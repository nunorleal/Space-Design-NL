import { expect, test, type Page } from '@playwright/test';

async function add(page: Page, name: string) {
  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  await page.getByRole('dialog').getByLabel('Pesquisar objetos').fill(name);
  await page.getByRole('dialog').locator('.catalog-item').filter({ hasText: name }).first().click();
}

async function setNumber(page: Page, name: string | RegExp, value: string) {
  const field = page.getByLabel(name);
  await field.fill(value);
  await field.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
});

test('grava a estante de 90 × 40 × 180 cm a 12 cm da parede e volta a abrir com os valores exatos', async ({ page }) => {
  await add(page, 'Estante');
  await setNumber(page, /Folga à parede/, '0,12');
  await expect(page.getByLabel(/Folga à parede/)).toHaveValue('0,12');
  await expect(page.getByLabel('Posição Z')).toHaveValue('0,32');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Estante', exact: true }).click();
  await expect(page.getByLabel('Largura do objeto')).toHaveValue('0,90');
  await expect(page.getByLabel('Profundidade do objeto')).toHaveValue('0,40');
  await expect(page.getByLabel('Altura do objeto')).toHaveValue('1,80');
  await expect(page.getByLabel(/Folga à parede/)).toHaveValue('0,12');
});

test('coloca veículos na garagem e conserva as medidas personalizadas do carro', async ({ page }) => {
  await setNumber(page, 'Profundidade (Z)', '4,00');
  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  const library = page.getByRole('dialog');
  await library.getByLabel('Categoria').selectOption('Veículos');
  await expect(library.locator('.catalog-item')).toHaveCount(2);
  await library.getByRole('button', { name: /^Carro Veículos/ }).click();
  await expect(page.getByLabel('Rotação em planta')).toHaveValue('90');
  await expect(page.getByLabel('Profundidade do objeto')).toHaveValue('4,40');
  await expect(page.getByText('O objeto sai dos limites da divisão.')).toHaveCount(0);
  await setNumber(page, 'Largura do objeto', '1,72');
  await setNumber(page, 'Profundidade do objeto', '4,12');
  await setNumber(page, 'Altura do objeto', '1,42');
  await add(page, 'Mota');
  await expect(page.getByLabel('Profundidade do objeto')).toHaveValue('2,10');
  await expect(page.getByText('Colisão com 1 objeto.')).toHaveCount(0);
  await expect(page.locator('.plan-object')).toHaveCount(2);
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  await expect(page.locator('.viewer-frame canvas')).toBeVisible();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toBeVisible();
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Carro', exact: true }).click();
  await expect(page.getByLabel('Largura do objeto')).toHaveValue('1,72');
  await expect(page.getByLabel('Profundidade do objeto')).toHaveValue('4,12');
  await expect(page.getByLabel('Altura do objeto')).toHaveValue('1,42');
  await expect(page.getByRole('button', { name: 'Mota', exact: true })).toBeVisible();
});

test('avisa de colisão e de saída da divisão e permite sobreposição intencional', async ({ page }) => {
  await add(page, 'Caixa');
  await add(page, 'Estante');
  await setNumber(page, 'Posição X', '2,5');
  await setNumber(page, 'Posição Z', '1,5');
  await expect(page.getByText('Colisão com 1 objeto.')).toBeVisible();
  await page.getByLabel('Permitir sobreposição').check();
  await expect(page.getByText('Colisão com 1 objeto.')).toHaveCount(0);
  await setNumber(page, 'Posição Z', '-0,05');
  await expect(page.getByText('O objeto sai dos limites da divisão.')).toBeVisible();
  await expect(page.getByText('Interseção com a parede 1.')).toBeVisible();
});

