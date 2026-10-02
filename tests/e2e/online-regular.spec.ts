import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { preparedState } from './state';

test('regular orders can be packed and livestream creates another regular order', async ({ page }) => {
  const state = preparedState();
  state.inventory['baby-tee'] = 6;
  state.inventory.ribbon = 5;
  state.inventory.jeans = 5;
  state.inventory.hoodie = 4;
  state.onlineListings = ['baby-tee', 'ribbon', 'jeans'];
  state.onlineChannelEnabled = true;
  state.regularOnlineOrders = [{
    id: 'regular-e2e', productIds: ['baby-tee'], customerName: 'Linh', customerHandle: '@linh_closet',
    price: 99000, fee: 7920, createdDay: 1, dueDay: 2, packed: false, source: 'storefront',
  }];

  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('#online-channel-button').click();

  const dialog = page.getByRole('dialog');
  await dialog.locator('[data-action="online-stock-open"]').click();
  await expect(dialog).toHaveClass('dialog-online-stock');
  await dialog.locator('[data-action="online-list"][data-id="hoodie"]').click();
  await expect(dialog.locator('.online-stock-card.is-listed')).toHaveCount(4);
  await dialog.locator('[data-action="online-stock-back"]').click();
  await expect(dialog).toHaveClass('dialog-online');
  await expect(dialog.locator('.storefront-product-grid [data-id="hoodie"]')).toHaveCount(1);

  await expect(dialog.locator('.regular-order-card')).toHaveCount(1);
  await dialog.locator('[data-action="regular-order-open"]').click();
  await expect(dialog).toHaveClass('dialog-regular-order-detail');
  await dialog.locator('[data-action="regular-pack"]').click();
  await expect(dialog.locator('.regular-order-detail')).toContainText('Đã đóng gói');
  await dialog.locator('.regular-order-detail > footer [data-action="regular-order-back"]').click();
  await expect(dialog).toHaveClass('dialog-online');
  await expect(dialog.locator('.regular-order-card')).toHaveClass(/is-packed/);

  await dialog.locator('[data-action="livestream-open"]').click();
  await expect(dialog).toHaveClass('dialog-livestream');
  await expect(dialog.locator('.livestream-product.is-selected')).toHaveCount(0);
  await expect(dialog.locator('[data-action="livestream-start"]')).toBeDisabled();
  const fullscreen = await dialog.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return Math.abs(rect.width - window.innerWidth) <= 2 && Math.abs(rect.height - window.innerHeight) <= 2;
  });
  expect(fullscreen).toBe(true);
  const livestreamFitsFrame = await dialog.locator('.dialog-inner').evaluate(element => element.scrollWidth <= element.clientWidth + 1);
  expect(livestreamFitsFrame).toBe(true);
  await dialog.locator('[data-action="livestream-pool-select"][data-id="baby-tee"]').click();
  await dialog.locator('[data-action="livestream-pool-select"][data-id="jeans"]').click();
  await expect(dialog.locator('.livestream-product.is-selected')).toHaveCount(2);
  await dialog.locator('[data-action="livestream-start"]').click();
  await expect(dialog.locator('.livestream-two-pane')).toBeVisible();
  await expect(dialog.locator('.livestream-video-pane')).toBeVisible();
  await expect(dialog.locator('.livestream-product-pane')).toBeVisible();
  await expect(dialog.locator('.livestream-time')).toBeVisible();
  await dialog.locator('[data-action="livestream-round-select"][data-id="baby-tee"]').click();
  await expect(dialog.locator('.livestream-pin-card.is-pinned')).toHaveCount(1);
  await dialog.locator('[data-action="livestream-round-select"][data-id="jeans"]').click();
  await expect(dialog.locator('.livestream-pin-card.is-pinned')).toHaveAttribute('data-id', 'jeans');
  await dialog.locator('[data-action="livestream-round-select"][data-id="baby-tee"]').click();
  const liveSessionFitsFrame = await dialog.locator('.dialog-inner').evaluate(element => element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1);
  expect(liveSessionFitsFrame).toBe(true);
  await expect(dialog.locator('.livestream-feed')).toContainText(/Em chốt mẫu đang ghim|Để em suy nghĩ thêm/, { timeout: 7000 });

  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.regularOnlineOrders.length).toBeGreaterThanOrEqual(1);
  if (saved.regularOnlineOrders.length > 1) expect(saved.regularOnlineOrders[1].source).toBe('livestream');
});

test('debug button opens the prepared online warehouse test', async ({ page }) => {
  const state = preparedState();
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');

  await page.locator('#debug-button').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass('dialog-debug');
  await dialog.locator('[data-action="debug-action"][data-id="online-stock"]').click();
  await expect(dialog).toHaveClass('dialog-online-stock');
  await expect(dialog.locator('.online-stock-card')).toHaveCount(8);
  await expect(dialog.locator('.online-stock-card.is-listed')).toHaveCount(2);
});

test('debug tools restore livestream and create a regular order', async ({ page }) => {
  const state = preparedState();
  state.lastLivestreamDay = state.day;
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');

  const dialog = page.getByRole('dialog');
  await page.locator('#debug-button').click();
  await dialog.locator('[data-action="debug-action"][data-id="livestream-reset"]').click();
  await expect(dialog).toHaveClass('dialog-livestream');
  await expect(dialog.locator('[data-action="livestream-start"]')).toBeDisabled();
  await dialog.locator('[data-action="livestream-pool-select"]').first().click();
  await expect(dialog.locator('[data-action="livestream-start"]')).toBeEnabled();
  await dialog.locator('[data-action="close-modal"]').click();

  await page.locator('#debug-button').click();
  await dialog.locator('[data-action="debug-action"][data-id="regular-order"]').click();
  await expect(dialog).toHaveClass('dialog-online');
  await expect(dialog.locator('.regular-order-card')).toHaveCount(1);
});
