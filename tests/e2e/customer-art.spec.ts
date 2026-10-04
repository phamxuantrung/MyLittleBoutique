import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState } from './state';

test('customer uses fixed normal artwork while products are selected', async ({ page }) => {
  const state = openState('lily', 'advice');
  state.nextArrivalIn = 999;
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: state,
  });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="sale-visit-open"][data-id="e2e-lily"]').dispatchEvent('click');

  const dialog = page.locator('#game-dialog');
  const model = dialog.locator('.fitting-model img');
  await expect(dialog).toHaveClass('dialog-serve');
  await expect(model).toHaveAttribute('src', '/assets/characters/customers/01-lily.webp');
  await expect(model).toHaveAttribute('data-outfit', '');

  await dialog.locator('[data-action="outfit-category"][data-id="tops"]').dispatchEvent('click');
  await dialog.locator('.outfit-grid [data-action="select-product"]').first().dispatchEvent('click');
  await expect(dialog.locator('.fitting-model img')).toHaveAttribute('src', '/assets/characters/customers/01-lily.webp');
  await expect(dialog.locator('.fitting-model img')).toHaveAttribute('data-outfit', '');
});
