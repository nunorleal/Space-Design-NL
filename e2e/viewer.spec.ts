import { expect, test, type Page } from '@playwright/test';

async function openSplit(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toBeVisible();
  await expect(page.locator('.viewer-frame canvas')).toBeVisible();
}

test('sincroniza alterações na divisão e no material com a geometria renderizada', async ({ page }) => {
  await openSplit(page);
  const viewport = page.locator('.viewer-frame canvas');
  const before = await viewport.screenshot();
  const width = page.getByLabel('Largura (X)');
  await width.fill('5,50');
  await width.press('Enter');
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toContainText('5,50 m × 3,00 m × 2,50 m');
  await expect.poll(async () => (await viewport.screenshot()).equals(before)).toBe(false);
  await page.getByLabel('Câmara 3D').selectOption('top');
  await page.getByRole('button', { name: 'Materiais da divisão' }).click();
  const concrete = await viewport.screenshot();
  await page.getByLabel('Material do pavimento').selectOption('oak');
  await expect.poll(async () => (await viewport.screenshot()).equals(concrete)).toBe(false);
  await page.getByRole('button', { name: 'Vista 3D', exact: true }).click();
  await expect(page.getByLabel('Planta 2D editável')).toBeHidden();
  await expect(page.getByLabel('Câmara 3D')).toHaveValue('top');
  await page.getByLabel('Câmara 3D').selectOption('iso');
  await page.getByRole('button', { name: 'Aproximar em 3D' }).click();
  await page.getByLabel('Câmara 3D').selectOption('eye');
  await expect(viewport).toBeVisible();
});

test('mantém a visibilidade das paredes ao voltar da planta para o 3D', async ({ page }) => {
  await openSplit(page);
  const walls = page.getByLabel('Visibilidade das paredes');
  const plan = page.getByRole('button', { name: 'Planta 2D', exact: true });
  const model = page.getByRole('button', { name: 'Vista 3D', exact: true });
  await walls.selectOption('all');
  await plan.click();
  await expect(walls).toBeHidden();
  await model.click();
  await expect(walls).toHaveValue('all');

  await walls.selectOption('hidden');
  await plan.click();
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  await expect(walls).toHaveValue('hidden');
});

test('mostra o arrasto de um vértice em 3D antes de o gravar no histórico', async ({ page }) => {
  await openSplit(page);
  const marker = (await page.locator('[data-kind="vertex"][data-index="1"] rect').boundingBox())!;
  const pixelsPerMetre = Number((await page.locator('.zoom-status').textContent())!.replace(',', '.').split(' ')[0]);
  const x = marker.x + marker.width / 2;
  const y = marker.y + marker.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + pixelsPerMetre * .3, y, { steps: 6 });
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toContainText('5,30 m × 3,00 m × 2,50 m');
  await expect(page.getByRole('button', { name: 'Desfazer', exact: true })).toBeDisabled();
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Desfazer', exact: true })).toBeEnabled();
});

test('insere uma porta e uma janela, mostra ambas na planta e grava as medidas', async ({ page }) => {
  await openSplit(page);
  await page.getByLabel('Visibilidade das paredes').selectOption('all');
  const top = page.locator('line[data-kind="wall"][data-index="0"]').last();
  const geometry = (await top.boundingBox())!;
  await page.mouse.click(geometry.x + geometry.width / 2, geometry.y + geometry.height / 2);
  const canvas = page.locator('.viewer-frame canvas');
  const filledWall = await canvas.screenshot();
  await page.getByRole('button', { name: 'Adicionar abertura' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Distância ao início').fill('0,60');
  await dialog.getByRole('button', { name: 'Criar abertura' }).click();
  await expect(page.getByRole('heading', { name: 'Porta' })).toBeVisible();
  await expect(page.getByLabel('Largura da abertura')).toHaveValue('0,80');
  await expect(page.getByLabel('Altura da abertura')).toHaveValue('2,10');
  await expect.poll(async () => (await canvas.screenshot()).equals(filledWall)).toBe(false);
  await page.getByRole('button', { name: 'Propriedades da parede' }).click();
  await page.getByRole('button', { name: 'Adicionar abertura' }).click();
  await dialog.getByLabel('Tipo de abertura').selectOption('window');
  await dialog.getByLabel('Altura do peitoril').fill('1,10');
  await dialog.getByRole('button', { name: 'Criar abertura' }).click();
  await expect(page.getByRole('heading', { name: 'Janela' })).toBeVisible();
  await expect(page.getByLabel('Altura do peitoril')).toHaveValue('1,10');
  await expect(page.locator('.plan-opening')).toHaveCount(2);
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.locator('.plan-opening')).toHaveCount(1);
  await page.getByRole('button', { name: 'Refazer', exact: true }).click();
  await expect(page.locator('.plan-opening')).toHaveCount(2);
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.reload();
  await expect(page.locator('.plan-opening')).toHaveCount(2);
});

test('reutiliza um objeto paramétrico e sincroniza a seleção a partir do 3D', async ({ page }) => {
  await openSplit(page);
  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  await page.getByLabel('Pesquisar objetos').fill('estante');
  await page.getByRole('button', { name: /Estante.*Arrumação/ }).click();
  await expect(page.getByLabel('Altura do objeto')).toHaveValue('1,80');
  const width = page.getByLabel('Largura do objeto');
  await width.fill('0,95');
  await width.press('Enter');
  await expect(page.locator('.plan-object.entity-selected .object-footprint')).toBeVisible();
  await page.getByLabel('Câmara 3D').selectOption('top');
  await page.locator('aside.rooms-panel').getByRole('button', { name: /Garagem.*15/ }).click();
  await expect(page.locator('.plan-object.entity-selected')).toHaveCount(0);
  const canvas = page.locator('.viewer-frame canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole('heading', { name: 'Estante' })).toBeVisible();
  await expect(width).toHaveValue('0,95');
  await expect(page.locator('.plan-object.entity-selected')).toHaveCount(1);
  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  await page.getByRole('button', { name: /Estante.*Arrumação/ }).click();
  await expect(page.locator('.plan-object')).toHaveCount(2);
});

test('abre o módulo 3D pela primeira vez sem rede depois de preparar a PWA', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
    });
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Vista 3D', exact: true }).click();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toContainText('5,00 m × 3,00 m × 2,50 m');
});
