import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState, preparedState } from './state';
import { canvasPoint } from './viewport';

test.describe('automatic landscape on phones', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('installed game fills the screen through rotation and return from background', async ({ page }) => {
    const state = preparedState();
    await page.addInitScript(({ key, state }) => {
      Object.defineProperty(navigator, 'standalone', { get: () => true });
      localStorage.setItem(key, JSON.stringify(state));
    }, { key: SAVE_KEY, state });
    await page.goto('/');
    const game = page.frameLocator('#landscape-game');
    await expect(game.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#app')).toHaveClass(/is-standalone/);
    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 430, height: 932 }]) {
      await page.setViewportSize(size);
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      await expect.poll(async () => {
        const rect = (await page.locator('#landscape-game').boundingBox())!;
        return [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)];
      }).toEqual([0, 0, size.width, size.height]);
      await expect.poll(() => game.locator('#app').evaluate(el => [el.clientWidth, el.clientHeight]))
        .toEqual([Math.max(size.width, size.height), Math.min(size.width, size.height)]);
    }
    await page.screenshot({ path: 'test-results/mobile-fullscreen-edge.png' });
  });

  test('safe areas move controls without shrinking the canvas', async ({ page }) => {
    const state = preparedState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    const game = page.frameLocator('#landscape-game');
    await expect(game.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    // Simulate iPhone physical insets: notch at top, home indicator below.
    await page.locator('#app').evaluate(el => {
      (el as HTMLElement).style.setProperty('--device-top', '59px');
      (el as HTMLElement).style.setProperty('--device-bottom', '34px');
      window.dispatchEvent(new Event('resize'));
    });
    expect(await game.locator('html').evaluate(() => [innerWidth, innerHeight])).toEqual([844, 390]);
    const canvasBounds = await game.locator('#game-canvas canvas').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    });
    expect(canvasBounds).toEqual({ left: 0, top: 0, right: 844, bottom: 390 });
    await expect(page.locator('#app')).toHaveCSS('padding', '0px');
    await expect(game.locator('.game-top-bar')).toHaveCSS('padding-left', '59px');
    await expect(game.locator('.right-dock-container')).toHaveCSS('right', '34px');
    await expect(game.locator('.game-top-bar')).toHaveCSS('padding-top', '4px');
    await game.locator('#settings-button').tap();
    const dialog = (await game.getByRole('dialog').boundingBox())!;
    expect(dialog.y).toBeGreaterThanOrEqual(59);
    expect(dialog.y + dialog.height).toBeLessThanOrEqual(844 - 34);
    await game.getByRole('dialog').locator('[data-action="close-modal"]').tap();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator('#app').evaluate(el => {
      const style = (el as HTMLElement).style;
      style.setProperty('--device-top', '0px');
      style.setProperty('--device-left', '59px');
      style.setProperty('--device-bottom', '21px');
      window.dispatchEvent(new Event('resize'));
    });
    expect(await game.locator('html').evaluate(() => [innerWidth, innerHeight])).toEqual([844, 390]);
    await expect(game.locator('.game-top-bar')).toHaveCSS('padding-left', '59px');
    await expect(game.locator('.game-bottom-hud')).toHaveCSS('padding-bottom', '21px');
    await expect(game.locator('.right-dock-container')).toHaveCSS('right', '4px');
  });

  test('opens sideways immediately and preserves the panel through device rotation', async ({ page }) => {
    const state = preparedState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    const game = page.frameLocator('#landscape-game');
    await expect(game.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#app')).toHaveClass(/is-rotated/);
    expect(await game.locator('html').evaluate(() => [innerWidth, innerHeight])).toEqual([844, 390]);
    await expect(game.locator('#landscape-hint')).toBeHidden();
    await expect(game.locator('.game-top-bar')).toHaveCSS('padding-top', '4px');
    await expect(game.locator('.game-top-bar')).toHaveCSS('padding-right', '4px');
    await expect(game.locator('.game-bottom-hud')).toHaveCSS('padding-bottom', '4px');
    await expect(game.locator('.right-dock-container')).toHaveCSS('right', '4px');
    const hostPadding = await page.locator('#app').evaluate(el => {
      const css = getComputedStyle(el);
      return [css.paddingLeft, css.paddingRight, css.paddingBottom];
    });
    expect(hostPadding).toEqual(['0px', '0px', '0px']);
    await page.screenshot({ path: 'test-results/mobile-edge-spacing.png' });

    await game.locator('[data-action="nav"][data-id="import"]').tap();
    const panel = game.locator('#content-panel');
    await expect(panel).toBeVisible();
    await panel.locator('.import-btn').first().tap();
    const moneyAfterPurchase = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).money, SAVE_KEY);
    expect(moneyAfterPurchase).toBeLessThan(state.money);

    // A swipe along the rotated screen's vertical axis must scroll the panel.
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 100, y: 450 }] });
    for (let x = 120; x <= 300; x += 20) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 450 }] });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await touch.detach();

    const documentId = await game.locator('html').evaluate(() => performance.timeOrigin);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('#app')).not.toHaveClass(/is-rotated/);
    await expect(page.locator('#app')).toHaveCSS('padding-top', '0px');
    await expect(page.locator('#app')).toHaveCSS('padding-bottom', '0px');
    await expect(panel).toBeVisible();
    expect(await game.locator('html').evaluate(() => performance.timeOrigin)).toBe(documentId);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).money, SAVE_KEY)).toBe(moneyAfterPurchase);
    await panel.locator('.panel-close-btn').tap();

    await game.locator('#settings-button').tap();
    await expect(game.getByRole('dialog')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#app')).toHaveClass(/is-rotated/);
    await expect(game.getByRole('dialog')).toBeVisible();
    const bounds = (await game.getByRole('dialog').boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
    await game.getByRole('dialog').locator('[data-action="close-modal"]').tap();
    await expect(game.getByRole('dialog')).not.toBeVisible();
  });

  test('a physical touch on the rotated canvas selects the customer', async ({ page }) => {
    const state = openState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    const game = page.frameLocator('#landscape-game');
    await expect(game.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await page.waitForTimeout(1600);
    const point = await canvasPoint(page, 426, 390);
    await page.touchscreen.tap(point.x, point.y);
    await expect(game.getByRole('dialog')).toHaveClass('dialog-serve');
    await game.locator('[data-action="outfit-category"][data-id="tops"]').tap();
    await game.locator('.outfit-grid [data-id="baby-tee"]').tap();
    await game.locator('[data-action="serve"]').tap();
    await expect(game.getByRole('dialog')).toHaveClass('dialog-result');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).stats.sold, SAVE_KEY)).toBe(1);
  });

  test('touch dragging moves furniture to the correct floor cell', async ({ page }) => {
    const state = preparedState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    const game = page.frameLocator('#landscape-game');
    await expect(game.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    const start = await canvasPoint(page, 416, 252);
    await page.touchscreen.tap(start.x, start.y);
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
