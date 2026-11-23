import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function audit(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
}

test('verifica acessibilidade na planta, nas definições e na vista dividida', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await audit(page);
  await page.getByRole('button', { name: 'Definições' }).click();
  await expect(page.getByRole('heading', { name: 'Grelha e unidades' })).toBeFocused();
  await audit(page);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toBeVisible();
  await expect(page.getByText('O navegador não conseguiu iniciar a vista 3D.')).toHaveCount(0);
  await audit(page);
});

test('mantém a planta e oferece nova tentativa quando o WebGL 2 falha', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: string, ...args: unknown[]) {
      if (contextId === 'webgl2') return null;
      return Reflect.apply(getContext, this, [contextId, ...args]);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  await page.getByRole('button', { name: 'Vista dividida' }).click();
  const viewer = page.getByRole('region', { name: 'Visualização 3D' });
  await expect(viewer.getByRole('button', { name: 'Voltar a tentar' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Navegar na planta' })).toBeVisible();
  await viewer.getByRole('button', { name: 'Voltar a tentar' }).click();
  await expect(viewer.getByRole('status')).toContainText('O navegador não conseguiu iniciar a vista 3D.');
});

test('usa o teclado para medir, deslocar objetos, mudar de vista e voltar ao botão do diálogo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Guardado no dispositivo')).toBeVisible();
  const settings = page.getByRole('button', { name: 'Definições' });
  await settings.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Grelha e unidades' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();

  const plan = page.getByRole('region', { name: 'Navegar na planta' });
  await plan.focus();
  await page.keyboard.press('m');
  await page.getByText('Medir por coordenadas', { exact: true }).press('Enter');
  const panel = page.getByRole('complementary', { name: 'Propriedades da seleção' });
  for (const [label, value] of [['A · X (m)', '0'], ['A · Z (m)', '0'], ['B · X (m)', '3'], ['B · Z (m)', '4']]) {
    await panel.getByLabel(label, { exact: true }).fill(value);
  }
  await panel.getByRole('button', { name: 'Calcular distância' }).press('Enter');
  await expect(panel.getByRole('status')).toContainText('5,00 m');

  await page.getByRole('button', { name: 'Adicionar objeto' }).click();
  await page.getByRole('dialog').locator('.catalog-item').filter({ hasText: 'Estante' }).click();
  await plan.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Posição X')).toHaveValue('2,55');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(page.getByLabel('Posição Z')).toHaveValue('2,00');
  await page.keyboard.press('3');
  await expect(page.getByLabel('Dimensões da divisão em 3D')).toBeVisible();

  await settings.click();
  await page.getByLabel('Atalhos de uma tecla').uncheck();
  await page.keyboard.press('Escape');
  await plan.focus();
  await page.keyboard.press('1');
  await expect(page.getByRole('button', { name: 'Vista dividida' })).toHaveAttribute('aria-pressed', 'true');
});
