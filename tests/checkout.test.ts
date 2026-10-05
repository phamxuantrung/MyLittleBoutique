import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';
import { addNotes, cashDrawerTotal, customerTender, drawerAmount, initialCashDrawer, makeChange } from '../src/systems/cash';
import { initialState, SaveSystem } from '../src/systems/save';
import { sellPrice, staffCashierProfile } from '../src/systems/rules';
import { GameStore } from '../src/systems/store';

class MemorySave extends SaveSystem { override write() {} }

function checkoutStore() {
  const state = initialState();
  const product = products.find(item => item.id === 'ribbon-kiss-tee')!;
  state.phase = 'open';
  state.dayTimer = 100;
  state.inventory[product.id] = 1;
  state.layout.find(item => item.uid === 'starter-rack')!.displayItems = [product.id];
  const total = sellPrice(state, product);
  state.activeVisits = [{ uid: 'checkout-1', customerId: 'lily', mode: 'browse', stage: 'checkout', patience: 30, maxPatience: 30, cartProductIds: [product.id], cartTotal: total, cartScore: 90, cartSpeech: 'Mình chốt món này.' }];
  state.currentVisitId = 'checkout-1'; state.currentCustomerId = 'lily'; state.customerMode = 'browse'; state.patience = 30;
  return { store: new GameStore(state, new MemorySave(), () => .5), product, total };
}

