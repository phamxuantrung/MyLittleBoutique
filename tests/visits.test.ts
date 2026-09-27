import { describe, expect, it } from 'vitest';
import { customers } from '../src/data/catalog';
import { activeCustomer, DAY_DURATION } from '../src/systems/rules';
import { initialState, parseSave, SaveSystem } from '../src/systems/save';
import { GameStore } from '../src/systems/store';

class MemorySave extends SaveSystem { override write() {} }
const make = (random = () => 0) => {
  const state = initialState();
  state.money = 500000;
  state.inventory = { 'baby-tee': 2, jeans: 2, 'ribbon-dress': 1, hoodie: 1, ribbon: 2 };
  state.layout.find(item => item.uid === 'starter-rack')!.displayItems = ['baby-tee', 'baby-tee', 'jeans', 'jeans', 'ribbon-dress', 'hoodie'];
  const plantIndex = state.layout.findIndex(item => item.uid === 'starter-plant');
  state.layout[plantIndex] = { uid: 'starter-table', id: 'table', x: 6, y: 0, rotation: 0, displayItems: ['ribbon', 'ribbon'] };
  return new GameStore(state, new MemorySave(), random);
};
const arrive = (store: GameStore) => { for (let i = 0; i < 30 && !activeCustomer(store.state); i++) store.tick(); };

describe('timed shop and random visits', () => {
  it.each([0, .9])('scales only advice wait times by level and preserves timers on reload (random %s)', random => {
    const baseline = make(() => random);
    baseline.openShop(); arrive(baseline);
    const baseWait = baseline.state.activeVisits[0].maxPatience;
    for (let level = 2; level <= 7; level++) {
      const store = make(() => random);
      store.state.level = level;
      store.openShop(); arrive(store);
      const visit = store.state.activeVisits[0];
      expect(visit.mode).toBe(baseline.state.activeVisits[0].mode);
      expect(visit.maxPatience).toBe(baseWait + (visit.mode === 'advice' ? (level - 1) * 5 : 0));
      store.tick();
      const loaded = parseSave(JSON.stringify(store.state));
      expect(loaded.activeVisits[0].maxPatience).toBe(visit.maxPatience);
      expect(loaded.activeVisits[0].patience).toBe(visit.patience);
    }
  });
  it('uses the original random advice rate without forcing the first visit', () => {
    const advice = make(() => .34); advice.openShop(); arrive(advice);
    expect(advice.state.customerMode).toBe('advice');
    const browse = make(() => .35); browse.openShop(); arrive(browse);
    expect(browse.state.customerMode).toBe('browse');
  });
  it('starts a three-minute day with an empty shop and admits a random unlocked visitor', () => {
    const store = make(); store.openShop();
    expect(store.state.dayTimer).toBe(DAY_DURATION);
    expect(activeCustomer(store.state)).toBeUndefined();
    arrive(store); expect(activeCustomer(store.state)?.id).toBe('lily');
    expect(store.state.customerMode).toBe('advice');
    expect(store.state.patience).toBeGreaterThanOrEqual(55);
    expect(store.state.patience).toBeLessThanOrEqual(90);
    const other = make(() => .95); other.openShop(); arrive(other);
    expect(activeCustomer(other.state)?.id).not.toBe('lily');
  });
  it('keeps several visitors active and advances every waiting timer independently', () => {
    const store = make(() => .34); store.openShop(); arrive(store);
    const first = store.state.activeVisits[0];
    expect(first.mode).toBe('advice');
    const before = first.patience;
    store.state.nextArrivalIn = 1;
    store.tick();
    expect(store.state.activeVisits).toHaveLength(2);
    expect(store.state.activeVisits.find(visit => visit.uid === first.uid)?.patience).toBe(before - 1);
    expect(store.state.currentVisitId).toBe(first.uid);
  });
  it('leaves a gap after each visit and never closes on a customer quota', () => {
    const store = make(() => .5); store.openShop();
    for (let n = 0; n < 12; n++) {
      store.state.dayTimer = DAY_DURATION;
      arrive(store); const previous = activeCustomer(store.state)!.id;
      store.skipCustomer();
      expect(activeCustomer(store.state)).toBeUndefined();
      expect(store.state.nextArrivalIn).toBeGreaterThanOrEqual(6);
      expect(store.state.lastCustomerId).toBe(previous);
      expect(store.state.phase).toBe('open');
    }
    const remaining = store.state.dayTimer;
    for (let n = 0; n < remaining; n++) store.tick();
    expect(store.state.phase).toBe('closed'); expect(store.state.dayTimer).toBe(0);
  });
  it('automatically checks out browsing customers and refuses manual advice', () => {
    const store = make(() => .5); store.openShop(); arrive(store);
    store.state.customerMode = 'browse'; store.state.patience = 1;
    const money = store.state.money;
    expect(store.serve(['baby-tee'])).toBeUndefined();
    store.tick(); expect(store.state.stats.happy).toBe(1);
    expect(store.state.money).toBeGreaterThan(money);
    expect(activeCustomer(store.state)).toBeUndefined();
    const sold = store.state.stats.sold; store.tick(); expect(store.state.stats.sold).toBe(sold);
  });
  it('closes early before counting a browsing walkout when every shelf is empty', () => {
    const store = make(() => .5); store.openShop(); arrive(store);
    store.state.customerMode = 'browse'; store.state.patience = 1; store.state.inventory = {};
    store.tick(); expect(store.state.phase).toBe('closed'); expect(store.state.stats.walkouts).toBe(0); expect(store.state.stats.sold).toBe(0);
  });
  it('persists the current visitor, mode, countdown and idle interval across reload', () => {
    const store = make(() => .34); store.openShop(); arrive(store);
    store.state.nextArrivalIn = 1; store.tick();
    const loaded = parseSave(JSON.stringify(store.state));
    expect(loaded.activeVisits).toHaveLength(2);
    expect(loaded.activeVisits.map(visit => visit.uid)).toEqual(store.state.activeVisits.map(visit => visit.uid));
    expect(loaded.currentCustomerId).toBe(store.state.currentCustomerId);
    expect(loaded.customerMode).toBe('advice'); expect(loaded.patience).toBe(store.state.patience);
    expect(loaded.dayTimer).toBe(store.state.dayTimer);
    while (activeCustomer(store.state)) store.skipCustomer();
    const idle = parseSave(JSON.stringify(store.state));
    expect(activeCustomer(idle)).toBeUndefined(); expect(idle.nextArrivalIn).toBe(store.state.nextArrivalIn);
    const legacy = parseSave(JSON.stringify({ ...store.state, currentCustomerId: undefined, customerIndex: 100 }));
    expect(legacy.phase).toBe('open');
    expect(customers.some(c => c.id === loaded.currentCustomerId)).toBe(true);
  });
  it('closes early once, cancels visits and invoices rent only once', () => {
    const store = make(); store.state.day = 4; store.openShop(); arrive(store);
    let summaries = 0; store.subscribe(e => { if (e.type === 'summary') summaries++; });
    store.closeDay(); const money = store.state.money; store.closeDay(); store.tick();
    expect(summaries).toBe(1); expect(store.state.money).toBe(money);
    expect(store.state.stats.rent).toBe(30000); expect(store.state.rentDue).toBe(30000); expect(activeCustomer(store.state)).toBeUndefined();
    expect(store.state.dayTimer).toBeGreaterThan(0);
    store.nextDay(); expect(store.state.dayTimer).toBe(DAY_DURATION); expect(store.state.currentCustomerId).toBeNull();
  });
});
