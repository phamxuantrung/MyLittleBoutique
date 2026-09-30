import { expect, test } from '@playwright/test';
import { products } from '../../src/data/catalog';
import { SAVE_KEY } from '../../src/systems/save';
import { openState, preparedState } from './state';
import { gameView } from './viewport';

test('advanced operations are placed in import, staff and customer-care screens', async ({ page }) => {
  const state = preparedState();
  state.level = 5;
  state.xp = 2000;
  state.claimed.push('system:campaign-guide-v1');
  state.returnCases.push({ id: 'return-e2e', productId: 'baby-tee', customerName: 'Chloe', amount: 99000, reason: 'Sai kích cỡ', availableDay: 1, deadlineDay: 3 });
  state.reputationCrisis = { startDay: 1, deadlineDay: 4, positiveReviews: 1, sales: 2, targetReviews: 3, targetSales: 8 };
  state.employees.push({ id: 'stylist', uid: 'stylist-1', name: 'Mai', role: 'Stylist', bio: 'Phối đồ tinh tế', appearance: 1, salary: 50000, service: 75, persuasion: 72, charm: 70, reliability: 80, appliedDay: 1, hiredDay: 1, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, energy: 75, assignment: 'service' });
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="nav"][data-id="import"]').click();
  await expect(page.locator('.supplier-choice-screen .supplier-bar-options > button')).toHaveCount(3);
  const activeSupplier = page.locator('.supplier-bar-options .is-active');
  const supplierCopyBox = await activeSupplier.locator('.supplier-card-copy').boundingBox();
  const supplierStatusBox = await activeSupplier.locator('.supplier-card-status').boundingBox();
  expect(supplierCopyBox!.x + supplierCopyBox!.width).toBeLessThanOrEqual(supplierStatusBox!.x);
  await expect(page.locator('[data-action="supplier-select"][data-id="global"]')).toContainText('Xưởng thiết kế cao cấp');
  await page.locator('[data-action="supplier-select"][data-id="wholesale"]').click();
  await expect(page.locator('.inventory-toolbar')).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).activeSupplierId, SAVE_KEY)).toBe('wholesale');
  const firstQty = page.locator('.traditional-qty-control').first();
  await expect(firstQty.locator('input')).toHaveValue('5');
  await firstQty.locator('[data-action="product-qty-step"][data-id="1"]').click();
  await expect(page.locator('.traditional-qty-control').first().locator('input')).toHaveValue('6');
  await page.locator('.panel-close-btn').click();
  await page.locator('[data-action="staff-open"]').click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.locator('.employee-shift-control')).toContainText('Năng lượng');
  await dialog.locator('[data-action="staff-assignment"][data-value="stock"]').click();
  await expect(dialog.locator('[data-action="staff-assignment"][data-value="stock"]')).toHaveClass(/is-active/);
  await dialog.locator('[data-action="close-modal"]').click();
  await page.locator('[data-action="customer-care-open"]').click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass('dialog-customer-care');
  await expect(dialog).toContainText('Chăm sóc đặc biệt');
  await expect(dialog).toContainText('Đổi trả & khiếu nại');
  await expect(dialog).toContainText('Lịch hẹn VIP');
  await expect(dialog).toContainText('Atelier couture');
  await expect(dialog).toContainText('Khủng hoảng uy tín');
  await dialog.locator('[data-action="couture-start"]').click();
  await expect(dialog).toContainText('Chốt ý tưởng');
});

test('delivered waiting stock is announced on the main shop screen', async ({ page }) => {
  const state = preparedState();
  state.phase = 'closed';
  state.pendingOrders.push({ id: 'arrival-e2e', productId: 'baby-tee', quantity: 4, cost: 120000, arrivalDay: 2, supplierId: 'wholesale' });
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await page.locator('[data-action="summary"]').click();
  await page.getByRole('dialog').locator('[data-action="next-day"]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass('dialog-orders-arrived');
  await expect(dialog).toContainText('Hàng mới đã về kho!');
  await expect(dialog).toContainText('Baby tee');
  await expect(dialog).toContainText('×4');
  await expect(page.locator('#shop-view')).toBeVisible();
});

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
  await expect(page.locator('.tutorial-callout')).toContainText('Chọn nguồn hàng');
  await page.locator('.supplier-source-card.tutorial-focus').click();
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

test('land expansion requires confirmation before spending money', async ({ page }) => {
  const state = preparedState();
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await page.locator('#land-expand-button').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass('dialog-land-expand-confirm');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).money, SAVE_KEY)).toBe(500000);
  await dialog.locator('[data-action="expand-land-confirmed"]').click();
  await expect(dialog).not.toBeVisible();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY);
  expect(saved.money).toBe(150000);
  expect(saved.landLevel).toBe(1);
});

