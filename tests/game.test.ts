import { describe, expect, it } from 'vitest';
import { customers, furniture, products } from '../src/data/catalog';
import { activeCustomer, buyPrice, canPlace, currentEvent, DAY_DURATION, dayDuration, displayCapacity, displayUpgradeCost, isOutOfTrend, isTrending, landSize, matchScore, nextStaffRequirement, onlineOrderChance, staffCapacity, validOutfit } from '../src/systems/rules';
import { initialState, parseSave, SaveSystem } from '../src/systems/save';
import { GameStore } from '../src/systems/store';
import type { GameState } from '../src/types';
import { shopReviewStats } from '../src/systems/reviews';
import { campaignOffers } from '../src/systems/campaigns';

class MemorySave extends SaveSystem { snapshot = ''; override write(s: GameState) { this.snapshot = JSON.stringify(s); } }
const stockStarter = (s: GameState) => {
  s.money = 500000;
  s.inventory = { 'baby-tee': 2, jeans: 2, 'ribbon-dress': 1, hoodie: 1, ribbon: 2 };
  s.layout.find(item => item.uid === 'starter-rack')!.displayItems = ['baby-tee', 'baby-tee', 'jeans', 'jeans', 'ribbon-dress', 'hoodie'];
  const plantIndex = s.layout.findIndex(item => item.uid === 'starter-plant');
  s.layout[plantIndex] = { uid: 'starter-table', id: 'table', x: 6, y: 0, rotation: 0, displayItems: ['ribbon', 'ribbon'] };
};
const makeStore = (mutate?: (s: GameState) => void) => { const s = initialState(); stockStarter(s); mutate?.(s); return new GameStore(s, new MemorySave()); };

const visit = (store: GameStore, id = 'lily') => { store.state.currentCustomerId = id; store.state.customerMode = 'advice'; store.state.patience = 30; };

