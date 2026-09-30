/**
 * customerGen.ts
 * Thuật toán sinh khách hàng đa dạng (procedural generation)
 */

import type { Customer, Occasion, Style, Category } from '../types';

// Seeded PRNG (xorshift32)
function seededRand(seed: number) {
  return function (): number {
    seed = (seed ^ (seed << 13)) >>> 0;
    seed = (seed ^ (seed >>> 17)) >>> 0;
    seed = (seed ^ (seed << 5)) >>> 0;
    return seed / 0xffffffff;
  };
}
function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}
function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

const NAMES_FEMALE = [
  'An Nhiên', 'Ánh', 'Bảo Anh', 'Bích Ngọc', 'Chi', 'Diệu Anh', 'Diệu Linh', 'Giang', 'Hà My', 'Gia Hân',
  'Hoa', 'Huyền', 'Khánh Linh', 'Lan', 'Linh Chi', 'Mai Anh', 'Mai', 'Mây', 'Mi', 'Minh Châu',
  'Mỹ Anh', 'Nga', 'Ngân', 'Ngọc Anh', 'Nhi', 'Như', 'Phương Anh', 'Quỳnh Anh', 'Thanh Trúc', 'Thảo Nhi',
  'Thu Hà', 'Thư', 'Trang', 'Trinh', 'Tú Anh', 'Tuệ Nhi', 'Uyên', 'Vân Anh', 'Vi An', 'Yến Vy',
  'Yến', 'Ý', 'Zoe', 'Mia', 'Rina', 'Elle', 'Chloe', 'Nari', 'Luna', 'Nova',
  'Iris', 'Aria', 'Lena', 'Nora', 'Mila', 'Sora', 'Yuna', 'Hana', 'Remi', 'Vivi',
];

const HANDLE_ADJECTIVES = [
  'sweet', 'soft', 'daily', 'dream', 'latte', 'pastel', 'hazy', 'wild', 'chill',
  'bloom', 'cloud', 'neon', 'vibes', 'cute', 'arch', 'edit', 'note', 'diary',
  'lazy', 'golden', 'silver', 'cozy', 'fresh', 'bright', 'calm', 'serene', 'breezy',
  'days', 'mode', 'world', 'store', 'look', 'fits', 'style', 'feels', 'moves',
];

const SKIN_TONES = [
  '#fff0e6', '#fce8d4', '#f5d5b0', '#edc8ad', '#e0b68e', '#d4a079', '#c89370',
  '#b88568', '#a87050', '#9b6c51', '#8b5d43', '#7a4f38', '#6b3e2c', '#5a3020',
];
const HAIR_COLORS = [
  '#1a1008', '#2c1a0e', '#3d2b1f', '#4e3c35', '#5b4239', '#6e4f3e', '#7a5c4a',
  '#8b6b55', '#9b7a62', '#a88c74', '#b8a090', '#c8b4a0',
  '#ff7aa8', '#f43f5e', '#c084fc', '#a78bfa', '#818cf8', '#60a5fa', '#34d399',
  '#fcd34d', '#fb923c', '#e879f9', '#38bdf8', '#f0abfc',
  '#38343d', '#403b37', '#453631', '#342c38', '#1e1b2e', '#0f172a',
];

const OUTFIT_COLORS: Record<string, string[]> = {
  'Hồng':    ['#f9a8d4', '#fda4af', '#fb7185', '#ec4899', '#fbcfe8'],
  'Tím':     ['#c084fc', '#a78bfa', '#ddd6fe', '#8b5cf6', '#e9d5ff'],
  'Xanh':    ['#93c5fd', '#60a5fa', '#bfdbfe', '#3b82f6', '#dbeafe'],
  'Xanh lá': ['#6ee7b7', '#a7f3d0', '#34d399', '#10b981', '#d1fae5'],
  'Vàng':    ['#fcd34d', '#fbbf24', '#fef3c7', '#f59e0b', '#fef9c3'],
  'Nâu':     ['#d9c0a3', '#c59e82', '#a67c61', '#8b6040', '#e5d0bb'],
  'Đen':     ['#374151', '#1f2937', '#111827', '#4b5563', '#6b7280'],
  'Kem':     ['#f5f0e8', '#fef9ef', '#fff8f0', '#f0e8d8', '#ede3d3'],
  'Bạc':     ['#d1d5db', '#e5e7eb', '#9ca3af', '#c0c8d0', '#b8c0cc'],
};

