import { expect, test } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 820, height: 1180 } });

test('aceita dois pontos de toque para ampliar sem mover o vértice inicialmente tocado', async ({ context, page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  const vertex = (await page.locator('[data-kind="vertex"][data-index="1"] rect').boundingBox())!;
  const first = { x: vertex.x + vertex.width / 2, y: vertex.y + vertex.height / 2, id: 1 };
  const second = { x: first.x - 125, y: first.y + 120, id: 2 };
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { ...first, x: first.x + 23, y: first.y - 36 },
    { ...second, x: second.x - 30, y: second.y + 25 },
  ] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await page.locator('[data-kind="vertex"][data-index="1"] rect').boundingBox())!.x).not.toBeCloseTo(vertex.x, 0);
  await expect(page.getByRole('button', { name: 'Desfazer', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Mostrar propriedades' }).tap();
  await expect(page.getByLabel('Largura (X)')).toHaveValue('5,00');
});

test('uma caneta desloca um vértice e cria uma só operação no histórico', async ({ context, page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  const vertex = (await page.locator('[data-kind="vertex"][data-index="1"] rect').boundingBox())!;
  const x = vertex.x + vertex.width / 2;
  const y = vertex.y + vertex.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, pointerType: 'pen' });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + 24, y, buttons: 1, pointerType: 'pen' });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + 24, y, button: 'left', buttons: 0, pointerType: 'pen' });
  await expect(page.getByRole('button', { name: 'Desfazer', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Mostrar propriedades' }).tap();
  await expect(page.getByRole('heading', { name: 'Vértice 2' })).toBeVisible();
  await expect(page.getByLabel('Coordenada X')).not.toHaveValue('5,00');
  await page.getByRole('button', { name: 'Desfazer', exact: true }).tap();
  await expect(page.getByLabel('Largura (X)')).toHaveValue('5,00');
  await expect(page.getByRole('button', { name: 'Desfazer', exact: true })).toBeDisabled();
});
