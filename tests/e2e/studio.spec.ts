import { expect, test, type Page } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState } from './state';
import { canvasPoint, gameView } from './viewport';

async function clickCustomer(page: Page) {
  await page.waitForTimeout(1600);
  const point = await canvasPoint(page, 426, 390);
  await page.mouse.click(point.x, point.y);
}

for (const [width, height] of [[390, 844], [844, 390], [1280, 800]]) {
  test(`fitting studio sale and loyalty at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const state = openState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    const view = await gameView(page);
    await expect(view.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await clickCustomer(page);
    const dialog = view.getByRole('dialog');
    await expect(dialog).toHaveClass('dialog-serve');
    await expect(dialog).toContainText('Khách mới');
    await dialog.locator('[data-action="outfit-category"][data-id="tops"]').click();
    await dialog.locator('.outfit-grid [data-id="baby-tee"]').click();
    await expect(dialog.locator('[data-action="serve"]')).toBeEnabled();
    await dialog.locator('[data-action="serve"]').click();
    await expect(dialog).toContainText('Phối đồ cực chuẩn');
    await expect(dialog).toContainText(/điểm thân thiết/);
    await dialog.locator('[data-action="continue"]').last().click();
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
    expect(saved.stats.sold).toBe(1);
    expect(saved.customerLoyalty.lily.purchases).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('browsing customer checks out automatically without opening advice', async ({ page }) => {
  const state = openState('lily', 'browse');
  state.activeVisits[0].patience = 3;
  state.patience = 3;
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).stats.sold, SAVE_KEY), { timeout: 15000 }).toBeGreaterThan(0);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