interface PersonalityTemplate {
  personality: string;
  gender: 'female' | 'male' | 'any';
  styles: Style[][];
  preferredColors: string[][];
  budgetRange: [number, number];
  patienceRange: [number, number];
  occasions: Occasion[];
  goals: string[];
  preferredCategories?: Category[][];
  minLevel: number;
  weight: number;
}

const TEMPLATES: PersonalityTemplate[] = [
  {
    personality: 'Cô nàng ngọt ngào', gender: 'female', weight: 4, minLevel: 1,
    styles: [['Coquette', 'Soft Girl'], ['Coquette', 'Balletcore'], ['Soft Girl', 'Balletcore', 'Coquette']],
    preferredColors: [['Hồng', 'Kem'], ['Hồng', 'Tím'], ['Hồng', 'Tím', 'Kem']],
    budgetRange: [280000, 580000], patienceRange: [120, 160],
    occasions: ['cafe', 'date'],
    goals: [
      'Mình đang tìm một set đồ dịu dàng có màu pastel, càng nhiều nơ càng tốt!',
      'Có đầm hoặc set đồ coquette nào xinh xỉu không ạ?',
      'Mình muốn tìm đồ đi café, tông hồng nhẹ nhàng.',
      'Một bộ outfit nhẹ nhàng dễ thương để đi dạo phố nha!',
      'Tìm món nào có bow detail hoặc màu cream xinh xinh đi!',
      'Đầm mini pastel hoặc set cô nàng dịu dàng là dream của mình!',
    ],
    preferredCategories: [['dresses', 'accessories'], ['tops', 'bags'], ['sets', 'shoes']],
  },
  {
    personality: 'Tín đồ Streetwear', gender: 'any', weight: 4, minLevel: 1,
    styles: [['Streetwear', 'Y2K'], ['Streetwear', 'Casual'], ['Streetwear', 'Casual', 'Y2K']],
    preferredColors: [['Xanh', 'Đen'], ['Xanh lá', 'Đen'], ['Bạc', 'Đen', 'Xanh']],
    budgetRange: [320000, 650000], patienceRange: [100, 140],
    occasions: ['city', 'concert', 'campus'],
    goals: [
      'Có áo oversized hoặc quần cargo nào ngầu không bạn?',
      'Tìm giúp mình outfit thả lỏng, vừa chất vừa thoải mái.',
      'Mình cần đồ đi dạo phố cuối tuần, phong cách street là okay!',
      'Một chiếc tee graphic hoặc hoodie cool cool cho mình nha.',
      'Muốn gì đó vừa casual vừa có edge, bạn chọn giúp.',
      'Sneaker với đồ coordinate matching, kiểu Y2K á.',
    ],
  },
  {
    personality: 'Trend hunter', gender: 'female', weight: 3, minLevel: 2,
    styles: [['Y2K', 'K-pop'], ['K-pop', 'Coquette'], ['Y2K', 'Soft Girl', 'K-pop']],
    preferredColors: [['Tím', 'Hồng'], ['Hồng', 'Bạc'], ['Tím', 'Kem', 'Bạc']],
    budgetRange: [400000, 750000], patienceRange: [110, 145],
    occasions: ['concert', 'date', 'city'],
    goals: [
      'Cho mình món đang hot nhất tháng này đi!',
      'Mình sắp quay video outfit, cần thứ gì đang viral nè.',
      'Concert cuối tuần! Outfit phải thật nổi bật ý.',
      'Có gì đang trend trên TikTok không? Mình cần tậu ngay.',
      'Ưu tiên mấy tone màu đang hot, style cũng phải on-trend.',
      'Mình follow trend rất sát, có gì mới nhất không?',
    ],
  },
  {
    personality: 'Clean Girl', gender: 'female', weight: 4, minLevel: 1,
    styles: [['Clean Girl', 'Minimal'], ['Minimal', 'Casual'], ['Clean Girl', 'Minimal', 'Preppy']],
    preferredColors: [['Kem', 'Nâu'], ['Bạc', 'Kem'], ['Xanh', 'Kem', 'Nâu']],
    budgetRange: [280000, 560000], patienceRange: [120, 150],
    occasions: ['cafe', 'campus', 'city'],
    goals: [
      'Mình thích phong cách đơn giản, thanh lịch. Không cần hoa hòe.',
      'Một outfit "less is more" thật tinh tế cho ngày đi học nha.',
      'Tông trung tính, phom gọn. That is me!',
      'Có gì clean, đẹp đơn giản mà vẫn trendy không?',
      'Mình cần đồ đi làm, nhẹ nhàng mà vẫn có gu.',
      'Minimal vibes thôi, không cần print hay logo to.',
    ],
    preferredCategories: [['tops', 'bottoms'], ['dresses'], ['sets', 'bags']],
  },
  {
    personality: 'Học giả cổ điển', gender: 'any', weight: 3, minLevel: 2,
    styles: [['Dark Academia', 'Preppy'], ['Vintage', 'Poetcore'], ['Dark Academia', 'Poetcore', 'Preppy']],
    preferredColors: [['Nâu', 'Kem'], ['Đen', 'Nâu'], ['Nâu', 'Kem', 'Đen']],
    budgetRange: [450000, 900000], patienceRange: [130, 165],
    occasions: ['campus', 'cafe', 'city'],
    goals: [
      'Tìm đồ mang cảm hứng thư viện, loafer nâu và túi da là chuẩn.',
      'Mình thích Vintage và Dark Academia, có gì hợp không?',
      'Một bộ đồ vừa học vừa đi café được, có gu một chút.',
      'Sơ mi kẻ hoặc áo len với chân váy midi thế nào nhỉ?',
      'Scholar chic nhưng không bị già. Bạn chọn giúp mình nha.',
      'Blazer hoặc cardigan với quần âu, kiểu intellectuelle á.',
    ],
  },
  {
    personality: 'Năng động', gender: 'any', weight: 3, minLevel: 1,
    styles: [['Sporty Chic', 'Casual'], ['Blokecore', 'Sporty Chic'], ['Gorpcore', 'Streetwear']],
    preferredColors: [['Xanh lá', 'Xanh'], ['Xanh', 'Bạc'], ['Xanh lá', 'Đen', 'Xanh']],
    budgetRange: [300000, 650000], patienceRange: [100, 140],
    occasions: ['active', 'city', 'campus'],
    goals: [
      'Mình hay đi gym, cần đồ vừa thể thao vừa mặc ra ngoài được.',
      'Có sneaker hoặc set sporty nào không? Mình sắp đi dã ngoại.',
      'Phong cách active nhưng vẫn stylish! Có gì hợp không?',
      'Sau buổi tập thì đi cà phê, cần đồ đa năng.',
      'Tìm giúp mình set năng động, màu tươi sáng nhé.',
      'Gorpcore hoặc sporty chic đều okay, miễn là thoải mái.',
    ],
    preferredCategories: [['shoes', 'bags'], ['tops', 'bottoms'], ['sets']],
  },
  {
    personality: 'Tự do phiêu lãng', gender: 'female', weight: 3, minLevel: 2,
    styles: [['Cottagecore', 'Boho'], ['Vintage', 'Boho'], ['Cottagecore', 'Soft Girl']],
    preferredColors: [['Vàng', 'Kem'], ['Nâu', 'Kem'], ['Vàng', 'Nâu', 'Kem']],
    budgetRange: [380000, 850000], patienceRange: [130, 170],
    occasions: ['travel', 'cafe', 'date'],
    goals: [
      'Mình sắp đi picnic, muốn đầm hoa nhẹ nhàng và túi crochet.',
      'Có gì mang hơi thở đồng quê, màu đất hoặc vàng nhạt không?',
      'Một bộ boho chic để đi du lịch bụi, thoải mái là quan trọng.',
      'Tìm giúp mình thứ gì vintage, florals, thật thơ mộng.',
      'Có đầm maxi hoặc chân váy tầng không? Picnic sáng mai rồi!',
      'Boho với túi đan cói và sandals, có không ạ?',
    ],
  },
  {
    personality: 'Influencer', gender: 'female', weight: 2, minLevel: 3,
    styles: [['Coquette', 'Y2K'], ['K-pop', 'Luxury'], ['Soft Girl', 'Coquette', 'Y2K']],
    preferredColors: [['Hồng', 'Bạc'], ['Tím', 'Hồng'], ['Kem', 'Hồng', 'Bạc']],
    budgetRange: [500000, 1200000], patienceRange: [130, 170],
    occasions: ['concert', 'party', 'date'],
    goals: [
      'Mình cần outfit viral cho video TikTok. Wow factor là yêu cầu!',
      'Cho mình cái gì thật photogenic. Feed Instagram cần thêm màu!',
      'Sắp collab với brand, cần look thật outstanding.',
      'Mình muốn một set đồ bước vào đâu cũng nổi bật nè.',
      'Có gì aesthetics, chụp ảnh đẹp không? Mình hay share outfit.',
      'Content tháng này cần đẹp hơn, kiếm đồ xịn xịn đi.',
    ],
  },
  {
    personality: 'Khách kỹ tính', gender: 'any', weight: 3, minLevel: 2,
    styles: [['Minimal', 'Preppy'], ['Luxury', 'Minimal'], ['Clean Girl', 'Preppy', 'Minimal']],
    preferredColors: [['Kem', 'Nâu'], ['Đen', 'Nâu'], ['Bạc', 'Kem', 'Nâu']],
    budgetRange: [600000, 1500000], patienceRange: [90, 130],
    occasions: ['cafe', 'city', 'date', 'campus'],
    goals: [
      'Mình rất khó chọn đồ. Cần thứ gì hoàn hảo mới mua.',
      'Chất liệu phải tốt, màu không được sặc sỡ, phom phải đẹp.',
      'Tinh tế là tiêu chí hàng đầu. Bạn tư vấn kỹ giúp mình nha.',
      'Mình không mua đồ bình thường. Chất lượng cao mới okay.',
      'Hàng phải xứng đáng với giá thì mình mới chốt.',
      'Đừng show đồ sale, mình quan tâm tới chất hơn giá.',
    ],
  },
  {
    personality: 'VIP', gender: 'any', weight: 1, minLevel: 4,
    styles: [['Luxury', 'Minimal'], ['Luxury', 'Preppy'], ['Luxury', 'K-pop', 'Minimal']],
    preferredColors: [['Đen', 'Bạc'], ['Kem', 'Nâu'], ['Đen', 'Kem', 'Bạc']],
    budgetRange: [1200000, 3500000], patienceRange: [140, 200],
    occasions: ['party', 'date', 'city'],
    goals: [
      'Mình cần đồ dự tiệc tối. Chỉ chấp nhận thứ thật chỉn chu.',
      'Dành thời gian là vốn quý của mình. Chọn đúng ngay lần đầu nhé.',
      'Muốn đầu tư một món đặc biệt, chất lượng phải luxury.',
      'Outfit đi gala cần chuẩn. Bạn hiểu gu mình chứ?',
      'Premium quality. Đừng show mình hàng bình thường.',
      'Một chiếc túi hoặc set dress xứng tầm, đừng tiếc tay.',
    ],
  },
  {
    personality: 'Thợ săn giá tốt', gender: 'any', weight: 4, minLevel: 1,
    styles: [['Casual', 'Minimal'], ['Streetwear', 'Casual'], ['Coquette', 'Casual', 'Minimal']],
    preferredColors: [['Kem', 'Xanh'], ['Nâu', 'Kem'], ['Xanh', 'Kem', 'Nâu']],
    budgetRange: [80000, 280000], patienceRange: [110, 150],
    occasions: ['cafe', 'campus', 'city'],
    goals: [
      'Mình có ngân sách khiêm tốn thôi, nhưng vẫn muốn đẹp!',
      'Giá tốt là yêu cầu hàng đầu. Nhưng không cần phải xấu nhé.',
      'Đang sale không? Mình hay tìm deal xịn lắm.',
      'Một món đơn giản, giá phải chăng, dễ phối là okay.',
      'Tìm cho mình thứ gì reasonable, không cần đắt.',
      'Budget hôm nay hạn chế, xem có gì cute mà ổn không?',
    ],
  },
  {
    personality: 'Gothic Chic', gender: 'female', weight: 2, minLevel: 2,
    styles: [['Grunge', 'Dark Academia'], ['Grunge', 'Y2K'], ['Dark Academia', 'Poetcore', 'Grunge']],
    preferredColors: [['Đen', 'Hồng'], ['Đen', 'Bạc'], ['Đen', 'Tím', 'Bạc']],
    budgetRange: [350000, 850000], patienceRange: [100, 140],
    occasions: ['concert', 'city', 'party'],
    goals: [
      'Mình thích dark aesthetic. Có gì đen, cá tính, edge một chút không?',
      'Grunge meets chic! Ribbon đen, platform shoes, đại loại vậy.',
      'Tìm đồ đi concert, phải ngầu nhưng vẫn có gu.',
      'Edgy nhưng feminine. Nghe khó nhưng mình tin bạn chọn được!',
      'Tông đen với chi tiết hoa hồng hoặc nơ là chuẩn gu mình.',
      'Gothic lite thôi, không cần quá heavy. Mix feminine với edge.',
    ],
  },
  {
    personality: 'Nhà sưu tầm', gender: 'female', weight: 2, minLevel: 3,
    styles: [['Vintage', 'Cottagecore'], ['Vintage', 'Boho'], ['Vintage', 'Coquette', 'Poetcore']],
    preferredColors: [['Vàng', 'Nâu'], ['Kem', 'Nâu'], ['Vàng', 'Kem', 'Hồng']],
    budgetRange: [500000, 1400000], patienceRange: [130, 175],
    occasions: ['cafe', 'city', 'travel'],
    goals: [
      'Mình đang sưu tầm đồ vintage. Có gì hiếm, đặc biệt không?',
      'Thích mấy kiểu floral retro hoặc linen tự nhiên.',
      'Đồ nào có thiết kế đặc sắc, khác biệt, mình rất muốn xem.',
      'Hàng vintage hoặc inspired-by-vintage đều okay với mình.',
      'Tìm giúp mình thứ gì có câu chuyện, không phải mass-market.',
      'Đầm 60s, sơ mi vintage wash hay set boho đều trong danh sách.',
    ],
  },
];

