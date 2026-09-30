import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState, preparedState } from './state';
import { canvasPoint } from './viewport';

test.describe('manual landscape on phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('asks the player to rotate and preserves purchases and panels across rotation', async ({ page }) => {
    const state = preparedState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#landscape-game')).toHaveCount(0);
    await expect(page.locator('#landscape-hint')).toBeVisible();
    const documentId = await page.evaluate(() => performance.timeOrigin);
    await page.locator('#landscape-hint').tap();
    expect(await page.evaluate(() => document.fullscreenElement === null)).toBe(true);
    await expect(page.locator('#landscape-hint')).toBeVisible();

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('#landscape-hint')).toBeHidden();
    await page.locator('[data-action="nav"][data-id="import"]').tap();
    const panel = page.locator('#content-panel');
    await panel.locator('.import-btn').first().tap();
    const money = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).money, SAVE_KEY);
    expect(money).toBeLessThan(state.money);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#landscape-hint')).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('#landscape-hint')).toBeHidden();
    await expect(panel).toBeVisible();
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentId);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).money, SAVE_KEY)).toBe(money);
  });

  test('a physical touch after rotating the phone selects the customer', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const state = openState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    const game = page;
    await expect(game.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await game.locator('[data-action="sale-speed"]').tap();
    await game.locator('[data-action="sale-speed"]').tap();
    await expect(game.locator('[data-action="sale-speed"]')).toContainText('4x');
    await page.waitForTimeout(1600);
    const point = await canvasPoint(page, 426, 390);
    await page.touchscreen.tap(point.x, point.y);
    await expect(game.getByRole('dialog')).toHaveClass('dialog-serve');
    await game.locator('[data-action="close-modal"]').tap();
    await expect(game.getByRole('dialog')).not.toBeVisible();
    await page.touchscreen.tap(point.x, point.y);
    await expect(game.getByRole('dialog')).toHaveClass('dialog-serve');
    await game.locator('[data-action="outfit-category"][data-id="tops"]').tap();
    await game.locator('.outfit-grid [data-id="baby-tee"]').tap();
    await game.locator('[data-action="serve"]').tap();
    await expect(game.getByRole('dialog')).toHaveClass('dialog-result');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).stats.sold, SAVE_KEY)).toBe(1);
  });

  test('touch dragging moves furniture to the correct floor cell', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const state = preparedState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    const game = page;
    await expect(game.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    const start = await canvasPoint(page, 416, 252);
    await page.locator('#toasts').evaluate(element => element.append(document.createElement('div')));
    await page.touchscreen.tap(start.x, start.y);
    await expect(page.locator('#toasts')).toHaveClass(/is-selection-active/);
    await expect(page.locator('#toasts')).toBeEmpty();
    await game.locator('[data-action="move-start"]').tap();
    await page.waitForTimeout(300);
    const end = await canvasPoint(page, 472, 280);
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let step = 1; step <= 10; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + (end.x - start.x) * step / 10, y: start.y + (end.y - start.y) * step / 10 }],
      });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(key => {
      const rack = JSON.parse(localStorage.getItem(key)!).layout.find((item: { uid: string }) => item.uid === 'starter-rack');
      return [rack.x, rack.y];
    }, SAVE_KEY)).toEqual([1, 2]);
    await session.detach();
    await page.screenshot({ path: 'test-results/landscape-portrait.png' });
  });
});
