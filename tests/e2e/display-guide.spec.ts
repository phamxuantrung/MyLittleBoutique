import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { preparedState } from './state';

test('day two explains categories, opens a fixture and remembers acknowledgement', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const state = preparedState();
  state.day = 2;
  await page.addInitScript(({ key, state }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, state });
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass('dialog-display-guide');
  await expect(dialog.locator('.display-guide-types li')).toHaveCount(4);
  await expect(dialog).toContainText('Ma-nơ-canh chỉ trưng set phối sẵn');
  await dialog.locator('[data-action="display-guide-start"]').click();
  await expect(dialog).toHaveClass('dialog-display');
  await expect(dialog.locator('.fixture-title-edit')).toContainText('Sào đồ Sunday');
  const upgrade = dialog.locator('.fixture-upgrade-strip');
  const studio = (await dialog.locator('.fixture-studio').boundingBox())!;
  const upgradeBox = (await upgrade.boundingBox())!;
  expect(upgradeBox.y).toBeGreaterThanOrEqual(studio.y + studio.height - 1);
  await upgrade.click();
  await expect(dialog).toHaveClass('dialog-display-upgrade-confirm');
  await expect(dialog).toContainText('Xác nhận nâng cấp');
  await dialog.locator('[data-action="display-upgrade-confirmed"]').click();
  await expect(dialog).toHaveClass('dialog-display');
  await expect(dialog.locator('.fixture-capacity-chip')).toContainText('24');
  await page.screenshot({ path: 'test-results/fixture-upgrade-bottom.png' });
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.phase).toBe('preparation');
  expect(saved.claimed).toContain('guide:day-two-display');
  await page.reload();
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.waitForTimeout(700);
  await expect(dialog).not.toBeVisible();
});

test('the reminder appears when advancing from day one to day two', async ({ page }) => {
  const state = preparedState();
  state.phase = 'closed';
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="summary"]').first().click();
  await page.locator('[data-action="next-day"]').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass('dialog-display-guide');
  await dialog.getByRole('button', { name: 'Đã hiểu', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.locator('[data-action="nav"][data-id="stock"]').click();
  await page.locator('.panel-close-btn').click();
  await page.waitForTimeout(700);
  await expect(dialog).not.toBeVisible();
});

test('no day-two reminder appears on day one or day three', async ({ page }) => {
  for (const day of [1, 3]) {
    const state = preparedState();
    state.day = day;
    await page.goto('/');
    await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.reload();
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await page.waitForTimeout(700);
    await expect(page.locator('.dialog-display-guide')).not.toBeVisible();
  }
});
