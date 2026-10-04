import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { openState } from './state';

test('customer advice badge opens the fitting room', async ({ page }) => {
  const state = openState();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.waitForTimeout(1600);
  const canvas = (await page.locator('#game-canvas canvas').boundingBox())!;
  await page.mouse.click(canvas.x + 426 * canvas.width / 1000, canvas.y + 390 * canvas.height / 700);
  await expect(page.getByRole('dialog')).toHaveClass('dialog-serve');
  await expect(page.getByRole('dialog')).toContainText('Khách mới');
});

test('a lost pointer-up cannot freeze the next sale interaction', async ({ page }) => {
  const state = openState();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  const canvasLocator = page.locator('#game-canvas canvas');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.waitForTimeout(1600);
  const canvas = (await canvasLocator.boundingBox())!;

  // Reproduce a browser/app switch swallowing the end of a touch gesture.
  await canvasLocator.dispatchEvent('pointerdown', {
    pointerId: 71,
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: canvas.x + canvas.width * .7,
    clientY: canvas.y + canvas.height * .7,
  });

  // The next fresh contact must clear the abandoned gesture and remain usable.
  await page.mouse.click(canvas.x + 426 * canvas.width / 1000, canvas.y + 390 * canvas.height / 700);
  await expect(page.getByRole('dialog')).toHaveClass('dialog-serve');
});
