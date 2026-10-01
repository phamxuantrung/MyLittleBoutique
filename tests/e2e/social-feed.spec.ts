import { expect, test } from '@playwright/test';
import { SAVE_KEY } from '../../src/systems/save';
import { preparedState } from './state';

test('opens a mixed drama and review feed from a legacy save', async ({ page }) => {
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
  (state.dramas as unknown[]).push(null, { id: 'broken-drama' });
  (state.posts as unknown[]).push(null, { id: 'broken-review' });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: state });
  await page.goto('/');
  await expect(page.locator('#game-canvas')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="nav"][data-id="social"]').click();
  await expect(page.locator('.social-drawer-panel')).toBeVisible();
  await expect(page.locator('[data-drama-card="drama-legacy"]')).toBeVisible();
  await expect(page.locator('.drawer-review-card')).toBeVisible();
});
