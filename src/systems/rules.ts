import { compatible, customers, dailyEvents, furniture, products, trends } from '../data/catalog';
import type { Customer, CustomerLoyalty, CustomerVisit, Furniture, GameState, LoyaltyTier, PlacedFurniture, Product, Style } from '../types';
import { lookupCustomer } from './customerGen';

export const currentTrend = (state: GameState) => trends[(state.day - 1) % trends.length];
export const currentEvent = (state: GameState) => {
  if (state.day <= 1 || dailyEvents.length <= 1) return dailyEvents[0];
  return dailyEvents[1 + (state.day - 2) % (dailyEvents.length - 1)];
};
const supplierFactor = (state: GameState) => state.activeSupplierId === 'global' ? .88 : state.activeSupplierId === 'wholesale' ? .95 : 1;
export const buyPrice = (state: GameState, product: Product) => Math.round(product.buyPrice * currentEvent(state).discount * supplierFactor(state));
export const sellPrice = (state: GameState, product: Product) => state.prices[product.id] ?? product.sellPrice;

export const productStyles = (product: Product) => [product.style, ...(product.secondaryStyles ?? [])];
const matchesTrendStyle = (product: Product, trend: (typeof trends)[number]) =>
  productStyles(product).some(style => trend.styles.includes(style));
const matchesTrend = (product: Product, trend: (typeof trends)[number]) =>
  matchesTrendStyle(product, trend) || trend.colors.includes(product.colorName);
export const isTrending = (state: GameState, product: Product) => matchesTrend(product, currentTrend(state));
export const previousTrend = (state: GameState) => state.day > 1
  ? trends[(state.day - 2) % trends.length]
  : undefined;
export const isOutOfTrend = (state: GameState, product: Product) => {
  const previous = previousTrend(state);
  // A colour alone should not make a whole shelf obsolete. Out-trend status is
  // reserved for products whose actual style belonged to yesterday's trend.
  return !!previous && !isTrending(state, product) && matchesTrendStyle(product, previous);
};
export function decorAppealScore(state: GameState): number {
  return state.layout.reduce((sum, p) => {
    const f = furniture.find(item => item.id === p.id);
    return sum + (f?.appeal ?? 0);
  }, 0);
}

export function displayedInventory(state: GameState): Record<string, number> {
  const result: Record<string, number> = {};
  for (const placed of state.layout) for (const id of placed.displayItems ?? []) {
    result[id] = (result[id] ?? 0) + 1;
  }
  for (const id of Object.keys(result)) result[id] = Math.min(result[id], state.inventory[id] ?? 0);
  return result;
}

export function displayedQuantity(state: GameState, productId: string): number {
  return displayedInventory(state)[productId] ?? 0;
}

export function displayLevel(fixture: Furniture, placed: PlacedFurniture): number {
  const upgrade = fixture.display?.upgrade;
  if (!upgrade) return 0;
  return Math.max(0, Math.min(upgrade.maxLevel, Math.floor(placed.displayLevel ?? 0)));
}

export function displayCapacity(fixture: Furniture, placed: PlacedFurniture): number {
  if (!fixture.display) return 0;
  const upgrade = fixture.display.upgrade;
  return fixture.display.capacity + (upgrade ? displayLevel(fixture, placed) * upgrade.slotsPerLevel : 0);
}

export function displayUpgradeCost(fixture: Furniture, placed: PlacedFurniture): number | undefined {
  const upgrade = fixture.display?.upgrade;
  if (!upgrade || displayLevel(fixture, placed) >= upgrade.maxLevel) return undefined;
  return upgrade.baseCost * (displayLevel(fixture, placed) + 1);
}
// Traffic affects the idle interval, never the number of visits allowed per day.
const customerTraffic = (state: GameState) => Math.max(2, Math.min(14,
  3 + Math.floor(state.level * .7) + Math.min(6, Math.floor(decorAppealScore(state) / 4)) + landExpansion[landTier(state)].traffic + currentEvent(state).extra));
