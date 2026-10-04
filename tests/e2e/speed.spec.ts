import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState } from './state';

test('sale speed cycles 1x, 2x, 4x, 1x and resets after closing', async ({ page }) => {
  const state = openState();
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const speed = page.locator('[data-action="sale-speed"]');
  const remaining = async () => {
    const [minutes, seconds] = (await page.locator('#day-timer-label').innerText()).split(':').map(Number);
    return minutes * 60 + seconds;
  };
  await expect(speed).toHaveText('1x');
  for (const multiplier of [2, 4, 1]) {
    await speed.click();
    await expect(speed).toHaveAttribute('data-speed', String(multiplier));
    const before = await remaining();
    await page.clock.runFor(2000);
    expect(before - await remaining()).toBe(2 * multiplier);
  }
  await page.locator('[data-action="close-shop"]').click();
  await expect(speed).toHaveCount(0);
  await page.locator('[data-action="next-day"]').click();
  await page.locator('[data-action="open"]').click();
  await expect(speed).toHaveAttribute('data-speed', '1');
});

test('sale controls and customer cards stay mounted across state renders', async ({ page }) => {
  const state = openState();
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  const speed = page.locator('[data-action="sale-speed"]');
  const customerCard = page.locator('[data-action="sale-visit-open"]').first();
  const closeButton = page.locator('[data-action="close-shop"]');
  await customerCard.evaluate(element => { (element as HTMLElement).dataset.stabilityProbe = 'customer'; });
  await closeButton.evaluate(element => { (element as HTMLElement).dataset.stabilityProbe = 'close'; });

  await speed.click();

  await expect(customerCard).toHaveAttribute('data-stability-probe', 'customer');
  await expect(closeButton).toHaveAttribute('data-stability-probe', 'close');
});

test('a held modal button still receives its click when the sale ticks underneath it', async ({ page }) => {
  const state = openState();
  state.onlineOrders = [{
    id: 'held-click-order',
    productId: 'ribbon-kiss-tee',
    customerName: 'Lily',
    customerHandle: '@lily.sweet',
    price: 100000,
    fee: 14000,
    createdDay: 1,
    courierVariant: 0,
  }];
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="online-order-open"]').click();

  const closeButton = page.getByRole('dialog').locator('[data-action="close-modal"]');
  const bounds = await closeButton.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.clock.runFor(1250);
  await page.mouse.up();

  await expect(page.getByRole('dialog')).not.toBeVisible();
});
