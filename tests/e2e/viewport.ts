import type { Page } from '@playwright/test';

export async function gameView(page: Page) {
  await page.locator('#landscape-game, #game-canvas').first().waitFor({ state: 'attached' });
  return await page.locator('#landscape-game').count()
    ? page.frameLocator('#landscape-game')
    : page;
}

// Convert a point on Phaser's 1000 × 700 canvas to physical screen coordinates.
export async function canvasPoint(page: Page, x: number, y: number) {
  const view = await gameView(page);
  const point = await view.locator('#game-canvas canvas').evaluate((canvas, { x, y }) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: bounds.left + x * bounds.width / 1000, y: bounds.top + y * bounds.height / 700 };
  }, { x, y });
  const frame = page.locator('#landscape-game');
  if (!await frame.count()) return point;
  const bounds = (await frame.boundingBox())!;
  const rotated = await page.locator('#app').evaluate(el => el.classList.contains('is-rotated'));
  return rotated
    ? { x: bounds.x + bounds.width - point.y, y: bounds.y + point.x }
    : { x: bounds.x + point.x, y: bounds.y + point.y };
}