export const DAY_DURATION = 180;
export const MAX_DAY_DURATION = 300;
export function dayDuration(state: Pick<GameState, 'level' | 'landLevel'>) {
  const matchedLevel = Math.min(Math.max(1, state.level), Math.max(1, Math.floor(state.landLevel ?? 0) + 1));
  return Math.min(MAX_DAY_DURATION, DAY_DURATION + (matchedLevel - 1) * 30);
}
export const landExpansion = [
  { size: 7, cost: 0, rent: 0, traffic: 0 },
  { size: 8, cost: 350000, rent: 30000, traffic: 2 },
  { size: 9, cost: 800000, rent: 65000, traffic: 4 },
  { size: 10, cost: 1500000, rent: 110000, traffic: 5 },
  { size: 11, cost: 2500000, rent: 165000, traffic: 6 },
  { size: 12, cost: 3700000, rent: 230000, traffic: 7 },
  { size: 13, cost: 5200000, rent: 305000, traffic: 8 },
  { size: 14, cost: 7000000, rent: 390000, traffic: 9 },
  { size: 15, cost: 9200000, rent: 490000, traffic: 10 },
  { size: 16, cost: 12000000, rent: 610000, traffic: 11 },
] as const;
export const shopLevelRent = [50000, 90000, 140000, 200000, 280000, 380000, 500000, 640000, 810000, 1000000] as const;
export function landTier(state: GameState) { return Math.max(0, Math.min(landExpansion.length - 1, Math.floor(state.landLevel ?? 0))); }
export function landSize(state: GameState) { return landExpansion[landTier(state)].size; }
export function nextLandExpansion(state: GameState) { return landExpansion[landTier(state) + 1]; }
export function landRent(state: GameState) { return landExpansion[landTier(state)].rent; }
export function dailyRent(state: GameState) { return shopLevelRent[Math.max(0, Math.min(shopLevelRent.length - 1, state.level - 1))] + landRent(state); }
export function staffCapacity(state: GameState) {
  // Nhân viên chỉ được mở khóa khi boutique đã đạt mặt bằng cấp 3.
  const byLand = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8][landTier(state)] ?? 0;
  const byLevel = state.level < 3 ? 0 : 1 + Math.floor((state.level - 3) / 2);
  return Math.min(byLand, byLevel);
}
export const STAFF_SALARY_MIN = 60000;
export const STAFF_SALARY_MAX = 400000;
export const STAFF_SALARY_DEFAULT = 100000;
export const STAFF_RECRUITMENT_FEE = 30000;
export function nextStaffRequirement(state: GameState) {
  return { level: 3, landLevel: 2 };
}
export function activeEmployees(state: GameState) {
  return state.employees.filter(employee => (!employee.leaveUntilDay || employee.leaveUntilDay <= state.day)
    && (employee.assignment ?? 'service') !== 'off' && (employee.energy ?? 100) >= 15)
    .slice(0, staffCapacity(state));
}
export function staffAdviceBonus(state: GameState) {
  const staff = activeEmployees(state);
  if (!staff.length) return 0;
  const best = Math.max(...staff.map(employee => employee.service * .06 + employee.persuasion * .09));
  return Math.max(2, Math.min(14, Math.round(best)));
}
export const advicePatience = (customer: Customer, level = 1) => Math.max(55, Math.min(90, Math.round(customer.patience * .5))) + (Math.max(1, Math.min(7, Math.floor(level))) - 1) * 5;
export function activeVisit(state: GameState): CustomerVisit | undefined {
  if (state.phase !== 'open') return;
  return state.activeVisits.find(visit => visit.uid === state.currentVisitId)
    ?? state.activeVisits.find(visit => visit.customerId === state.currentCustomerId);
}
export function activeCustomer(state: GameState): Customer | undefined {
  if (state.phase !== 'open') return;
  const customerId = activeVisit(state)?.customerId ?? state.currentCustomerId;
  if (!customerId) return;
  // Thử tìm trong static pool trước
  const staticMatch = customers.find(c => c.id === customerId);
  if (staticMatch) return staticMatch;
  // Fallback: tìm trong runtime registry (generated customers)
  return lookupCustomer(customerId);
}
export function customerNeedsAdvice(state: GameState, customer: Customer): boolean {
  const visit = activeVisit(state);
  if (state.currentCustomerId === customer.id && state.customerMode) return state.customerMode === 'advice';
  return visit ? visit.customerId === customer.id && visit.mode === 'advice' : false;
}
export function arrivalDelay(state: GameState, random: () => number): number {
  // Đầu game khoảng 19–35 giây giữa hai lượt; shop phát triển sẽ đông dần
  // nhưng vẫn luôn có nhịp nghỉ để người chơi kịp xử lý khách đang chờ.
  const crisisPenalty = state.reputationCrisis ? 7 : 0;
  return Math.max(10, Math.round(26 + random() * 16 - customerTraffic(state) + crisisPenalty));
}

