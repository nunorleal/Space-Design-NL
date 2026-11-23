import { expect, test, type Page } from '@playwright/test';
import { sampleGlb, sampleGltf, sampleGltfZip } from '../src/test/fixtures/models';

async function openImport(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Importar GLB/GLTF' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Importar modelo 3D' })).toBeVisible();
  return dialog;
}

async function prepareOffline(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
    });
  });
}

test('corrige as unidades e a orientação do GLB e reutiliza o modelo com escalas por instância', async ({ page, context }) => {
  const dialog = await openImport(page);
  await dialog.getByLabel('Ficheiros GLB, GLTF ou ZIP').setInputFiles({
    name: 'Modelo de oficina.glb', mimeType: 'model/gltf-binary', buffer: sampleGlb(),
  });
  const dimensions = dialog.getByLabel('Dimensões medidas do modelo');
  await expect(dimensions).toContainText('200,00 m');
  await dialog.getByLabel('Unidade original').selectOption('cm');
  await dialog.getByLabel('Orientação do modelo').selectOption('z-up');
  await expect(dimensions).toContainText('Largura 2,00 m');
  await expect(dimensions).toContainText('Altura 0,50 m');
  await expect(dimensions).toContainText('Profundidade 1,00 m');
  await expect(dialog.locator('.import-preview[data-ready="true"]')).toBeVisible();
  await dialog.getByRole('button', { name: 'Guardar modelo', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Modelo de oficina' })).toBeVisible();
  await expect(page.getByLabel('Tipo de escala')).toHaveValue('uniform');
  const scale = page.getByLabel('Escala uniforme');
  await scale.fill('0,75');
  await scale.press('Enter');
  await expect(page.getByLabel('Largura do objeto')).toHaveText('1,50 m');
  await page.getByLabel('Tipo de escala').selectOption('axes');
  await expect(page.getByText(/podem distorcer o modelo/)).toBeVisible();
  await page.getByLabel('Tipo de escala').selectOption('uniform');

  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  await expect(dialog.locator('.catalog-item').filter({ hasText: 'Modelo de oficina' }).locator('img')).toBeVisible();
  await dialog.locator('.catalog-item').filter({ hasText: 'Modelo de oficina' }).click();
  await expect(page.locator('.plan-object')).toHaveCount(2);
  await expect(page.getByLabel('Escala uniforme')).toHaveValue('1');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await prepareOffline(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.plan-object')).toHaveCount(2);
  await page.getByRole('button', { name: 'Vista 3D', exact: true }).click();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toBeVisible();
  await page.getByRole('button', { name: 'Modelo de oficina', exact: true }).first().click();
  await expect(page.getByLabel('Escala uniforme')).toHaveValue('0,75');
  await expect(page.locator('.model-marker')).toHaveCount(0);
});

test('importa um GLTF com recursos em subpastas via ZIP mesmo sem rede e renderiza a textura', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await prepareOffline(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Importar GLB/GLTF' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Ficheiros GLB, GLTF ou ZIP').setInputFiles({
    name: 'mota.zip', mimeType: 'application/zip', buffer: await sampleGltfZip(),
  });
  await expect(dialog.getByLabel('Dimensões medidas do modelo')).toContainText('2,00 m');
  const preview = dialog.locator('.import-preview[data-ready="true"] canvas');
  await expect(preview).toBeVisible();
  const image = (await preview.screenshot()).toString('base64');
  const orange = await page.evaluate(async data => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + data;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > pixels[i + 1] + 30 && pixels[i + 1] > pixels[i + 2] + 15) count++;
    return count;
  }, image);
  expect(orange).toBeGreaterThan(100);
  await dialog.getByRole('button', { name: 'Guardar modelo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'mota' })).toBeVisible();
  await expect(page.locator('.plan-object')).toHaveCount(1);
});

test('aceita recursos soltos e rejeita referências externas sem efetuar pedidos de rede', async ({ page }) => {
  const dialog = await openImport(page);
  const input = dialog.getByLabel('Ficheiros GLB, GLTF ou ZIP');
  const { json, binary } = sampleGltf();
  let contactedExternal = false;
  page.on('request', request => { if (request.url().includes('example.invalid')) contactedExternal = true; });
  await input.setInputFiles({
    name: 'externo.gltf', mimeType: 'model/gltf+json',
    buffer: Buffer.from(JSON.stringify({ ...json, buffers: [{ uri: 'https://example.invalid/externo.bin', byteLength: binary.length }] })),
  });
  await expect(dialog.getByRole('alert')).toContainText('referência externa');
  expect(contactedExternal).toBe(false);
  await input.setInputFiles([
    { name: 'modelo.gltf', mimeType: 'model/gltf+json', buffer: Buffer.from(JSON.stringify(json)) },
    { name: 'malha.bin', mimeType: 'application/octet-stream', buffer: binary },
  ]);
  await expect(dialog.getByLabel('Dimensões medidas do modelo')).toContainText('2,00 m');
});
