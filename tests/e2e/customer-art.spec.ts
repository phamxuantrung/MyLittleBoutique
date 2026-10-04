import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState } from './state';

test('customer uses fixed normal artwork while products are selected', async ({ page }) => {
  const state = openState('lily', 'advice');
  state.nextArrivalIn = 999;
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: state,
  });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="sale-visit-open"][data-id="e2e-lily"]').dispatchEvent('click');

  const dialog = page.locator('#game-dialog');
  const model = dialog.locator('.fitting-model img');
  await expect(dialog).toHaveClass('dialog-serve');
  await expect(model).toHaveAttribute('src', '/assets/characters/customers/01-lily.webp');
  await expect(model).toHaveAttribute('data-outfit', '');

  await dialog.locator('[data-action="outfit-category"][data-id="tops"]').dispatchEvent('click');
  await dialog.locator('.outfit-grid [data-action="select-product"]').first().dispatchEvent('click');
  await expect(dialog.locator('.fitting-model img')).toHaveAttribute('src', '/assets/characters/customers/01-lily.webp');
  await expect(dialog.locator('.fitting-model img')).toHaveAttribute('data-outfit', '');
});

test('selecting the last consultation product keeps the wardrobe mounted and stable', async ({ page }) => {
  const state = openState('lily', 'advice');
  state.nextArrivalIn = 999;
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE_KEY,
    value: state,
  });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="sale-visit-open"][data-id="e2e-lily"]').dispatchEvent('click');

  const result = await page.locator('.outfit-grid .outfit-option').last().evaluate(async option => {
    const grid = option.closest<HTMLElement>('.outfit-grid')!;
    grid.scrollTop = grid.scrollHeight;
    const before = grid.scrollTop;
    option.setAttribute('data-stability-probe', 'kept');
    (option as HTMLButtonElement).click();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const current = grid.querySelector<HTMLElement>(`.outfit-option[data-id="${(option as HTMLElement).dataset.id}"]`);
    return {
      sameNode: current === option,
      probe: current?.getAttribute('data-stability-probe'),
      scrollDifference: Math.abs(grid.scrollTop - before),
    };
  });

  expect(result).toEqual({ sameNode: true, probe: 'kept', scrollDifference: 0 });
});