describe('inventory and economy', () => {
  it('keeps a substantial and unique endgame catalog across levels 5 to 7', () => {
    expect(new Set(products.map(product => product.id)).size).toBe(products.length);
    expect(new Set(furniture.map(item => item.id)).size).toBe(furniture.length);
    for (const level of [5, 6, 7]) expect(products.filter(product => product.level === level).length).toBeGreaterThanOrEqual(6);
    for (const level of [5, 6, 7]) expect(furniture.filter(item => item.level === level).length).toBeGreaterThanOrEqual(2);
  });
  it('starts with 500,000 in cash but no stock', () => {
    const s = initialState(); expect(s.money).toBe(500000); expect(Object.values(s.inventory).reduce((a, b) => a + b, 0)).toBe(0);
    expect(s.loan).toBeNull(); expect(s.rentDue).toBe(0);
  });
  it('buys stock at the daily wholesale price and persists it atomically', () => {
    const store = makeStore(s => { s.day = 2; });
    const p = products[0], price = buyPrice(store.state, p);
    expect(price).toBe(42750); expect(store.buy(p.id, 5)).toBe(true);
    expect(store.state.money).toBe(500000 - price * 5); expect(store.state.inventory[p.id]).toBe(7);
    expect(parseSave((store.save as MemorySave).snapshot).money).toBe(store.state.money);
  });
  it('rejects insufficient funds, locked items, fractional and negative amounts', () => {
    const store = makeStore(s => { s.money = 20000; }); const before = JSON.stringify(store.state);
    expect(store.buy('baby-tee', 1)).toBe(false); expect(store.buy('silk', 1)).toBe(false);
    expect(store.buy('baby-tee', -1)).toBe(false); expect(store.buy('baby-tee', .5)).toBe(false);
    expect(JSON.stringify(store.state)).toBe(before);
  });
  it('accepts freely chosen non-negative selling prices and rejects invalid values', () => {
    const store = makeStore(); store.setPrice('baby-tee', Infinity); store.setPrice('baby-tee', -1);
    expect(store.state.prices['baby-tee']).toBeUndefined();
    store.setPrice('baby-tee', 10000); expect(store.state.prices['baby-tee']).toBe(10000);
    store.setPrice('baby-tee', 250000); expect(store.state.prices['baby-tee']).toBe(250000);
  });
  it('never grants free rescue stock because financing remains the recovery path', () => {
    const store = makeStore(); const before = { ...store.state.inventory };
    store.rescue(); expect(store.state.inventory).toEqual(before);
    store.state.inventory = {}; store.state.money = 0; store.rescue(); expect(store.state.inventory).toEqual({});
  });
  it('lists warehouse stock online and creates a courier order when reach is strong', () => {
    const state = initialState(); stockStarter(state);
    state.inventory['baby-tee'] = 3;
    state.followers = 500;
    const store = new GameStore(state, new MemorySave(), () => 0);
    expect(store.listOnlineProduct('baby-tee')).toBe(true);
    store.openShop();
    store.state.onlineNextOrderIn = 0;
    store.tick();
    expect(store.state.onlineOrders).toHaveLength(1);
    expect(store.state.onlineOrders[0].productId).toBe('baby-tee');
  });
  it('allows every stocked product to be listed online without a slot limit', () => {
    const state = initialState();
    for (const product of products) state.inventory[product.id] = 1;
    const store = new GameStore(state, new MemorySave());
    for (const product of products) expect(store.listOnlineProduct(product.id)).toBe(true);
    expect(store.state.onlineListings).toHaveLength(products.length);
    expect(parseSave(JSON.stringify(store.state)).onlineListings).toHaveLength(products.length);
  });
  it('keeps listings while the online channel is toggled off and stops accepting orders', () => {
    const state = initialState();
    state.inventory['baby-tee'] = 3;
    state.layout.find(item => item.id === 'rack')!.displayItems = ['baby-tee'];
    state.onlineListings = ['baby-tee'];
    const store = new GameStore(state, new MemorySave(), () => 0);
    expect(store.toggleOnlineChannel()).toBe(true);
    expect(store.state.onlineChannelEnabled).toBe(false);
    expect(store.state.onlineListings).toEqual(['baby-tee']);
    store.openShop();
    store.state.onlineNextOrderIn = 0;
    store.tick();
    expect(store.state.onlineOrders).toHaveLength(0);
  });
  it('creates a ready-to-test online order from the debug panel', () => {
    const store = makeStore();
    expect(store.debug('online-order')).toBe(true);
    expect(store.state.phase).toBe('open');
    expect(store.state.onlineListings).toContain(store.state.onlineOrders[0].productId);
    expect(store.state.onlineOrders).toHaveLength(1);
    expect(store.state.onlineOrders[0].productIds).toHaveLength(3);
  });
  it('delivers all products in a multi-item online order together', () => {
    const store = makeStore(s => {
      s.phase = 'open';
      s.inventory['baby-tee'] = 2;
      s.inventory.jeans = 2;
      s.onlineOrders = [{ id: 'multi', productId: 'baby-tee', productIds: ['baby-tee', 'jeans'], customerName: 'An', customerHandle: '@an_style', price: 206000, fee: 28840, createdDay: 1, courierVariant: 0 }];
    });
    expect(store.fulfillOnlineOrder('multi', ['baby-tee', 'jeans'])).toBe(true);
    expect(store.state.inventory['baby-tee']).toBe(1);
    expect(store.state.inventory.jeans).toBe(1);
    expect(store.state.onlineOrders).toHaveLength(0);
    expect(store.state.money).toBe(500000 + 177160);
  });
  it('makes online demand difficult for a new channel and sensitive to real review quality', () => {
    const state = initialState();
    state.onlineListings = ['baby-tee'];
    state.followers = 5;
    expect(onlineOrderChance(state)).toBeLessThan(.01);
    state.followers = 500;
    state.reputation = 4.8;
    state.onlineReviews = 30;
    state.onlineSales = 40;
    state.onlineRating = 4.7;
    const trustedChance = onlineOrderChance(state);
    state.onlineRating = 2;
    const damagedChance = onlineOrderChance(state);
    expect(trustedChance).toBeGreaterThan(.15);
    expect(damagedChance).toBeLessThan(trustedChance / 5);
  });
  it('charges the online fee for a correct parcel and penalizes a wrong parcel', () => {
    const store = makeStore(s => {
      s.inventory['baby-tee'] = 3;
      s.inventory.jeans = 3;
      s.phase = 'open';
      s.onlineOrders = [{ id: 'order-1', productId: 'baby-tee', customerName: 'An', customerHandle: '@an_style', price: 100000, fee: 14000, createdDay: 1, courierVariant: 0 }];
    });
    const beforeMoney = store.state.money;
    expect(store.fulfillOnlineOrder('order-1', 'baby-tee')).toBe(true);
    expect(store.state.money).toBe(beforeMoney + 86000);
    expect(store.state.onlineSales).toBe(1);
    store.state.onlineOrders = [{ id: 'order-2', productId: 'baby-tee', customerName: 'Vy', customerHandle: '@vy_daily', price: 100000, fee: 14000, createdDay: 1, courierVariant: 1 }];
    const beforeReputation = store.state.reputation;
    expect(store.fulfillOnlineOrder('order-2', 'jeans')).toBe(true);
    expect(store.state.reputation).toBeLessThan(beforeReputation);
    expect(store.state.onlineRating).toBeLessThan(5);
  });
  it('protects stock reserved for another courier and allows a lighter stockout cancellation', () => {
    const store = makeStore(s => {
      s.inventory['baby-tee'] = 3;
      s.inventory.jeans = 3;
      s.phase = 'open';
      s.onlineOrders = [
        { id: 'order-baby', productId: 'baby-tee', customerName: 'An', customerHandle: '@an_style', price: 100000, fee: 14000, createdDay: 1, courierVariant: 0 },
        { id: 'order-jeans', productId: 'jeans', customerName: 'Vy', customerHandle: '@vy_daily', price: 120000, fee: 16800, createdDay: 1, courierVariant: 1 },
      ];
    });
    expect(store.fulfillOnlineOrder('order-baby', 'jeans')).toBe(false);
    expect(store.state.inventory.jeans).toBe(3);
    store.state.inventory['baby-tee'] = 2;
    const beforeReputation = store.state.reputation;
    expect(store.cancelOutOfStockOnlineOrder('order-baby')).toBe(true);
    expect(store.state.onlineOrders.map(order => order.id)).toEqual(['order-jeans']);
    expect(beforeReputation - store.state.reputation).toBeGreaterThan(.08);
    expect(beforeReputation - store.state.reputation).toBeLessThan(.3);
  });
  it('cancels an online order without revenue or reputation penalties', () => {
    const store = makeStore(s => {
      s.phase = 'open';
      s.onlineOrders = [{ id: 'cancel-me', productId: 'baby-tee', customerName: 'An', customerHandle: '@an_style', price: 77000, fee: 10780, createdDay: 1, courierVariant: 0 }];
    });
    const before = { money: store.state.money, reputation: store.state.reputation, rating: store.state.onlineRating, reviews: store.state.onlineReviews, followers: store.state.followers };
    expect(store.cancelOnlineOrder('cancel-me')).toBe(true);
    expect(store.state.onlineOrders).toHaveLength(0);
    expect({ money: store.state.money, reputation: store.state.reputation, rating: store.state.onlineRating, reviews: store.state.onlineReviews, followers: store.state.followers }).toEqual(before);
  });
  it('allows handing a different displayed product to the courier and records a wrong delivery', () => {
    const store = makeStore(s => {
      s.phase = 'open';
      s.inventory.jeans = 1;
      const rack = s.layout.find(item => item.id === 'rack')!;
      rack.displayItems = ['jeans'];
      s.onlineOrders = [{ id: 'wrong-item', productId: 'baby-tee', customerName: 'An', customerHandle: '@an_style', price: 77000, fee: 10780, createdDay: 1, courierVariant: 0 }];
    });
    expect(store.fulfillOnlineOrder('wrong-item', 'jeans')).toBe(true);
    expect(store.state.inventory.jeans).toBe(0);
    expect(store.state.layout.find(item => item.id === 'rack')?.displayItems).not.toContain('jeans');
    expect(store.state.onlineRating).toBe(1);
  });
  it('lets the player choose a loan within the lifetime credit limit', () => {
    const store = new GameStore(initialState(), new MemorySave());
    expect(store.takeLoan(200000)).toBe(false);
    expect(store.takeLoan(700000)).toBe(true);
    expect(store.state.money).toBe(1200000);
    expect(store.state.loan).toMatchObject({ principal: 700000, balance: 700000, paymentDue: 0 });
    expect(store.takeLoan(9300000)).toBe(true);
    expect(store.takeLoan(10000)).toBe(false);
    expect(store.state.loan?.principal).toBe(10000000);
  });
});

