import { describe, expect, it } from 'vitest';
import { initialState, parseSave } from '../src/systems/save';
import { recordPublicShopReview, shopReviewStats } from '../src/systems/reviews';
import type { SocialPost } from '../src/types';

const post = (stars: number): SocialPost => ({ id: '1', name: 'Chloe', handle: '@chloe.archive', text: 'Xinh!', color: '#c59e82', day: 1, likes: 35, viral: false, reviewStars: stars });

describe('public shop rating', () => {
  it('shows no rating until a public review exists', () => {
    expect(shopReviewStats(initialState())).toMatchObject({ count: 0, average: null });
  });
  it('migrates one five-star review independently of reputation and hidden reviews', () => {
    const legacy: Record<string, unknown> = { ...initialState(), reputation: 3.9, reviews: 8, posts: [post(5)] };
    delete legacy.shopReviewCount;
    delete legacy.shopReviewTotal;
    const state = parseSave(JSON.stringify(legacy));
    expect(shopReviewStats(state)).toEqual({ count: 1, total: 5, average: 5 });
    expect(state.reputation).toBe(3.9);
    recordPublicShopReview(state, 3);
    expect(shopReviewStats(parseSave(JSON.stringify(state)))).toEqual({ count: 2, total: 8, average: 4 });
  });
  it('retains older reviews when the public feed is capped at forty posts', () => {
    const state = initialState();
    for (let i = 0; i < 45; i++) {
      const stars = i < 5 ? 1 : 5;
      recordPublicShopReview(state, stars);
      state.posts.unshift({ ...post(stars), id: String(i) });
      state.posts = state.posts.slice(0, 40);
    }
    const restored = parseSave(JSON.stringify(state));
    expect(restored.posts).toHaveLength(40);
    expect(shopReviewStats(restored)).toEqual({ count: 45, total: 205, average: 205 / 45 });
  });
  it('rebuilds malformed totals using the known public feedback', () => {
    const state = parseSave(JSON.stringify({ ...initialState(), posts: [post(4)], shopReviewCount: 2, shopReviewTotal: 200 }));
    expect(shopReviewStats(state)).toEqual({ count: 1, total: 4, average: 4 });
  });
});
