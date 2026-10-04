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
    const source = panel.locator('.supplier-source-card:not([disabled])').first();
    if (await source.isVisible()) await source.tap();
    const importRail = panel.locator('.import-horizontal-rail');
    await importRail.evaluate(element => { element.scrollLeft = 120; });
    const importScrollBefore = await importRail.evaluate(element => element.scrollLeft);
    await importRail.locator('.import-btn').nth(1).tap();
    const importDialog = page.getByRole('dialog');
    await expect(importDialog).toHaveClass('dialog-import-quantity');
    await importDialog.locator('[data-action="import-quantity-confirm"]').tap();
    await expect(importDialog).not.toBeVisible();
    await expect.poll(() => importRail.evaluate(element => element.scrollLeft)).toBe(importScrollBefore);
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
    await game.locator('.outfit-grid [data-id="ribbon-kiss-tee"]').tap();
    await game.locator('[data-action="serve"]').tap();
    await expect(game.getByRole('dialog')).toHaveClass('dialog-result');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).stats.sold, SAVE_KEY)).toBe(1);
  });

  test('another customer checkout does not close the active consultation', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const state = openState('lily', 'advice');
    state.activeVisits.push({
      uid: 'visit-checkout', customerId: 'emma', mode: 'browse', patience: 1, maxPatience: 90,
    });
    state.nextArrivalIn = 999;
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await page.locator('[data-action="sale-visit-open"][data-id="e2e-lily"]').dispatchEvent('click');
    await expect(page.locator('#game-dialog')).toHaveClass('dialog-serve');
    await expect(page.locator('#game-dialog')).toContainText('Lily');

    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).stats.served, SAVE_KEY), { timeout: 5000 }).toBe(1);
    await expect(page.locator('#game-dialog')).toHaveClass('dialog-serve');
    await expect(page.locator('#game-dialog')).toContainText('Lily');
    await page.locator('[data-action="outfit-category"][data-id="tops"]').dispatchEvent('click');
    await expect(page.locator('#game-dialog')).toContainText('Lily');
  });

  test('swiping the consultation products does not select an item', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const state = openState('lily', 'advice');
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    await page.locator('[data-action="sale-visit-open"][data-id="e2e-lily"]').dispatchEvent('click');
    const product = page.locator('.outfit-grid [data-action="select-product"]').first();
    await expect(product).toHaveAttribute('aria-pressed', 'false');
    const box = await product.boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const startY = box!.y + box!.height * .72;
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
    for (let step = 1; step <= 6; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: startY - 54 * step / 6 }],
      });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(100);
    await expect(product).toHaveAttribute('aria-pressed', 'false');
    await session.detach();

    await product.tap();
    await expect(page.locator('.outfit-grid [data-action="select-product"]').first()).toHaveAttribute('aria-pressed', 'true');
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

  test('dragging a selected piece across another piece keeps the original drag target', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const state = preparedState();
    state.layout = [
      { uid: 'drag-table', id: 'table', x: 1, y: 2, rotation: 0, displayItems: [] },
      { uid: 'crossed-plant', id: 'plant', x: 2, y: 2, rotation: 0 },
    ];
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');

    // Start on the painted centre of the table; imported furniture is anchored
    // by its feet, below the centre of the PNG.
    const start = await canvasPoint(page, 444, 285);
    const crossed = await canvasPoint(page, 500, 313);
    const end = await canvasPoint(page, 556, 341);
    await page.touchscreen.tap(start.x, start.y);
    await page.locator('[data-action="move-start"]').tap();
    await page.waitForTimeout(200);

    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (const point of [crossed, end]) {
      for (let step = 1; step <= 6; step++) {
        const from = point === crossed ? start : crossed;
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: from.x + (point.x - from.x) * step / 6, y: from.y + (point.y - from.y) * step / 6 }],
        });
      }
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect.poll(() => page.evaluate(key => {
      const layout = JSON.parse(localStorage.getItem(key)!).layout as Array<{ uid: string; x: number; y: number }>;
      const table = layout.find(item => item.uid === 'drag-table')!;
      const plant = layout.find(item => item.uid === 'crossed-plant')!;
      return { table: [table.x, table.y], plant: [plant.x, plant.y] };
    }, SAVE_KEY)).toEqual({ table: [3, 2], plant: [2, 2] });
    await session.detach();
  });

  test('move mode keeps the original selection when another piece is tapped', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const state = preparedState();
    state.layout = [
      { uid: 'selected-table', id: 'table', x: 1, y: 2, rotation: 0, displayItems: [] },
      { uid: 'nearby-plant', id: 'plant', x: 2, y: 2, rotation: 0 },
    ];
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');

    const table = await canvasPoint(page, 444, 285);
    const plant = await canvasPoint(page, 500, 313);
    await page.touchscreen.tap(table.x, table.y);
    await page.locator('[data-action="move-start"]').tap();
    await page.waitForTimeout(150);
    await page.touchscreen.tap(plant.x, plant.y);
    await page.locator('[data-action="move-rotate"]').tap();

    await expect.poll(() => page.evaluate(key => {
      const layout = JSON.parse(localStorage.getItem(key)!).layout as Array<{ uid: string; rotation: number }>;
      return layout.map(item => [item.uid, item.rotation]);
    }, SAVE_KEY)).toEqual([['selected-table', 1], ['nearby-plant', 0]]);
  });

  test('cancelled multi-touch gestures do not turn the next furniture drag into zoom', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const state = preparedState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');

    const start = await canvasPoint(page, 416, 252);
    const session = await page.context().newCDPSession(page);
    for (let attempt = 0; attempt < 4; attempt++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [start, { x: start.x + 45, y: start.y + 18 }],
      });
      await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    }

    await page.touchscreen.tap(start.x, start.y);
    await page.locator('[data-action="move-start"]').tap();
    await page.waitForTimeout(200);
    const end = await canvasPoint(page, 472, 280);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + (end.x - start.x) * step / 8, y: start.y + (end.y - start.y) * step / 8 }],
      });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(key => {
      const rack = JSON.parse(localStorage.getItem(key)!).layout.find((item: { uid: string }) => item.uid === 'starter-rack');
      return [rack.x, rack.y];
    }, SAVE_KEY)).toEqual([1, 2]);
    await session.detach();
  });
});
