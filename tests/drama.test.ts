import { describe, expect, it } from 'vitest';
import { fallbackDrama, fallbackReplyEvaluation, type DramaRequest } from '../src/systems/drama';
import { initialState, parseSave, SaveSystem } from '../src/systems/save';
import { GameStore } from '../src/systems/store';
import { socialPanel } from '../src/ui/panels';

class MemorySave extends SaveSystem { override write() {} }

const context: DramaRequest = {
  day: 2,
  shopName: 'Tiệm Mây',
  customerName: 'Hân',
  customerHandle: '@han_mood',
  personality: 'Influencer',
  products: ['Cloud Atelier Tee'],
  total: 110000,
  budget: 350000,
  score: 90,
  success: true,
  viral: true,
  reason: 'Đúng gu',
  heat: 12,
  trust: 70,
};

describe('Boutique Buzz drama', () => {
  it('creates a first-person fallback with no suggested replies', () => {
    const drama = fallbackDrama(context);
    expect(drama.source).toBe('fallback');
    expect(drama.comments.length).toBeGreaterThanOrEqual(3);
    expect(drama.post).toMatch(/\b(Mình|Tôi)\b/);
    expect(drama.choices).toEqual([]);
  });

  it('keeps accepting comments while applying game effects only once', () => {
    const store = new GameStore(initialState(), new MemorySave());
    const drama = fallbackDrama(context);
    expect(store.addSocialDrama(drama)).toBe(true);
    expect(store.state.shopReviewCount).toBe(0);
    expect(store.state.shopReviewTotal).toBe(0);
    expect(store.addSocialDrama(drama)).toBe(false);
    expect(store.state.shopReviewCount).toBe(0);
    expect(store.resolveSocialDramaCustom(drama.id, 'Shop trả lời tự do.', 'sassy', 'Cộng đồng phản hồi.')).toBe(true);
    expect(store.state.dramaHeat).toBe(22);
    expect(store.state.dramaTrust).toBe(68);
    expect(store.state.followers).toBe(15);
    expect(store.resolveSocialDramaCustom(drama.id, 'Trả lời lần hai.', 'cute', 'Tui vào trả lời tiếp nè.')).toBe(true);
    expect(store.state.dramas[0].threadReplies).toHaveLength(2);
    expect(store.state.followers).toBe(15);
  });

  it('keeps drama and its resolution across save parsing', () => {
    const state = initialState();
    const drama = fallbackDrama(context);
    drama.resolvedChoiceId = 'business';
    drama.outcome = 'Shop đã xử lý phản hồi rõ ràng.';
    drama.threadReplies.push({
      id: 'saved-thread', shopText: 'Shop xin nghe nè.', tone: 'business',
      communityAuthorName: 'Hân Mood', communityAuthorHandle: '@han_mood',
      communityText: 'Vậy mình nói tiếp nha.', source: 'fallback',
    });
    state.dramas = [drama];
    state.dramaHeat = 44;
    state.dramaTrust = 81;
    const loaded = parseSave(JSON.stringify(state));
    expect(loaded.dramas[0].resolvedChoiceId).toBe('business');
    expect(loaded.dramas[0].outcome).toBeTruthy();
    expect(loaded.dramas[0].threadReplies).toHaveLength(1);
    expect(loaded.shopReviewCount).toBe(0);
    expect(loaded.shopReviewTotal).toBe(0);
    expect(loaded.dramaHeat).toBe(44);
    expect(loaded.dramaTrust).toBe(81);
  });

  it('accepts a free shop reply and evaluates it without AI as a fallback', () => {
    const store = new GameStore(initialState(), new MemorySave());
    const drama = fallbackDrama(context);
    store.addSocialDrama(drama);
    const evaluation = fallbackReplyEvaluation('Ví phản đối nhưng outfit đẹp vãi nên shop không chịu trách nhiệm nha.');
    expect(evaluation.tone).toBe('sassy');
    expect(store.resolveSocialDramaCustom(
      drama.id,
      'Shop không chịu trách nhiệm nha.',
      evaluation.tone,
      evaluation.communityText,
      evaluation.communityAuthorName,
      evaluation.communityAuthorHandle,
      evaluation.source,
    )).toBe(true);
    expect(store.state.dramas[0].resolvedChoiceId).toBe('custom');
    expect(store.state.dramas[0].shopReply).toBe('Shop không chịu trách nhiệm nha.');
    expect(store.state.dramas[0].threadReplies[0].communityText).toBe(evaluation.communityText);
    expect(store.state.dramaHeat).toBe(22);
    const markup = socialPanel(store.state);
    expect(markup).toContain(evaluation.communityText);
    expect(markup).toContain(`data-drama-reply="${drama.id}"`);
  });

  it('renders the social panel even when a hot-reloaded session contains broken drama data', () => {
    const state = initialState();
    state.dramas = [{ id: 'broken', day: 1, title: 'Old drama' } as never];
    expect(() => socialPanel(state)).not.toThrow();
    expect(socialPanel(state)).toContain('social-drawer-panel');
  });
});
