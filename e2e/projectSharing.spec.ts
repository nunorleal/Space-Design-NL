import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { sampleGltfZip } from '../src/test/fixtures/models';

async function download(page: Page, name: string) {
  await page.getByRole('button', { name: 'Exportar projeto' }).click();
  const file = page.waitForEvent('download');
  await page.getByRole('button', { name, exact: true }).click();
  const result = await file;
  return { name: result.suggestedFilename(), buffer: await readFile((await result.path())!) };
}

test('transporta um projeto com textura por ZIP para outro armazenamento e abre offline', async ({ browser, page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Importar GLB/GLTF' }).click();
  const importer = page.getByRole('dialog');
  await importer.getByLabel('Ficheiros GLB, GLTF ou ZIP').setInputFiles({
    name: 'modelo.zip', mimeType: 'application/zip', buffer: await sampleGltfZip(),
  });
  await expect(importer.getByLabel('Dimensões medidas do modelo')).toContainText('2,00 m');
  await importer.getByRole('button', { name: 'Guardar modelo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'mota' })).toBeVisible();
  const zip = await download(page, 'Exportar ZIP do projeto');
  expect(zip.name).toMatch(/\.spaceplan\.zip$/);
  expect(zip.buffer.readUInt16LE()).toBe(0x4b50);
  const target = await browser.newContext();
  try {
    const imported = await target.newPage();
    await imported.goto(new URL('/', page.url()).href);
    await expect(imported.getByText('Guardado no dispositivo')).toBeVisible();
    await imported.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
      });
    });
    await target.setOffline(true);
    await imported.locator('header input[type="file"]').setInputFiles({ ...zip, mimeType: 'application/zip' });
    await expect(imported.locator('.plan-object')).toHaveCount(1);
    await expect(imported.getByText('Guardado no dispositivo')).toBeVisible();
    await imported.reload();
    await expect(imported.locator('.plan-object')).toHaveCount(1);
    await imported.getByRole('button', { name: 'Vista 3D', exact: true }).click();
    await expect(imported.getByLabel('Dimensões da divisão em 3D')).toBeVisible();
    await imported.getByRole('button', { name: 'mota', exact: true }).click();
    await expect(imported.locator('.model-marker')).toHaveCount(0);
    const screenshot = await imported.locator('.viewer-frame canvas').screenshot();
    const counts = await checkPng(imported, screenshot);
    expect(counts.orange).toBeGreaterThan(50);
  } finally { await target.close(); }
});

async function checkPng(page: Page, bytes: Buffer) {
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return page.evaluate(async data => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + data;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const { data: pixels } = context.getImageData(0, 0, image.width, image.height);
    let dark = 0, orange = 0;
    const colors = new Set<number>();
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b, a] = pixels.subarray(i, i + 4);
      if (a && r < 100 && b < 140) dark++;
      if (a && r > g + 25 && g > b + 12) orange++;
      if (a) colors.add((r << 16) | (g << 8) | b);
    }
    return { dark, orange, colors: colors.size };
  }, bytes.toString('base64'));
}

test('descarrega PNG da planta e da vista 3D com conteúdo renderizado', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toBeVisible();
  const plan = await download(page, 'Exportar planta em PNG');
  expect(plan.name).toMatch(/-planta\.png$/);
  expect((await checkPng(page, plan.buffer)).dark).toBeGreaterThan(100);
  const model = await download(page, 'Exportar vista 3D em PNG');
  expect(model.name).toMatch(/-3D\.png$/);
  expect((await checkPng(page, model.buffer)).colors).toBeGreaterThan(12);
});

test('recupera um registo pendente após recarregar e permite voltar à versão anterior', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.evaluate(async () => {
    const id = localStorage.getItem('spaceplan.active')!;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('spaceplan');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const query = db.transaction('projects').objectStore('projects').get(id);
      query.onerror = () => reject(query.error);
      query.onsuccess = () => resolve(query.result);
    });
    db.close();
    localStorage.setItem('spaceplan.pending.' + id, JSON.stringify({
      ...data, name: 'Garagem recuperada', updatedAt: new Date(Date.parse(String(data.updatedAt)) + 1).toISOString(),
    }));
  });
  await page.reload();
  await expect(page.locator('.project-title')).toContainText('Garagem recuperada');
  await expect(page.getByText(/Foram recuperadas versões locais/)).toBeVisible();
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir projeto' }).click();
  await page.getByRole('button', { name: 'Gerir projeto Garagem recuperada' }).click();
  await page.getByRole('button', { name: 'Recuperar versão anterior' }).click();
  await page.getByRole('button', { name: 'Confirmar recuperação' }).click();
  await expect(page.locator('.project-title')).toContainText('Projeto Garagem');
  await page.reload();
  await expect(page.locator('.project-title')).toContainText('Projeto Garagem');
});

