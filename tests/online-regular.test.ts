import { describe, expect, it } from 'vitest';
import { initialState, parseSave, SaveSystem } from '../src/systems/save';
import { GameStore } from '../src/systems/store';
import type { GameState } from '../src/types';
import { debugPanel, livestreamModal, livestreamRequest, onlineChannelModal, onlineStockModal, regularOrderDetailModal } from '../src/ui/panels';

class MemorySave extends SaveSystem {
  override write(_state: GameState) { /* in-memory test */ }
}

const preparedStore = (random = () => 0) => {
  const state = initialState();
  state.inventory['baby-tee'] = 6;
  state.inventory.ribbon = 4;
  state.inventory.hoodie = 3;
  state.onlineListings = ['baby-tee', 'ribbon'];
  state.onlineChannelEnabled = true;
  state.layout.find(item => item.uid === 'starter-rack')!.displayItems = ['baby-tee'];
  return new GameStore(state, new MemorySave(), random);
};

describe('regular online orders', () => {
  it('migrates old saves with an empty regular-order queue', () => {
    const legacy = initialState() as unknown as Record<string, unknown>;
    delete legacy.regularOnlineOrders;
    const parsed = parseSave(JSON.stringify(legacy));
    expect(parsed.regularOnlineOrders).toEqual([]);
    expect(parsed.onlinePackingLevel).toBe(1);
  });

  it('receives regular orders in the background without a livestream', () => {
    const store = preparedStore();
    store.openShop();
    store.state.regularOnlineNextOrderIn = 0;
    store.state.onlineNextOrderIn = 50;
    store.tick();
    expect(store.state.regularOnlineOrders).toHaveLength(1);
    expect(store.state.regularOnlineOrders[0].source).toBe('storefront');
    expect(store.state.onlineOrders).toHaveLength(0);
  });

  it('livestream creates only a regular order', () => {
    const store = preparedStore();
    expect(store.beginLivestream()).toBe(true);
    const result = store.resolveLivestreamRound(['baby-tee'], livestreamRequest(store.state, ['baby-tee', 'ribbon'], 1), 0);
    expect(result.orderCreated).toBe(true);
    expect(result.conversionChance).toBeGreaterThan(0);
    expect(result.fee).toBeGreaterThan(0);
    expect(store.state.regularOnlineOrders[0].source).toBe('livestream');
    expect(store.state.onlineOrders).toHaveLength(0);
  });

  it('packs regular orders before opening and hands them to the batch courier', () => {
    const store = preparedStore();
    store.state.regularOnlineOrders = [{
      id: 'regular-test', productIds: ['baby-tee'], customerName: 'An', customerHandle: '@an_daily',
      price: 100000, fee: 8000, createdDay: 1, dueDay: 2, packed: false, source: 'storefront',
    }];
    expect(store.packRegularOnlineOrder('regular-test')).toBe(true);
    const moneyBefore = store.state.money;
    const stockBefore = store.state.inventory['baby-tee'];
    store.openShop();
    expect(store.fulfillPackedRegularOrders()).toBe(true);
    expect(store.state.regularOnlineOrders).toHaveLength(0);
    expect(store.state.inventory['baby-tee']).toBe(stockBefore - 1);
    expect(store.state.money).toBe(moneyBefore + 92000);
  });

  it('renders the regular-order board and interactive livestream without empty markup', () => {
    const store = preparedStore();
    store.state.regularOnlineOrders = [{
      id: 'regular-ui', productIds: ['baby-tee'], customerName: 'Linh', customerHandle: '@linh_closet',
      price: 99000, fee: 7920, createdDay: 1, dueDay: 2, packed: false, source: 'storefront',
    }];
    expect(onlineChannelModal(store.state)).toContain('data-action="regular-order-open"');
    expect(onlineChannelModal(store.state)).not.toContain('data-action="regular-pack"');
    expect(regularOrderDetailModal(store.state, 'regular-ui')).toContain('data-action="regular-pack"');
    expect(regularOrderDetailModal(store.state, 'regular-ui')).toContain('data-action="regular-cancel"');
    expect(onlineChannelModal(store.state)).toContain('data-action="online-stock-open"');
    expect(onlineChannelModal(store.state)).not.toContain('online-dashboard-stock-list');
    expect(onlineStockModal(store.state)).toContain('data-action="online-list"');
    expect(onlineStockModal(store.state)).toContain('data-action="online-stock-back"');
    expect(livestreamModal(store.state, ['baby-tee', 'ribbon', 'jeans'])).toContain('data-action="livestream-start"');
    const liveMarkup = livestreamModal(store.state, ['baby-tee', 'ribbon', 'jeans'], 1, [], 0, undefined, undefined, 60, 60);
    expect(liveMarkup).toContain('livestream-two-pane');
    expect(liveMarkup).toContain('data-action="livestream-round-select"');
    expect(liveMarkup).not.toContain('data-action="livestream-submit"');
  });

  it('allows every listed product to join one livestream without a six-item cap', () => {
    const store = preparedStore();
    const ids = ['baby-tee', 'jeans', 'ribbon-dress', 'hoodie', 'ribbon', 'sneakers', 'mini-skirt', 'bag'];
    for (const id of ids) store.state.inventory[id] = 8;
    store.state.onlineListings = ids;
    const markup = livestreamModal(store.state, ids);
    expect(markup).toContain('8/8 sản phẩm online');
    expect(markup.match(/is-selected/g)).toHaveLength(8);
  });

  it('prepares the online warehouse from the debug toolkit', () => {
    const store = preparedStore();
    store.state.phase = 'closed';
    expect(debugPanel(store.state)).toContain('data-id="online-stock"');
    expect(store.debug('online-stock')).toBe(true);
    expect(store.state.phase).toBe('preparation');
    expect(store.state.onlineChannelEnabled).toBe(true);
    expect(store.state.onlineListings).toHaveLength(2);
    expect(onlineStockModal(store.state)).toContain('data-action="online-list"');
  });

  it('restores livestream and creates a fake regular order from debug', () => {
    const store = preparedStore();
    store.state.lastLivestreamDay = store.state.day;
    store.state.phase = 'closed';
    expect(debugPanel(store.state)).toContain('data-id="livestream-reset"');
    expect(debugPanel(store.state)).toContain('data-id="regular-order"');
    expect(store.debug('livestream-reset')).toBe(true);
    expect(store.state.phase).toBe('preparation');
    expect(store.state.lastLivestreamDay).toBeLessThan(store.state.day);
    expect(store.state.onlineListings).toHaveLength(6);
    expect(store.debug('regular-order')).toBe(true);
    expect(store.state.regularOnlineOrders.at(-1)?.source).toBe('storefront');
  });
});
