import { expect, test } from '@playwright/test';

test('abre as propriedades por toque e edita uma medida em modo retrato', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => innerWidth));
  await expect(page.getByRole('button', { name: 'Definições' })).toBeInViewport();
  await expect(page.getByRole('complementary', { name: 'Propriedades da seleção' })).toBeHidden();
  await page.getByRole('button', { name: 'Mostrar propriedades' }).tap();
  const height = page.getByLabel('Altura', { exact: false });
  await height.fill('2,55');
  await height.press('Enter');
  await expect(height).toHaveValue('2,55');
  await page.getByRole('button', { name: 'Fechar painel' }).tap({ position: { x: 45, y: 45 } });
  await page.getByRole('button', { name: 'Aproximar' }).tap();
  await page.getByRole('button', { name: 'Mostrar divisões' }).tap();
  await expect(page.getByRole('button', { name: /Garagem.*15,00/ })).toBeVisible();
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await expect(page.getByRole('button', { name: 'Mostrar propriedades' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => innerWidth));
});

test('abre a vista dividida e altera a câmara com o perfil de iPad', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Vista dividida' }).tap();
  const model = page.getByLabel('Dimensões da divisão em 3D');
  await expect(model).toBeVisible();
  await expect(page.getByLabel('Planta 2D editável')).toBeVisible();
  await page.getByLabel('Câmara 3D').selectOption('iso');
  await expect(page.getByLabel('Câmara 3D')).toHaveValue('iso');
  await page.getByRole('button', { name: 'Aproximar em 3D' }).tap();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => innerWidth));
});

test('seleciona vários objetos no perfil de toque e agrupa-os pelas propriedades', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  const divisions = page.getByRole('button', { name: 'Mostrar divisões' });
  await divisions.tap();
  await page.getByRole('button', { name: 'Adicionar objeto' }).tap();
  await page.locator('.catalog-item').filter({ hasText: 'Caixa' }).first().tap();
  await page.getByRole('button', { name: 'Adicionar objeto' }).tap();
  await page.locator('.catalog-item').filter({ hasText: 'Estante' }).tap();
  await page.getByRole('button', { name: 'Selecionar vários objetos' }).tap();
  await page.getByRole('button', { name: 'Caixa', exact: true }).tap();
  await page.getByRole('button', { name: 'Mostrar propriedades' }).tap();
  await expect(page.getByRole('heading', { name: '2 objetos selecionados' })).toBeVisible();
  await page.getByRole('button', { name: 'Agrupar', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Desagrupar', exact: true })).toBeVisible();
});

test('configura qualidade e guarda um GLB no perfil de iPad', async ({ page }) => {
  const { sampleGlb } = await import('../src/test/fixtures/models');
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Definições' }).tap();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Qualidade da vista 3D').selectOption('low');
  await dialog.getByLabel('Limite de objetos em 3D').selectOption('50');
  await dialog.getByRole('button', { name: 'Fechar' }).tap();
  await page.getByRole('button', { name: 'Mostrar divisões' }).tap();
  await page.getByRole('button', { name: 'Importar GLB/GLTF' }).tap();
  await dialog.getByLabel('Ficheiros GLB, GLTF ou ZIP').setInputFiles({
    name: 'Caixa do iPad.glb', mimeType: 'model/gltf-binary', buffer: sampleGlb(1, .6, .5),
  });
  await expect(dialog.getByLabel('Dimensões medidas do modelo')).toContainText('1,00 m');
  await dialog.getByRole('button', { name: 'Guardar modelo', exact: true }).tap();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Mostrar propriedades' }).tap();
  await expect(page.getByRole('heading', { name: 'Caixa do iPad' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => innerWidth));
});

test('transfere uma cópia em ZIP no perfil de iPad', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Exportar projeto' }).tap();
  const file = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar ZIP do projeto' }).tap();
  const zip = await file;
  expect(zip.suggestedFilename()).toMatch(/\.spaceplan\.zip$/);
  await page.locator('header input[type="file"]').setInputFiles((await zip.path())!);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir projeto' }).tap();
  await expect(page.getByRole('dialog').getByRole('button', { name: /^Projeto Garagem/ })).toHaveCount(2);
});

test('devolve o foco ao seletor do painel quando o utilizador carrega em Escape', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Mostrar propriedades' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Propriedades' })).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