/** EXP tăng theo quy mô đơn, nhưng có trần để đơn lớn không đẩy cấp quá nhanh. */
export function saleXp(itemCount: number, viral: boolean, assisted: boolean): number {
  const items = Math.max(1, Math.min(5, Math.floor(itemCount)));
  return 6 + items * 3 + (assisted ? 3 : 0) + (viral ? 12 : 0);
}
export function randomBrowseThought(state: GameState, customer: Customer): string {
  const decor = decorAppealScore(state);
  if (decor < 6) {
    const poor = [
      'Quán hơi vắng vẻ nhỉ...',
      'Tiệm ít đồ trang trí quá ta...',
      'Nhìn quanh chưa thấy món nào bắt mắt...',
    ];
    return poor[Math.floor(Math.random() * poor.length)];
  }
  const thoughts = [
    'Quán decor xinh xắn quá nè~',
    'Nhạc quán chill ghê á...',
    'Chiếc gương này chụp ảnh sống ảo đỉnh thật!',
    'Không gian ở đây thơm và dễ thương ghê',
    'Để xem hôm nay tiệm có mẫu gì mới...',
    'Tone màu quán hợp gu mình quá',
  ];
  return thoughts[(state.customerIndex + state.day) % thoughts.length];
}
export function evaluateCustomerSelfPick(state: GameState, customer: Customer): {
  success: boolean;
  items: Product[];
  score: number;
  total: number;
  speech: string;
} {
  const available = Object.entries(displayedInventory(state))
    .filter(([_, qty]) => qty > 0)
    .map(([id]) => products.find(p => p.id === id))
    .filter((p): p is Product => !!p);

  if (!available.length) {
    return {
      success: false,
      items: [],
      score: 0,
      total: 0,
      speech: 'Tiệm hết hàng mất rồi, chẳng còn gì để chọn...',
    };
  }

  // Chấm điểm từng món trong kho xem món nào hợp gu khách nhất
  let bestItem: Product | undefined;
  let bestScore = -1;

  for (const item of available) {
    const price = sellPrice(state, item);
    if (price > customer.budget) continue; // Vượt túi tiền thì bỏ qua
    const score = matchScore(state, customer, [item]);
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  const thresh = threshold(customer);
  if (bestItem && bestScore >= thresh - 4) {
    const items = [bestItem];
    let total = sellPrice(state, bestItem);

    // Nếu còn dư nhiều tiền trong ngân sách, thử nhặt thêm 1 phụ kiện hoặc túi xách hợp gu
    const remainingBudget = customer.budget - total;
    if (remainingBudget >= 40000) {
      const extraAcc = available.find(p =>
        (p.category === 'accessories' || p.category === 'bags') &&
        p.id !== bestItem!.id &&
        validOutfit([bestItem!.id, p.id]) &&
        matchScore(state, customer, [bestItem!, p]) >= thresh - 4 &&
        sellPrice(state, p) <= remainingBudget &&
        (productStyles(p).some((st: Style) => customer.styles.includes(st)) || customer.colors.includes(p.colorName))
      );
      if (extraAcc) {
        items.push(extraAcc);
        total += sellPrice(state, extraAcc);
      }
    }

    let speech = 'Xinh quá, mình chốt mua bộ này nhé!';
    if (bestScore >= 85) speech = 'Chốt luôn em này, đúng gu xinh xỉu!';
    else if (isTrending(state, bestItem)) speech = 'Món này đang hot trend nè, lấy cho mình nha!';
    else if (customer.colors.includes(bestItem.colorName)) speech = `Tone màu ${bestItem.colorName} này tôn da mình thật, mình lấy nhé!`;

    return {
      success: true,
      items,
      score: matchScore(state, customer, items),
      total,
      speech,
    };
  }

  // Khách không tìm được món đồ ưng ý
  const affordable = available.some(p => sellPrice(state, p) <= customer.budget);
  let speech = 'Chưa tìm được đồ hợp gu, hẹn shop lần sau nhé!';
  if (!affordable) {
    speech = 'Đắt quá, toàn vượt ngân sách của mình thôi...';
  } else {
    speech = 'Mấy mẫu này hơi khác phong cách mình đang tìm rồi...';
  }

  return {
    success: false,
    items: [],
    score: bestScore > 0 ? bestScore : 20,
    total: 0,
    speech,
  };
}
export function matchScore(state: GameState, customer: Customer, items: Product[]) {
  if (!items.length) return 0;
  const price = items.reduce((sum, item) => sum + sellPrice(state, item), 0);
  if (price > customer.budget) return 0;
  const appeal = Math.min(12, decorAppealScore(state) / 2.5);
  const value = items.reduce((sum, item) => {
    const styles = productStyles(item);
    const style = styles.some(s => customer.styles.includes(s)) ? 38 : customer.styles.some(s => styles.some(itemStyle => compatible[s]?.includes(itemStyle))) ? 22 : 0;
    const color = customer.colors.includes(item.colorName) ? 14 : 0;
    const outOfTrend = isOutOfTrend(state, item);
    const markdown = Math.max(0, 1 - sellPrice(state, item) / item.sellPrice);
    const clearanceRecovery = outOfTrend ? Math.min(8, markdown * 30) : 0;
    const trend = isTrending(state, item)
      ? (customer.personality === 'Trend hunter' ? 24 : 12)
      : outOfTrend
        ? (customer.personality === 'Trend hunter' ? -18 : -10) + clearanceRecovery
        : 0;
    const markup = Math.max(0, sellPrice(state, item) / item.sellPrice - 1) * 65;
    const bargain = customer.personality === 'Thợ săn giá tốt' && sellPrice(state, item) > item.sellPrice ? 12 : 0;
    const occasion = customer.occasion && item.occasions.includes(customer.occasion) ? 6 : 0;
    const category = customer.preferredCategories?.length ? customer.preferredCategories.includes(item.category) ? 8 : -8 : 0;
    return sum + 15 + style + color + trend + occasion + category + item.quality * .14 + appeal - markup - bargain;
  }, 0) / items.length;
  const trustBonus = loyaltyTierIndex(loyaltyTier(state.customerLoyalty[customer.id])) * 2;
  return Math.max(0, Math.min(100, Math.round(value + trustBonus)));
}
export function threshold(customer: Customer) { return customer.personality === 'Khách kỹ tính' || customer.personality === 'VIP' ? 73 : 59; }
export const loyaltyMilestones = [
  { points: 0, tier: 'Khách mới' as LoyaltyTier, rewardMoney: 0, rewardFollowers: 0 },
  { points: 25, tier: 'Khách quen' as LoyaltyTier, rewardMoney: 25000, rewardFollowers: 0 },
  { points: 60, tier: 'Thân thiết' as LoyaltyTier, rewardMoney: 50000, rewardFollowers: 10 },
  { points: 120, tier: 'VIP' as LoyaltyTier, rewardMoney: 100000, rewardFollowers: 30 },
];
export const LOAN_MIN = 300000;
export const LOAN_MAX = 10000000;
export const LOAN_DAILY_RATE = .015;
export const LOAN_PAYMENT_RATE = .05;
export function loyaltyTier(relation?: CustomerLoyalty): LoyaltyTier {
  const points = relation?.points ?? 0;
  return [...loyaltyMilestones].reverse().find(milestone => points >= milestone.points)!.tier;
}
export function loyaltyTierIndex(tier: LoyaltyTier) {
  return loyaltyMilestones.findIndex(milestone => milestone.tier === tier);
}
export function loyaltyPatienceBonus(state: GameState, customerId: string) {
  return loyaltyTierIndex(loyaltyTier(state.customerLoyalty[customerId])) * 5;
}
const wallFurnitureIds = new Set(['boutique-window', 'blush-blinds', 'shop-sign', 'fashion-print', 'gallery-print', 'botanical-print', 'runway-print', 'parfum-print', 'shoe-sketch-print', 'ribbon-sign', 'neon-sign', 'lightbox-sign']);
export const isWallFurnitureId = (id: string) => wallFurnitureIds.has(id);
const rugFurnitureIds = new Set(['atelier-rug', 'heart-rug', 'checkered-rug']);
export const isRugFurnitureId = (id: string) => rugFurnitureIds.has(id);
export const MAX_PLACED_FURNITURE = 30;
export function canPlace(layout: PlacedFurniture[], item: PlacedFurniture, landLevel = 0) {
  const def = furniture.find(f => f.id === item.id);
  if (!def || !Number.isInteger(item.x) || !Number.isInteger(item.y)) return false;
  const w = item.rotation % 2 ? def.height : def.width;
  const h = item.rotation % 2 ? def.width : def.height;
  const size = landExpansion[Math.max(0, Math.min(landExpansion.length - 1, Math.floor(landLevel)))].size;
  if (item.x < 0 || item.y < 0 || item.x + w > size || item.y + h > size) return false;
  if (isRugFurnitureId(item.id)) return true;
  // Wall decorations use rotation to choose a wall: 0 = right wall, 1 = left wall.
  if (isWallFurnitureId(item.id) && !((item.rotation === 0 && item.y === 0) || (item.rotation === 1 && item.x === 0))) return false;
  // Reserve only the actual doorway at the front corner. Customers choose a
  // free arrival point inside the room, so an otherwise empty middle tile
  // must remain usable for furniture.
  const entranceEdge = size - 2;
  if (item.x + w > entranceEdge && item.y + h > entranceEdge) return false;
  return !layout.some(other => {
    if (other.uid === item.uid) return false;
    const d = furniture.find(f => f.id === other.id)!;
    const ow = other.rotation % 2 ? d.height : d.width, oh = other.rotation % 2 ? d.width : d.height;
    if (isRugFurnitureId(other.id)) return false;
    const itemWall = isWallFurnitureId(item.id), otherWall = isWallFurnitureId(other.id);
    if (itemWall || otherWall) {
      if (!itemWall || !otherWall || item.rotation !== other.rotation) return false;
      return item.rotation === 0
        ? item.x < other.x + ow && item.x + w > other.x
        : item.y < other.y + oh && item.y + h > other.y;
    }
    return item.x < other.x + ow && item.x + w > other.x && item.y < other.y + oh && item.y + h > other.y;
  });
}
export const MAX_OUTFIT_ITEMS = 5;
export function validOutfit(ids: string[]) {
  const items = ids.map(id => products.find(p => p.id === id)).filter((p): p is Product => !!p);
  if (!ids.length || items.length !== ids.length || new Set(ids).size !== ids.length || items.length > MAX_OUTFIT_ITEMS) return false;
  const cats = items.map(p => p.category);
  if (new Set(cats).size !== cats.length) return false;
  if (cats.includes('sets') && (cats.includes('tops') || cats.includes('bottoms') || cats.includes('dresses'))) return false;
  return !(cats.includes('dresses') && (cats.includes('tops') || cats.includes('bottoms')));
}

export function smartOutfitSelection(currentIds: string[], nextId: string): { next: string[]; replaced: string[] } {
  // Bỏ chọn nếu món đồ này đã được mặc
  if (currentIds.includes(nextId)) {
    return { next: currentIds.filter(id => id !== nextId), replaced: [] };
  }

  const newProd = products.find(p => p.id === nextId);
  if (!newProd) {
    return { next: currentIds, replaced: [] };
  }

  // Tìm các món đang mặc bị xung đột phân loại với món mới
  const conflicts: string[] = [];

  for (const oldId of currentIds) {
    const oldProd = products.find(p => p.id === oldId);
    if (!oldProd) continue;

    // 1. Trùng phân loại trực tiếp (áo đổi áo, quần đổi quần, giày đổi giày, ...)
    if (oldProd.category === newProd.category) {
      conflicts.push(oldId);
      continue;
    }

    // 2. Set trang phục xung đột với áo, quần, đầm
    if (newProd.category === 'sets' && ['tops', 'bottoms', 'dresses'].includes(oldProd.category)) {
      conflicts.push(oldId);
      continue;
    }
    if (oldProd.category === 'sets' && ['tops', 'bottoms', 'dresses'].includes(newProd.category)) {
      conflicts.push(oldId);
      continue;
    }

    // 3. Đầm xung đột với áo và quần
    if (newProd.category === 'dresses' && ['tops', 'bottoms'].includes(oldProd.category)) {
      conflicts.push(oldId);
      continue;
    }
    if (oldProd.category === 'dresses' && ['tops', 'bottoms'].includes(newProd.category)) {
      conflicts.push(oldId);
      continue;
    }
  }

  // Gỡ các món xung đột
  let next = currentIds.filter(id => !conflicts.includes(id));

  // Giới hạn số lượng tối đa nếu vượt quá
  if (next.length >= MAX_OUTFIT_ITEMS) {
    const overflowItem = next[0];
    conflicts.push(overflowItem);
    next = next.slice(1);
  }

  next.push(nextId);

  return { next, replaced: conflicts };
}

/** Demand for one listing: good quality, sensible pricing and current trends convert better. */
export function onlineProductDemandWeight(s: GameState, product: Product) {
  const price = s.prices[product.id] ?? product.sellPrice;
  const priceRatio = price / Math.max(1, product.sellPrice);
  const priceFactor = Math.max(.08, Math.min(1.22, 1.16 - Math.max(0, priceRatio - .85) * 1.65));
  const qualityFactor = .55 + Math.max(0, Math.min(100, product.quality)) / 220;
  const trendFactor = isTrending(s, product) ? 1.16 : isOutOfTrend(s, product) ? .78 : 1;
  return Math.max(.04, priceFactor * qualityFactor * trendFactor);
}

/** Chance for one online demand check to become an order (checks happen every 7–14 game seconds). */
export function onlineOrderChance(s: GameState, availableProductIds: string[] = s.onlineListings) {
  const available = availableProductIds
    .map(id => products.find(product => product.id === id))
    .filter((product): product is Product => !!product);
  if (!available.length) return 0;

  // A displayed 5.0 with no reviews still needs proof, but a new channel now
  // gets a modest discovery boost so its first orders are difficult rather
  // than vanishingly rare.
  const priorReviews = 5;
  const trustedRating = (s.onlineRating * s.onlineReviews + 3.3 * priorReviews) / (s.onlineReviews + priorReviews);
  const ratingTrust = Math.pow(Math.max(.02, Math.min(1, (trustedRating - 2.4) / 2.3)), 1.25);
  const reviewConfidence = .32 + .68 * Math.min(1, s.onlineReviews / 22);
  const shopTrust = Math.pow(Math.max(.03, Math.min(1, (s.reputation - 2.8) / 2.2)), 1.1);
  const recognition = Math.max(.03, Math.min(1, Math.log10(s.followers + 1) / Math.log10(1001)));
  const assortment = .44 + .56 * Math.min(1, available.length / 7);
  const offerQuality = available.reduce((sum, product) => sum + onlineProductDemandWeight(s, product), 0) / available.length;
  const deliveryHistory = Math.min(.18, s.onlineSales * .004) * ratingTrust;
  return Math.max(0, Math.min(.78, .0025 + shopTrust * recognition * ratingTrust * reviewConfidence * assortment * offerQuality * .82 + deliveryHistory));
}
