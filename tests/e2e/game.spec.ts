import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState, preparedState } from './state';

test('a new boutique completes seven tutorial steps and keeps preparing', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('#shop-name-input').fill('Tiệm Mây Hồng');
  await dialog.locator('[data-action="confirm-shop-name"]').click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#hud')).toContainText('500.000₫');
  await expect(page.locator('.tutorial-callout')).toContainText('Bấm Nhập hàng');
  await expect(page.locator('.tutorial-callout')).toContainText('1/7');
  await page.locator('.tutorial-focus[data-id="import"]').click();
  await expect(page.locator('.tutorial-callout')).toContainText('nhập mẫu đầu tiên');
  await page.locator('.import-btn.tutorial-focus').click();
  await page.locator('.panel-close-btn.tutorial-focus').click();
  await expect(page.locator('.tutorial-callout')).toContainText('sào quần áo');
  await page.waitForTimeout(400);
  await page.locator('.tutorial-cue-inside > .tutorial-callout').click();
  await expect(dialog).toBeVisible();
  const displayCardBox = await dialog.locator('.fixture-stock-option').first().boundingBox();
  const displayCueBox = await dialog.locator('.tutorial-callout').boundingBox();
  expect(displayCueBox!.y).toBeGreaterThanOrEqual(displayCardBox!.y + displayCardBox!.height);
  const stockGridBox = (await dialog.locator('.fixture-stock-grid').boundingBox())!;
  expect(displayCueBox!.x).toBeGreaterThanOrEqual(stockGridBox.x);
  expect(displayCueBox!.x + displayCueBox!.width).toBeLessThanOrEqual(stockGridBox.x + stockGridBox.width);
  expect(displayCueBox!.y + displayCueBox!.height).toBeLessThanOrEqual(stockGridBox.y + stockGridBox.height);
  await dialog.locator('.tutorial-display-add-target.tutorial-focus').click();
  const closeCue = dialog.locator('.tutorial-cue-badge > .tutorial-callout');
  await expect(closeCue).toContainText('Bấm X để về shop');
  const closeCueBox = await closeCue.boundingBox();
  expect(closeCueBox!.x + closeCueBox!.width).toBeLessThanOrEqual((await dialog.boundingBox())!.x + (await dialog.boundingBox())!.width);
  await dialog.locator('[data-action="close-modal"].tutorial-focus').click();
  await expect(dialog).toHaveClass('dialog-tutorial-recap');
  await expect(dialog).toContainText('BƯỚC 7/7');
  await expect(dialog.locator('.preparation-recap-steps li')).toHaveCount(5);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).tutorialDone, SAVE_KEY)).toBe(false);
  await dialog.getByRole('button', { name: 'Đã hiểu, tiếp tục chuẩn bị' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#move-toolbar')).toBeHidden();
  await expect(page.locator('.tutorial-callout')).toHaveCount(0);
  await expect(page.locator('.tutorial-focus')).toHaveCount(0);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.hasNamedShop).toBe(true);
  expect(saved.tutorialDone).toBe(true);
  expect(Object.values(saved.inventory).reduce((sum: number, value) => sum + Number(value), 0)).toBe(1);
  expect(saved.phase).toBe('preparation');
  await expect(page.locator('[data-action="open"]')).toBeVisible();
  await page.locator('[data-action="open"]').click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).phase, SAVE_KEY)).toBe('open');
});

test('the player can take a chosen loan on top of starting capital', async ({ page }) => {
  const state = preparedState();
  state.money = 500000;
  state.inventory = {};
  for (const fixture of state.layout) fixture.displayItems = [];
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await page.locator('[data-action="finance-open"]').first().click();
  await dialog.locator('#loan-amount-input').fill('700000');
  await dialog.locator('[data-action="take-loan"]').click();
  await expect(dialog).toContainText('1.200.000₫');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.money).toBe(1200000);
  expect(saved.loan.balance).toBe(700000);
});