describe('staff payroll', () => {
  const addEmployee = (s: GameState, assignment: 'service' | 'off' = 'service') => {
    s.level = 3;
    s.landLevel = 2;
    s.employees.push({
      id: 'staff-test', uid: 'staff-test-uid', name: 'Mai An', role: 'Tư vấn viên', bio: 'Nhân viên kiểm thử.',
      appearance: 0, salary: 100000, service: 70, persuasion: 70, charm: 70, reliability: 99, appliedDay: 1,
      hiredDay: 1, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, energy: 100, assignment,
      unpaidShifts: 0, unpaidWages: 0, totalShiftsWorked: 0,
    });
  };

  it('accrues salary only for a real worked shift and pays it manually', () => {
    const store = makeStore(s => { s.money = 1000000; addEmployee(s); });
    store.openShop();
    store.closeDay();
    const employee = store.state.employees[0];
    expect(employee).toMatchObject({ unpaidShifts: 1, unpaidWages: 100000, totalShiftsWorked: 1 });
    const beforePay = store.state.money;
    expect(store.payStaffWages(employee.uid)).toBe(true);
    expect(store.state.money).toBe(beforePay - 100000);
    expect(employee).toMatchObject({ unpaidShifts: 0, unpaidWages: 0 });
  });

  it('does not accrue salary while an employee is off shift', () => {
    const store = makeStore(s => { addEmployee(s, 'off'); });
    store.openShop();
    store.closeDay();
    expect(store.state.employees[0]).toMatchObject({ unpaidShifts: 0, unpaidWages: 0, totalShiftsWorked: 0 });
  });

  it('automatically settles old wages when an employee is fired', () => {
    const store = makeStore(s => {
      s.money = 500000;
      addEmployee(s);
      s.employees[0].unpaidShifts = 2;
      s.employees[0].unpaidWages = 200000;
    });
    expect(store.fireStaff('staff-test-uid')).toBe(true);
    expect(store.state.money).toBe(300000);
    expect(store.state.stats.staffWages).toBe(200000);
    expect(store.state.employees).toHaveLength(0);
  });

  it('makes an employee leave after the fourth unpaid shift and settles all old wages', () => {
    const state = initialState();
    stockStarter(state);
    state.money = 1000000;
    addEmployee(state);
    const store = new GameStore(state, new MemorySave(), () => .99);
    for (let shift = 0; shift < 4; shift++) {
      store.openShop();
      store.closeDay();
      if (shift < 3) store.nextDay();
    }
    expect(store.state.employees).toHaveLength(0);
    expect(store.state.money).toBe(600000);
    expect(store.state.stats.staffWages).toBe(400000);
  });

  it('charges a fee when posting a recruitment notice', () => {
    const store = makeStore(s => { s.level = 3; s.landLevel = 2; s.money = 100000; });
    expect(store.postRecruitment(100000)).toBe(true);
    expect(store.state.money).toBe(70000);
    expect(store.state.recruitmentPost?.salary).toBe(100000);
  });
});

