import type { DramaResponseTone, GameState, SaleResult, SocialDrama } from '../types';

export interface DramaRequest {
  day: number;
  shopName: string;
  customerName: string;
  customerHandle: string;
  personality: string;
  products: string[];
  total: number;
  budget: number;
  score: number;
  success: boolean;
  viral: boolean;
  reason: string;
  heat: number;
  trust: number;
  recentDramas?: string[];
}

export interface DramaReplyEvaluation {
  tone: DramaResponseTone;
  communityAuthorName: string;
  communityAuthorHandle: string;
  communityText: string;
  source: 'ai' | 'fallback';
}

const templates = [
  (c: DramaRequest) => ({
    title: 'Mua một món, rung động cả cái ví',
    post: `Mình bảo chỉ vào xem thôi, vậy mà bước ra với ${Math.max(1, c.products.length)} món và số dư tài khoản đang cần được cấp cứu.`,
    comments: ['Đây là healing hay thao túng tài chính vậy?', 'Xin địa chỉ để mình vào né... à nhầm, vào mua.', 'Ví mỏng mà gu dày, tôi hiểu.'],
  }),
  (c: DramaRequest) => ({
    title: 'Outfit này có bỏ bùa không?',
    post: `Mình mặc đồ của ${c.shopName} xong thì người yêu cũ đột nhiên xin quay lại. Shop giải thích giúp mình vụ này với?`,
    comments: ['Xin link bộ đồ để tôi làm thí nghiệm.', 'Người yêu cũ hay outfit, chọn đi chị.', 'Shop này bán quần áo hay bán nghiệp vậy?'],
  }),
  (c: DramaRequest) => ({
    title: 'Đẹp vãi nhưng ví vừa qua đời',
    post: `Mình vừa thanh toán ${c.total.toLocaleString('vi-VN')}đ cho outfit mới. Đây là đầu tư phong cách hay một phút bốc đồng vậy mọi người?`,
    comments: ['Tiền có thể kiếm lại, ảnh đẹp thì không.', 'Nói câu này với chủ nhà thử xem.', 'Tôi không tiêu hoang, tôi đầu tư visual.'],
  }),
  (c: DramaRequest) => ({
    title: 'Người ta bảo chỉ xem thôi',
    post: `Mình đã lặp lại “chỉ xem thôi” ba lần trước khi ôm một đống đồ ra quầy. Camera boutique có nên trao cho mình giải diễn xuất không?`,
    comments: ['Câu nói nguy hiểm nhất mọi boutique.', 'Tôi cũng xem, xem mà hết mẹ lương.', 'Nhân vật chính không bao giờ chỉ xem.'],
  }),
  (c: DramaRequest) => ({
    title: 'Gu thì sang, ngân sách thì đang ngủ',
    post: `Mình muốn một outfit “nhìn như người thừa kế” nhưng ngân sách chỉ có ${c.budget.toLocaleString('vi-VN')}đ. Stylist cứu mình quả này được không?`,
    comments: ['Old money nhưng money old mất rồi.', 'Hãy để gu thẩm mỹ gánh kinh tế.', 'Tôi cần outfit này trước ngày lĩnh lương.'],
  }),
  (c: DramaRequest) => ({
    title: 'Thời trang hay một cú lừa?',
    post: `Mình vừa mặc outfit mới và không biết là đẹp thật hay do đèn shop chiếu quá nên đang ảo giác nữa?`,
    comments: ['Ánh sáng không thể may đường vai đẹp thế đâu.', 'Ảo giác mà xinh thì cho tôi ảo giác cùng.', 'Gu này không thể là tai nạn được.'],
  }),
];

const hash = (value: string) => Array.from(value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);

export function dramaRequestFromSale(state: GameState, result: SaleResult): DramaRequest {
  return {
    day: state.day,
    shopName: state.shopName || 'My Little Boutique',
    customerName: result.customer.name,
    customerHandle: result.customer.handle,
    personality: result.customer.personality,
    products: result.products.map(product => product.name).slice(0, 4),
    total: result.total,
    budget: result.customer.budget,
    score: result.score,
    success: result.success,
    viral: result.viral,
    reason: result.reason,
    heat: state.dramaHeat,
    trust: state.dramaTrust,
    recentDramas: (Array.isArray(state.dramas) ? state.dramas : [])
      .slice(0, 10)
      .map(drama => `${drama.title}: ${drama.post}`.slice(0, 420)),
  };
}

export function fallbackDrama(context: DramaRequest): SocialDrama {
  const template = templates[hash(`${context.day}:${context.customerHandle}:${context.products.join(',')}`) % templates.length](context);
  return {
    id: `drama-${context.day}-${Date.now().toString(36)}`,
    day: context.day,
    authorName: context.customerName,
    authorHandle: context.customerHandle,
    choices: [],
    threadReplies: [],
    source: 'fallback',
    ...template,
  };
}