export interface GeneratedCustomerSeed {
  day: number;
  index: number;
  shopLevel: number;
}

export function generateCustomer(seed: GeneratedCustomerSeed): Customer {
  const rand = seededRand(seed.day * 1000 + seed.index * 137 + seed.shopLevel * 31 + 7919);

  // Chọn template phù hợp level và có weight
  const eligible = TEMPLATES.filter(t => t.minLevel <= seed.shopLevel);
  const weightedPool: PersonalityTemplate[] = [];
  for (const t of eligible) {
    for (let i = 0; i < t.weight; i++) weightedPool.push(t);
  }
  const template = pick(weightedPool, rand);

  // Boutique chỉ sinh khách nữ; template vẫn giữ trường gender để tương thích dữ liệu cũ.
  const name = pick(NAMES_FEMALE, rand);

  // Handle
  const handleAdj = pick(HANDLE_ADJECTIVES, rand);
  const handleBase = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd').replace(/[^a-z0-9]/g, '');
  const handle = `@${handleBase}.${handleAdj}`;

  // Styles
  const styleGroup = pick(template.styles, rand);
  const numStyles = Math.min(2 + Math.floor(rand() * 2), styleGroup.length);
  const styles = pickN(styleGroup, numStyles, rand) as Style[];

  // Colors
  const colors = pick(template.preferredColors, rand);

  // Budget với level multiplier
  const levelMult = 1 + (seed.shopLevel - 1) * 0.12;
  const [budMin, budMax] = template.budgetRange;
  const rawBudget = budMin + Math.floor(rand() * (budMax - budMin));
  const budget = Math.round(rawBudget * levelMult / 10000) * 10000;

  // Patience
  const [patMin, patMax] = template.patienceRange;
  const patience = patMin + Math.floor(rand() * (patMax - patMin));

  // Goal
  const goal = pick(template.goals, rand);

  // Occasion
  const occasion = pick(template.occasions, rand);

  // Preferred categories
  const preferredCategories = template.preferredCategories
    ? pick(template.preferredCategories, rand) as Category[]
    : undefined;

  // Skin
  const skinPool = [...SKIN_TONES.slice(0, 8), ...SKIN_TONES.slice(0, 3)];
  const skin = pick(skinPool, rand);

  // Hair
  const colorfulPersonalities = ['Trend hunter', 'Influencer', 'Gothic Chic'];
  const useColorfulHair = colorfulPersonalities.includes(template.personality) && rand() < 0.55;
  const hairPool = useColorfulHair ? HAIR_COLORS.slice(12, 24)
    : [...HAIR_COLORS.slice(0, 14), ...HAIR_COLORS.slice(12, 18)];
  const hair = pick(hairPool, rand);

  // Outfit color
  const mainColor = colors[0];
  const outfitPalette = OUTFIT_COLORS[mainColor] ?? OUTFIT_COLORS['Hồng'];
  const outfit = pick(outfitPalette, rand);

  // Hair style
  const hairStylePool = [0, 0, 1, 2, 0];
  const hairStyle = pick(hairStylePool, rand);

  const templateKey = template.personality.replace(/\s+/g, '_').toLowerCase();
  const id = `gen_${seed.day}_${seed.index}_${templateKey}`;

  return {
    id, name, handle, personality: template.personality,
    styles, colors, budget, patience, goal,
    skin, hair, outfit, hairStyle,
    occasion, preferredCategories,
    minLevel: template.minLevel,
  };
}