describe('customer interactions and day progression', () => {
  it('marks yesterday\'s trend as out of trend from the next day', () => {
    const state = initialState();
    const ribbonDress = products.find(product => product.id === 'ribbon-dress')!;
    expect(isTrending(state, ribbonDress)).toBe(true);
    expect(isOutOfTrend(state, ribbonDress)).toBe(false);
    state.day = 2;
    expect(isTrending(state, ribbonDress)).toBe(false);
    expect(isOutOfTrend(state, ribbonDress)).toBe(true);
  });
  it('lets a clearance discount recover part of an out-trend score penalty', () => {
    const state = initialState(); state.day = 2;
    const ribbonDress = products.find(product => product.id === 'ribbon-dress')!;
    const customer = customers.find(candidate => candidate.id === 'lily')!;
    const regularScore = matchScore(state, customer, [ribbonDress]);
    state.prices[ribbonDress.id] = Math.round(ribbonDress.sellPrice * .8);
    expect(matchScore(state, customer, [ribbonDress])).toBeGreaterThan(regularScore);
  });
  it('does not open without stock or process sales while closed', () => {
    const store = makeStore(s => { s.inventory = {}; }); store.openShop(); expect(store.state.phase).toBe('preparation');
    expect(store.serve(['baby-tee'])).toBeUndefined();
  });
  it('uses the same daily event for its opening status and gameplay modifiers', () => {
    const store = makeStore(s => { s.day = 2; });
    store.openShop();
    expect(store.state.dailyLuck).toBe(currentEvent(store.state).name);
  });
  it('sells a matching outfit and consumes exactly the selected items', () => {
    const store = makeStore(); store.openShop(); visit(store); const result = store.serve(['baby-tee', 'ribbon']);
    expect(result?.success).toBe(true); expect(store.state.money).toBe(500000 + products.find(p => p.id === 'baby-tee')!.sellPrice + products.find(p => p.id === 'ribbon')!.sellPrice);
    expect(store.state.inventory['baby-tee']).toBe(1); expect(store.state.inventory.ribbon).toBe(1);
    expect(store.state.stats.sold).toBe(2); expect(store.state.xp).toBe(12); expect(store.state.posts).toHaveLength(1);
    expect(store.state.posts[0].reviewStars).toBe(result?.reviewStars);
    expect(shopReviewStats(store.state)).toMatchObject({ count: 1, average: result?.reviewStars });
    expect(store.state.customerIndex).toBe(1);
  });
  it('builds customer loyalty, grants a tier reward once and persists it', () => {
    const store = makeStore(s => {
      s.customerLoyalty.lily = { visits: 2, purchases: 1, points: 20, lastVisitDay: 0, rewardsClaimed: [] };
    });
    store.openShop(); visit(store);
    const result = store.serve(['baby-tee', 'ribbon']);
    expect(result?.success).toBe(true);
    expect(result?.loyaltyPoints).toBeGreaterThan(0);
    expect(result?.loyaltyTier).toBe('Khách quen');
    expect(result?.loyaltyReward).toContain('25.000');
    expect(store.state.customerLoyalty.lily.purchases).toBe(2);
    expect(store.state.customerLoyalty.lily.rewardsClaimed).toEqual([25]);
    expect(parseSave(JSON.stringify(store.state)).customerLoyalty.lily).toEqual(store.state.customerLoyalty.lily);
  });
  it('gives loyal customers a small trust bonus when evaluating an outfit', () => {
    const state = initialState();
    const lily = customers.find(customer => customer.id === 'lily')!;
    const hoodie = products.find(product => product.id === 'hoodie')!;
    const newCustomerScore = matchScore(state, lily, [hoodie]);
    state.customerLoyalty.lily = { visits: 5, purchases: 4, points: 60, lastVisitDay: 1, rewardsClaimed: [25, 60] };
    expect(matchScore(state, lily, [hoodie])).toBe(newCustomerScore + 4);
  });
  it('rejects an unaffordable outfit without consuming stock or money', () => {
    const store = makeStore(); store.openShop(); visit(store); visit(store, 'an');
    const c = activeCustomer(store.state)!; expect(c.name).toBe('An');
    const before = store.state.money; const result = store.serve(['ribbon-dress']);
    expect(result?.success).toBe(false); expect(result?.score).toBe(0);
    expect(store.state.money).toBe(before); expect(store.state.inventory['ribbon-dress']).toBe(1);
  });
  it('uses customer preferences and markup, not an automatic sale', () => {
    const store = makeStore(); store.openShop(); visit(store); const c = activeCustomer(store.state)!;
    const tee = products.find(p => p.id === 'baby-tee')!, hoodie = products.find(p => p.id === 'hoodie')!;
    expect(matchScore(store.state, c, [tee])).toBeGreaterThan(matchScore(store.state, c, [hoodie]));
    const before = matchScore(store.state, c, [tee]); store.setPrice('baby-tee', tee.sellPrice * 1.5);
    expect(matchScore(store.state, c, [tee])).toBeLessThan(before);
  });
  it('prevents duplicate categories, duplicate items and incompatible dress layers', () => {
    expect(validOutfit(['baby-tee', 'hoodie'])).toBe(false); expect(validOutfit(['baby-tee', 'baby-tee'])).toBe(false);
    expect(validOutfit(['ribbon-dress', 'jeans'])).toBe(false); expect(validOutfit(['ribbon-dress', 'ribbon', 'sneakers'])).toBe(true);
    expect(validOutfit(['missing'])).toBe(false); expect(validOutfit([])).toBe(false);
  });
  it('does not sell out-of-stock items', () => {
    const store = makeStore(); store.openShop(); visit(store); const before = JSON.stringify(store.state);
    expect(store.serve(['silk'])).toBeUndefined(); expect(JSON.stringify(store.state)).toBe(before);
  });
  it('creates a viral post only for a very happy influencer', () => {
    const store = makeStore(); store.openShop(); visit(store); visit(store, 'linh');
    const result = store.serve(['ribbon-dress', 'ribbon']);
    expect(result?.viral).toBe(true); expect(result?.followers).toBe(132); expect(store.state.posts[0].viral).toBe(true);
  });
  it('advances impatient customers exactly once and ends the day', () => {
    const store = makeStore(); store.openShop(); visit(store); store.state.patience = 1; store.tick();
    expect(store.state.customerIndex).toBe(1); expect(store.state.patience).toBe(0); expect(store.state.nextArrivalIn).toBeGreaterThan(0);
    for (let i = 0; i < DAY_DURATION; i++) store.tick();
    expect(store.state.phase).toBe('closed'); expect(store.state.stats.served).toBeGreaterThan(1);
    const served = store.state.stats.served; store.tick(); store.skipCustomer(); expect(store.state.stats.served).toBe(served);
    const money = store.state.money; store.nextDay(); expect(store.state.day).toBe(2); expect(store.state.phase).toBe('preparation');
    expect(store.state.stats.served).toBe(0); expect(store.state.money).toBe(money);
  });
  it('closes early after the last displayed item is sold', () => {
    const store = makeStore(s => {
      s.inventory = { 'baby-tee': 1, ribbon: 1 };
      for (const fixture of s.layout) fixture.displayItems = [];
      s.layout.find(item => item.uid === 'starter-rack')!.displayItems = ['baby-tee'];
      s.layout.find(item => item.uid === 'starter-table')!.displayItems = ['ribbon'];
    });
    store.openShop();
    visit(store);
    expect(store.serve(['baby-tee', 'ribbon'])?.success).toBe(true);
    expect(store.state.phase).toBe('open');
    expect(store.state.dayTimer).toBeGreaterThan(0);
    store.tick();
    expect(store.state.phase).toBe('closed');
    expect(store.state.stats.sold).toBe(2);
  });
  it('creates rent and loan invoices from day 3 without automatically deducting cash', () => {
    const store = makeStore(s => { s.day = 3; s.money = 600000; });
    expect(store.takeLoan(600000)).toBe(true);
    const cashBeforeClosing = store.state.money;
    store.openShop(); visit(store); store.closeDay();
    expect(store.state.money).toBe(cashBeforeClosing);
    expect(store.state.stats.rent).toBe(50000); expect(store.state.rentDue).toBe(50000);
    expect(store.state.stats.loanInterest).toBe(9000);
    expect(store.state.loan).toMatchObject({ balance: 609000, paymentDue: 30000, lastInterestDay: 3 });
    expect(store.state.loanOverdueDays).toBe(1); expect(store.state.rentOverdueDays).toBe(1);
    expect(store.payRentDue()).toBe(true); expect(store.payLoanDue()).toBe(true);
    expect(store.state.rentDue).toBe(0); expect(store.state.loan?.paymentDue).toBe(0);
    expect(store.state.loan?.balance).toBe(579000);
    expect(store.state.loanOverdueDays).toBe(0); expect(store.state.rentOverdueDays).toBe(0);
  });
  it('charges the higher daily rent from the first day', () => {
    const store = makeStore(); const cash = store.state.money;
    store.openShop(); store.closeDay();
    expect(store.state.stats.rent).toBe(50000);
    expect(store.state.rentDue).toBe(50000);
    expect(store.state.rentOverdueDays).toBe(1);
    expect(store.state.money).toBe(cash);
  });
  it('carries unpaid rent forward instead of taking the last cash automatically', () => {
    const store = makeStore(s => { s.day = 4; s.money = 2000; }); store.openShop(); visit(store); store.closeDay();
    expect(store.state.stats.rent).toBe(50000); expect(store.state.rentDue).toBe(50000); expect(store.state.money).toBe(2000);
    expect(store.payRentDue()).toBe(false); expect(store.state.money).toBe(2000);
  });
  it('warns before day seven and ends the run after more than seven unpaid days', () => {
    const store = makeStore(s => { s.day = 3; s.money = 100000; });
    expect(store.takeLoan(600000)).toBe(true);
    let warnings = 0, gameOvers = 0;
    store.subscribe(event => { if (event.type === 'debt-warning') warnings++; if (event.type === 'game-over') gameOvers++; });
    for (let overdueDay = 1; overdueDay <= 8; overdueDay++) {
      store.openShop(); store.closeDay();
      if (overdueDay < 8) store.nextDay();
    }
    expect(warnings).toBe(3);
    expect(gameOvers).toBe(1);
    expect(store.state.loanOverdueDays).toBe(8);
    expect(store.state.rentOverdueDays).toBe(8);
    expect(store.state.gameOverReason).toBe('creditor');
    const failedDay = store.state.day;
    store.nextDay(); store.openShop();
    expect(store.state.day).toBe(failedDay); expect(store.state.phase).toBe('closed');
  });
  it('makes mission rewards idempotent and day-specific', () => {
    const store = makeStore(); store.claimQuest('sales'); expect(store.state.money).toBe(500000);
    store.state.stats.sold = 3; store.claimQuest('sales'); store.claimQuest('sales'); expect(store.state.money).toBe(535000);
    store.state.day = 2; store.claimQuest('sales'); expect(store.state.money).toBe(570000);
  });
});