test('pede confirmação antes de eliminar um projeto e preserva o projeto aberto', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Novo projeto', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill('Projeto temporário');
  await dialog.getByRole('button', { name: 'Criar projeto' }).click();
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir projeto' }).click();
  await dialog.getByRole('button', { name: /^Projeto Garagem/ }).click();
  await page.getByRole('button', { name: 'Abrir projeto' }).click();
  await dialog.getByRole('button', { name: 'Gerir projeto Projeto temporário' }).click();
  await dialog.getByRole('button', { name: 'Eliminar projeto' }).click();
  await expect(dialog.getByText(/apaga a gravação local/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await dialog.getByRole('button', { name: 'Eliminar projeto' }).click();
  await dialog.getByRole('button', { name: 'Confirmar eliminação' }).click();
  await expect(dialog.getByRole('button', { name: /^Projeto temporário/ })).toHaveCount(0);
  await expect(page.locator('.project-title')).toContainText('Projeto Garagem');
});

test('recusa um ZIP danificado e mantém o projeto aberto', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.locator('header input[type="file"]').setInputFiles({
    name: 'incompleto.spaceplan.zip', mimeType: 'application/zip', buffer: Buffer.from('ZIP danificado'),
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('alert')).toContainText('Não foi possível ler o ZIP');
  await dialog.getByRole('button', { name: 'Fechar' }).click();
  await expect(page.locator('.project-title')).toContainText('Projeto Garagem');
  await expect(page.getByLabel('Largura (X)')).toHaveValue('5,00');
});

test('liberta um binário antigo sem referência e conserva os ficheiros da recuperação e os recentes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('spaceplan');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      const projectId = localStorage.getItem('spaceplan.active')!;
      const project = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const request = db.transaction('projects').objectStore('projects').get(projectId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['binaries', 'recoveries'], 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        const binaries = transaction.objectStore('binaries');
        for (const id of ['orphan', 'recent', 'retained']) {
          binaries.put({ id, bytes: new Uint8Array([0, 1, 2]).buffer, mime: 'model/gltf-binary',
            createdAt: id === 'recent' ? Date.now() : 1 });
        }
        transaction.objectStore('recoveries').put({
          ...project, assets: [{ id: 'mota', name: 'Mota', kind: 'glb', blobKey: 'retained',
            nativeDimensions: { width: 1, height: 1, depth: 1 } }],
        });
      });
    } finally { db.close(); }
  });
  await page.getByRole('button', { name: 'Definições' }).click();
  await page.getByText('Armazenamento local', { exact: true }).click();
  await page.getByRole('button', { name: 'Libertar ficheiros sem referência' }).click();
  await page.getByRole('button', { name: 'Confirmar limpeza' }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Foi libertado 1 ficheiro');
  const keys = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('spaceplan');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      return await new Promise<IDBValidKey[]>((resolve, reject) => {
        const request = db.transaction('binaries').objectStore('binaries').getAllKeys();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } finally { db.close(); }
  });
  expect(keys).toEqual(['recent', 'retained']);
});

test('impede um separador antigo de voltar a guardar um projeto eliminado', async ({ context, page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  const old = await context.newPage();
  await old.goto(page.url());
  await expect(old.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir projeto' }).click();
  await page.getByRole('button', { name: 'Gerir projeto Projeto Garagem' }).click();
  await page.getByRole('button', { name: 'Eliminar projeto' }).click();
  await page.getByRole('button', { name: 'Confirmar eliminação' }).click();
  await expect(page.locator('.project-title')).toContainText('Projeto sem título');
  await old.locator('.project-title').click();
  await old.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Projeto desatualizado');
  await old.getByRole('button', { name: 'Guardar nome' }).click();
  await expect(old.getByText(/foi eliminado noutro separador/)).toBeVisible();
  await old.reload();
  await expect(old.locator('.project-title')).toContainText('Projeto sem título');
  await old.close();
});
