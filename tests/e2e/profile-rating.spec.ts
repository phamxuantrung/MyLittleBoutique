import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { preparedState } from './state';

test('profile separates public stars from reputation and uses full-width initial-only comments', async ({ page }) => {
  const state = preparedState();
  state.reputation = 3.9;
  state.posts = [{ id: 'review-1', name: 'Chloe', handle: '@chloe.archive', text: 'Baby tee nơ hồng ở boutique xinh xỉu! Vừa ghé đã chốt đơn liền tay. #BoutiqueLover', color: '#c59e82', day: 1, likes: 35, viral: false, reviewStars: 5 }];
  await page.addInitScript(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: SAVE_KEY, state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="nav"][data-id="social"]').click();
  await expect(page.locator('.profile-shop-rating')).toContainText('5.0');
  await expect(page.locator('.profile-shop-rating')).toContainText('1 lượt');
  await expect(page.locator('.profile-statistics > div').filter({ hasText: 'Độ uy tín' })).toContainText('3.9');
  await expect(page.locator('.post-initial-avatar')).toHaveText('C');
  await expect(page.locator('.social-post-card img')).toHaveCount(0);
  await expect(page.locator('.game-panel-body > .social-profile-card')).toHaveCount(1);
  const card = await page.locator('.social-post-card').boundingBox();
  const feed = await page.locator('.feed-tab-content').evaluate(el => ({ width: el.clientWidth, padding: parseFloat(getComputedStyle(el).paddingLeft) + parseFloat(getComputedStyle(el).paddingRight) }));
  expect(Math.abs(card!.width - (feed.width - feed.padding))).toBeLessThan(2);
  await page.screenshot({ path: 'test-results/profile-latest.png' });
  await page.locator('.social-post-card').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/comments-latest.png' });
});
