import { describe, expect, it } from 'vitest';
import { GameStore } from '../src/systems/store';
import { initialState, parseSave } from '../src/systems/save';
import { ATELIER_PURCHASE_COST, ATELIER_RECIPE_CARD_COST, atelierRecipes } from '../src/data/atelier';
import { atelierProductBody, atelierProductPoints } from '../src/art/atelierArt';

class MemorySave {
  write() {}
}

describe('personal tailoring workshop', () => {
  it('gives all ten recipes a unique editable block and surface identity', () => {
    const pointSignatures = atelierRecipes.map(recipe => JSON.stringify(atelierProductPoints(recipe.art)));
    const renderedBodies = atelierRecipes.map(recipe => atelierProductBody(recipe.art, recipe.color));

    expect(atelierRecipes).toHaveLength(10);
    expect(new Set(pointSignatures).size).toBe(10);
    expect(new Set(renderedBodies).size).toBe(10);
    renderedBodies.forEach(body => {
      expect(body).toContain('atelier-recipe-surface');
      expect(body).toContain('atelier-live-shape-path');
    });
  });

  it('buys random recipe cards and keeps duplicate draws', () => {
    const state = initialState();
    state.level = 8;
    state.atelierOwned = true;
    state.money = 3000000;
    const store = new GameStore(state, new MemorySave() as never, () => 0);

    const first = store.buyRandomAtelierRecipe();
    const second = store.buyRandomAtelierRecipe();

    expect(first).toMatchObject({ success: true, count: 1, recipe: { id: 'cloud-tee' } });
    expect(second).toMatchObject({ success: true, count: 2, recipe: { id: 'cloud-tee' } });
    expect(state.atelierRecipeCards).toEqual(['cloud-tee', 'cloud-tee']);
    expect(state.money).toBe(3000000 - ATELIER_RECIPE_CARD_COST * 2);
    expect(parseSave(JSON.stringify(state)).atelierRecipeCards).toEqual(['cloud-tee', 'cloud-tee']);
  });

  it('buys the workshop, consumes failed samples and produces an approved design in batches', () => {
    const state = initialState();
    state.level = 8;
    state.money = 50000000;
    const store = new GameStore(state, new MemorySave() as never, () => 0);

    expect(store.buyAtelier()).toBe(true);
    expect(state.money).toBe(50000000 - ATELIER_PURCHASE_COST);
    expect(state.atelierOwned).toBe(true);

    expect(store.buyAtelierMaterial('cotton', 13)).toBe(true);
    expect(store.buyAtelierMaterial('ribbon', 7)).toBe(true);
    const failed = store.createAtelierSample('Casual', { cotton: 1, ribbon: 1 });
    expect(failed).toMatchObject({ success: false, reason: 'wrong-recipe' });
    expect(state.materialInventory).toMatchObject({ cotton: 12, ribbon: 6 });
    expect(state.atelierCraftHistory[0]).toMatchObject({ success: false, style: 'Casual', materials: { cotton: 1, ribbon: 1 } });

    const sample = store.createAtelierSample('Casual', { cotton: 2, ribbon: 1 });
    expect(sample.success).toBe(true);
    expect(state.atelierDraft?.recipeId).toBe('cloud-tee');
    expect(state.craftedRecipeIds).toContain('cloud-tee');
    expect(state.atelierCraftHistory[1]).toMatchObject({ success: true, recipeId: 'cloud-tee' });
    expect(store.acceptAtelierSample()).toBe(true);
    const product = state.customProducts[0];
    expect(state.inventory[product.id]).toBe(1);

    expect(store.startTailoringBatch(product.id, 5)).toBe(true);
    expect(state.tailoringJobs[0]).toMatchObject({ productId: product.id, quantity: 5, readyDay: 2 });
    state.phase = 'closed';
    store.nextDay();
    expect(state.inventory[product.id]).toBe(6);
    expect(state.tailoringJobs).toHaveLength(0);

    const restored = parseSave(JSON.stringify(state));
    expect(restored.customProducts[0]?.id).toBe(product.id);
    expect(restored.inventory[product.id]).toBe(6);
    expect(restored.craftedRecipeIds).toContain('cloud-tee');
    expect(restored.atelierCraftHistory).toHaveLength(2);
  });

  it('seeds every workshop state from the debug toolkit', () => {
    const state = initialState();
    const store = new GameStore(state, new MemorySave() as never, () => 0);

    expect(store.debug('atelier-ready')).toBe(true);
    expect(state.level).toBe(8);
    expect(state.atelierOwned).toBe(true);
    expect(state.materialInventory).toMatchObject({ cotton: 20, ribbon: 20 });

    const cottonBeforeFailure = state.materialInventory.cotton;
    const ribbonBeforeFailure = state.materialInventory.ribbon;
    expect(store.debug('atelier-wrong-recipe')).toBe(true);
    expect(state.atelierDraft).toBeNull();
    expect(state.materialInventory.cotton).toBe(cottonBeforeFailure - 1);
    expect(state.materialInventory.ribbon).toBe(ribbonBeforeFailure - 1);

    expect(store.debug('atelier-sample')).toBe(true);
    expect(state.atelierDraft?.recipeId).toBe('cloud-tee');

    expect(store.debug('atelier-blueprint')).toBe(true);
    expect(state.atelierDraft).toBeNull();
    expect(state.customProducts).toHaveLength(1);
    const product = state.customProducts[0];
    expect(state.inventory[product.id]).toBe(1);

    expect(store.debug('atelier-batch')).toBe(true);
    expect(state.tailoringJobs[0]).toMatchObject({ productId: product.id, quantity: 10, readyDay: 3 });
    expect(store.debug('atelier-deliver')).toBe(true);
    expect(state.tailoringJobs).toHaveLength(0);
    expect(state.inventory[product.id]).toBe(11);

    expect(store.debug('atelier-max')).toBe(true);
    expect(state.level).toBe(10);
    expect(state.materialInventory.crystal).toBe(50);
    expect(state.materialInventory.cashmere).toBe(50);
  });

  it('orders materials with the selected supplier and delivers them to material storage', () => {
    const state = initialState();
    state.level = 8;
    state.money = 5000000;
    const store = new GameStore(state, new MemorySave() as never, () => 0);

    expect(store.selectSupplier('wholesale')).toBe(true);
    expect(store.buyAtelierMaterial('cotton', 10)).toBe(true);
    expect(state.materialInventory.cotton).toBe(0);
    expect(state.pendingMaterialOrders[0]).toMatchObject({ materialId: 'cotton', quantity: 10, arrivalDay: 2, supplierId: 'wholesale' });

    state.phase = 'closed';
    store.nextDay();
    expect(state.pendingMaterialOrders).toHaveLength(0);
    expect(state.materialInventory.cotton).toBe(10);
  });

  it('persists custom artwork and safely removes a blueprint', () => {
    const state = initialState();
    const store = new GameStore(state, new MemorySave() as never, () => 0);
    expect(store.debug('atelier-ready')).toBe(true);
    expect(store.debug('atelier-sample')).toBe(true);
    expect(store.debug('atelier-blueprint')).toBe(true);
    const product = state.customProducts[0];

    expect(store.customizeCustomProduct(product.id, 'Mây Hồng Studio', '#68a6df', [
      { color: '#d4429a', width: 3, points: [{ x: 30, y: 40 }, { x: 60, y: 58 }, { x: 82, y: 42 }] },
    ], 'bow', '#ffcf63', 1.3, 76, 69, 1.14, .86, 30, .75, 3, [
      { x: 30, y: 30 }, { x: 45, y: 20 }, { x: 75, y: 20 }, { x: 90, y: 30 }, { x: 82, y: 110 }, { x: 38, y: 110 },
    ], false, '#4a2d5a', 3.2, [
      { id: 'sticker-test', kind: 'vest-collar', x: 72, y: 58, scale: 1.4, rotation: 30, color: '#ffcf63' },
    ])).toBe(true);
    const restored = parseSave(JSON.stringify(state));
    expect(restored.customProducts[0]).toMatchObject({
      name: 'Mây Hồng Studio',
      designColor: '#68a6df',
      designMotif: 'bow',
      designAccentColor: '#ffcf63',
      designMotifScale: 1.3,
      designMotifX: 76,
      designMotifY: 69,
      designFormWidth: 1.14,
      designFormLength: .86,
      designMotifRotation: 30,
      designMotifOpacity: .75,
      designMotifRepeat: 3,
      designShapeSmooth: false,
      designStrokeColor: '#4a2d5a',
      designStrokeWidth: 3.2,
    });
    expect(restored.customProducts[0].designShapePoints).toHaveLength(6);
    expect(restored.customProducts[0].designStickers?.[0]).toMatchObject({ id: 'sticker-test', kind: 'vest-collar', x: 72, y: 58, scale: 1.4, rotation: 30, color: '#ffcf63' });
    expect(restored.customProducts[0].designStrokes?.[0]).toMatchObject({ color: '#d4429a', width: 3 });
    expect(restored.customProducts[0].designStrokes?.[0].points).toHaveLength(3);

    state.tailoringJobs.push({ id: 'active-job', productId: product.id, quantity: 5, readyDay: state.day + 1 });
    expect(store.deleteCustomProduct(product.id)).toBe(false);
    state.tailoringJobs = [];
    state.onlineListings = [product.id];
    state.layout[0].displayItems = [product.id];
    expect(store.deleteCustomProduct(product.id)).toBe(true);
    expect(state.customProducts).toHaveLength(0);
    expect(state.onlineListings).not.toContain(product.id);
    expect(state.layout[0].displayItems).not.toContain(product.id);
    expect(state.inventory[product.id]).toBeUndefined();
  });
});