function parseDrama(value: unknown, context: DramaRequest): SocialDrama | undefined {
  if (!value || typeof value !== 'object') return;
  const drama = value as Record<string, unknown>;
  if (typeof drama.title !== 'string' || typeof drama.post !== 'string' || !Array.isArray(drama.comments)) return;
  if (!/(^|[\s“"'(])(mình|tôi)(?=$|[\s,.!?…”"')])/iu.test(drama.post)) return;
  return {
    id: `drama-${context.day}-${Date.now().toString(36)}`,
    day: context.day,
    title: drama.title.slice(0, 100),
    post: drama.post.slice(0, 500),
    authorName: typeof drama.authorName === 'string' ? drama.authorName.slice(0, 50) : context.customerName,
    authorHandle: typeof drama.authorHandle === 'string' ? drama.authorHandle.slice(0, 50) : context.customerHandle,
    comments: drama.comments.filter((comment): comment is string => typeof comment === 'string').slice(0, 5).map(comment => comment.slice(0, 180)),
    choices: [],
    threadReplies: [],
    source: 'ai',
  };
}

export async function requestSocialDrama(context: DramaRequest): Promise<SocialDrama> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch('/api/drama', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(context),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.warn(`Drama AI unavailable (${response.status})`, detail.slice(0, 300));
      throw new Error(`Drama API ${response.status}`);
    }
    return parseDrama(await response.json(), context) ?? fallbackDrama(context);
  } catch (error) {
    console.warn('Using fallback drama because the AI request failed', error);
    return fallbackDrama(context);
  } finally {
    window.clearTimeout(timeout);
  }
}

export function fallbackReplyEvaluation(reply: string): DramaReplyEvaluation {
  const normalized = reply.toLocaleLowerCase('vi-VN');
  const sassyWords = ['vãi', 'vl', 'vcl', 'quần què', 'mẹ', 'ảo giác', 'nghiệp', 'mỏ', 'cà khịa', 'khịa', 'cút', 'đéo', 'éo'];
  const businessWords = ['xin lỗi', 'cảm ơn', 'kiểm tra', 'hỗ trợ', 'ngân sách', 'chính sách', 'cam kết', 'phản hồi'];
  const tone: DramaResponseTone = sassyWords.some(word => normalized.includes(word))
    ? 'sassy'
    : businessWords.some(word => normalized.includes(word)) ? 'business' : 'cute';
  const communityText = tone === 'sassy'
    ? 'Ơ kìa shop, nói nghe căng mà hợp lý quá nên tui chưa cãi tiếp được nha 😭'
    : tone === 'business'
      ? 'Shop phản hồi rõ ràng vậy là ổn nè, mong lần tới trải nghiệm sẽ mượt hơn nha.'
      : 'Shop trả lời dễ thương quá, thôi cho một tim rồi mình hóng tiếp vậy 💗';
  const authors = [
    { communityAuthorName: 'Mê Bông', communityAuthorHandle: '@me_bong' },
    { communityAuthorName: 'Hân Mood', communityAuthorHandle: '@han_mood' },
    { communityAuthorName: 'Lemon Tea', communityAuthorHandle: '@lemontea' },
  ];
  const author = authors[hash(reply) % authors.length];
  return { tone, ...author, communityText, source: 'fallback' };
}

export async function requestDramaReplyEvaluation(drama: Pick<SocialDrama, 'title' | 'post' | 'comments' | 'threadReplies'>, reply: string): Promise<DramaReplyEvaluation> {
  const fallback = fallbackReplyEvaluation(reply);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch('/api/drama-reply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: drama.title,
        post: drama.post,
        comments: drama.comments.slice(0, 5),
        thread: (Array.isArray(drama.threadReplies) ? drama.threadReplies : []).slice(-8).map(item => ({
          shopText: item.shopText,
          communityAuthorHandle: item.communityAuthorHandle,
          communityText: item.communityText,
        })),
        reply: reply.slice(0, 180),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return fallback;
    const value = await response.json() as Record<string, unknown>;
    if (!['cute', 'sassy', 'business'].includes(String(value.tone)) || typeof value.communityAuthorName !== 'string'
      || typeof value.communityAuthorHandle !== 'string' || typeof value.communityText !== 'string') return fallback;
    return {
      tone: value.tone as DramaResponseTone,
      communityAuthorName: value.communityAuthorName.slice(0, 50),
      communityAuthorHandle: value.communityAuthorHandle.slice(0, 50),
      communityText: value.communityText.slice(0, 220),
      source: 'ai',
    };
  } catch {
    return fallback;
  } finally {
    window.clearTimeout(timeout);
  }
}
