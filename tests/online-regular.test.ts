import { describe, expect, it } from 'vitest';
import { initialState, parseSave, SaveSystem } from '../src/systems/save';
import { GameStore } from '../src/systems/store';
import { products } from '../src/data/catalog';
import type { GameState } from '../src/types';
import { debugPanel, livestreamModal, livestreamRequest, onlineChannelModal, onlineStockModal, regularOrderDetailModal } from '../src/ui/panels';

class MemorySave extends SaveSystem {
  override write(_state: GameState) { /* in-memory test */ }
}

const preparedStore = (random = () => 0) => {
  const state = initialState();
  state.inventory['ribbon-kiss-tee'] = 6;
  state.inventory.ribbon = 4;
  state.inventory['urban-pulse-hoodie'] = 3;
  state.onlineListings = ['ribbon-kiss-tee', 'ribbon'];
  state.onlineChannelEnabled = true;
  state.layout.find(item => item.uid === 'starter-rack')!.displayItems = ['ribbon-kiss-tee'];
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

  it('persists whether a packed regular order already committed its stock', () => {
    const state = initialState();
    state.regularOnlineOrders = [{
      id: 'regular-saved', productIds: ['ribbon-kiss-tee'], customerName: 'Vy', customerHandle: '@vy_pick',
      price: 100000, fee: 8000, createdDay: 1, dueDay: 2, packed: true, stockCommitted: true, source: 'storefront',
    }];
    expect(parseSave(JSON.stringify(state)).regularOnlineOrders[0].stockCommitted).toBe(true);
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
    const result = store.resolveLivestreamRound(['ribbon-kiss-tee'], livestreamRequest(store.state, ['ribbon-kiss-tee', 'ribbon'], 1), 0);
    expect(result.orderCreated).toBe(true);
    expect(result.conversionChance).toBeGreaterThan(0);
    expect(result.fee).toBeGreaterThan(0);
    expect(store.state.regularOnlineOrders[0].source).toBe('livestream');
    expect(store.state.onlineOrders).toHaveLength(0);
  });

  it('packs regular orders before opening and hands them to the batch courier', () => {
    const store = preparedStore();
    store.state.regularOnlineOrders = [{
      id: 'regular-test', productIds: ['ribbon-kiss-tee'], customerName: 'An', customerHandle: '@an_daily',
      price: 100000, fee: 8000, createdDay: 1, dueDay: 2, packed: false, source: 'storefront',
    }];
    const stockBefore = store.state.inventory['ribbon-kiss-tee'];
    expect(store.packRegularOnlineOrder('regular-test')).toBe(true);
    expect(store.state.inventory['ribbon-kiss-tee']).toBe(stockBefore - 1);
    expect(store.state.regularOnlineOrders[0].stockCommitted).toBe(true);
    const moneyBefore = store.state.money;
    store.openShop();
    expect(store.fulfillPackedRegularOrders()).toBe(true);
    expect(store.state.regularOnlineOrders).toHaveLength(0);
    expect(store.state.inventory['ribbon-kiss-tee']).toBe(stockBefore - 1);
    expect(store.state.money).toBe(moneyBefore + 92000);
  });

  it('returns committed stock when a packed regular order is cancelled', () => {
    const store = preparedStore();
    store.state.regularOnlineOrders = [{
      id: 'regular-cancel', productIds: ['ribbon-kiss-tee'], customerName: 'An', customerHandle: '@an_daily',
      price: 100000, fee: 8000, createdDay: 1, dueDay: 2, packed: false, source: 'storefront',
    }];
    const stockBefore = store.state.inventory['ribbon-kiss-tee'];
    expect(store.packRegularOnlineOrder('regular-cancel')).toBe(true);
    expect(store.state.inventory['ribbon-kiss-tee']).toBe(stockBefore - 1);
    expect(store.cancelRegularOnlineOrder('regular-cancel')).toBe(true);
    expect(store.state.inventory['ribbon-kiss-tee']).toBe(stockBefore);
    expect(store.state.regularOnlineOrders).toHaveLength(0);
  });

  it('does not create regular orders for listed products without warehouse stock', () => {
    const store = preparedStore();
    store.state.onlineListings = ['ribbon-kiss-tee'];
    store.state.inventory['ribbon-kiss-tee'] = 1;
    store.openShop();
    store.state.regularOnlineNextOrderIn = 0;
    store.state.onlineNextOrderIn = 50;
    store.tick();
    expect(store.state.regularOnlineOrders).toHaveLength(0);
    expect(onlineChannelModal(store.state)).toContain('Tạm hết hàng');
    expect(onlineStockModal(store.state)).toContain('Tạm hết hàng');
  });

  it('renders the regular-order board and interactive livestream without empty markup', () => {
    const store = preparedStore();
    store.state.regularOnlineOrders = [{
      id: 'regular-ui', productIds: ['ribbon-kiss-tee'], customerName: 'Linh', customerHandle: '@linh_closet',
      price: 99000, fee: 7920, createdDay: 1, dueDay: 2, packed: false, source: 'storefront',
    }];
    expect(onlineChannelModal(store.state)).toContain('data-action="regular-order-open"');
    expect(onlineChannelModal(store.state)).not.toContain('data-action="regular-pack"');
    expect(regularOrderDetailModal(store.state, 'regular-ui')).toContain('data-action="regular-pack"');
    expect(regularOrderDetailModal(store.state, 'regular-ui')).toContain('data-action="regular-cancel"');
    const detailMarkup = regularOrderDetailModal(store.state, 'regular-ui');
    expect(detailMarkup).toContain('regular-order-detail-product-scroll');
    expect(detailMarkup).not.toContain('<dialog');
    expect(onlineChannelModal(store.state)).toContain('data-action="online-stock-open"');
    expect(onlineChannelModal(store.state)).not.toContain('online-dashboard-stock-list');
    expect(onlineStockModal(store.state)).toContain('data-action="online-list"');
    expect(onlineStockModal(store.state)).toContain('data-action="online-stock-back"');
    expect(livestreamModal(store.state, ['ribbon-kiss-tee', 'ribbon', 'ribbon-dress'])).toContain('data-action="livestream-start"');
    const liveMarkup = livestreamModal(store.state, ['ribbon-kiss-tee', 'ribbon', 'ribbon-dress'], 1, [], 0, undefined, undefined, 60, 60);
    expect(liveMarkup).toContain('livestream-two-pane');
    expect(liveMarkup).toContain('data-action="livestream-round-select"');
    expect(liveMarkup).not.toContain('data-action="livestream-submit"');
  });

  it('allows every listed product to join one livestream without a six-item cap', () => {
    const store = preparedStore();
    const ids = products.slice(0, 8).map(product => product.id);
    for (const id of ids) store.state.inventory[id] = 8;
    store.state.onlineListings = ids;
    const markup = livestreamModal(store.state, ids);
    expect(markup).toContain('Không giới hạn mẫu');
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