test('the online channel accepts listings and fulfills a courier order', async ({ page }) => {
  const state = openState('lily', 'browse');
  state.onlineListings = ['baby-tee'];
  state.onlineOrders = [{ id: 'e2e-online-order', productId: 'baby-tee', customerName: 'An', customerHandle: '@an_style', price: 100000, fee: 14000, createdDay: 1, courierVariant: 0 }];
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#online-fab-badge')).toHaveText('1');
  await page.locator('#online-channel-button').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('1 đơn cần giao');
  await dialog.locator('[data-action="online-order-open"]').click();
  await expect(dialog).toContainText('Chuẩn bị đúng món cho An');
  await dialog.locator('[data-action="online-hand-over"][data-id="baby-tee"]').click();
  await expect(dialog.locator('.online-overview')).toContainText('1 đơn');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.onlineOrders).toHaveLength(0);
  expect(saved.onlineSales).toBe(1);
  expect(saved.money).toBe(586000);
});

test('current navigation opens inventory, trends and decoration panels', async ({ page }) => {
  const state = preparedState();
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="nav"][data-id="stock"]').click();
  await expect(page.locator('#content-panel')).toContainText('KHO HÀNG BOUTIQUE');
  await page.getByRole('button', { name: /Quay lại/ }).click();
  await page.locator('.standalone-dock-btn[data-id="trend"]').click();
  await expect(page.locator('#content-panel')).toContainText('Balletcore');
  const outTrendTab = page.locator('[data-action="trend-section"][data-id="out"]');
  await expect(outTrendTab).toBeVisible();
  await outTrendTab.click();
  await expect(outTrendTab).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: /Quay lại/ }).click();
  await page.locator('.standalone-dock-btn[data-id="decor"]').click();
  await expect(page.locator('#content-panel')).toContainText('BÀY TRÍ SHOP');
  await expect(page.locator('[data-action="buy-furniture"]').first()).toBeVisible();
  await page.getByRole('button', { name: /Quay lại/ }).click();
  await expect(page.locator('#game-canvas')).toBeVisible();
});

test('finance modal fits inside a short landscape viewport', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const state = preparedState();
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await page.locator('[data-action="finance-open"]').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.finance-footnote')).toBeInViewport();
  const box = await dialog.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(390);
});

test('overdue debt warns the player before the boutique is reclaimed', async ({ page }) => {
  const state = preparedState();
  state.phase = 'closed';
  state.rentDue = 75000;
  state.rentOverdueDays = 5;
  state.loanOverdueDays = 5;
  state.loan = { principal: 700000, balance: 752500, dailyRate: .015, paymentDue: 175000, issuedDay: 1, lastInterestDay: 7 };
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Chỉ còn 2 ngày để thanh toán');
  await dialog.locator('[data-action="finance-open"]').click();
  await expect(dialog).toContainText('Đang nợ 5/7 ngày');
  await expect(dialog).toContainText('30.000₫/ngày');
});

test('a reclaimed boutique can only start over', async ({ page }) => {
  const state = preparedState();
  state.phase = 'closed';
  state.loanOverdueDays = 8;
  state.rentOverdueDays = 8;
  state.gameOverReason = 'creditor';
  state.loan = { principal: 700000, balance: 900000, dailyRate: .015, paymentDue: 280000, issuedDay: 1, lastInterestDay: 10 };
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Chủ nợ đã tới thu hồi shop');
  await dialog.locator('[data-action="reset"]').click();
  await expect(dialog).toContainText('Chào mừng bạn đến với tiệm!');
});

test('level 7 exposes the new runway products and flagship furniture', async ({ page }) => {
  const state = preparedState();
  state.level = 7;
  state.xp = 99999;
  state.money = 99999999;
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('.standalone-dock-btn[data-id="decor"]').click();
  await expect(page.locator('#content-panel')).toContainText('Sào couture Vầng Trăng');
  await expect(page.locator('#content-panel')).toContainText('Tủ túi Global Flagship');
  await page.getByRole('button', { name: /Quay lại/ }).click();
  await page.locator('.standalone-dock-btn[data-id="import"]').click();
  await expect(page.locator('#content-panel')).toContainText('Đầm Runway Aurora');
  await expect(page.locator('#content-panel')).toContainText('Set World Tour Headliner');
});

for (const [width, height] of [[375, 667], [844, 390], [1280, 720]]) {
  test(`main controls stay usable at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const state = preparedState();
    await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
    await page.goto('/');
    await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('[data-action="open"]')).toBeVisible();
    await page.locator('[data-action="open"]').click();
    await expect(page.locator('[data-action="sale-speed"]')).toBeVisible();
    await expect(page.locator('[data-action="close-shop"]')).toBeVisible();
  });
}
