import type { Page } from '@playwright/test';

export async function gameView(page: Page) {
  await page.locator('#game-canvas').waitFor({ state: 'attached' });
  return page;
}

// Convert a point on Phaser's 1000 × 700 canvas to physical screen coordinates.
export async function canvasPoint(page: Page, x: number, y: number) {
  const view = await gameView(page);
  const point = await view.locator('#game-canvas canvas').evaluate((canvas, { x, y }) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: bounds.left + x * bounds.width / 1000, y: bounds.top + y * bounds.height / 700 };
  }, { x, y });
  return point;
}