describe('employee recruitment and payroll', () => {
  it('requires shop level 3 and land level 3 before the first recruitment', () => {
    const store = makeStore(s => { s.level = 3; s.landLevel = 1; });
    expect(staffCapacity(store.state)).toBe(0);
    expect(nextStaffRequirement(store.state)).toEqual({ level: 3, landLevel: 2 });
    expect(store.postRecruitment(60000)).toBe(false);

    store.state.landLevel = 2;
    expect(staffCapacity(store.state)).toBe(1);
    expect(store.postRecruitment(60000)).toBe(true);
    expect(store.state.recruitmentPost?.applicantsDay).toBe(3);
  });

  it('delivers three applicants after two days and hires only one of them', () => {
    const state = initialState();
    stockStarter(state);
    state.level = 3;
    state.landLevel = 2;
    const store = new GameStore(state, new MemorySave(), () => .5);
    expect(store.postRecruitment(75000)).toBe(true);

    store.state.phase = 'closed';
    store.nextDay();
    expect(store.state.staffApplicants).toHaveLength(0);
    store.state.phase = 'closed';
    store.nextDay();
    expect(store.state.staffApplicants).toHaveLength(3);
    expect(new Set(store.state.staffApplicants.map(candidate => candidate.name)).size).toBe(3);
    expect(new Set(store.state.staffApplicants.map(candidate => candidate.appearance)).size).toBe(3);

    const candidate = store.state.staffApplicants[0];
    expect(store.hireStaff(candidate.id)).toBe(true);
    expect(store.state.employees).toHaveLength(1);
    expect(store.state.employees[0].salary).toBe(75000);
    expect(store.state.staffApplicants).toHaveLength(0);
    expect(store.state.recruitmentPost).toBeNull();
  });

  it('accrues shift salary and records it only when paid manually', () => {
    const store = makeStore(s => {
      s.day = 2; s.level = 3; s.landLevel = 2;
      s.employees.push({
        id: 'candidate-1', uid: 'staff-1', name: 'Mai An', role: 'Stylist', bio: 'Tư vấn phối đồ.', appearance: 0,
        salary: 70000, service: 72, persuasion: 74, charm: 68, reliability: 80, appliedDay: 1,
        hiredDay: 2, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0,
      });
    });
    const before = store.state.money;
    store.state.phase = 'open';
    store.closeDay();
    expect(store.state.money).toBe(before);
    expect(store.state.employees[0]).toMatchObject({ unpaidShifts: 1, unpaidWages: 70000 });
    expect(store.state.stats.staffWages).toBe(0);
    expect(store.payStaffWages('staff-1')).toBe(true);
    expect(store.state.money).toBe(before - 70000);
    expect(store.state.stats.staffWages).toBe(70000);
  });

  it('awards shift experience and raises employee stats at a career level', () => {
    const store = makeStore(s => {
      s.employees.push({
        id: 'candidate-xp', uid: 'staff-xp', name: 'Gia Hân', role: 'Stylist', bio: 'Tư vấn phối đồ.', appearance: 2,
        salary: 60000, service: 70, persuasion: 72, charm: 68, reliability: 80, appliedDay: 1,
        hiredDay: 1, morale: 90, deniedLeaves: 0, sales: 2, tipsEarned: 0, experience: 49, skillLevel: 1, shiftSales: 2,
      });
    });
    store.state.phase = 'open';
    store.closeDay();
    const employee = store.state.employees[0];
    expect(employee.skillLevel).toBe(2);
    expect(employee.experience).toBe(21);
    expect(employee.service).toBe(72);
    expect(employee.persuasion).toBe(74);
    expect(employee.shiftSales).toBe(0);
  });

  it('allows staff to request leave only after the shift has ended', () => {
    const state = initialState();
    stockStarter(state);
    state.employees.push({
      id: 'candidate-leave', uid: 'staff-leave', name: 'Hà My', role: 'Boutique host', bio: 'Chăm sóc khách hàng.', appearance: 4,
      salary: 60000, service: 68, persuasion: 65, charm: 72, reliability: 70, appliedDay: 1,
      hiredDay: 1, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, experience: 0, skillLevel: 1, shiftSales: 0,
    });
    const store = new GameStore(state, new MemorySave(), () => 0);
    store.openShop();
    store.state.nextArrivalIn = 999;
    for (let second = 0; second < 5; second++) store.tick();
    expect(store.state.staffLeaveRequests).toHaveLength(0);
    store.closeDay();
    expect(store.state.phase).toBe('closed');
    expect(store.state.staffLeaveRequests).toHaveLength(1);
    expect(store.state.staffLeaveRequests[0].requestedDay).toBe(store.state.day);
  });

  it('lets a skilled employee automatically take and resolve an advice visit', () => {
    const state = initialState();
    stockStarter(state);
    state.employees.push({
      id: 'candidate-auto', uid: 'staff-auto', name: 'Mai An', role: 'Fashion assistant', bio: 'Chủ động hỗ trợ khách.', appearance: 0,
      salary: 70000, service: 99, persuasion: 99, charm: 90, reliability: 99, appliedDay: 1,
      hiredDay: 1, morale: 95, deniedLeaves: 0, sales: 0, tipsEarned: 0, experience: 0, skillLevel: 1, shiftSales: 0,
    });
    const store = new GameStore(state, new MemorySave(), () => 0);
    store.openShop();
    store.state.nextArrivalIn = 999;
    store.state.activeVisits = [{ uid: 'visit-auto', customerId: 'lily', mode: 'advice', patience: 60, maxPatience: 60 }];
    store.state.currentVisitId = 'visit-auto';
    store.state.currentCustomerId = 'lily';
    store.state.customerMode = 'advice';
    store.state.patience = 60;
    for (let second = 0; second < 7; second++) store.tick();
    expect(store.state.activeVisits).toHaveLength(0);
    expect(store.state.stats.served).toBe(1);
    expect(store.state.employees[0].sales).toBe(1);
    expect(store.state.employees[0].shiftSales).toBe(1);
  });

  it('does not credit an employee for an outfit advised manually by the player', () => {
    const store = makeStore(s => {
      s.employees.push({
        id: 'candidate-manual', uid: 'staff-manual', name: 'Mai An', role: 'Fashion assistant', bio: 'Chủ động hỗ trợ khách.', appearance: 0,
        salary: 70000, service: 99, persuasion: 99, charm: 90, reliability: 99, appliedDay: 1,
        hiredDay: 1, morale: 95, deniedLeaves: 0, sales: 0, tipsEarned: 0, experience: 0, skillLevel: 1, shiftSales: 0,
      });
    });
    store.openShop();
    visit(store);
    expect(store.serve(['baby-tee'])?.success).toBe(true);
    expect(store.state.employees[0].sales).toBe(0);
    expect(store.state.employees[0].shiftSales).toBe(0);
    expect(store.state.employees[0].tipsEarned).toBe(0);
  });
});

