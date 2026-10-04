import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { preparedState } from './state';

test('functional furniture displays real warehouse products', async ({ page }) => {
  const state = preparedState();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  const canvas = (await page.locator('#game-canvas canvas').boundingBox())!;
  await page.mouse.click(canvas.x + canvas.width * .416, canvas.y + canvas.height * .36);
  await page.locator('[data-action="display-open"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass('dialog-display');
  await expect(dialog.getByRole('textbox', { name: /Đổi tên Sào đồ Sunday/ })).toHaveText('Sào đồ Sunday');
  await expect(dialog.locator('.fixture-capacity-chip')).toContainText('4/16');
  await expect(dialog.locator('[data-action="display-remove"][data-id="ribbon-kiss-tee"]')).toBeVisible();
});

test('Crystal Luxe keeps its GIF animation after being placed on the Phaser floor', async ({ page }) => {
  const state = preparedState();
  state.level = 9;
  state.layout.push({ uid: 'crystal-luxe-e2e', id: 'crystal-luxe', x: 3, y: 5, rotation: 0 });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');

  const canvas = page.locator('#game-canvas canvas');
  const frames: string[] = [];
  for (let index = 0; index < 5; index++) {
    frames.push((await canvas.screenshot()).toString('base64'));
    await page.waitForTimeout(180);
  }
  expect(new Set(frames).size).toBeGreaterThan(1);
});
