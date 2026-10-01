import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { preparedState } from './state';

test('opens a mixed drama and review feed from a legacy save', async ({ page }) => {
  await page.route('**/api/drama', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      title: 'AI đang hoạt động', post: 'Mình vừa ghé shop.', authorName: 'AI Test',
      authorHandle: '@ai_test', comments: ['Một', 'Hai', 'Ba'],
    }),
  }));
  const state = preparedState();
  delete (state as Partial<typeof state>).nextDramaDay;
  state.posts = [{
    id: 'review-after-drama', name: 'Mai', handle: '@mai', text: 'Shop phục vụ ổn.',
    likes: 0, day: 1, viral: false, color: '#f19ac0', reviewStars: 4, channel: 'shop',
  }];
  state.dramas = [{
    id: 'drama-legacy', day: 1, title: 'Có chuyện rồi đây', post: 'Mình cần shop giải thích chuyện này.',
    authorName: 'Linh', authorHandle: '@linh', comments: ['Hóng nha.', 'Shop vào trả lời đi.', 'Bình tĩnh nghe hai phía.'],
    choices: [], threadReplies: [], source: 'fallback',
  }];
  (state.dramas[0].threadReplies as unknown[]).push({
    id: 'damaged-reply', shopText: 'Shop phản hồi.', communityText: 'Khách trả lời.',
    communityAuthorName: 42, communityAuthorHandle: { broken: true }, tone: 'unknown',
  });
  (state.dramas as unknown[]).push(null, { id: 'broken-drama' });
  (state.posts as unknown[]).push(null, { id: 'broken-review' });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="nav"][data-id="social"]').click();
  await expect(page.locator('.social-drawer-panel')).toBeVisible();
  await expect(page.locator('[data-drama-card="drama-legacy"]')).toBeVisible();
  await expect(page.locator('.drawer-review-card')).toBeVisible();
  await page.locator('[data-action="drama-ai-test"]').click();
  await expect(page.locator('#toasts')).toContainText('AI hoạt động tốt');
});