describe('self-service POS checkout', () => {
  it('starts the register with 500,000₫ in useful small denominations', () => {
    const drawer = initialCashDrawer();
    expect(cashDrawerTotal(drawer)).toBe(500000);
    expect(drawer['1000']).toBeGreaterThan(0);
    expect(drawer['50000']).toBeGreaterThan(0);
  });

  it('uses a sensible round tender and requires exact available change', () => {
    const tender = customerTender(60000);
    expect(drawerAmount(tender)).toBe(100000);
    const drawer = initialCashDrawer(); addNotes(drawer, tender);
    expect(drawerAmount(makeChange(drawer, 40000)!)).toBe(40000);
  });

  it('varies customer cash without adding redundant repeated notes', () => {
    const variants = [0, .2, .4, .6, .8, .999].map(roll => customerTender(60000, () => roll));
    expect(new Set(variants.map(drawerAmount)).size).toBeGreaterThan(1);
    for (const tender of variants) {
      expect(drawerAmount(tender)).toBeGreaterThanOrEqual(60000);
      expect(tender['50000'] ?? 0).toBeLessThanOrEqual(2);
    }
    expect(variants.some(tender => (tender['500000'] ?? 0) === 1)).toBe(true);
  });

  it('puts cash sales in the drawer instead of the bank balance', () => {
    const { store, total } = checkoutStore();
    const bankBefore = store.state.money;
    const cashBefore = store.cashBalance();
    const tender = store.checkoutTender('checkout-1')!;
    const available = { ...store.state.cashDrawer }; addNotes(available, tender);
    const change = makeChange(available, drawerAmount(tender) - total)!;
    const drawerBefore = { ...store.state.cashDrawer };
    expect(store.completeSelfCheckout('checkout-1', 'cash', change).ok).toBe(true);
    expect(store.state.money).toBe(bankBefore);
    expect(store.cashBalance()).toBe(cashBefore + total);
    for (const value of Object.keys(tender)) {
      expect(store.state.cashDrawer[value]).toBe((drawerBefore[value] ?? 0) + (tender[value] ?? 0) - (change[value] ?? 0));
    }
    expect(store.state.stats.sold).toBe(1);
  });

  it('allows imperfect change but only penalizes a customer who receives too little', () => {
    const short = checkoutStore();
    short.store.state.activeVisits[0].cashTender = { '100000': 1 };
    const due = 100000 - short.total;
    const available = { ...short.store.state.cashDrawer, '100000': (short.store.state.cashDrawer['100000'] ?? 0) + 1 };
    const exact = makeChange(available, due)!;
    const exactAmount = drawerAmount(exact);
    const shortChange = makeChange(available, Math.max(0, exactAmount - 1000)) ?? {};
    const shortResult = short.store.completeSelfCheckout('checkout-1', 'cash', shortChange);
    expect(shortResult.ok).toBe(true);
    expect(shortResult.result?.reviewStars).toBeLessThanOrEqual(3);

    const extra = checkoutStore();
    extra.store.state.activeVisits[0].cashTender = { '100000': 1 };
    const extraAvailable = { ...extra.store.state.cashDrawer, '100000': (extra.store.state.cashDrawer['100000'] ?? 0) + 1 };
    const extraChange = makeChange(extraAvailable, 100000 - extra.total + 1000)!;
    const extraResult = extra.store.completeSelfCheckout('checkout-1', 'cash', extraChange);
    expect(extraResult.ok).toBe(true);
    expect(extraResult.result?.reviewStars).toBeGreaterThan(3);
  });

  it('issues a 10,000,000₫ police fine and reputation penalty after four short-change incidents', () => {
    const { store, product, total } = checkoutStore();
    const reputationBefore = store.state.reputation;
    let balanceBeforeFine = store.state.money;
    let finalResult: ReturnType<typeof store.completeSelfCheckout>;
    for (let incident = 1; incident <= 4; incident++) {
      store.state.inventory[product.id] = 1;
      store.state.layout.find(item => item.uid === 'starter-rack')!.displayItems = [product.id];
      store.state.activeVisits = [{ uid: `fraud-${incident}`, customerId: 'lily', mode: 'browse', stage: 'checkout', patience: 30, maxPatience: 30, cartProductIds: [product.id], cartTotal: total, cartScore: 90, cartSpeech: 'Thanh toán.', checkoutPaymentMethod: 'cash', cashTender: { '100000': 1 } }];
      store.state.currentVisitId = `fraud-${incident}`;
      store.state.currentCustomerId = 'lily';
      store.state.customerMode = 'browse';
      if (incident === 4) balanceBeforeFine = store.state.money;
      finalResult = store.completeSelfCheckout(`fraud-${incident}`, 'cash', {});
      expect(finalResult.ok).toBe(true);
    }
    expect(store.state.shortChangeViolations).toBe(4);
    expect(store.state.shortChangeFraudFines).toBe(1);
    expect(store.state.money).toBe(balanceBeforeFine - 10000000);
    expect(store.state.reputation).toBeLessThan(reputationBefore - .9);
    expect(finalResult!.result?.shortChangeFine).toEqual({ amount: 10000000, reputationLoss: 1, violations: 4 });
  });

  it('moves money between the register and the main account outside selling hours', () => {
    const state = initialState();
    const store = new GameStore(state, new MemorySave());
    expect(store.depositCash(100000)).toBe(true);
    expect(store.state.money).toBe(600000);
    expect(store.cashBalance()).toBe(400000);
    expect(store.withdrawCash(50000)).toBe(true);
    expect(store.state.money).toBe(550000);
    expect(store.cashBalance()).toBe(450000);
  });

  it('transfers selected notes and charges 30,000₫ for each register transaction', () => {
    const state = initialState();
    const store = new GameStore(state, new MemorySave());
    const bank = state.money;
    const cash = store.cashBalance();
    expect(store.transferCashNotes('deposit', { '100000': 1 })).toBe(true);
    expect(state.money).toBe(bank + 70000);
    expect(store.cashBalance()).toBe(cash - 100000);
    expect(store.transferCashNotes('withdraw', { '20000': 2 })).toBe(true);
    expect(state.money).toBe(bank);
    expect(store.cashBalance()).toBe(cash - 60000);
  });

  it('makes an unattended checkout customer leave when the queue timer expires', () => {
    const { store } = checkoutStore();
    let checkoutTimedOut = false;
    store.subscribe(event => {
      if (event.type === 'sale') checkoutTimedOut = event.result.checkoutTimedOut === true;
    });
    store.state.activeVisits[0].patience = 1; store.state.patience = 1;
    store.tick();
    expect(store.state.activeVisits.some(visit => visit.uid === 'checkout-1')).toBe(false);
    expect(store.state.stats.walkouts).toBe(1);
    expect(store.state.stats.sold).toBe(0);
    expect(checkoutTimedOut).toBe(true);
  });

  it('stops reducing patience after the customer has started a payment method', () => {
    const { store } = checkoutStore();
    const patience = store.state.activeVisits[0].patience;
    const dayTimer = store.state.dayTimer;
    store.state.activeVisits.push({ uid: 'waiting-2', customerId: 'minh', mode: 'advice', patience: 20, maxPatience: 20 });
    store.tick('', 'checkout-1');
    expect(store.state.activeVisits[0].patience).toBe(patience);
    expect(store.state.activeVisits.find(visit => visit.uid === 'waiting-2')?.patience).toBe(19);
    expect(store.state.dayTimer).toBe(dayTimer - 1);
    expect(store.state.activeVisits.some(visit => visit.uid === 'checkout-1')).toBe(true);
  });

  it('lets an assigned cashier complete checkout for a self-browse customer', () => {
    const { store } = checkoutStore();
    store.state.level = 3;
    store.state.landLevel = 2;
    store.state.nextArrivalIn = 999;
    store.state.activeVisits[0].checkoutPaymentMethod = 'transfer';
    store.state.employees.push({
      id: 'cashier-test', uid: 'cashier-test-uid', name: 'Mai An', role: 'Thu ngân', bio: 'Thanh toán tại quầy.', appearance: 0,
      salary: 100000, service: 90, persuasion: 70, charm: 70, reliability: 99, appliedDay: 1, hiredDay: 1,
      morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, energy: 100, skillLevel: 2, assignment: 'cashier',
    });

    for (let second = 0; second < 10 && store.state.activeVisits.some(visit => visit.uid === 'checkout-1'); second++) store.tick();

    expect(store.state.activeVisits.some(visit => visit.uid === 'checkout-1')).toBe(false);
    expect(store.state.stats.sold).toBe(1);
    expect(store.state.employees[0].sales).toBe(1);
  });

  it('caps cashier short-change risk at 5% and records a cash mistake', () => {
    expect(staffCashierProfile({ reliability: 0, service: 0, skillLevel: 1 }).shortChangeChance).toBeLessThanOrEqual(.05);
    const base = checkoutStore();
    base.store.state.level = 3;
    base.store.state.landLevel = 2;
    base.store.state.nextArrivalIn = 999;
    base.store.state.activeVisits[0].checkoutPaymentMethod = 'cash';
    base.store.state.activeVisits[0].cashTender = { '100000': 1 };
    base.store.state.employees.push({
      id: 'cashier-risk', uid: 'cashier-risk-uid', name: 'Thu ngân mới', role: 'Thu ngân', bio: '', appearance: 0,
      salary: 100000, service: 0, persuasion: 60, charm: 60, reliability: 0, appliedDay: 1, hiredDay: 1,
      morale: 80, deniedLeaves: 0, sales: 0, tipsEarned: 0, energy: 100, skillLevel: 1, assignment: 'cashier',
    });
    const store = new GameStore(base.store.state, new MemorySave(), () => 0);
    for (let second = 0; second < 10 && store.state.activeVisits.length; second++) store.tick();
    expect(store.state.shortChangeViolations).toBe(1);
  });

  it('lets the customer choose the payment method and can switch cash to a remaining method', () => {
    const { store } = checkoutStore();
    store.state.activeVisits[0].checkoutPaymentMethod = 'cash';
    const response = store.requestCheckoutPaymentChange('checkout-1');
    expect(response).toEqual({ accepted: true, method: 'card' });
    expect(store.state.activeVisits[0].checkoutPaymentMethod).toBe('card');
    expect(store.state.activeVisits[0].paymentFriction).toBe(1);
  });

  it('allows a cash customer to refuse another payment method and leave', () => {
    const base = checkoutStore();
    base.store.state.activeVisits[0].checkoutPaymentMethod = 'cash';
    const refusingStore = new GameStore(base.store.state, new MemorySave(), () => 0);
    let refused = false;
    refusingStore.subscribe(event => {
      if (event.type === 'sale') refused = event.result.checkoutPaymentRefused === true;
    });
    expect(refusingStore.requestCheckoutPaymentChange('checkout-1').accepted).toBe(false);
    expect(refusingStore.state.activeVisits).toHaveLength(0);
    expect(refusingStore.state.stats.walkouts).toBe(1);
    expect(refused).toBe(true);
  });
});
