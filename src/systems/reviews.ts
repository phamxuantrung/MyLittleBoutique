import type { GameState } from '../types';

/** Public feedback is separate from reputation penalties and online ratings. */
export function shopReviewStats(state: GameState) {
  const hasTotals = Number.isInteger(state.shopReviewCount) && state.shopReviewCount >= state.posts.length &&
    Number.isFinite(state.shopReviewTotal) && state.shopReviewTotal >= state.shopReviewCount &&
    state.shopReviewTotal <= state.shopReviewCount * 5;
  const count = hasTotals ? state.shopReviewCount : state.posts.length;
  const total = hasTotals ? state.shopReviewTotal : state.posts.reduce((sum, post) => sum + Math.max(1, Math.min(5, post.reviewStars)), 0);
  return { count, total, average: count ? total / count : null };
}

export function recordPublicShopReview(state: GameState, stars: number) {
  const { count, total } = shopReviewStats(state);
  state.shopReviewCount = count + 1;
  state.shopReviewTotal = total + Math.max(1, Math.min(5, Math.round(stars * 2) / 2));
}