/**
 * Pre-generate danh sách khách cho 1 ngày
 * Đảm bảo không có 2 khách cùng personality liên tiếp
 */
export function generateDayCustomers(day: number, shopLevel: number, count: number): Customer[] {
  const result: Customer[] = [];
  let slot = 0;
  let attempts = 0;
  while (result.length < count && attempts < count * 8) {
    const candidate = generateCustomer({ day, index: slot * 17 + attempts, shopLevel });
    if (result.length === 0 || result[result.length - 1].personality !== candidate.personality) {
      result.push(candidate);
      slot++;
    }
    attempts++;
  }
  return result;
}

// ─── Global runtime registry cho generated customers ─────────────────────────
// Dùng để activeCustomer() trong rules.ts có thể tra cứu
const _runtimeCustomers = new Map<string, Customer>();

export function registerCustomer(c: Customer) {
  _runtimeCustomers.set(c.id, c);
}

export function lookupCustomer(id: string): Customer | undefined {
  let c = _runtimeCustomers.get(id);
  if (!c && id.startsWith('gen_')) {
    const parts = id.split('_');
    if (parts.length >= 3) {
      const day = parseInt(parts[1], 10);
      const index = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(index)) {
        c = generateCustomer({ day, index, shopLevel: 1 });
        _runtimeCustomers.set(id, c);
      }
    }
  }
  return c;
}

export function clearCustomerRegistry() {
  _runtimeCustomers.clear();
}
