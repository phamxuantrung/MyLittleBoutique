import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { preparedState } from './state';

test('all preparation navigation buttons render without a blank screen', async ({ page }) => {
  const state = preparedState();
  state.level = 10;
  state.xp = 100000;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.stack ?? error.message));
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');

  for (const id of ['stock', 'import', 'trend', 'decor', 'atelier', 'social']) {
    await page.locator(`.vertical-dock [data-action="nav"][data-id="${id}"]`).dispatchEvent('click');
    await expect(page.locator('#content-panel')).toBeVisible();
    await expect(page.locator('.game-panel-body')).not.toBeEmpty();
    expect(errors, `JavaScript error after opening ${id}`).toEqual([]);
    await page.locator('[data-action="nav"][data-id="shop"]').first().dispatchEvent('click');
    await expect(page.locator('#content-panel')).toBeHidden();
  }

  for (const [selector, content] of [
    ['[data-action="settings"]', '.game-settings-modal'],
    ['[data-action="upgrade-open"]', '.upgrade-modal-wrapper'],
  ] as const) {
    await page.locator(selector).first().dispatchEvent('click');
    await expect(page.locator('#game-dialog')).toBeVisible();
    await expect(page.locator(content)).toBeVisible();
    await page.locator('#game-dialog [data-action="close-modal"]').first().dispatchEvent('click');
    await expect(page.locator('#game-dialog')).toBeHidden();
    expect(errors, `JavaScript error after opening ${selector}`).toEqual([]);
  }
});

test('inventory card content stays inside each narrow landscape card', async ({ page }) => {
  const state = preparedState();
  await page.setViewportSize({ width: 720, height: 503 });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('.vertical-dock [data-action="nav"][data-id="stock"]').dispatchEvent('click');

  const cards = page.locator('.inventory-horizontal-rail > .inv-card');
  await expect(cards.first()).toBeVisible();
  const overflow = await cards.evaluateAll(items => items.map(card => {
    const right = card.getBoundingClientRect().right + 1;
    const selectors = ['.inv-name-row', '.product-name', '.inv-pricing-console', '.inv-profit-row'];
    return selectors.filter(selector => {
      const element = card.querySelector<HTMLElement>(selector);
      return !!element && element.getBoundingClientRect().right > right;
    });
  }));
  expect(overflow).toEqual(overflow.map(() => []));
  const longNames = await cards.locator('.product-name').evaluateAll(items => items.map(item => {
    const style = getComputedStyle(item);
    return { overflow: style.overflow, textOverflow: style.textOverflow, whiteSpace: style.whiteSpace };
  }));
  expect(longNames.every(style => style.overflow === 'hidden' && style.textOverflow === 'ellipsis' && style.whiteSpace === 'nowrap')).toBe(true);
});