test('closing card collapses and ready quests do not repeat the completed tag', async ({ page }) => {
  const state = preparedState();
  state.phase = 'closed';
  state.stats.sold = 3;
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('.closing-card')).toBeVisible();
  await page.locator('.closing-card [data-action="closing-toggle"]').click();
  await expect(page.locator('.closing-card')).toHaveClass(/is-collapsed/);
  await expect(page.locator('#closing-details')).toBeHidden();
  await page.locator('[data-action="quests"]').click();
  const readyQuest = page.locator('.daily-quest-card.is-ready').first();
  await expect(readyQuest.getByRole('button', { name: 'Nhận thưởng' })).toBeVisible();
  await expect(readyQuest).not.toContainText('Hoàn thành!');
});

test('level 3 introduces the campaign guide before brand briefs', async ({ page }) => {
  const state = preparedState();
  state.level = 3;
  state.xp = 650;
  state.claimed = state.claimed.filter(key => !key.includes('campaign-guide'));
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('.campaign-new-label')).toBeVisible();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Xây tên tuổi qua từng chiến dịch');
  await expect(dialog.locator('.campaign-guide-steps li')).toHaveCount(4);
  await dialog.locator('[data-action="campaign-guide-done"]').click();
  await expect(page.locator('.campaign-new-label')).toBeHidden();
  await expect(dialog.locator('.campaign-offer')).toHaveCount(3);
  await dialog.locator('[data-action="campaign-start"]').first().click();
  await expect(dialog).toContainText('Sản phẩm đúng brief');
  expect((await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), SAVE_KEY)).activeCampaign).not.toBeNull();
});

test('the online channel accepts listings and fulfills a courier order', async ({ page }) => {
  const state = openState('lily', 'advice');
  state.dayTimer = 116;
  for (const product of products) state.inventory[product.id] = Math.max(2, state.inventory[product.id] ?? 0);
  state.onlineListings = ['baby-tee'];
  state.onlineOrders = [{ id: 'e2e-online-order', productId: 'baby-tee', customerName: 'An', customerHandle: '@an_style', price: 100000, fee: 14000, createdDay: 1, courierVariant: 0 }];
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#online-fab-badge')).toHaveText('1');
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.dataset.action = 'online-order-open';
    button.dataset.id = 'e2e-online-order';
    document.body.append(button);
    button.click();
    button.remove();
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Shipper đang chờ tại shop');
  await expect.poll(() => page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    return [saved.dayTimer, saved.activeVisits[0]?.patience];
  }, SAVE_KEY)).toEqual([115, 89]);

  const grid = dialog.locator('.online-handover-grid');
  const scrollTop = await grid.evaluate(element => {
    element.scrollTop = element.scrollHeight;
    return element.scrollTop;
  });
  expect(scrollTop).toBeGreaterThan(0);
  const lastProduct = grid.locator('[data-action="online-hand-over-select"]').last();
  await lastProduct.click();
  await expect.poll(() => grid.evaluate(element => element.scrollTop)).toBeCloseTo(scrollTop, 0);
  await lastProduct.click();
  await dialog.locator('[data-action="online-hand-over-select"][data-id="baby-tee"]').click();
  await dialog.locator('[data-action="online-hand-over"]').click();
  await expect(dialog).not.toBeVisible();
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
    const view = await gameView(page);
    await expect(view.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
    if (height > width) {
      await expect(view.locator('#landscape-hint')).toBeVisible();
      await page.setViewportSize({ width: height, height: width });
      await expect(view.locator('#landscape-hint')).toBeHidden();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(view.locator('[data-action="open"]')).toBeVisible();
    await view.locator('[data-action="open"]').click();
    await expect(view.locator('[data-action="sale-speed"]')).toBeVisible();
    await expect(view.locator('[data-action="close-shop"]')).toBeVisible();
  });
}
