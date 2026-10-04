import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../src/systems/save';
import { preparedState } from '../tests/e2e/state';

test('renders imported wall artwork', async ({ page }) => {
  const state = preparedState();
  state.shopName = 'Tiệm Mây Nhỏ';
  state.layout = [
    { uid: 'shop-name', id: 'shop-sign', x: 1, y: 0, rotation: 0 },
    { uid: 'fitting-room', id: 'fitting', x: 3, y: 3, rotation: 0 },
    { uid: 'fashion', id: 'fashion-print', x: 0, y: 0, rotation: 0 },
    { uid: 'gallery', id: 'gallery-print', x: 2, y: 0, rotation: 0 },
    { uid: 'runway', id: 'runway-print', x: 4, y: 0, rotation: 0 },
    { uid: 'blinds', id: 'blush-blinds', x: 6, y: 0, rotation: 0 },
    { uid: 'welcome', id: 'ribbon-sign', x: 0, y: 0, rotation: 1 },
    { uid: 'neon', id: 'neon-sign', x: 0, y: 3, rotation: 1 },
  ];
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: state });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => page.evaluate(() => document.fonts.check('700 24px Mali', 'Tiệm Mây Nhỏ'))).toBe(true);
  await page.screenshot({ path: '.tmp/wall-art-scene.png' });
});
