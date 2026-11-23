import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
});

test('edita a garagem, desfaz, guarda e reabre offline', async ({ page, context }) => {
  const width = page.getByLabel('Largura (X)', { exact: false });
  await expect(width).toHaveValue('5,00');
  await expect(page.getByLabel('Profundidade (Z)', { exact: false })).toHaveValue('3,00');
  await expect(page.getByLabel('Altura', { exact: false })).toHaveValue('2,50');
  await width.fill('5,125');
  await width.press('Enter');
  await expect(width).toHaveValue('5,125');
  await expect(page.getByText('15,375 m²').first()).toBeVisible();
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(width).toHaveValue('5,00');
  await page.getByRole('button', { name: 'Refazer', exact: true }).click();
  await expect(width).toHaveValue('5,125');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
    });
  });
  await context.setOffline(true);
  await page.reload();
  await expect(width).toHaveValue('5,125');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
});

test('desfaz e refaz vinte alterações sem perder a medida exata', async ({ page }) => {
  const width = page.getByLabel('Largura (X)');
  const widths = Array.from({ length: 20 }, (_, index) => `5,${String(index + 1).padStart(2, '0')}`);
  for (const value of widths) {
    await width.fill(value);
    await width.press('Enter');
  }
  const plan = page.getByRole('region', { name: 'Navegar na planta' });
  const undo = page.getByRole('button', { name: 'Desfazer', exact: true });
  const redo = page.getByRole('button', { name: 'Refazer', exact: true });
  await plan.focus();
  for (const value of [...widths.slice(0, -1).reverse(), '5,00']) {
    await plan.press('Control+z');
    await expect(width).toHaveValue(value);
  }
  await expect(undo).toBeDisabled();
  for (const value of widths) {
    await plan.press('Control+Shift+z');
    await expect(width).toHaveValue(value);
  }
  await expect(redo).toBeDisabled();
  await expect(page.getByText('15,60 m²').first()).toBeVisible();
});

test('desenha uma divisão em L, altera um vértice, divide e mede uma parede', async ({ page }) => {
  await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Estudo em L');
  await page.getByRole('button', { name: 'Criar projeto', exact: true }).click();
  await page.getByRole('button', { name: 'Polígono', exact: true }).click();
  for (const [x, z] of [[0, 0], [5, 0], [5, 2], [3, 2], [3, 4], [0, 4]]) {
    await page.getByLabel('X (m)', { exact: true }).fill(String(x));
    await page.getByLabel('Z (m)', { exact: true }).fill(String(z));
    await page.getByRole('button', { name: 'Adicionar vértice', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Fechar divisão', exact: true }).click();
  await expect(page.getByText('16,00 m²').first()).toBeVisible();
  await page.getByRole('button', { name: 'Nome, origem e paredes' }).click();
  await page.getByRole('button', { name: 'Vértice 3', exact: true }).click();
  const z = page.getByLabel('Coordenada Z');
  await z.fill('2,50');
  await z.press('Enter');
  await expect(z).toHaveValue('2,50');
  await expect(page.getByText('16,50 m²').first()).toBeVisible();
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  await expect(page.locator('.viewer-frame canvas')).toBeVisible();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toContainText('5,00 m × 4,00 m × 2,50 m');
  await page.getByRole('button', { name: 'Planta 2D', exact: true }).click();

  const top = page.locator('line[data-kind="wall"][data-index="0"]').last();
  const box = (await top.boundingBox())!;
  await page.getByRole('button', { name: 'Dividir parede', exact: true }).click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole('heading', { name: 'Vértice 2' })).toBeVisible();
  await expect(page.getByText('7 paredes', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Medir', exact: true }).click();
  await page.mouse.click(box.x, box.y + box.height / 2);
  await page.mouse.click(box.x + box.width, box.y + box.height / 2);
  await expect(page.getByText('Distância', { exact: true })).toBeVisible();
});

test('cria um retângulo com medidas em centímetros e exporta e importa o JSON', async ({ page }) => {
  await page.getByRole('button', { name: 'Definições' }).click();
  await page.getByLabel('Unidade de medida').selectOption('cm');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('button', { name: 'Nova divisão', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome da divisão').fill('Oficina');
  await dialog.getByLabel('Largura (cm)').fill('612,5');
  await dialog.getByLabel('Profundidade (cm)').fill('312');
  await dialog.getByLabel('Altura (cm)').fill('260');
  await dialog.getByRole('button', { name: 'Criar divisão' }).click();
  await expect(page.getByLabel('Largura (X)')).toHaveValue('612,5');
  await page.getByRole('button', { name: 'Exportar projeto' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  const file = await downloaded;
  const path = await file.path();
  await page.locator('header input[type="file"]').setInputFiles(path!);
  await expect(page.getByRole('button', { name: /Oficina/ })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir projeto' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: /^Projeto Garagem/ })).toHaveCount(2);
});

test('arrasta um vértice com encaixe e desfaz o gesto numa operação', async ({ page }) => {
  const corner = page.locator('[data-kind="vertex"][data-index="1"] rect');
  const box = (await corner.boundingBox())!;
  const pixelsPerMetre = Number((await page.locator('.zoom-status').textContent())!.replace(',', '.').split(' ')[0]);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + pixelsPerMetre * .3, y, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Vértice 2' })).toBeVisible();
  await expect(page.getByLabel('Coordenada X')).toHaveValue('5,30');
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByLabel('Largura (X)')).toHaveValue('5,00');
  await expect(page.getByRole('button', { name: 'Desfazer', exact: true })).toBeDisabled();
});