test('agrupa, arrasta, bloqueia e copia uma seleção com histórico transacional', async ({ page }) => {
  await add(page, 'Caixa');
  await add(page, 'Estante');
  await page.getByRole('button', { name: 'Caixa', exact: true }).click({ modifiers: ['Shift'] });
  await expect(page.getByRole('heading', { name: '2 objetos selecionados' })).toBeVisible();
  await page.getByLabel('Alinhar ou distribuir').selectOption('center');
  await page.getByRole('button', { name: 'Aplicar alinhamento' }).click();
  await page.getByRole('button', { name: 'Agrupar', exact: true }).click();
  const footprint = page.locator('.plan-object.entity-selected .object-footprint').first();
  const geometry = (await footprint.boundingBox())!;
  const x = geometry.x + geometry.width / 2;
  const y = geometry.y + geometry.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 75, y + 40, { steps: 10 });
  await page.mouse.up();
  expect((await footprint.boundingBox())!.x).toBeGreaterThan(geometry.x + 30);
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  expect((await footprint.boundingBox())!.x).toBeCloseTo(geometry.x, 0);
  await page.getByRole('button', { name: 'Bloquear', exact: true }).click();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 75, y + 40, { steps: 10 });
  await page.mouse.up();
  expect((await footprint.boundingBox())!.x).toBeCloseTo(geometry.x, 0);
  await page.getByRole('button', { name: 'Copiar', exact: true }).click();
  await page.getByRole('button', { name: 'Colar', exact: true }).click();
  await expect(page.locator('.plan-object')).toHaveCount(4);
  await page.getByRole('button', { name: 'Ocultar', exact: true }).click();
  await expect(page.locator('.plan-object')).toHaveCount(2);
  await page.getByRole('button', { name: 'Mostrar', exact: true }).click();
  await expect(page.locator('.plan-object')).toHaveCount(4);
});

test('cria, marca como favorito e protege um modelo personalizado em utilização', async ({ page }) => {
  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  const library = page.getByRole('dialog');
  await library.getByRole('button', { name: 'Novo modelo de caixa' }).click();
  await library.getByLabel('Nome do modelo').fill('Banco de ensaio');
  await library.getByRole('button', { name: 'Guardar novo modelo' }).click();
  await library.getByLabel('Pesquisar objetos').fill('Banco de ensaio');
  await library.getByRole('button', { name: 'Favorito: Banco de ensaio' }).click();
  await library.getByLabel('Favoritos', { exact: true }).check();
  await library.locator('.catalog-item').filter({ hasText: 'Banco de ensaio' }).click();
  await expect(page.getByRole('heading', { name: 'Banco de ensaio' })).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  await library.getByLabel('Pesquisar objetos').fill('Banco de ensaio');
  await library.getByRole('button', { name: 'Gerir modelo: Banco de ensaio' }).click();
  await expect(library.getByRole('button', { name: 'Eliminar modelo' })).toBeDisabled();
});

test('desloca e roda a estante com o manipulador 3D e a pega na planta', async ({ page }) => {
  await add(page, 'Estante');
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toBeVisible();
  await page.getByLabel('Câmara 3D').selectOption('top');
  const canvas = page.locator('.viewer-frame canvas');
  await canvas.waitFor();
  await page.getByRole('button', { name: 'Mover em 3D' }).click();
  await canvas.screenshot();
  const model = (await canvas.boundingBox())!;
  const x = model.x + model.width / 2 + 38;
  const y = model.y + model.height / 2;
  const footprint = page.locator('.plan-object.entity-selected .object-footprint');
  const original = await footprint.getAttribute('points');
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 54, y, { steps: 10 });
  await expect(footprint).not.toHaveAttribute('points', original!);
  await page.mouse.up();
  expect(Number((await page.getByLabel('Posição X').inputValue()).replace(',', '.'))).toBeGreaterThan(3);
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByLabel('Posição X')).toHaveValue('2,50');
  await page.getByRole('button', { name: 'Rodar em 3D' }).click();
  await canvas.screenshot();
  const modelX = model.x + model.width / 2;
  const offset = 72 / Math.sqrt(2);
  await page.mouse.move(modelX + offset, y + offset);
  await page.mouse.down();
  await page.mouse.move(modelX - offset, y + offset, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByLabel('Rotação em planta')).toHaveValue('-90');
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByLabel('Rotação em planta')).toHaveValue('0');
  await page.getByRole('button', { name: 'Planta 2D', exact: true }).click();
  const handle = (await page.locator('.rotation-knob').boundingBox())!;
  const box = (await footprint.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const hy = handle.y + handle.height / 2;
  await page.mouse.move(handle.x + handle.width / 2, hy);
  await page.mouse.down();
  await page.mouse.move(cx + cy - hy, cy, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByLabel('Rotação em planta')).toHaveValue('-90');
});