describe('decoration, upgrades and resilient saves', () => {
  it('buys functional fixtures empty and stocks them only with compatible warehouse items', () => {
    const store = makeStore();
    store.buyFurniture('shoe-shelf');
    const shelf = store.state.layout.find(item => item.id === 'shoe-shelf')!;
    expect(shelf.displayItems).toEqual([]);
    expect(store.displayProduct(shelf.uid, 'ribbon')).toBe(false);
    expect(store.buy('sneakers', 1)).toBe(true);
    store.state.phase = 'open';
    expect(store.displayProduct(shelf.uid, 'sneakers')).toBe(true);
    expect(shelf.displayItems).toEqual(['sneakers']);
    expect(store.state.inventory.sneakers).toBe(1);
  });
  it('returns displayed goods to warehouse availability when a fixture is stored', () => {
    const store = makeStore();
    const rack = store.state.layout.find(item => item.uid === 'starter-rack')!;
    const owned = store.state.inventory['baby-tee'];
    expect(rack.displayItems).toContain('baby-tee');
    store.storeFurniture(rack.uid);
    expect(store.state.inventory['baby-tee']).toBe(owned);
    expect(store.state.layout.some(item => item.uid === rack.uid)).toBe(false);
  });
  it('returns the placed furniture uid for immediate move mode selection', () => {
    const store = makeStore();
    const boughtUid = store.buyFurniture('flowers');
    expect(typeof boughtUid).toBe('string');
    expect(store.state.layout.some(item => item.uid === boughtUid)).toBe(true);
    store.storeFurniture(boughtUid!);
    const restoredUid = store.placeStoredFurniture('flowers');
    expect(typeof restoredUid).toBe('string');
    expect(store.state.layout.some(item => item.uid === restoredUid)).toBe(true);
  });
  it('upgrades each display fixture independently and persists its extra slots', () => {
    const store = makeStore();
    const rack = store.state.layout.find(item => item.uid === 'starter-rack')!;
    const fixture = furniture.find(item => item.id === 'rack')!;
    expect(displayCapacity(fixture, rack)).toBe(16);
    const cost = displayUpgradeCost(fixture, rack);
    expect(cost).toBe(90000);
    expect(store.upgradeDisplay(rack.uid)).toBe(true);
    expect(rack.displayLevel).toBe(1);
    expect(displayCapacity(fixture, rack)).toBe(24);
    expect(store.state.money).toBe(410000);
    expect(parseSave(JSON.stringify(store.state)).layout.find(item => item.uid === rack.uid)?.displayLevel).toBe(1);
  });
  it('keeps mannequin fixed to one slot and accepts only a set product', () => {
    const store = makeStore(s => { s.level = 2; });
    expect(store.buy('coquette-set', 1)).toBe(true);
    store.buyFurniture('mannequin');
    const mannequin = store.state.layout.find(item => item.id === 'mannequin')!;
    expect(store.displayProduct(mannequin.uid, 'baby-tee')).toBe(false);
    expect(store.displayProduct(mannequin.uid, 'coquette-set')).toBe(true);
    expect(store.displayProduct(mannequin.uid, 'coquette-set')).toBe(false);
    expect(store.upgradeDisplay(mannequin.uid)).toBe(false);
  });
  it('does not offer warehouse stock that has not been placed on a display', () => {
    const store = makeStore(s => {
      for (const item of s.layout) item.displayItems = item.displayItems?.filter(id => id !== 'baby-tee');
    });
    store.openShop(); visit(store);
    expect(store.serve(['baby-tee'])).toBeUndefined();
  });
  it('validates the starter layout, collisions, boundaries and entrance', () => {
    const s = initialState(); for (const p of s.layout) expect(canPlace(s.layout, p)).toBe(true);
    const item = { uid: 'test', id: 'plant', x: 0, y: 0, rotation: 0 };
    expect(canPlace(s.layout, item)).toBe(false); expect(canPlace([], { ...item, x: -1 })).toBe(false);
    expect(canPlace([], { ...item, x: 3, y: 4 })).toBe(false); expect(canPlace([], { ...item, x: 6, y: 6 })).toBe(false);
    expect(canPlace([], { uid: 'wall', id: 'fashion-print', x: 4, y: 1, rotation: 0 })).toBe(false);
    expect(canPlace([], { uid: 'wall', id: 'fashion-print', x: 4, y: 0, rotation: 0 })).toBe(true);
    expect(canPlace([], { uid: 'wall', id: 'fashion-print', x: 0, y: 4, rotation: 1 })).toBe(true);
    const wallPiece = { uid: 'wall-piece', id: 'fashion-print', x: 4, y: 0, rotation: 0 };
    expect(canPlace([wallPiece], { ...wallPiece, uid: 'same-slot' })).toBe(false);
    expect(canPlace(s.layout, { uid: 'rug-overlap', id: 'heart-rug', x: 0, y: 2, rotation: 0 })).toBe(true);
    expect(canPlace([], { uid: 'rug-outside', id: 'heart-rug', x: 7, y: 0, rotation: 0 })).toBe(false);
  });
  it('moves the reserved entrance path outward with every land expansion', () => {
    const oldEntrance = { uid: 'old-entrance', id: 'plant', x: 3, y: 4, rotation: 0 };
    expect(canPlace([], oldEntrance, 0)).toBe(false);
    expect(canPlace([], oldEntrance, 1)).toBe(true);
    expect(canPlace([], { ...oldEntrance, uid: 'new-entrance', x: 4, y: 5 }, 1)).toBe(false);
    expect(canPlace([], { ...oldEntrance, uid: 'latest-entrance', x: 10, y: 11 }, 7)).toBe(false);
  });
  it('rejects illegal movement without losing furniture and refunds sold furniture once', () => {
    const store = makeStore(); const piece = { ...store.state.layout[0] };
    expect(store.moveFurniture(piece.uid, -1, 0)).toBe(false); expect(store.state.layout[0]).toEqual(piece);
    store.sellFurniture(piece.uid); const money = store.state.money; store.sellFurniture(piece.uid); expect(store.state.money).toBe(money);
    expect(money).toBe(575000);
  });
  it('rotates wall decorations onto the opposite wall at the matching distance', () => {
    const store = makeStore();
    const print = store.state.layout.find(item => item.uid === 'starter-fashion-print')!;
    expect(store.moveFurniture(print.uid, print.x, print.y, true)).toBe(true);
    expect(print).toMatchObject({ x: 0, rotation: 1 });
    expect(canPlace(store.state.layout, print)).toBe(true);
    expect(store.moveFurniture(print.uid, print.x, print.y, true)).toBe(true);
    expect(print).toMatchObject({ y: 0, rotation: 0 });
    expect(canPlace(store.state.layout, print)).toBe(true);
  });
  it('finds the nearest free slot on the opposite wall and leaves full walls unchanged', () => {
    const store = makeStore();
    const print = { uid: 'rotating-print', id: 'fashion-print', x: 2, y: 0, rotation: 0 };
    store.state.layout = [print, { uid: 'blocking-print', id: 'fashion-print', x: 0, y: 2, rotation: 1 }];
    expect(store.moveFurniture(print.uid, print.x, print.y, true)).toBe(true);
    expect(print).toMatchObject({ x: 0, y: 0, rotation: 1 });
    expect(store.moveFurniture(print.uid, print.x, print.y, true)).toBe(true);
    store.state.layout = [print, ...Array.from({ length: 3 }, (_, slot) => ({ uid: `full-${slot}`, id: 'fashion-print', x: 0, y: slot * 2, rotation: 1 }))];
    const before = { ...print };
    expect(store.moveFurniture(print.uid, print.x, print.y, true)).toBe(false);
    expect(print).toEqual(before);
  });
  it('expands the usable floor and persists custom display names', () => {
    const store = makeStore();
    expect(landSize(store.state)).toBe(7);
    expect(canPlace([], { uid: 'edge', id: 'plant', x: 7, y: 0, rotation: 0 }, store.state.landLevel)).toBe(false);
    expect(store.expandLand()).toBe(true);
    expect(store.state.money).toBe(150000);
    expect(landSize(store.state)).toBe(8);
    expect(canPlace([], { uid: 'edge', id: 'plant', x: 7, y: 0, rotation: 0 }, store.state.landLevel)).toBe(true);
    store.state.money = 50000000;
    for (let level = 2; level <= 9; level++) expect(store.expandLand()).toBe(true);
    expect(store.state.landLevel).toBe(9);
    expect(landSize(store.state)).toBe(16);
    expect(store.expandLand()).toBe(false);
    expect(store.renameDisplayFixture('starter-rack', 'Kệ Best Seller')).toBe(true);
    const parsed = parseSave(JSON.stringify(store.state));
    expect(parsed.landLevel).toBe(9);
    expect(parsed.layout.find(item => item.uid === 'starter-rack')?.customName).toBe('Kệ Best Seller');
  });
  it('adds 30 seconds only when shop and land levels advance together', () => {
    const state = initialState();
    expect(dayDuration(state)).toBe(180);
    state.level = 2;
    expect(dayDuration(state)).toBe(180);
    state.landLevel = 1;
    expect(dayDuration(state)).toBe(210);
    state.landLevel = 4;
    expect(dayDuration(state)).toBe(210);
    state.level = 4;
    expect(dayDuration(state)).toBe(270);
    state.level = 7;
    state.landLevel = 7;
    expect(dayDuration(state)).toBe(300);
    state.level = 4;
    state.landLevel = 4;
    stockStarter(state);
    const store = new GameStore(state, new MemorySave(), () => 0);
    store.openShop();
    expect(store.state.dayTimer).toBe(270);
  });
  it('starts new games with background music turned off', () => {
    expect(initialState().music).toBe(false);
    expect(parseSave(JSON.stringify({ ...initialState(), music: undefined })).music).toBe(false);
  });
  it('runs multi-day brand campaigns and rewards industry reputation', () => {
    const store = makeStore(state => { state.level = 3; state.xp = 650; });
    const offer = campaignOffers(store.state)[0];
    expect(store.startCampaign(offer.id)).toBe(true);
    const product = products.find(item => item.style === offer.style)!;
    const campaign = store.state.activeCampaign!;
    campaign.targetUnits = 1;
    campaign.targetRevenue = product.sellPrice;
    (store as unknown as { progressCampaign(items: typeof products, total: number, online: boolean): void }).progressCampaign([product], product.sellPrice, false);
    expect(campaign.status).toBe('ready');
    const before = { money: store.state.money, prestige: store.state.industryReputation };
    expect(store.claimCampaign()).toBe(true);
    expect(store.state.money).toBe(before.money + offer.rewardMoney);
    expect(store.state.industryReputation).toBe(before.prestige + offer.prestigeReward);
    expect(store.state.activeCampaign).toBeNull();
    expect(store.state.campaignSeason).toBe(2);
  });
  it('uses supplier contracts to trade cheaper stock for delayed delivery', () => {
    const store = makeStore(state => { state.level = 3; state.money = 1000000; });
    expect(store.selectSupplier('wholesale')).toBe(true);
    const before = store.state.money;
    const unitPrice = buyPrice(store.state, products.find(item => item.id === 'baby-tee')!);
    expect(store.buy('baby-tee', 5)).toBe(true);
    expect(store.state.money).toBe(before - unitPrice * 5);
    expect(store.state.pendingOrders.at(-1)).toMatchObject({ productId: 'baby-tee', quantity: 5, supplierId: 'wholesale' });
    expect(store.state.pendingOrders.at(-1)!.arrivalDay).toBeGreaterThanOrEqual(store.state.day + 1);
    expect(store.state.pendingOrders.at(-1)!.arrivalDay).toBeLessThanOrEqual(store.state.day + 2);
  });
  it('adds the three international shipping days after the selected source lead time', () => {
    const state = initialState();
    stockStarter(state);
    state.level = 5;
    state.money = 10000000;
    const store = new GameStore(state, new MemorySave(), () => 0);
    expect(store.selectSupplier('global')).toBe(true);
    const product = products.find(item => item.id === 'silk')!;
    const before = store.state.money;
    expect(store.orderImport(product.id, 10)).toBe(true);
    expect(store.state.money).toBe(before - buyPrice(store.state, product) * 10);
    expect(store.state.pendingOrders.at(-1)?.arrivalDay).toBe(store.state.day + 5);
  });
  it('announces delivered waiting orders when the next day starts', () => {
    const store = makeStore(state => {
      state.pendingOrders.push({ id: 'delivery-1', productId: 'baby-tee', quantity: 4, cost: 100000, arrivalDay: 2, supplierId: 'wholesale' });
      state.phase = 'closed';
    });
    let delivered = 0;
    store.subscribe(event => { if (event.type === 'orders-arrived') delivered += event.items.reduce((sum, item) => sum + item.quantity, 0); });
    store.nextDay();
    expect(delivered).toBe(4);
    expect(store.state.pendingOrders).toHaveLength(0);
  });
  it('assigns staff shifts and restores energy on a rest day', () => {
    const store = makeStore(state => {
      state.level = 3;
      state.employees.push({ id: 'e', uid: 'e-1', name: 'Mai', role: 'Stylist', bio: '', appearance: 3, salary: 40000, service: 70, persuasion: 70, charm: 70, reliability: 80, appliedDay: 1, hiredDay: 1, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, energy: 40, assignment: 'service' });
    });
    expect(store.setStaffAssignment('e-1', 'off')).toBe(true);
    store.state.phase = 'open';
    store.closeDay();
    expect(store.state.employees[0].energy).toBeGreaterThan(40);
  });
  it('resolves returns with a refund and keeps the returned product in stock', () => {
    const store = makeStore(state => {
      state.level = 3;
      state.returnCases.push({ id: 'r-1', productId: 'baby-tee', customerName: 'Chloe', amount: 45000, reason: 'Sai kích cỡ', availableDay: 1, deadlineDay: 3 });
    });
    const beforeMoney = store.state.money;
    const beforeStock = store.state.inventory['baby-tee'];
    expect(store.resolveReturn('r-1', 'refund')).toBe(true);
    expect(store.state.money).toBe(beforeMoney - 45000);
    expect(store.state.inventory['baby-tee']).toBe(beforeStock + 1);
    expect(store.state.returnCases).toHaveLength(0);
  });
  it('charges only return shipping for an exchange and keeps inventory unchanged', () => {
    const store = makeStore(state => {
      state.level = 3;
      state.returnCases.push({ id: 'r-exchange', productId: 'baby-tee', customerName: 'Chloe', amount: 77000, reason: 'Đổi kích cỡ', availableDay: 1, deadlineDay: 3 });
    });
    const beforeMoney = store.state.money;
    const beforeStock = store.state.inventory['baby-tee'];
    expect(store.resolveReturn('r-exchange', 'exchange')).toBe(true);
    expect(store.state.money).toBe(beforeMoney - 20000);
    expect(store.state.inventory['baby-tee']).toBe(beforeStock);
    expect(store.state.returnCases).toHaveLength(0);
  });
  it('requires quality investment before a couture order can be delivered', () => {
    const store = makeStore(state => { state.level = 5; state.money = 2000000; });
    expect(store.startCoutureOrder()).toBe(true);
    expect(store.advanceCouture('premium')).toBe(true);
    expect(store.advanceCouture('premium')).toBe(true);
    expect(store.advanceCouture('safe')).toBe(true);
    expect(store.state.coutureOrder).toMatchObject({ status: 'ready', quality: 78 });
    const reward = store.state.coutureOrder!.reward;
    const before = store.state.money;
    expect(store.deliverCouture()).toBe(true);
    expect(store.state.money).toBe(before + reward);
    expect(store.state.coutureOrder).toBeNull();
  });
  it('lets a VIP automatically collect suitable displayed products when the shop opens', () => {
    const store = makeStore(state => {
      state.level = 4;
      state.vipAppointments.push({ id: 'vip-1', customerName: 'Hạ Vy', style: 'Coquette', category: 'tops', budget: 1000000, scheduledDay: 1, minItems: 1, reward: 200000, status: 'accepted' });
    });
    const before = store.state.inventory['baby-tee'];
    store.openShop();
    expect(store.state.inventory['baby-tee']).toBe(before - 1);
    expect(store.state.vipAppointments).toHaveLength(0);
    expect(store.state.stats.sold).toBe(1);
  });
  it('penalizes the shop when a VIP pickup is unavailable on the scheduled day', () => {
    const store = makeStore(state => {
      state.level = 4;
      state.vipAppointments.push({ id: 'vip-1', customerName: 'Yuna', style: 'Luxury', category: 'dresses', budget: 1000000, scheduledDay: 1, minItems: 1, reward: 200000, status: 'accepted' });
    });
    const reputation = store.state.reputation;
    store.openShop();
    expect(store.state.vipAppointments).toHaveLength(0);
    expect(store.state.reputation).toBeLessThan(reputation);
    expect(store.state.stats.walkouts).toBe(1);
  });
  it('starts a recovery challenge when reputation falls into crisis', () => {
    const store = makeStore(state => { state.level = 3; state.reviews = 5; state.reputation = 3.1; });
    (store as unknown as { applyShopReview(stars: number): number }).applyShopReview(1);
    expect(store.state.reputationCrisis).toMatchObject({ targetReviews: 3, targetSales: 8, deadlineDay: store.state.day + 3 });
  });
  it('expires an unfinished campaign after its inclusive deadline', () => {
    const store = makeStore(state => { state.level = 3; state.day = 4; });
    expect(store.startCampaign(campaignOffers(store.state)[1].id)).toBe(true);
    store.state.activeCampaign!.deadlineDay = 4;
    store.state.phase = 'closed';
    store.nextDay();
    expect(store.state.day).toBe(5);
    expect(store.state.activeCampaign?.status).toBe('failed');
  });
  it('adds purchased furniture only to an unoccupied legal cell', () => {
    const store = makeStore(); store.buyFurniture('flowers');
    expect(store.state.money).toBe(465000); expect(store.state.layout).toHaveLength(10);
    expect(canPlace(store.state.layout, store.state.layout[9])).toBe(true);
  });
  it('requires both XP and funds for upgrades', () => {
    const store = makeStore(); store.upgrade(); expect(store.state.level).toBe(1);
    store.state.xp = 240; store.state.money = 449999; store.upgrade(); expect(store.state.level).toBe(1);
    store.state.money = 450000; store.upgrade(); expect(store.state.level).toBe(2); expect(store.state.money).toBe(0);
  });
  it('roundtrips a complete session including inventory, prices and layout', () => {
    const store = makeStore(); store.buy('ribbon', 5); store.buyFurniture('flowers'); store.setPrice('baby-tee', 118800); store.openShop(); visit(store); store.serve(['baby-tee']);
    expect(parseSave(JSON.stringify(store.state))).toEqual({ ...store.state, inventory: Object.fromEntries(products.map(p => [p.id, store.state.inventory[p.id] ?? 0])) });
  });
  it('recovers from corrupt, missing and future-version saves', () => {
    for (const raw of ['{bad', 'null', '{"version":99}', null]) expect(parseSave(raw)).toEqual(initialState());
  });
  it('sanitizes invalid numbers, unknown products and overlapping furniture', () => {
    const s = initialState(); const parsed = parseSave(JSON.stringify({ ...s, money: -500, day: -2, level: 999, inventory: { 'baby-tee': -9, evil: 20 }, layout: [...s.layout, { ...s.layout[0], uid: 'duplicate' }] }));
    expect(parsed.money).toBe(500000); expect(parsed.day).toBe(1); expect(parsed.level).toBe(7);
    expect(parsed.inventory['baby-tee']).toBe(0); expect(parsed.inventory.evil).toBeUndefined(); expect(parsed.layout).toHaveLength(9);
  });
});
