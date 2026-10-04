import { initialState } from '../../src/systems/save';
import type { GameState } from '../../src/types';

export function preparedState(): GameState {
  const state = initialState();
  state.tutorialDone = true;
  state.hasNamedShop = true;
  state.shopName = 'Sunday Boutique';
  state.money = 500000;
  state.inventory = { 'ribbon-kiss-tee': 2, 'cyber-pop-flare': 2, 'ribbon-dress': 1, 'urban-pulse-hoodie': 1, ribbon: 2 };
  state.layout.find(item => item.uid === 'starter-rack')!.displayItems = ['ribbon-kiss-tee', 'cyber-pop-flare', 'ribbon-dress', 'urban-pulse-hoodie'];
  const plantIndex = state.layout.findIndex(item => item.uid === 'starter-plant');
  state.layout[plantIndex] = { uid: 'starter-table', id: 'table', x: 6, y: 0, rotation: 0, displayItems: ['ribbon', 'ribbon'] };
  return state;
}

export function openState(customerId = 'lily', mode: 'advice' | 'browse' = 'advice'): GameState {
  const state = preparedState();
  state.phase = 'open';
  state.nextArrivalIn = 30;
  const uid = `e2e-${customerId}`;
  state.activeVisits = [{ uid, customerId, mode, patience: 90, maxPatience: 90 }];
  state.currentVisitId = uid;
  state.currentCustomerId = customerId;
  state.customerMode = mode;
  state.patience = 90;
  return state;
}
