import { customers, furniture, levels, products } from '../data/catalog';
import type { CustomProduct, Customer, DramaResponseTone, GameEvent, GameState, LegacyStoryChoice, LivestreamRequest, LivestreamRoundResult, LoyaltyTier, OnlineOrder, PendingMaterialOrder, PendingOrder, PlacedFurniture, Product, ProductDesignMotif, ProductDesignPoint, ProductDesignSticker, ProductDesignStroke, SaleResult, SocialDrama, StaffAssignment, StaffCandidate, StaffMember, Style, SupplierId } from '../types';
import { activeCustomer, activeEmployees, activeVisit, buyPrice, canPlace, advicePatience, arrivalDelay, currentEvent, customerNeedsAdvice, dailyRent, DAY_DURATION, dayDuration, displayCapacity, displayLevel, displayUpgradeCost, displayedInventory, displayedQuantity, evaluateCustomerSelfPick, isTrending, isWallFurnitureId, landExpansion, landSize, LOAN_DAILY_RATE, LOAN_MAX, LOAN_MIN, LOAN_PAYMENT_RATE, loyaltyMilestones, loyaltyPatienceBonus, loyaltyTier, matchScore, nextLandExpansion, nextStaffRequirement, onlineOrderChance, onlineProductDemandWeight, saleXp, sellPrice, staffAdviceBonus, staffCapacity, STAFF_RECRUITMENT_FEE, STAFF_SALARY_MAX, STAFF_SALARY_MIN, threshold, validOutfit } from './rules';
import { emptyStats, initialState, SaveSystem } from './save';
import { generateDayCustomers, registerCustomer } from './customerGen';
import { recordPublicShopReview, shopReviewStats } from './reviews';
import { CAMPAIGN_GUIDE_SEEN, campaignIsComplete, campaignOffers } from './campaigns';
import { createVipAppointment, crisisComplete, RETURN_EXCHANGE_SHIPPING_FEE, supplierFor, suppliers } from './operations';
import { gameDate } from './calendar';
import { ATELIER_PURCHASE_COST, ATELIER_RECIPE_CARD_COST, ATELIER_UNLOCK_LEVEL, atelierMaterials, atelierRecipeCost, atelierRecipes, clearRegisteredCustomProducts, registerCustomProduct, unregisterCustomProduct } from '../data/atelier';

const STAFF_NAMES = [
  'Mai An', 'Thảo Nhi', 'Gia Hân', 'Bảo Trân', 'Minh Châu', 'Khánh Linh', 'Yến Vy', 'Hà My', 'Ngọc Lam', 'Tú Anh',
  'An Nhiên', 'Ánh Dương', 'Bích Ngọc', 'Diệu Anh', 'Hạ Vy', 'Hoài An', 'Lan Chi', 'Linh Đan', 'Mai Chi', 'Mỹ Duyên',
  'Nhã Uyên', 'Phương Anh', 'Quỳnh Anh', 'Thanh Trúc', 'Thu Hà', 'Trâm Anh', 'Tuệ Nhi', 'Vân Anh', 'Yến Nhi', 'Kim Ngân',
  'Ngọc Anh', 'Hải Yến', 'Nhật Hạ', 'Thiên Kim', 'Kiều My', 'Lam Anh', 'Mộc Miên', 'Thùy Linh', 'Cẩm Tú', 'Tú Uyên',
  'Diễm Quỳnh', 'Gia Linh', 'Hương Giang', 'Khả Hân', 'Minh Anh', 'Ngọc Hân', 'Phương Linh', 'Quỳnh Chi', 'Thanh Mai', 'Thùy Dương',
  'Uyên Nhi', 'Xuân Nghi', 'Bảo Ngọc', 'Mai Phương', 'Khánh Vy', 'Như Ý', 'Tường Vi', 'Hoàng Yến', 'Đan Thy', 'Ái Linh',
] as const;

export class GameStore {
  state: GameState;
  private listeners = new Set<(event: GameEvent) => void>();
  readonly save: SaveSystem;
  /** Runtime cache: danh sách khách procedural cho ngày hiện tại */
  private dayCustomers: Customer[] = [];
  private dayCustomersKey = -1; // số ngày đã generate
  constructor(state?: GameState, save = new SaveSystem(), private random: () => number = Math.random) {
    this.save = save;
    this.state = state ?? save.load();
    // Hot-reloaded sessions and callers may still hold a pre-Boutique Buzz state.
    // Normalize it here so opening the social panel can never crash on old data.
    if (!Array.isArray(this.state.dramas)) this.state.dramas = [];
    this.state.dramaHeat = Number.isFinite(this.state.dramaHeat) ? this.state.dramaHeat : 12;
    this.state.dramaTrust = Number.isFinite(this.state.dramaTrust) ? this.state.dramaTrust : 70;
    if (!Number.isFinite(this.state.nextDramaDay)) {
      const latestDramaDay = this.state.dramas.reduce((latest, drama) => Math.max(latest, drama.day), 0);
      this.state.nextDramaDay = latestDramaDay ? latestDramaDay + 1 : this.state.day;
    }
    this.ensureDayCustomers();
  }
  subscribe(fn: (event: GameEvent) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  emit(event: GameEvent) { this.listeners.forEach(fn => fn(event)); }
  commit() { this.save.write(this.state); this.emit({ type: 'change' }); }
  toast(message: string, tone: 'success' | 'error' = 'success') { this.emit({ type: 'toast', message, tone }); }
  private syncFocusedVisit() {
    const visit = this.state.activeVisits.find(candidate => candidate.uid === this.state.currentVisitId) ?? this.state.activeVisits[0];
    this.state.currentVisitId = visit?.uid ?? null;
    this.state.currentCustomerId = visit?.customerId ?? null;
    this.state.customerMode = visit?.mode ?? null;
    this.state.patience = visit?.patience ?? 0;
  }
  private focusVisit(uid: string) {
    if (!this.state.activeVisits.some(visit => visit.uid === uid)) return false;
    this.state.currentVisitId = uid;
    this.syncFocusedVisit();
    return true;
  }
  focusCustomer(uid: string) {
    if (!this.focusVisit(uid)) return false;
    this.commit();
    this.emit({ type: 'customer', reason: 'focus' });
    return true;
  }

  private roundedStars(value: number) {
    return Math.max(1, Math.min(5, Math.round(value)));
  }

  private applyShopReview(stars: number, weight = 1) {
    const s = this.state;
    const cashierBonus = activeEmployees(s).some(employee => (employee.assignment ?? 'service') === 'cashier') ? .25 : 0;
    const normalized = this.roundedStars(stars + cashierBonus);
    const effectiveHistory = Math.max(10, s.reviews);
    const impact = weight * (normalized < 3 ? 1.2 : 1);
    s.reputation = Math.max(1, Math.min(5, (s.reputation * effectiveHistory + normalized * impact) / (effectiveHistory + impact)));
    s.reviews++;
    if (s.reputationCrisis && normalized >= 4) s.reputationCrisis.positiveReviews++;
    if (!s.reputationCrisis && s.level >= 3 && s.reviews >= 5 && s.reputation < 3.5) {
      s.reputationCrisis = { startDay: s.day, deadlineDay: s.day + 3, positiveReviews: 0, sales: 0, targetReviews: 3, targetSales: 8 };
      this.toast('Uy tín boutique đang gặp khủng hoảng. Hãy phục vụ 8 món và nhận 3 đánh giá tốt trong 4 ngày!', 'error');
    }
    return normalized;
  }

  private recordAdvancedSale(items: Product[], total: number, customerName: string) {
    const s = this.state;
    if (s.reputationCrisis) s.reputationCrisis.sales += items.length;
    if (s.level >= 3 && items.length && this.random() < .07 && s.returnCases.length < 4) {
      const item = items[Math.floor(this.random() * items.length)];
      s.returnCases.push({
        id: `return-${s.day}-${s.operationSequence++}`, productId: item.id, customerName,
        amount: sellPrice(s, item), reason: item.quality < 70 ? 'Sản phẩm có lỗi đường may' : 'Khách đổi ý sau khi thử tại nhà',
        availableDay: s.day + 1, deadlineDay: s.day + 3,
      });
    }
    void total;
  }

  private applyOnlineReview(stars: number, shopWeight = .55) {
    const s = this.state;
    const normalized = this.roundedStars(stars);
    s.onlineRating = s.onlineReviews
      ? Math.max(1, Math.min(5, (s.onlineRating * s.onlineReviews + normalized) / (s.onlineReviews + 1)))
      : normalized;
    s.onlineReviews++;
    this.applyShopReview(normalized, shopWeight);
    return normalized;
  }

  private inStoreReviewStars(score: number, total: number, customer: Customer, success: boolean, patienceRatio: number, assisted = false, selfPick = false) {
    if (!success) {
      return score < 35 && patienceRatio < .18 ? 2 : 3;
    }
    const priceRatio = customer.budget > 0 ? total / customer.budget : 1;
    let quality = score;
    if (priceRatio <= .72) quality += 4;
    if (priceRatio > .94) quality -= 4;
    if (patienceRatio >= .65) quality += 3;
    if (patienceRatio < .25) quality -= 10;
    if (assisted) quality += 4;
    else if (selfPick) quality += 2;
    if (quality >= 86) return 5;
    if (quality >= 58) return 4;
    if (quality >= 40) return 3;
    return 2;
  }

  private shouldPublishCustomerReview(stars: number, viral = false) {
    if (viral) return true;
    if (!shopReviewStats(this.state).count && stars >= 4) return true;
    const chance = stars === 5 ? .42 : stars === 4 ? .34 : stars === 3 ? .15 : stars === 2 ? .07 : .8;
    return this.random() < chance;
  }

  private publishCustomerReview(customer: Customer, stars: number, text: string, likes: number, viral = false, suffix = '') {
    const s = this.state;
    recordPublicShopReview(s, stars);
    s.posts.unshift({
      id: `${s.day}-${s.customerIndex}${suffix ? `-${suffix}` : ''}`,
      name: customer.name,
      handle: customer.handle,
      text,
      likes,
      day: s.day,
      viral,
      color: customer.outfit,
      reviewStars: stars,
      createdAt: Date.now(),
      channel: 'shop',
      avatar: { id: customer.id, skin: customer.skin, hair: customer.hair, outfit: customer.outfit, hairStyle: customer.hairStyle },
    });
    s.posts = s.posts.slice(0, 40);
  }

  private publishOnlineReview(order: OnlineOrder, stars: number, text: string, likes = 0) {
    const seed = Array.from(order.customerHandle).reduce((total, character) => total + character.charCodeAt(0), 0);
    const customer = customers.find(candidate => candidate.handle === order.customerHandle) ?? customers[seed % customers.length];
    this.state.posts.unshift({
      id: `${order.id}-review`,
      name: order.customerName,
      handle: order.customerHandle,
      text,
      likes,
      day: this.state.day,
      viral: false,
      color: customer.outfit,
      reviewStars: stars,
      createdAt: Date.now(),
      channel: 'online',
      avatar: { id: customer.id, skin: customer.skin, hair: customer.hair, outfit: customer.outfit, hairStyle: customer.hairStyle },
    });
    this.state.posts = this.state.posts.slice(0, 40);
  }

  toggleShopReviewLike(postId: string) {
    const post = this.state.posts.find(item => item.id === postId);
    if (!post) return false;
    post.likedByShop = !post.likedByShop;
    post.likes = Math.max(0, post.likes + (post.likedByShop ? 1 : -1));
    this.commit();
    return true;
  }

  addSocialDrama(drama: SocialDrama) {
    if (!Array.isArray(this.state.dramas)) this.state.dramas = [];
    if (this.state.dramas.some(item => item.id === drama.id)) return false;
    this.state.dramas.unshift({ ...drama, createdAt: drama.createdAt ?? Date.now() });
    this.state.dramas = this.state.dramas.slice(0, 20);
    const interval = Math.floor(Math.max(0, Math.min(.999999, this.random())) * 7) + 1;
    this.state.nextDramaDay = Math.max(this.state.day, drama.day) + interval;
    this.commit();
    this.toast('Boutique Buzz vừa có drama mới. Vào bảng tin để hóng!');
    return true;
  }

  resolveSocialDrama(dramaId: string, choiceId: string) {
    if (!Array.isArray(this.state.dramas)) this.state.dramas = [];
    const drama = this.state.dramas.find(item => item.id === dramaId);
    if (!drama || drama.resolvedChoiceId) return false;
    const choice = drama.choices.find(item => item.id === choiceId);
    if (!choice) return false;
    drama.resolvedChoiceId = choice.id;
    drama.resolvedTone = choice.tone;
    drama.shopReply = choice.text;
    drama.outcome = choice.resultText;
    return this.applyDramaResponseEffect(choice.tone);
  }

  resolveSocialDramaCustom(
    dramaId: string,
    reply: string,
    tone: DramaResponseTone,
    communityText: string,
    communityAuthorName = 'Cộng đồng',
    communityAuthorHandle = '@congdong',
    source: 'ai' | 'fallback' = 'fallback',
  ) {
    if (!Array.isArray(this.state.dramas)) this.state.dramas = [];
    const drama = this.state.dramas.find(item => item.id === dramaId);
    const normalizedReply = reply.trim().slice(0, 180);
    if (!drama || !normalizedReply) return false;
    const firstInteraction = !drama.resolvedChoiceId && (!Array.isArray(drama.threadReplies) || !drama.threadReplies.length);
    if (!Array.isArray(drama.threadReplies)) drama.threadReplies = [];
    if (!drama.threadReplies.length && drama.shopReply && drama.outcome) {
      drama.threadReplies.push({
        id: `legacy-${drama.id}`,
        shopText: drama.shopReply.slice(0, 180),
        tone: drama.resolvedTone ?? 'business',
        communityAuthorName: 'Cộng đồng',
        communityAuthorHandle: '@congdong',
        communityText: drama.outcome.slice(0, 220),
        source: 'fallback',
      });
    }
    drama.threadReplies.push({
      id: `reply-${Date.now().toString(36)}-${drama.threadReplies.length}`,
      shopText: normalizedReply,
      tone,
      communityAuthorName: communityAuthorName.trim().slice(0, 50) || 'Cộng đồng',
      communityAuthorHandle: communityAuthorHandle.trim().slice(0, 50) || '@congdong',
      communityText: communityText.trim().slice(0, 220),
      source,
    });
    drama.resolvedChoiceId = 'custom';
    drama.resolvedTone = tone;
    drama.shopReply = normalizedReply;
    drama.outcome = communityText.slice(0, 220);
    if (firstInteraction) return this.applyDramaResponseEffect(tone);
    this.commit();
    return true;
  }

  private applyDramaResponseEffect(tone: DramaResponseTone) {
    const effects: Record<DramaResponseTone, { heat: number; trust: number; followers: number; reputation: number }> = {
      cute: { heat: 2, trust: 6, followers: 5, reputation: .03 },
      sassy: { heat: 10, trust: -2, followers: 15, reputation: -.02 },
      business: { heat: 4, trust: 4, followers: 8, reputation: .04 },
    };
    const effect = effects[tone];
    this.state.dramaHeat = Math.max(0, Math.min(100, this.state.dramaHeat + effect.heat));
    this.state.dramaTrust = Math.max(0, Math.min(100, this.state.dramaTrust + effect.trust));
    this.state.followers += effect.followers;
    this.state.stats.followers += effect.followers;
    this.state.reputation = Math.max(1, Math.min(5, this.state.reputation + effect.reputation));
    this.commit();
    this.toast(`${tone === 'sassy' ? 'Câu trả lời đang viral' : 'Đã phản hồi drama'} · +${effect.followers} người theo dõi`);
    return true;
  }

  private recordCustomerRelationship(customer: Customer, success: boolean, score = 0, itemCount = 0): { points?: number; tier?: LoyaltyTier; reward?: string } {
    if (!customers.some(candidate => candidate.id === customer.id)) return {};
    const relation = this.state.customerLoyalty[customer.id] ??= { visits: 0, purchases: 0, points: 0, lastVisitDay: 0, rewardsClaimed: [] };
    relation.visits++;
    relation.lastVisitDay = this.state.day;
    let earned = 0;
    if (success) {
      relation.purchases++;
      earned = 8 + itemCount * 2 + Math.floor(score / 20);
      relation.points += earned;
    }
    const unlocked = loyaltyMilestones.filter(milestone => milestone.points > 0 && relation.points >= milestone.points && !relation.rewardsClaimed.includes(milestone.points));
    let rewardMoney = 0;
    let rewardFollowers = 0;
    for (const milestone of unlocked) {
      relation.rewardsClaimed.push(milestone.points);
      rewardMoney += milestone.rewardMoney;
      rewardFollowers += milestone.rewardFollowers;
    }
    if (rewardMoney) this.state.money += rewardMoney;
    if (rewardFollowers) {
      this.state.followers += rewardFollowers;
      this.state.stats.followers += rewardFollowers;
    }
    const tier = loyaltyTier(relation);
    const reward = unlocked.length
      ? `${customer.name} đã trở thành ${tier.toLowerCase()}: thưởng ${rewardMoney.toLocaleString('vi-VN')}₫${rewardFollowers ? ` và ${rewardFollowers} người theo dõi` : ''}`
      : undefined;
    return { points: earned, tier, reward };
  }

  /** Sinh hoặc lấy lại danh sách khách procedural cho ngày hiện tại */
  private ensureDayCustomers() {
    const day = this.state.day;
    if (this.dayCustomersKey === day) return;
    const land = Math.min(landExpansion.length - 1, Math.max(0, this.state.landLevel ?? 0));
    const count = 15 + (day % 6) + landExpansion[land].traffic * 2;
    const staticCustomers = customers.filter(c => (c.minLevel ?? 1) <= this.state.level);
    const generatedCustomers = generateDayCustomers(day, this.state.level, count);
    // Register generated customers vào runtime registry để rules.ts tìm được
    for (const c of generatedCustomers) registerCustomer(c);
    this.dayCustomers = [
      ...staticCustomers,
      ...generatedCustomers,
    ];
    this.dayCustomersKey = day;
  }
  selectSupplier(id: SupplierId) {
    if (this.state.phase === 'open') { this.toast('Hãy chốt nhà cung cấp trước giờ mở cửa.', 'error'); return false; }
    const supplier = suppliers.find(item => item.id === id);
    if (!supplier || this.state.level < supplier.unlockLevel) return false;
    this.state.activeSupplierId = id;
    this.commit();
    return true;
  }

  setStaffAssignment(uid: string, assignment: StaffAssignment) {
    if (this.state.phase === 'open') { this.toast('Không thể đổi ca khi shop đang mở cửa.', 'error'); return false; }
    const employee = this.state.employees.find(item => item.uid === uid);
    if (!employee || !['off', 'service', 'cashier', 'stock'].includes(assignment)) return false;
    if (assignment !== 'off' && (employee.assignment ?? 'service') === 'off') {
      const assignedCount = this.state.employees.filter(item => (item.assignment ?? 'service') !== 'off').length;
      const capacity = staffCapacity(this.state);
      if (assignedCount >= capacity) {
        this.toast(`Ca làm hiện chỉ có ${capacity} vị trí. Hãy cho một nhân viên nghỉ trước khi xếp người khác vào ca.`, 'error');
        return false;
      }
    }
    employee.assignment = assignment;
    const autoPacked = assignment === 'stock' ? this.autoPackRegularOrdersWithStaff() : undefined;
    this.commit();
    if (autoPacked?.count) this.toast(`${autoPacked.employee.name} đã tự động đóng gói ${autoPacked.count} đơn thường.`);
    return true;
  }

  resolveReturn(id: string, decision: 'refund' | 'exchange' | 'deny') {
    const claim = this.state.returnCases.find(item => item.id === id && item.availableDay <= this.state.day);
    if (!claim) return false;
    const product = products.find(item => item.id === claim.productId);
    if (!product) return false;
    if (decision === 'refund') {
      if (this.state.money < claim.amount) { this.toast('Không đủ tiền để hoàn lại cho khách.', 'error'); return false; }
      this.state.money -= claim.amount;
      this.state.inventory[product.id] = Math.min(999, (this.state.inventory[product.id] ?? 0) + 1);
      this.applyShopReview(5, .45);
    } else if (decision === 'exchange') {
      if (this.state.money < RETURN_EXCHANGE_SHIPPING_FEE) { this.toast(`Cần ${RETURN_EXCHANGE_SHIPPING_FEE.toLocaleString('vi-VN')}₫ để gửi lại hàng đổi cho khách.`, 'error'); return false; }
      this.state.money -= RETURN_EXCHANGE_SHIPPING_FEE;
      this.state.stats.spent += RETURN_EXCHANGE_SHIPPING_FEE;
      this.applyShopReview(5, .5);
    } else {
      this.applyShopReview(1, .8);
      this.state.followers = Math.max(0, this.state.followers - 8);
    }
    this.state.returnCases = this.state.returnCases.filter(item => item.id !== id);
    this.commit();
    this.toast(decision === 'deny'
      ? 'Bạn đã từ chối khiếu nại. Uy tín shop bị ảnh hưởng.'
      : decision === 'exchange'
        ? `Đã đổi hàng cho khách, phí vận chuyển ${RETURN_EXCHANGE_SHIPPING_FEE.toLocaleString('vi-VN')}₫.`
        : 'Đã hoàn tiền và nhận lại sản phẩm vào kho.', decision === 'deny' ? 'error' : 'success');
    return true;
  }

  acceptVip(id: string) {
    const appointment = this.state.vipAppointments.find(item => item.id === id && item.status === 'offered');
    if (!appointment) return false;
    appointment.status = 'accepted';
    this.commit(); this.toast(`Đã nhận đơn VIP của ${appointment.customerName}, khách sẽ tới lấy vào ${gameDate(appointment.scheduledDay)}.`); return true;
  }

  declineVip(id: string) {
    const appointment = this.state.vipAppointments.find(item => item.id === id);
    if (!appointment) return false;
    this.state.vipAppointments = this.state.vipAppointments.filter(item => item.id !== id);
    this.commit(); return true;
  }

  private processVipPickupsOnOpen() {
    const s = this.state;
    const dueAppointments = s.vipAppointments.filter(item => item.status === 'accepted' && item.scheduledDay === s.day);
    for (const appointment of dueAppointments) {
      const candidates = products.filter(product => product.category === appointment.category
        && (product.style === appointment.style || product.secondaryStyles?.includes(appointment.style))
        && displayedQuantity(s, product.id) > 0 && (s.inventory[product.id] ?? 0) > 0);
      let selected: Product[] | undefined;
      let bestQuality = -1;
      const choose = (start: number, picked: Product[]) => {
        if (picked.length === appointment.minItems) {
          const total = picked.reduce((sum, item) => sum + sellPrice(s, item), 0);
          const quality = picked.reduce((sum, item) => sum + item.quality, 0);
          if (total <= appointment.budget && quality > bestQuality) {
            selected = [...picked];
            bestQuality = quality;
          }
          return;
        }
        for (let index = start; index < candidates.length; index++) choose(index + 1, [...picked, candidates[index]]);
      };
      choose(0, []);

      s.vipAppointments = s.vipAppointments.filter(item => item.id !== appointment.id);
      if (!selected) {
        s.stats.served++;
        s.stats.walkouts = (s.stats.walkouts ?? 0) + 1;
        s.followers = Math.max(0, s.followers - 15);
        this.applyShopReview(1, .8);
        const reason = candidates.length < appointment.minItems
          ? `không có đủ ${appointment.minItems} món ${appointment.style} · ${appointment.category}`
          : 'các món đã trưng vượt ngân sách đặt trước';
        this.toast(`${appointment.customerName} đã tới nhưng ${reason}. Shop bị giảm uy tín.`, 'error');
        continue;
      }

      const pickedItems: Product[] = selected;
      const total = pickedItems.reduce((sum, item) => sum + sellPrice(s, item), 0);
      for (const item of pickedItems) {
        s.inventory[item.id]--;
        this.consumeDisplayedItem(item.id);
        s.stats.soldProducts ??= {};
        s.stats.soldProducts[item.id] = (s.stats.soldProducts[item.id] ?? 0) + 1;
      }
      s.money += total + appointment.reward;
      s.xp += 35;
      s.followers += 25;
      s.industryReputation += 3;
      s.stats.revenue += total + appointment.reward;
      s.stats.costOfGoods += pickedItems.reduce((sum, item) => sum + item.buyPrice, 0);
      s.stats.sold += pickedItems.length;
      s.stats.served++;
      s.stats.happy++;
      s.stats.trendSales += pickedItems.filter(item => isTrending(s, item)).length;
      s.stats.followers += 25;
      this.applyShopReview(5);
      this.progressCampaign(pickedItems, total, false);
      this.recordAdvancedSale(pickedItems, total, appointment.customerName);
      this.toast(`${appointment.customerName} đã tới lấy ${pickedItems.length} món đặt trước: +${(total + appointment.reward).toLocaleString('vi-VN')}₫.`);
    }
  }

  startCoutureOrder() {
    if (this.state.level < 5 || this.state.coutureOrder || this.state.day < this.state.coutureAvailableDay) return false;
    const seq = this.state.operationSequence++;
    this.state.coutureOrder = { id: `couture-${this.state.day}-${seq}`, clientName: ['Maison Lumière', 'Nữ ca sĩ Aria', 'Biên tập viên Elle'][seq % 3], brief: 'Thiết kế độc bản cho một sự kiện lớn, cần cân bằng chất liệu và độ hoàn thiện.', stage: 'concept', quality: 0, acceptedDay: this.state.day, deadlineDay: this.state.day + 5, reward: 850000 + this.state.level * 120000, status: 'active' };
    this.commit(); return true;
  }

  advanceCouture(choice: 'safe' | 'premium') {
    const order = this.state.coutureOrder;
    if (!order || order.status === 'ready' || this.state.phase === 'open') return false;
    const premiumCost = order.stage === 'materials' ? 240000 : order.stage === 'fitting' ? 90000 : 0;
    if (choice === 'premium' && premiumCost > this.state.money) { this.toast('Chưa đủ tiền cho phương án cao cấp.', 'error'); return false; }
    this.state.money -= choice === 'premium' ? premiumCost : 0;
    order.quality = Math.min(100, order.quality + (choice === 'premium' ? 30 : 18));
    order.stage = order.stage === 'concept' ? 'materials' : order.stage === 'materials' ? 'fitting' : order.stage === 'fitting' ? 'delivery' : 'delivery';
    if (order.stage === 'delivery') order.status = 'ready';
    this.commit(); return true;
  }

  deliverCouture() {
    const order = this.state.coutureOrder;
    if (!order || order.status !== 'ready') return false;
    const onTime = this.state.day <= order.deadlineDay;
    const success = onTime && order.quality >= 54;
    if (success) {
      this.state.money += order.reward; this.state.xp += 80; this.state.followers += 60; this.state.industryReputation += 8;
      this.applyShopReview(5);
    } else {
      this.state.reputation = Math.max(1, this.state.reputation - .3); this.state.followers = Math.max(0, this.state.followers - 25);
    }
    this.state.coutureOrder = null;
    this.state.coutureAvailableDay = this.state.day + 3;
    this.commit(); this.toast(success ? `Đã bàn giao thiết kế độc bản: +${order.reward.toLocaleString('vi-VN')}₫.` : 'Đơn couture không đạt yêu cầu hoặc đã trễ hạn.', success ? 'success' : 'error'); return success;
  }

  buy(id: string, quantity: number) {
    if (this.state.phase === 'open') {
      this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
      return false;
    }
    const p = products.find(p => p.id === id);
    if (!p || ![1, 5, 10].includes(quantity) || p.level > this.state.level) return false;
    const supplier = supplierFor(this.state);
    if (quantity < supplier.minOrder) { this.toast(`${supplier.name} yêu cầu tối thiểu ${supplier.minOrder} món mỗi mẫu.`, 'error'); return false; }
    const reserved = this.state.pendingOrders.filter(order => order.productId === id).reduce((sum, order) => sum + order.quantity, 0);
    if ((this.state.inventory[id] ?? 0) + reserved + quantity > 999) { this.toast('Kho và hàng đang về đã đủ 999 món của mẫu này.', 'error'); return false; }
    const cost = buyPrice(this.state, p) * quantity;
    if (cost > this.state.money) { this.toast('Ví hơi vơi rồi. Hãy bán thêm vài món nhé!', 'error'); return false; }
    this.state.money -= cost; this.state.stats.spent += cost;
    if (supplier.deliveryDays > 0) {
      const delay = this.random() > supplier.reliability ? 1 : 0;
      this.state.pendingOrders.push({ id: `supplier-${crypto.randomUUID()}`, productId: id, quantity, cost, arrivalDay: this.state.day + supplier.deliveryDays + delay, supplierId: supplier.id });
      this.state.supplierRelations[supplier.id] = Math.min(100, this.state.supplierRelations[supplier.id] + 1);
      this.commit(); this.toast(`Đã đặt ${quantity} món từ ${supplier.name}, dự kiến về sau ${supplier.deliveryDays + delay} ngày.`); return true;
    }
    this.state.inventory[id] = (this.state.inventory[id] ?? 0) + quantity;
    this.commit(); this.toast(`Đã nhập ${quantity} ${p.name.toLowerCase()}.`); return true;
  }
  /** International orders take 2–3 days; reserve their inventory capacity up front. */
  orderImport(id: string, quantity: number) {
    if (this.state.phase === 'open') {
      this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
      return false;
    }
    const p = products.find(p => p.id === id);
    if (!p || p.level > this.state.level) return false;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 30) return false;
    const supplier = supplierFor(this.state);
    if (quantity < supplier.minOrder) { this.toast(`${supplier.name} yêu cầu tối thiểu ${supplier.minOrder} món mỗi mẫu.`, 'error'); return false; }
    const reserved = this.state.pendingOrders.filter(o => o.productId === id).reduce((sum, o) => sum + o.quantity, 0);
    if ((this.state.inventory[id] ?? 0) + reserved + quantity > 999) {
      this.toast('Kho và hàng đang về đã đủ 999 món của mẫu này.', 'error'); return false;
    }
    const basePrice = buyPrice(this.state, p);
    const totalCost = basePrice * quantity;
    if (totalCost > this.state.money) { this.toast('Không đủ tiền để nhập đơn này.', 'error'); return false; }
    const isInternational = p.level >= 4 || p.buyPrice >= 200000;
    this.state.money -= totalCost; this.state.stats.spent += totalCost;
    const baseDeliveryDays = isInternational ? 3 : 0;
    const supplierDelay = supplier.deliveryDays && this.random() > supplier.reliability ? 1 : 0;
    const daysToArrive = baseDeliveryDays + supplier.deliveryDays + supplierDelay;
    if (daysToArrive > 0) {
      const order: PendingOrder = {
        id: `order-${crypto.randomUUID()}`,
        productId: id, quantity, cost: totalCost,
        arrivalDay: this.state.day + daysToArrive,
        supplierId: supplier.id,
      };
      this.state.pendingOrders.push(order);
      this.state.supplierRelations[supplier.id] = Math.min(100, this.state.supplierRelations[supplier.id] + 1);
      this.commit();
      this.toast(`Đã đặt ${p.name} × ${quantity} từ ${supplier.name}. Dự kiến về sau ${daysToArrive} ngày.`);
    } else {
      if ((this.state.inventory[id] ?? 0) + quantity > 999) { this.state.money += totalCost; this.state.stats.spent -= totalCost; return false; }
      this.state.inventory[id] = (this.state.inventory[id] ?? 0) + quantity;
      this.commit();
      this.toast(`Đã nhập ${quantity} ${p.name.toLowerCase()}.`);
    }
    return true;
  }
  setPrice(id: string, price: number) {
    const p = products.find(p => p.id === id);
    if (!p || !Number.isFinite(price) || price < 0 || price > 999999999) return false;
    const rounded = Math.round(price);
    this.state.prices[id] = rounded;
    this.commit();
    if (rounded < p.buyPrice) this.toast(`Giá này thấp hơn vốn ${p.buyPrice.toLocaleString('vi-VN')}₫, mỗi món bán ra sẽ bị lỗ.`, 'error');
    else if (rounded > p.sellPrice * 1.5) this.toast('Giá đang cao hơn nhiều so với mức gợi ý. Khách sẽ khó chấp nhận và có thể rời shop.', 'error');
    else if (rounded > p.sellPrice) this.toast('Giá cao giúp tăng lãi, nhưng sẽ làm giảm khả năng khách quyết định mua.');
    return true;
  }
  buyOutfit(ids: string[], quantity = 1) {
    if (this.state.phase === 'open') {
      this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
      return false;
    }
    if (!validOutfit(ids)) return false;
    const supplier = supplierFor(this.state);
    if (quantity < supplier.minOrder) { this.toast(`${supplier.name} yêu cầu tối thiểu ${supplier.minOrder} bộ.`, 'error'); return false; }
    const items = ids.map(id => products.find(p => p.id === id)!);
    if (items.some(p => {
      const reserved = this.state.pendingOrders.filter(order => order.productId === p.id).reduce((sum, order) => sum + order.quantity, 0);
      return p.level > this.state.level || (this.state.inventory[p.id] ?? 0) + reserved + quantity > 999;
    })) return false;
    const baseCostPerSet = items.reduce((sum, p) => sum + buyPrice(this.state, p), 0);
    const totalCost = baseCostPerSet * quantity;
    if (totalCost > this.state.money) { this.toast('Chưa đủ tiền để nhập trọn outfit này.', 'error'); return false; }
    this.state.money -= totalCost; this.state.stats.spent += totalCost;
    const internationalDays = items.some(item => item.level >= 4 || item.buyPrice >= 200000) ? 3 : 0;
    const supplierDelay = supplier.deliveryDays && this.random() > supplier.reliability ? 1 : 0;
    const deliveryDays = internationalDays + supplier.deliveryDays + supplierDelay;
    if (deliveryDays) {
      const costPerItem = Math.round(totalCost / items.length);
      for (const p of items) this.state.pendingOrders.push({ id: `look-${crypto.randomUUID()}`, productId: p.id, quantity, cost: costPerItem, arrivalDay: this.state.day + deliveryDays, supplierId: supplier.id });
      this.state.supplierRelations[supplier.id] = Math.min(100, this.state.supplierRelations[supplier.id] + 1);
      this.commit();
      this.toast(`Đã đặt ×${quantity} bộ từ ${supplier.name}. Dự kiến về sau ${deliveryDays} ngày.`);
      return true;
    }
    for (const p of items) this.state.inventory[p.id] = (this.state.inventory[p.id] ?? 0) + quantity;
    this.commit();
    this.toast(`Đã nhập ×${quantity} bộ (${items.length * quantity} món) vào kho!`);
    return true;
  }
  atelierAvailable() {
    return this.state.level >= ATELIER_UNLOCK_LEVEL && this.state.atelierOwned;
  }
  buyAtelier() {
    const s = this.state;
    if (s.level < ATELIER_UNLOCK_LEVEL || s.phase === 'open') return false;
    if (s.atelierOwned) return false;
    if (s.money < ATELIER_PURCHASE_COST) { this.toast('Bạn cần 30.000.000₫ để mua xưởng may.', 'error'); return false; }
    s.money -= ATELIER_PURCHASE_COST;
    s.stats.spent += ATELIER_PURCHASE_COST;
    s.atelierOwned = true;
    this.commit();
    this.toast('Đã mua xưởng may. Không gian này giờ thuộc về boutique của bạn!');
    return true;
  }
  buyRandomAtelierRecipe() {
    const s = this.state;
    if (!this.atelierAvailable() || s.phase === 'open' || !atelierRecipes.length) return { success: false as const, reason: 'unavailable' as const };
    if (s.money < ATELIER_RECIPE_CARD_COST) {
      this.toast(`Bạn cần ${ATELIER_RECIPE_CARD_COST.toLocaleString('vi-VN')}₫ để mua một bản công thức.`, 'error');
      return { success: false as const, reason: 'money' as const };
    }
    const index = Math.min(atelierRecipes.length - 1, Math.floor(this.random() * atelierRecipes.length));
    const recipe = atelierRecipes[index];
    const cards = s.atelierRecipeCards ?? (s.atelierRecipeCards = []);
    s.money -= ATELIER_RECIPE_CARD_COST;
    s.stats.spent += ATELIER_RECIPE_CARD_COST;
    cards.push(recipe.id);
    if (cards.length > 200) cards.splice(0, cards.length - 200);
    const count = cards.filter(id => id === recipe.id).length;
    this.commit();
    this.toast(count > 1 ? `Nhận lại công thức ${recipe.name} · hiện có ×${count}.` : `Đã nhận công thức ${recipe.name}!`);
    return { success: true as const, recipe, count };
  }
  buyAtelierMaterial(materialId: string, quantity: number) {
    const s = this.state;
    const material = atelierMaterials.find(item => item.id === materialId);
    quantity = Math.max(1, Math.min(30, Math.floor(quantity)));
    const supplier = supplierFor(s);
    if (!material || s.level < ATELIER_UNLOCK_LEVEL || s.level < material.level || s.phase === 'open') return false;
    if (quantity < supplier.minOrder) { this.toast(`${supplier.name} yêu cầu tối thiểu ${supplier.minOrder} đơn vị mỗi loại.`, 'error'); return false; }
    const pendingMaterialOrders = s.pendingMaterialOrders ?? (s.pendingMaterialOrders = []);
    const reserved = pendingMaterialOrders.filter(order => order.materialId === materialId).reduce((sum, order) => sum + order.quantity, 0);
    if ((s.materialInventory[material.id] ?? 0) + reserved + quantity > 9999) { this.toast('Kho nguyên liệu và hàng đang về đã đầy.', 'error'); return false; }
    const unitPrice = Math.round(material.price * currentEvent(s).discount * supplier.priceFactor);
    const cost = unitPrice * quantity;
    if (s.money < cost) { this.toast('Chưa đủ tiền mua nguyên vật liệu.', 'error'); return false; }
    s.money -= cost; s.stats.spent += cost;
    const delay = supplier.deliveryDays && this.random() > supplier.reliability ? 1 : 0;
    const deliveryDays = supplier.deliveryDays + delay;
    if (deliveryDays > 0) {
      const order: PendingMaterialOrder = { id: `material-${crypto.randomUUID()}`, materialId, quantity, cost, arrivalDay: s.day + deliveryDays, supplierId: supplier.id };
      pendingMaterialOrders.push(order);
      s.supplierRelations[supplier.id] = Math.min(100, s.supplierRelations[supplier.id] + 1);
      this.commit();
      this.toast(`Đã đặt ${material.name} ×${quantity} từ ${supplier.name}. Dự kiến về sau ${deliveryDays} ngày.`);
      return true;
    }
    s.materialInventory[material.id] = (s.materialInventory[material.id] ?? 0) + quantity;
    this.commit();
    this.toast(`Đã nhập ${material.name} ×${quantity} vào kho nguyên liệu.`);
    return true;
  }
  createAtelierSample(style: Style, selection: Record<string, number>) {
    const s = this.state;
    if (!this.atelierAvailable() || s.phase === 'open' || s.atelierDraft) return { success: false as const, reason: 'unavailable' as const };
    const ingredients = Object.entries(selection)
      .map(([id, quantity]) => ({ material: atelierMaterials.find(item => item.id === id), quantity: Math.max(0, Math.floor(quantity)) }))
      .filter((item): item is { material: typeof atelierMaterials[number]; quantity: number } => !!item.material && item.quantity > 0);
    if (ingredients.length < 2) { this.toast('Một mẫu cần kết hợp ít nhất 2 loại nguyên vật liệu.', 'error'); return { success: false as const, reason: 'ingredients' as const }; }
    if (ingredients.length > 3) { this.toast('Một mẫu chỉ được kết hợp tối đa 3 loại nguyên vật liệu.', 'error'); return { success: false as const, reason: 'ingredients' as const }; }
    if (ingredients.some(item => item.material.level > s.level || (s.materialInventory[item.material.id] ?? 0) < item.quantity)) {
      this.toast('Kho nguyên liệu không đủ cho mẫu thiết kế này.', 'error');
      return { success: false as const, reason: 'stock' as const };
    }
    const usedMaterials = Object.fromEntries(ingredients.map(item => [item.material.id, item.quantity]));
    const recordCraft = (success: boolean, recipeId?: string) => {
      const history = s.atelierCraftHistory ?? (s.atelierCraftHistory = []);
      history.push({ id: `craft-${crypto.randomUUID()}`, style, materials: usedMaterials, ...(recipeId ? { recipeId } : {}), success, day: s.day });
      if (history.length > 50) history.splice(0, history.length - 50);
    };
    for (const item of ingredients) s.materialInventory[item.material.id] -= item.quantity;
    const recipe = atelierRecipes.find(candidate => candidate.style === style
      && Object.keys(candidate.materials).length === ingredients.length
      && ingredients.every(item => candidate.materials[item.material.id] === item.quantity));
    if (!recipe) {
      recordCraft(false);
      this.commit();
      this.toast('Công thức không thành công. Toàn bộ nguyên liệu tạo mẫu đã bị tiêu hao.', 'error');
      return { success: false as const, reason: 'wrong-recipe' as const };
    }
    const requiredLevel = Math.max(ATELIER_UNLOCK_LEVEL, ...Object.keys(recipe.materials).map(id => atelierMaterials.find(material => material.id === id)?.level ?? ATELIER_UNLOCK_LEVEL));
    const product: CustomProduct = {
      id: `custom-${recipe.id}-${s.day}-${++s.operationSequence}`,
      name: recipe.name, category: recipe.category, style: recipe.style, color: recipe.color, colorName: recipe.colorName,
      buyPrice: atelierRecipeCost(recipe), sellPrice: recipe.sellPrice, quality: recipe.quality, level: requiredLevel,
      art: recipe.art, subcategory: 'Thiết kế cá nhân', occasions: ['city', 'party'], secondaryStyles: [],
      custom: true, recipeId: recipe.id, createdDay: s.day,
    };
    const craftedRecipeIds = s.craftedRecipeIds ?? (s.craftedRecipeIds = []);
    if (!craftedRecipeIds.includes(recipe.id)) craftedRecipeIds.push(recipe.id);
    recordCraft(true, recipe.id);
    s.atelierDraft = product;
    this.commit();
    return { success: true as const, product };
  }
  acceptAtelierSample() {
    const s = this.state, product = s.atelierDraft;
    if (!product || !this.atelierAvailable()) return false;
    s.customProducts.push(product);
    registerCustomProduct(product);
    s.inventory[product.id] = Math.min(999, (s.inventory[product.id] ?? 0) + 1);
    s.prices[product.id] = product.sellPrice;
    s.atelierDraft = null;
    this.commit();
    this.toast(`${product.name} đã trở thành bản thiết kế và được thêm 1 mẫu vào kho.`);
    return true;
  }
  discardAtelierSample() {
    if (!this.state.atelierDraft) return false;
    this.state.atelierDraft = null;
    this.commit();
    this.toast('Đã xoá mẫu thử. Nguyên liệu đã sử dụng không được hoàn lại.');
    return true;
  }
  renameCustomProduct(productId: string, name: string) {
    const product = this.state.customProducts.find(item => item.id === productId);
    if (!product) return false;
    const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 32);
    if (!cleanName) {
      this.toast('Tên sản phẩm không được để trống.', 'error');
      return false;
    }
    if (product.name === cleanName) return true;
    product.name = cleanName;
    this.commit();
    this.toast(`Đã đổi tên thiết kế thành ${cleanName}.`);
    return true;
  }
  customizeCustomProduct(productId: string, name: string, designColor: string, designStrokes: ProductDesignStroke[], designMotif?: ProductDesignMotif, designAccentColor?: string, designMotifScale?: number, designMotifX?: number, designMotifY?: number, designFormWidth?: number, designFormLength?: number, designMotifRotation?: number, designMotifOpacity?: number, designMotifRepeat?: 1 | 3 | 5, designShapePoints?: ProductDesignPoint[], designShapeSmooth?: boolean, designStrokeColor?: string, designStrokeWidth?: number, designStickers?: ProductDesignSticker[]) {
    const product = this.state.customProducts.find(item => item.id === productId);
    const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 32);
    if (!product || !cleanName || !/^#[0-9a-f]{6}$/i.test(designColor)) return false;
    product.name = cleanName;
    product.designColor = designColor;
    product.designStrokes = designStrokes.slice(0, 80).map(stroke => ({
      color: /^#[0-9a-f]{6}$/i.test(stroke.color) ? stroke.color : '#d4429a',
      width: Math.max(.6, Math.min(8, stroke.width)),
      points: stroke.points.slice(0, 240).map(point => ({ x: Math.max(0, Math.min(120, point.x)), y: Math.max(0, Math.min(140, point.y)) })),
      tip: (['round', 'marker', 'calligraphy', 'neon', 'eraser'] as string[]).includes(stroke.tip ?? '') ? stroke.tip : 'round',
    })).filter(stroke => stroke.points.length > 0);
    if (designMotif !== undefined) product.designMotif = (['none', 'heart', 'star', 'bow', 'flower', 'stripes'] as ProductDesignMotif[]).includes(designMotif) ? designMotif : 'none';
    if (designAccentColor !== undefined) product.designAccentColor = /^#[0-9a-f]{6}$/i.test(designAccentColor) ? designAccentColor : '#d4429a';
    if (designMotifScale !== undefined) product.designMotifScale = Math.max(.7, Math.min(1.35, Number(designMotifScale) || 1));
    if (designMotifX !== undefined) product.designMotifX = Math.max(38, Math.min(82, Number(designMotifX) || 60));
    if (designMotifY !== undefined) product.designMotifY = Math.max(42, Math.min(100, Number(designMotifY) || 69));
    if (designFormWidth !== undefined) product.designFormWidth = Math.max(.84, Math.min(1.16, Number(designFormWidth) || 1));
    if (designFormLength !== undefined) product.designFormLength = Math.max(.84, Math.min(1.18, Number(designFormLength) || 1));
    if (designMotifRotation !== undefined) product.designMotifRotation = Math.max(-40, Math.min(40, Number(designMotifRotation) || 0));
    if (designMotifOpacity !== undefined) product.designMotifOpacity = Math.max(.4, Math.min(1, Number(designMotifOpacity) || 1));
    if (designMotifRepeat !== undefined) product.designMotifRepeat = ([1, 3, 5] as number[]).includes(designMotifRepeat) ? designMotifRepeat : 1;
    if (designShapePoints !== undefined) {
      const shapePoints = designShapePoints.slice(0, 48).map(point => ({
        x: Math.max(4, Math.min(116, Number(point.x) || 60)),
        y: Math.max(5, Math.min(138, Number(point.y) || 70)),
      }));
      if (shapePoints.length >= 6) product.designShapePoints = shapePoints;
    }
    if (designShapeSmooth !== undefined) product.designShapeSmooth = designShapeSmooth;
    if (designStrokeColor !== undefined) product.designStrokeColor = /^#[0-9a-f]{6}$/i.test(designStrokeColor) ? designStrokeColor : '#795267';
    if (designStrokeWidth !== undefined) product.designStrokeWidth = Math.max(.6, Math.min(4, Number(designStrokeWidth) || 2));
    if (designStickers !== undefined) product.designStickers = designStickers.slice(0, 24).map((sticker, index) => ({
      id: /^[a-z0-9-]{1,50}$/i.test(sticker.id) ? sticker.id : `sticker-${index}`,
      kind: (['heart', 'star', 'bow', 'flower', 'round-collar', 'vest-collar', 'polo-collar', 'pleats', 'buttons', 'pocket', 'zipper', 'belt', 'seam', 'cuffs', 'text'] as ProductDesignSticker['kind'][]).includes(sticker.kind) ? sticker.kind : 'heart',
      x: Math.max(6, Math.min(114, Number(sticker.x) || 60)),
      y: Math.max(7, Math.min(133, Number(sticker.y) || 69)),
      scale: Math.max(.35, Math.min(2.5, Number(sticker.scale) || 1)),
      rotation: Math.max(-180, Math.min(180, Number(sticker.rotation) || 0)),
      color: /^#[0-9a-f]{6}$/i.test(sticker.color) ? sticker.color : '#d4429a',
      ...(sticker.kind === 'text' ? {
        text: (sticker.text ?? 'Boutique').trim().slice(0, 18) || 'Boutique',
        font: (['rounded', 'handwritten', 'serif'] as string[]).includes(sticker.font ?? '') ? sticker.font : 'rounded',
        fontSize: Math.max(8, Math.min(32, Math.round(Number(sticker.fontSize) || 14))),
        curve: Math.max(-60, Math.min(60, Math.round(Number(sticker.curve) || 0))),
        effect: (['none', 'outline', 'shadow', 'glow'] as string[]).includes(sticker.effect ?? '') ? sticker.effect : 'none',
      } : {}),
    }));
    this.commit();
    this.toast(`Đã lưu phiên bản mới của ${cleanName}.`);
    return true;
  }
  deleteCustomProduct(productId: string) {
    const s = this.state;
    const product = s.customProducts.find(item => item.id === productId);
    if (!product) return false;
    if (s.tailoringJobs.some(job => job.productId === productId)) {
      this.toast('Không thể xóa bản thiết kế đang nằm trên chuyền may.', 'error');
      return false;
    }
    if (s.onlineOrders.some(order => order.productId === productId || order.productIds?.includes(productId)) || s.regularOnlineOrders.some(order => order.productIds.includes(productId))) {
      this.toast('Hãy giao xong đơn online chứa sản phẩm này trước khi xóa.', 'error');
      return false;
    }
    s.customProducts = s.customProducts.filter(item => item.id !== productId);
    s.onlineListings = s.onlineListings.filter(id => id !== productId);
    for (const fixture of s.layout) {
      if (fixture.displayItems) fixture.displayItems = fixture.displayItems.filter(id => id !== productId);
    }
    delete s.inventory[productId];
    delete s.prices[productId];
    unregisterCustomProduct(productId);
    this.commit();
    this.toast(`Đã xóa bản thiết kế ${product.name}.`);
    return true;
  }
  startTailoringBatch(productId: string, quantity: number) {
    const s = this.state;
    const product = s.customProducts.find(item => item.id === productId);
    const recipe = product && atelierRecipes.find(item => item.id === product.recipeId);
    quantity = Math.max(5, Math.min(50, Math.ceil(quantity / 5) * 5));
    if (!product || !recipe || !this.atelierAvailable() || s.phase === 'open') return false;
    const requirements = Object.entries(recipe.materials).map(([id, amount]) => ({ id, amount: amount * quantity }));
    if (requirements.some(item => (s.materialInventory[item.id] ?? 0) < item.amount)) {
      this.toast('Không đủ nguyên liệu để sản xuất số lượng đã chọn.', 'error'); return false;
    }
    if ((s.inventory[product.id] ?? 0) + s.tailoringJobs.filter(job => job.productId === product.id).reduce((sum, job) => sum + job.quantity, 0) + quantity > 999) return false;
    for (const item of requirements) s.materialInventory[item.id] -= item.amount;
    const days = Math.max(1, Math.ceil(quantity / 5));
    s.tailoringJobs.push({ id: `tailoring-${crypto.randomUUID()}`, productId, quantity, readyDay: s.day + days });
    this.commit();
    this.toast(`Đã chuyển ${product.name} ×${quantity} vào sản xuất. Hoàn thành sau ${days} ngày.`);
    return true;
  }
  postRecruitment(salary: number) {
    const s = this.state;
    const requirement = nextStaffRequirement(s);
    if (s.phase === 'open') { this.toast('Hãy đăng tin tuyển dụng khi shop đã đóng cửa.', 'error'); return false; }
    if (s.level < requirement.level || (s.landLevel ?? 0) < requirement.landLevel) {
      this.toast(`Tuyển dụng cần shop cấp ${requirement.level} và mặt bằng cấp ${requirement.landLevel + 1}.`, 'error'); return false;
    }
    if (s.recruitmentPost || s.staffApplicants.length) { this.toast('Shop đang có một đợt tuyển dụng chưa hoàn tất.', 'error'); return false; }
    const rounded = Math.round(salary / 5000) * 5000;
    if (!Number.isFinite(rounded) || rounded < STAFF_SALARY_MIN || rounded > STAFF_SALARY_MAX) { this.toast(`Mức lương mỗi ca cần từ ${STAFF_SALARY_MIN.toLocaleString('vi-VN')}₫ đến ${STAFF_SALARY_MAX.toLocaleString('vi-VN')}₫.`, 'error'); return false; }
    if (s.money < STAFF_RECRUITMENT_FEE) { this.toast(`Cần ${STAFF_RECRUITMENT_FEE.toLocaleString('vi-VN')}₫ phí đăng tin tuyển dụng.`, 'error'); return false; }
    s.money -= STAFF_RECRUITMENT_FEE;
    s.stats.spent += STAFF_RECRUITMENT_FEE;
    s.recruitmentPost = { salary: rounded, postedDay: s.day, applicantsDay: s.day + 2 };
    this.commit();
    this.toast(`Đã trả ${STAFF_RECRUITMENT_FEE.toLocaleString('vi-VN')}₫ phí đăng tin · lương ${rounded.toLocaleString('vi-VN')}₫/ca.`);
    return true;
  }
  cancelRecruitment() {
    if (!this.state.recruitmentPost && !this.state.staffApplicants.length) return false;
    this.state.recruitmentPost = null;
    this.state.staffApplicants = [];
    this.commit(); this.toast('Đã đóng đợt tuyển dụng hiện tại.'); return true;
  }
  private generateStaffApplicants() {
    const post = this.state.recruitmentPost;
    if (!post || this.state.day < post.applicantsDay || this.state.staffApplicants.length) return;
    const roles = [
      ['Stylist tinh tế', 'Mạnh về đọc gu khách và hoàn thiện outfit chỉ trong vài phút.'],
      ['Tư vấn viên năng động', 'Giao tiếp tự nhiên, tạo cảm giác thoải mái cho khách mới.'],
      ['Chuyên viên bán hàng', 'Nhanh nhạy khi chốt đơn và giới thiệu món phối bổ sung.'],
      ['Boutique host', 'Chăm sóc trải nghiệm, ghi nhớ sở thích của khách quen.'],
      ['Fashion assistant', 'Tỉ mỉ, đáng tin cậy và luôn giữ quầy kệ gọn gàng.'],
    ];
    const salaryPower = Math.max(0, Math.min(1, (post.salary - STAFF_SALARY_MIN) / (STAFF_SALARY_MAX - STAFF_SALARY_MIN)));
    const base = 34 + salaryPower * 46;
    const used = new Set(this.state.employees.map(employee => employee.name));
    const usedAppearances = new Set(this.state.employees.map(employee => Math.abs(employee.appearance) % 6));
    const applicants: StaffCandidate[] = [];
    for (let index = 0; index < 3; index++) {
      const availableNames = STAFF_NAMES.filter(name => !used.has(name));
      const name = availableNames[Math.floor(this.random() * availableNames.length)] ?? `Ứng viên ${index + 1}`;
      used.add(name);
      const role = roles[Math.floor(this.random() * roles.length)];
      const availableAppearances = [0, 1, 2, 3, 4, 5].filter(appearance => !usedAppearances.has(appearance));
      const appearance = availableAppearances[Math.floor(this.random() * availableAppearances.length)] ?? index % 6;
      usedAppearances.add(appearance);
      const stat = (focus = 0) => Math.max(28, Math.min(98, Math.round(base + focus + (this.random() - .5) * 30)));
      applicants.push({
        id: `app-${this.state.day}-${index}-${Math.floor(this.random() * 1e7).toString(36)}`,
        name, role: role[0], bio: role[1], appearance, salary: post.salary,
        service: stat(index === 0 ? 8 : 0), persuasion: stat(index === 1 ? 8 : 0), charm: stat(index === 2 ? 8 : 0),
        reliability: stat(4), appliedDay: this.state.day,
      });
    }
    this.state.staffApplicants = applicants;
    this.toast(`${applicants.length} hồ sơ ứng viên mới đã gửi đến bảng tin boutique.`);
  }
  hireStaff(candidateId: string) {
    const s = this.state;
    const candidate = s.staffApplicants.find(item => item.id === candidateId);
    if (!candidate || staffCapacity(s) < 1) return false;
    const assignedCount = s.employees.filter(item => (item.assignment ?? 'service') !== 'off').length;
    const assignment: StaffAssignment = assignedCount < staffCapacity(s) ? 'service' : 'off';
    s.employees.push({ ...candidate, uid: `staff-${Date.now()}-${candidate.id}`, hiredDay: s.day, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, experience: 0, skillLevel: 1, shiftSales: 0, energy: 100, assignment, unpaidShifts: 0, unpaidWages: 0, totalShiftsWorked: 0 });
    s.staffApplicants = s.staffApplicants.filter(item => item.id !== candidateId);
    if (!s.staffApplicants.length) s.recruitmentPost = null;
    this.commit();
    this.toast(assignment === 'off' ? `${candidate.name} đã gia nhập đội ngũ và đang nghỉ chờ xếp ca.` : `${candidate.name} đã gia nhập ${s.shopName}!`);
    return true;
  }
  fireStaff(uid: string) {
    const employee = this.state.employees.find(item => item.uid === uid);
    if (!employee) return false;
    const settledWages = this.settleDepartingStaffWages(employee);
    this.state.employees = this.state.employees.filter(item => item.uid !== uid);
    this.state.staffLeaveRequests = this.state.staffLeaveRequests.filter(request => request.employeeUid !== uid);
    this.commit(); this.toast(`${employee.name} đã rời đội ngũ boutique.${settledWages ? ` Đã tự động trả ${settledWages.toLocaleString('vi-VN')}₫ lương còn nợ.` : ''}`, 'error'); return true;
  }
  private settleDepartingStaffWages(employee: StaffMember) {
    const amount = Math.max(0, employee.unpaidWages ?? 0);
    if (!amount) return 0;
    this.state.money -= amount;
    this.state.stats.staffWages += amount;
    employee.unpaidWages = 0;
    employee.unpaidShifts = 0;
    return amount;
  }
  decideStaffLeave(uid: string, approve: boolean) {
    const request = this.state.staffLeaveRequests.find(item => item.employeeUid === uid);
    const employee = this.state.employees.find(item => item.uid === uid);
    if (!request || !employee) return false;
    this.state.staffLeaveRequests = this.state.staffLeaveRequests.filter(item => item !== request);
    if (approve) {
      employee.leaveUntilDay = this.state.day + request.days + 1;
      employee.morale = Math.min(100, employee.morale + 6);
      this.toast(`Đã duyệt ${request.days} ngày nghỉ cho ${employee.name}.`);
    } else {
      employee.deniedLeaves++;
      employee.morale = Math.max(0, employee.morale - 14);
      this.toast(`Đã từ chối đơn nghỉ của ${employee.name}. Tinh thần nhân viên giảm.`, 'error');
    }
    this.commit(); return true;
  }
  private processStaffShiftEnd() {
    const s = this.state;
    const reasons = ['có lịch khám sức khỏe', 'cần giải quyết việc gia đình', 'muốn nghỉ ngơi để hồi phục năng lượng', 'có việc cá nhân quan trọng'];
    for (const employee of [...s.employees]) {
      const assignment = employee.assignment ?? 'service';
      const onLeave = !!employee.leaveUntilDay && employee.leaveUntilDay > s.day;
      if (onLeave) {
        employee.energy = Math.min(100, (employee.energy ?? 100) + 38);
        continue;
      }
      employee.energy = assignment === 'off' ? Math.min(100, (employee.energy ?? 100) + 38) : Math.max(0, (employee.energy ?? 100) - 24);
      if (assignment === 'stock' && (employee.energy ?? 0) >= 15) {
        const nextOrder = s.pendingOrders.filter(order => order.arrivalDay > s.day).sort((a, b) => a.arrivalDay - b.arrivalDay)[0];
        if (nextOrder) nextOrder.arrivalDay = Math.max(s.day + 1, nextOrder.arrivalDay - 1);
      }
      const quitChance = employee.deniedLeaves >= 2 ? .04 + employee.deniedLeaves * .07 + (100 - employee.morale) * .003 : 0;
      if (quitChance && this.random() < quitChance) {
        const settledWages = this.settleDepartingStaffWages(employee);
        s.employees = s.employees.filter(item => item.uid !== employee.uid);
        s.staffLeaveRequests = s.staffLeaveRequests.filter(request => request.employeeUid !== employee.uid);
        this.toast(`${employee.name} đã xin nghỉ việc vì nhiều lần không được duyệt nghỉ.${settledWages ? ` Shop tự động trả ${settledWages.toLocaleString('vi-VN')}₫ lương còn nợ.` : ''}`, 'error');
        continue;
      }
      const alreadyRequested = s.staffLeaveRequests.some(request => request.employeeUid === employee.uid);
      if (!employee.leaveUntilDay && !alreadyRequested) {
        const leaveChance = .025 + (100 - employee.reliability) * .0012;
        if (this.random() < leaveChance) {
          const leaveDays = 1 + Math.floor(this.random() * 5);
          s.staffLeaveRequests.push({ employeeUid: employee.uid, requestedDay: s.day, days: leaveDays, reason: reasons[Math.floor(this.random() * reasons.length)] });
          this.toast(`${employee.name} vừa gửi một đơn xin nghỉ phép.`);
        }
      }
    }
  }
  private processStaffNewDay() {
    this.generateStaffApplicants();
    for (const employee of this.state.employees) {
      if (employee.leaveUntilDay && employee.leaveUntilDay <= this.state.day) delete employee.leaveUntilDay;
    }
  }

  private processAdvancedOperationsNewDay() {
    const s = this.state;
    for (const claim of [...s.returnCases]) {
      if (claim.deadlineDay >= s.day) continue;
      s.returnCases = s.returnCases.filter(item => item.id !== claim.id);
      this.applyShopReview(1, .9);
      s.followers = Math.max(0, s.followers - 12);
      this.toast(`Khiếu nại của ${claim.customerName} đã quá hạn. Uy tín shop giảm.`, 'error');
    }
    for (const appointment of [...s.vipAppointments]) {
      if (appointment.status === 'accepted' && appointment.scheduledDay < s.day) {
        s.vipAppointments = s.vipAppointments.filter(item => item.id !== appointment.id);
        s.reputation = Math.max(1, s.reputation - .2);
        this.toast(`Shop đã lỡ ngày khách VIP ${appointment.customerName} tới lấy hàng.`, 'error');
      } else if (appointment.status === 'offered' && appointment.scheduledDay <= s.day) {
        s.vipAppointments = s.vipAppointments.filter(item => item.id !== appointment.id);
      }
    }
    if (s.level >= 4 && !s.vipAppointments.length && s.day % 3 === 0) {
      s.vipAppointments.push(createVipAppointment(s));
      s.operationSequence++;
      this.toast('Có một khách VIP gửi yêu cầu đặt hàng trước.');
    }
    if (s.coutureOrder && s.day > s.coutureOrder.deadlineDay) {
      s.reputation = Math.max(1, s.reputation - .25);
      s.coutureOrder = null;
      s.coutureAvailableDay = s.day + 2;
      this.toast('Đơn couture đã quá hạn và bị hủy.', 'error');
    }
    if (s.reputationCrisis) {
      if (crisisComplete(s)) {
        s.reputation = Math.max(3.8, s.reputation);
        s.followers += 40;
        s.reputationCrisis = null;
        this.toast('Boutique đã vượt qua khủng hoảng uy tín và lấy lại niềm tin của khách!');
      } else if (s.day > s.reputationCrisis.deadlineDay) {
        s.followers = Math.max(0, Math.floor(s.followers * .8));
        s.reputation = Math.max(1, s.reputation - .35);
        s.reputationCrisis = null;
        this.toast('Kế hoạch xử lý khủng hoảng thất bại. Shop mất thêm người theo dõi.', 'error');
      }
    }
  }
  openShop() {
    if (this.state.phase !== 'preparation') return;
    if (this.state.gameOverReason) return;
    this.expireCampaignIfNeeded();
    if (!this.hasDisplayedStock()) { this.toast('Hãy trưng ít nhất một món lên sào, kệ, tủ hoặc ma-nơ-canh trước khi mở cửa.', 'error'); return; }
    this.state.phase = 'open';
    this.state.dayTimer = dayDuration(this.state);
    const event = currentEvent(this.state);
    this.state.dailyLuck = event.name;
    this.state.customerIndex = 0;
    this.state.currentCustomerId = null;
    this.state.customerMode = null;
    this.state.activeVisits = [];
    this.state.currentVisitId = null;
    this.state.patience = 0;
    this.state.nextArrivalIn = 3 + Math.floor(this.random() * 6);
    this.state.onlineNextOrderIn = 6 + Math.floor(this.random() * 7);
    this.state.regularOnlineNextOrderIn = 4 + Math.floor(this.random() * 5);
    const autoPacked = this.autoPackRegularOrdersWithStaff();
    this.processVipPickupsOnOpen();
    // Refresh danh sách khách cho ngày mới
    this.dayCustomersKey = -1;
    this.ensureDayCustomers();
    this.commit();
    this.emit({ type: 'customer' });
    this.toast(`Mở cửa ${gameDate(this.state.day)}! ${event.name}: ${event.description}`);
    if (autoPacked?.count) this.toast(`${autoPacked.employee.name} đã tự động đóng gói ${autoPacked.count} đơn thường.`);
  }
  serve(ids: string[], assistingStaffUid?: string, automatedByStaff = false): SaleResult | undefined {
    const customer = activeCustomer(this.state);
    if (!customer || !customerNeedsAdvice(this.state, customer) || !validOutfit(ids) || ids.some(id => displayedQuantity(this.state, id) < 1)) return;
    const items = ids.map(id => products.find(p => p.id === id)!);
    const total = items.reduce((sum, p) => sum + sellPrice(this.state, p), 0);
    const availableStaff = activeEmployees(this.state);
    const assistingStaff = assistingStaffUid
      ? availableStaff.find(employee => employee.uid === assistingStaffUid)
      : undefined;
    const score = Math.min(100, matchScore(this.state, customer, items) + (assistingStaff ? staffAdviceBonus(this.state) : 0));
    const thresh = threshold(customer);
    // Điều kiện mua: tổng tiền không vượt budget và score đạt chuẩn phong cách
    const withinBudget = total <= customer.budget;
    const styleMatch = score >= thresh;
    const success = withinBudget && styleMatch;
    const visit = activeVisit(this.state);
    const patienceRatio = visit?.maxPatience ? visit.patience / visit.maxPatience : .5;
    const reviewStars = this.inStoreReviewStars(score, total, customer, success, patienceRatio, !!assistingStaff);
    const viral = success && score >= 88 && customer.personality === 'Influencer';
    const followers = success ? viral ? 132 : Math.round(score / 12) : 0;
    let reason = '';
    if (success) {
      reason = viral
        ? 'Outfit này xứng đáng lên feed! Mình mê shop quá!'
        : score >= 88
        ? 'Đúng gu mình luôn! Cho mình mang về nhé!'
        : 'Xinh đó, mình lấy nhé. Cảm ơn bạn!';
    } else if (!withinBudget) {
      reason = `Bộ này xinh thật, nhưng vượt ngân sách ${customer.budget.toLocaleString('vi-VN')}₫ của mình mất rồi…`;
    } else {
      reason = 'Chưa đúng phong cách và yêu cầu mình tìm kiếm lắm. Hẹn bạn lần sau nhé!';
    }
    const xpEarned = success ? saleXp(items.length, viral, !!assistingStaff) : 0;
    const tipChance = assistingStaff ? .08 + assistingStaff.charm * .006 : 0;
    const tip = success && assistingStaff && this.random() < tipChance
      ? Math.max(5000, Math.round(total * (.015 + assistingStaff.charm * .00045) / 1000) * 1000)
      : 0;
    const result: SaleResult = { success, score, total: success ? total : 0, followers, viral, customer, products: items, reason, isSelfPick: false, isStaffAssisted: automatedByStaff, visitUid: this.state.currentVisitId ?? undefined, xpEarned, tip, staffName: assistingStaff?.name, reviewStars };
    const s = this.state;
    s.stats.served++;
    if (success) {
      for (const p of items) { s.inventory[p.id]--; this.consumeDisplayedItem(p.id); s.stats.soldProducts ??= {}; s.stats.soldProducts[p.id] = (s.stats.soldProducts[p.id] ?? 0) + 1; }
      s.money += total + tip; s.xp += xpEarned; s.stats.revenue += total + tip; s.stats.tips += tip;
      s.stats.costOfGoods += items.reduce((sum, p) => sum + p.buyPrice, 0);
      s.stats.sold += items.length; s.stats.happy++;
      s.stats.trendSales += items.filter(p => isTrending(s, p)).length;
      s.followers += followers; s.stats.followers += followers;
      if (assistingStaff) { assistingStaff.sales++; assistingStaff.shiftSales = (assistingStaff.shiftSales ?? 0) + 1; assistingStaff.tipsEarned += tip; assistingStaff.morale = Math.min(100, assistingStaff.morale + 1); }
      this.applyShopReview(reviewStars);
      this.progressCampaign(items, total, false);
      this.recordAdvancedSale(items, total, customer.name);
      if (this.shouldPublishCustomerReview(reviewStars, viral)) {
        const itemNames = items.map(item => item.name).join(' + ');
        const reviewText = viral
          ? 'Một chiếc boutique nhỏ xinh vừa xuất hiện trên feed của mình! Outfit đúng gu, chủ shop siêu có tâm. Mọi người phải ghé thử! #LittleBoutique #OOTD'
          : reviewStars === 5
            ? `${itemNames} đẹp hơn mình tưởng! Phối đúng gu, tư vấn rất có tâm. Chắc chắn mình sẽ quay lại.`
            : reviewStars === 4
              ? `${itemNames} khá xinh và hợp gu. Trải nghiệm mua sắm dễ chịu, mình sẽ ghé lại.`
              : `Món đồ ổn và shop thân thiện, nhưng trải nghiệm vẫn còn vài điểm có thể tốt hơn.`;
        this.publishCustomerReview(customer, reviewStars, reviewText, viral ? 2431 : Math.round(score / 3), viral);
      }
    } else {
      s.stats.walkouts = (s.stats.walkouts ?? 0) + 1;
      this.applyShopReview(reviewStars, .72);
      if (this.shouldPublishCustomerReview(reviewStars)) {
        const reviewText = reviewStars === 2
          ? 'Mình đã chờ khá lâu nhưng món được gợi ý vẫn chưa đúng nhu cầu. Mong shop cải thiện hơn.'
          : 'Lần này mình chưa tìm được món phù hợp. Trải nghiệm ở mức bình thường, hy vọng lần sau tốt hơn.';
        this.publishCustomerReview(customer, reviewStars, reviewText, reviewStars === 2 ? 3 : 8, false, 'miss');
      }
    }
    const loyalty = this.recordCustomerRelationship(customer, success, score, items.length);
    result.loyaltyPoints = loyalty.points;
    result.loyaltyTier = loyalty.tier;
    result.loyaltyReward = loyalty.reward;
    this.advanceCustomer(); this.commit(); this.emit({ type: 'sale', result }); return result;
  }
  customerSelfPickSale(items: Product[], total: number, score: number, speech: string): SaleResult | undefined {
    const customer = activeCustomer(this.state);
    if (!customer || this.state.customerMode !== 'browse' || !validOutfit(items.map(p => p.id)) || items.some(p => displayedQuantity(this.state, p.id) < 1)) return;
    const viral = score >= 88 && customer.personality === 'Influencer';
    const followers = viral ? 132 : Math.round(score / 12);
    const xpEarned = saleXp(items.length, viral, false);
    const reviewStars = this.inStoreReviewStars(score, total, customer, true, .75, false, true);
    const result: SaleResult = {
      success: true,
      score,
      total,
      followers,
      viral,
      customer,
      products: items,
      reason: speech,
      isSelfPick: true,
      visitUid: this.state.currentVisitId ?? undefined,
      xpEarned,
      reviewStars,
    };
    const s = this.state;
    s.stats.served++;
    for (const p of items) { s.inventory[p.id]--; this.consumeDisplayedItem(p.id); s.stats.soldProducts ??= {}; s.stats.soldProducts[p.id] = (s.stats.soldProducts[p.id] ?? 0) + 1; }
    s.money += total; s.xp += xpEarned; s.stats.revenue += total;
    s.stats.costOfGoods += items.reduce((sum, p) => sum + p.buyPrice, 0);
    s.stats.sold += items.length; s.stats.happy++;
    s.stats.trendSales += items.filter(p => isTrending(s, p)).length;
    s.followers += followers; s.stats.followers += followers;
    this.applyShopReview(reviewStars);
    this.progressCampaign(items, total, false);
    this.recordAdvancedSale(items, total, customer.name);
    if (this.shouldPublishCustomerReview(reviewStars, viral)) {
      const reviewText = reviewStars === 5
        ? `${items.map(item => item.name).join(' + ')} ở boutique xinh xỉu! Vừa ghé đã chốt đơn liền tay. #BoutiqueLover`
        : reviewStars === 4
          ? 'Mình tự chọn được món khá hợp gu, giá ổn và không gian shop rất dễ thương.'
          : 'Có món phù hợp nhưng lựa chọn vẫn chưa thật sự đa dạng. Trải nghiệm nhìn chung ổn.';
      this.publishCustomerReview(customer, reviewStars, reviewText, viral ? 1850 : Math.round(score / 4) + 10, viral, 'self');
    }
    const loyalty = this.recordCustomerRelationship(customer, true, score, items.length);
    result.loyaltyPoints = loyalty.points;
    result.loyaltyTier = loyalty.tier;
    result.loyaltyReward = loyalty.reward;
    this.advanceCustomer();
    this.commit();
    this.emit({ type: 'sale', result });
    return result;
  }
  customerSelfWalkout(reason: string) {
    const customer = activeCustomer(this.state);
    if (!customer) return;
    const s = this.state;
    s.stats.served++;
    s.stats.walkouts = (s.stats.walkouts ?? 0) + 1;
    const reviewStars = this.applyShopReview(2, .55);
    if (this.shouldPublishCustomerReview(reviewStars)) {
      this.publishCustomerReview(customer, reviewStars, 'Mình đã chờ nhưng chưa tìm được món phù hợp. Shop cần cải thiện lựa chọn và hỗ trợ khách tốt hơn.', 2, false, 'walkout');
    }
    const result: SaleResult = {
      success: false,
      score: 30,
      total: 0,
      followers: 0,
      viral: false,
      customer,
      products: [],
      reason,
      isSelfPick: true,
      visitUid: this.state.currentVisitId ?? undefined,
      xpEarned: 0,
      reviewStars,
    };
    const loyalty = this.recordCustomerRelationship(customer, false);
    result.loyaltyTier = loyalty.tier;
    this.advanceCustomer();
    this.commit();
    this.emit({ type: 'sale', result });
  }
  skipCustomer() {
    const customer = activeCustomer(this.state);
    if (!customer) return;
    this.state.stats.served++;
    this.state.stats.walkouts = (this.state.stats.walkouts ?? 0) + 1;
    const reviewStars = this.applyShopReview(1, .8);
    if (this.shouldPublishCustomerReview(reviewStars)) {
      this.publishCustomerReview(customer, reviewStars, 'Mình đã đến shop nhưng không được phục vụ và phải rời đi. Đây là một trải nghiệm rất thất vọng.', 1, false, 'ignored');
    }
    this.recordCustomerRelationship(customer, false);
    this.advanceCustomer();
    this.commit();
    this.emit({ type: 'customer' });
    this.toast('Khách đã rời shop. Hẹn một lần hợp gu hơn!', 'error');
  }
  private advanceCustomer() {
    this.state.lastCustomerId = this.state.currentCustomerId;
    this.state.customerIndex++;
    const currentUid = this.state.currentVisitId;
    if (currentUid) this.state.activeVisits = this.state.activeVisits.filter(visit => visit.uid !== currentUid);
    else if (this.state.currentCustomerId) {
      const index = this.state.activeVisits.findIndex(visit => visit.customerId === this.state.currentCustomerId);
      if (index >= 0) this.state.activeVisits.splice(index, 1);
    }
    this.state.currentVisitId = this.state.activeVisits[0]?.uid ?? null;
    this.syncFocusedVisit();
  }
  private maxConcurrentCustomers() {
    return Math.min(5, 2 + Math.floor(Math.max(0, this.state.level - 1) / 2) + Math.min(1, this.state.landLevel ?? 0));
  }
  private admitCustomer() {
    if (this.state.activeVisits.length >= this.maxConcurrentCustomers()) return false;
    this.ensureDayCustomers();
    const sourcePool = this.dayCustomers.length ? this.dayCustomers : customers.filter(c => (c.minLevel ?? 1) <= this.state.level);
    const activeIds = new Set(this.state.activeVisits.map(visit => visit.customerId));
    const pool = sourcePool.filter(customer => !activeIds.has(customer.id));
    if (!pool.length) return false;
    const returning = pool.filter(candidate => (this.state.customerLoyalty[candidate.id]?.purchases ?? 0) > 0);
    const returnChance = Math.min(.4, .08 + returning.length * .04);
    let customer = returning.length && this.random() < returnChance
      ? returning[Math.floor(this.random() * returning.length)]
      : pool[Math.floor(this.random() * pool.length)];
    if (customer.id === this.state.lastCustomerId && pool.length > 1) {
      const alternatives = pool.filter(candidate => candidate.id !== this.state.lastCustomerId);
      customer = alternatives[Math.floor(this.random() * alternatives.length)];
    }
    const isPicky = ['VIP', 'Khách kỹ tính'].includes(customer.personality);
    const needsAdvice = this.random() < (isPicky ? .65 : .35);
    const mode = needsAdvice ? 'advice' : 'browse';
    const loyaltyBonus = loyaltyPatienceBonus(this.state, customer.id);
    const maxPatience = (needsAdvice ? advicePatience(customer, this.state.level) : 12 + Math.floor(this.random() * 9)) + loyaltyBonus;
    const uid = `visit-${this.state.day}-${this.state.customerIndex}-${this.state.activeVisits.length}-${customer.id}-${Date.now().toString(36)}-${Math.floor(this.random() * 1e6).toString(36)}`;
    this.state.activeVisits.push({ uid, customerId: customer.id, mode, patience: maxPatience, maxPatience });
    if (!this.state.currentVisitId) this.state.currentVisitId = uid;
    this.syncFocusedVisit();
    this.commit();
    this.emit({ type: 'customer' });
    if (needsAdvice) this.toast(`${customer.name} cần tư vấn! Chạm vào khách hoặc khung chat để phối đồ.`);
    return true;
  }
  tick(overtimeAdviceVisitId = '') {
    if (this.state.phase !== 'open') return;
    if (!this.hasDisplayedStock()) {
      this.closeDay('sold-out');
      return;
    }
    if (!this.state.activeVisits.length && this.state.currentCustomerId) {
      const customer = activeCustomer(this.state);
      if (customer) {
        const mode = this.state.customerMode === 'browse' ? 'browse' : 'advice';
        const maxPatience = mode === 'advice' ? advicePatience(customer, this.state.level) : Math.max(15, this.state.patience);
        const uid = `legacy-runtime-${this.state.day}-${this.state.customerIndex}-${customer.id}`;
        this.state.activeVisits.push({ uid, customerId: customer.id, mode, patience: this.state.patience || maxPatience, maxPatience });
        this.state.currentVisitId = uid;
      }
    } else {
      const focused = this.state.activeVisits.find(visit => visit.uid === this.state.currentVisitId);
      if (focused && focused.customerId === this.state.currentCustomerId) {
        if (this.state.customerMode) focused.mode = this.state.customerMode;
        if (this.state.patience !== focused.patience) focused.patience = this.state.patience;
      }
    }
    this.state.dayTimer = Math.max(0, this.state.dayTimer - 1);
    const overtimeAdviceVisit = !this.state.dayTimer && overtimeAdviceVisitId
      ? this.state.activeVisits.find(visit => visit.uid === overtimeAdviceVisitId && visit.mode === 'advice')
      : undefined;
    if (!this.state.dayTimer && !overtimeAdviceVisit) { this.closeDay('time'); return; }
    if (overtimeAdviceVisit) {
      // Keep only the consultation that was already open when trading time ended.
      // No new visitors or online orders are processed during this short grace period.
      this.state.activeVisits = [overtimeAdviceVisit];
      this.state.currentVisitId = overtimeAdviceVisit.uid;
      this.syncFocusedVisit();
    } else {
      this.processOnlineChannel();
      this.state.nextArrivalIn = Math.max(0, this.state.nextArrivalIn - 1);
      if (!this.state.nextArrivalIn && this.state.activeVisits.length < this.maxConcurrentCustomers()) {
        this.state.nextArrivalIn = arrivalDelay(this.state, this.random);
        this.admitCustomer();
        const groupChance = Math.min(.24, .015 + Math.max(0, this.state.level - 1) * .03 + (this.state.landLevel ?? 0) * .025);
        if (this.state.activeVisits.length < this.maxConcurrentCustomers() && this.random() < groupChance) this.admitCustomer();
      }
    }

    for (const visit of this.state.activeVisits) visit.patience = Math.max(0, visit.patience - 1);
    this.syncFocusedVisit();
    if (this.processStaffAssistance()) return;
    const expired = this.state.activeVisits.filter(visit => visit.patience <= 0).map(visit => visit.uid);
    for (const uid of expired) {
      const visit = this.state.activeVisits.find(candidate => candidate.uid === uid);
      if (!visit || !this.focusVisit(uid)) continue;
      const customer = activeCustomer(this.state);
      if (!customer) continue;
      if (visit.mode === 'advice') this.skipCustomer();
      else {
        const pick = evaluateCustomerSelfPick(this.state, customer);
        if (pick.success) this.customerSelfPickSale(pick.items, pick.total, pick.score, pick.speech);
        else this.customerSelfWalkout(pick.speech);
      }
    }
    if (!this.state.dayTimer && !this.state.activeVisits.some(visit => visit.uid === overtimeAdviceVisitId)) {
      this.closeDay('time');
      return;
    }
    if (this.state.dayTimer % 5 === 0) this.save.write(this.state);
  }

  private onlineWarehouseQuantity(productId: string) {
    return Math.max(0, (this.state.inventory[productId] ?? 0) - displayedQuantity(this.state, productId));
  }

  private onlineOrderProductIds(order: OnlineOrder) {
    const ids = order.productIds?.length ? order.productIds : [order.productId];
    return ids.filter((id, index) => products.some(product => product.id === id) && ids.indexOf(id) === index);
  }

  private onlineReservedQuantity(productId: string, exceptOrderId = '') {
    const express = this.state.onlineOrders.reduce((total, order) => total + (order.id !== exceptOrderId && this.onlineOrderProductIds(order).includes(productId) ? 1 : 0), 0);
    const regular = this.state.regularOnlineOrders.reduce((total, order) => total + (order.productIds.includes(productId) ? 1 : 0), 0);
    return express + regular;
  }

  private onlineHandOverQuantity(productId: string, orderId: string) {
    return Math.max(0, (this.state.inventory[productId] ?? 0) - this.onlineReservedQuantity(productId, orderId));
  }

  private processOnlineChannel() {
    const s = this.state;
    if (!s.onlineChannelEnabled || !s.onlineListings.length) return;

    // Express orders keep the original real-time courier flow and get first
    // claim on their tick. Regular demand is evaluated independently below.
    if (s.onlineOrders.length < 5) {
      s.onlineNextOrderIn = Math.max(0, s.onlineNextOrderIn - 1);
      if (!s.onlineNextOrderIn) {
        s.onlineNextOrderIn = 7 + Math.floor(this.random() * 8);
        const expressEligible = s.onlineListings.filter(productId => this.onlineWarehouseQuantity(productId) > this.onlineReservedQuantity(productId));
        const expressChance = Math.min(.36, onlineOrderChance(s, expressEligible) * .42);
        if (expressEligible.length && this.random() < expressChance) this.createOnlineOrder(this.pickOnlineBasket(expressEligible));
      }
    }

    s.regularOnlineNextOrderIn = Math.max(0, s.regularOnlineNextOrderIn - 1);
    if (!s.regularOnlineNextOrderIn) {
      s.regularOnlineNextOrderIn = 5 + Math.floor(this.random() * 7);
      if (s.regularOnlineOrders.length < this.regularOnlineCapacity()) {
        const regularEligible = s.onlineListings.filter(productId => this.onlineWarehouseQuantity(productId) > this.onlineReservedQuantity(productId));
        if (regularEligible.length && this.random() < Math.min(.72, onlineOrderChance(s, regularEligible) * 1.35)) {
          if (this.createRegularOnlineOrder(this.pickOnlineBasket(regularEligible), 'storefront')) this.commit();
        }
      }
    }
  }

  private pickOnlineBasket(eligible: string[]) {
    const s = this.state;
    const candidates = eligible.map(id => ({ id, weight: onlineProductDemandWeight(s, products.find(product => product.id === id)!) }));
    const sizeRoll = this.random();
    const requestedSize = sizeRoll < .18 ? 3 : sizeRoll < .58 ? 2 : 1;
    const basketSize = Math.min(requestedSize, candidates.length);
    const productIds: string[] = [];
    while (productIds.length < basketSize && candidates.length) {
      const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
      let roll = this.random() * totalWeight;
      let selectedIndex = candidates.findIndex(item => (roll -= item.weight) <= 0);
      if (selectedIndex < 0) selectedIndex = candidates.length - 1;
      productIds.push(candidates.splice(selectedIndex, 1)[0].id);
    }
    return productIds;
  }

  private createOnlineOrder(productIds: string | string[]) {
    const s = this.state;
    const ids = [...new Set(Array.isArray(productIds) ? productIds : [productIds])].slice(0, 6);
    const orderedProducts = ids.map(id => products.find(item => item.id === id)).filter((product): product is Product => !!product);
    if (!orderedProducts.length || orderedProducts.length !== ids.length || s.phase !== 'open' || s.onlineOrders.length >= 5 || ids.some(id => this.onlineWarehouseQuantity(id) <= this.onlineReservedQuantity(id))) return false;
    const price = orderedProducts.reduce((total, product) => total + sellPrice(s, product), 0);
    const fee = Math.max(1000, Math.round(price * .14));
    const firstNames = ['An', 'Linh', 'Nhi', 'Vy', 'Hân', 'Thư', 'Ngân', 'Mai', 'Châu', 'Trâm'];
    const suffixes = ['closet', 'daily', 'wears', 'style', 'mood', 'studio'];
    const customerName = firstNames[Math.floor(this.random() * firstNames.length)];
    const order: OnlineOrder = {
      id: `online-${s.day}-${Date.now().toString(36)}-${Math.floor(this.random() * 1e6).toString(36)}`,
      productId: ids[0], productIds: ids, customerName, customerHandle: `@${customerName.toLowerCase()}_${suffixes[Math.floor(this.random() * suffixes.length)]}`,
      price, fee, createdDay: s.day, courierVariant: Math.floor(this.random() * 3),
    };
    s.onlineOrders.push(order);
    this.commit();
    this.toast(`Có đơn hỏa tốc mới! Shipper đang chờ lấy ${orderedProducts.length} sản phẩm.`);
    return true;
  }

  regularOnlineCapacity() {
    return [0, 6, 10, 15][Math.max(1, Math.min(3, this.state.onlinePackingLevel))];
  }

  private createRegularOnlineOrder(productIds: string[], source: 'storefront' | 'livestream', discount = 0) {
    const s = this.state;
    const ids = [...new Set(productIds)].slice(0, 6);
    const orderedProducts = ids.map(id => products.find(item => item.id === id)).filter((product): product is Product => !!product);
    if (!s.onlineChannelEnabled || !orderedProducts.length || orderedProducts.length !== ids.length || s.regularOnlineOrders.length >= this.regularOnlineCapacity()
      || ids.some(id => this.onlineWarehouseQuantity(id) <= this.onlineReservedQuantity(id))) return false;
    const listPrice = orderedProducts.reduce((total, product) => total + sellPrice(s, product), 0);
    const price = Math.max(1, Math.round(listPrice * (1 - Math.max(0, Math.min(.25, discount)))));
    const fee = Math.max(1000, Math.round(price * .08));
    const firstNames = ['An', 'Linh', 'Nhi', 'Vy', 'Hân', 'Thư', 'Ngân', 'Mai', 'Châu', 'Trâm'];
    const suffixes = ['closet', 'daily', 'wears', 'style', 'mood', 'studio'];
    const customerName = firstNames[Math.floor(this.random() * firstNames.length)];
    s.regularOnlineOrders.push({
      id: `regular-${s.day}-${Date.now().toString(36)}-${Math.floor(this.random() * 1e6).toString(36)}`,
      productIds: ids,
      customerName,
      customerHandle: `@${customerName.toLowerCase()}_${suffixes[Math.floor(this.random() * suffixes.length)]}`,
      price,
      fee,
      createdDay: s.day,
      dueDay: s.day + 1,
      packed: false,
      source,
    });
    const autoPacked = this.autoPackRegularOrdersWithStaff();
    if (autoPacked?.count) this.toast(`${autoPacked.employee.name} đã tự động đóng gói đơn mới.`);
    return true;
  }

  beginLivestream() {
    const s = this.state;
    if (s.phase === 'open' || !s.onlineChannelEnabled || !s.onlineListings.length || s.lastLivestreamDay === s.day) return false;
    if (s.regularOnlineOrders.length >= this.regularOnlineCapacity()) {
      this.toast('Hàng chờ đơn thường đã đầy. Hãy giao bớt đơn trước khi livestream.', 'error');
      return false;
    }
    s.lastLivestreamDay = s.day;
    this.commit();
    return true;
  }

  resolveLivestreamRound(productIds: string[], request: LivestreamRequest, discount: number, responseDelaySeconds = 0): LivestreamRoundResult {
    const s = this.state;
    const selected = [...new Set(productIds)].slice(0, 1).map(id => products.find(product => product.id === id)).filter((product): product is Product => !!product);
    const listTotal = selected.reduce((sum, product) => sum + sellPrice(s, product), 0);
    const total = Math.round(listTotal * (1 - discount));
    const fee = Math.max(1000, Math.round(total * .08));
    const stockAvailable = selected.length > 0 && selected.every(product => this.onlineWarehouseQuantity(product.id) > this.onlineReservedQuantity(product.id));
    const styleMatch = selected.some(product => product.style === request.style || product.secondaryStyles?.includes(request.style as Style));
    const categoryMatch = selected.some(product => product.category === request.category);
    const budgetRatio = request.budget > 0 ? total / request.budget : 2;
    const budgetScore = budgetRatio <= 1 ? 22 : budgetRatio <= 1.08 ? 10 : budgetRatio <= 1.18 ? 3 : 0;
    const trendBonus = selected.some(product => isTrending(s, product)) ? 12 : 0;
    const eventLuck = currentEvent(s).extra > 0 ? 5 : currentEvent(s).discount < 1 ? 3 : 0;
    const score = Math.max(0, Math.min(100, (styleMatch ? 34 : 0) + (categoryMatch ? 26 : 0) + 10 + budgetScore + trendBonus + eventLuck));
    const channelTrust = Math.max(0, Math.min(.12, (s.onlineRating - 3) * .045 + Math.log10(Math.max(10, s.followers)) * .015));
    const responsePenalty = Math.min(.45, Math.max(0, responseDelaySeconds - 4) * .035);
    const intentStrength = Math.max(-.12, Math.min(.15, request.intentStrength ?? 0));
    const discountImpact = discount * (.75 + Math.max(0, Math.min(.8, request.discountSensitivity ?? 0)));
    const conversionChance = Math.max(.03, Math.min(.92, .04 + score * .0072 + discountImpact + channelTrust + intentStrength - responsePenalty));
    const orderCreated = stockAvailable && selected.length === 1 && this.random() < conversionChance
      && this.createRegularOnlineOrder(selected.map(product => product.id), 'livestream', discount);
    const viewersDelta = Math.round((score - 52) / 7) + (orderCreated ? 9 : -2);
    const likesGain = Math.max(1, Math.round(score / 7) + (discount > 0 ? 4 : 0));
    const followerGain = Math.max(0, Math.round((score - 25) / 18)) + (orderCreated ? 2 : 0);
    s.followers += followerGain;
    s.stats.followers += followerGain;
    const reason = !stockAvailable ? 'Sản phẩm vừa hết lượng có thể bán'
      : budgetRatio > 1.18 ? 'Tổng giá vượt khá xa ngân sách'
          : !styleMatch ? 'Sản phẩm ghim chưa đúng phong cách khách hỏi'
            : !categoryMatch ? 'Thiếu đúng loại sản phẩm khách cần'
              : orderCreated ? 'Khách đã nhập địa chỉ và xác nhận thanh toán' : 'Khách còn do dự nên chưa hoàn tất thanh toán';
    this.commit();
    return { score, orderCreated, followerGain, total, listTotal, fee, conversionChance, viewersDelta, likesGain, reason };
  }

  previewLivestreamProduct(productId: string, request: LivestreamRequest, discount: number, responseDelaySeconds = 0) {
    const product = products.find(item => item.id === productId);
    if (!product) return { score: 0, conversionChance: 0 };
    const total = Math.round(sellPrice(this.state, product) * (1 - discount));
    const styleMatch = product.style === request.style || product.secondaryStyles?.includes(request.style as Style);
    const categoryMatch = product.category === request.category;
    const budgetRatio = request.budget > 0 ? total / request.budget : 2;
    const budgetScore = budgetRatio <= 1 ? 22 : budgetRatio <= 1.08 ? 10 : budgetRatio <= 1.18 ? 3 : 0;
    const trendBonus = isTrending(this.state, product) ? 12 : 0;
    const eventLuck = currentEvent(this.state).extra > 0 ? 5 : currentEvent(this.state).discount < 1 ? 3 : 0;
    const score = Math.max(0, Math.min(100, (styleMatch ? 34 : 0) + (categoryMatch ? 26 : 0) + 10 + budgetScore + trendBonus + eventLuck));
    const channelTrust = Math.max(0, Math.min(.12, (this.state.onlineRating - 3) * .045 + Math.log10(Math.max(10, this.state.followers)) * .015));
    const responsePenalty = Math.min(.45, Math.max(0, responseDelaySeconds - 4) * .035);
    const intentStrength = Math.max(-.12, Math.min(.15, request.intentStrength ?? 0));
    const discountImpact = discount * (.75 + Math.max(0, Math.min(.8, request.discountSensitivity ?? 0)));
    return { score, conversionChance: Math.max(.03, Math.min(.92, .04 + score * .0072 + discountImpact + channelTrust + intentStrength - responsePenalty)) };
  }

  packRegularOnlineOrder(orderId: string) {
    const s = this.state;
    const order = s.regularOnlineOrders.find(item => item.id === orderId);
    if (!order || s.phase === 'open' || order.packed) return false;
    if (order.productIds.some(id => (s.inventory[id] ?? 0) < 1)) {
      this.toast('Kho không còn đủ sản phẩm đã giữ cho đơn này.', 'error');
      return false;
    }
    order.packed = true;
    this.commit();
    this.toast(`Đã đóng gói đơn của ${order.customerHandle}.`);
    return true;
  }

  private autoPackRegularOrdersWithStaff() {
    const employee = activeEmployees(this.state).find(item => item.assignment === 'stock');
    if (!employee) return;
    const pending = this.state.regularOnlineOrders.filter(order => !order.packed
      && order.productIds.every(id => (this.state.inventory[id] ?? 0) >= 1));
    if (!pending.length) return;
    for (const order of pending) order.packed = true;
    employee.energy = Math.max(0, (employee.energy ?? 100) - Math.min(18, pending.length * 3));
    return { employee, count: pending.length };
  }

  packAllRegularOrdersWithStaff() {
    const s = this.state;
    if (s.phase === 'open') return false;
    if (!activeEmployees(s).some(item => item.assignment === 'stock')) {
      this.toast('Hãy phân công ít nhất một nhân viên kho để đóng tất cả đơn.', 'error');
      return false;
    }
    const autoPacked = this.autoPackRegularOrdersWithStaff();
    if (!autoPacked) return false;
    this.commit();
    this.toast(`${autoPacked.employee.name} đã đóng gói ${autoPacked.count} đơn thường.`);
    return true;
  }

  upgradeOnlinePacking() {
    const s = this.state;
    if (s.phase === 'open' || s.onlinePackingLevel >= 3) return false;
    const cost = s.onlinePackingLevel === 1 ? 350000 : 900000;
    if (s.money < cost) {
      this.toast(`Cần ${cost.toLocaleString('vi-VN')}₫ để nâng khu đóng gói.`, 'error');
      return false;
    }
    s.money -= cost;
    s.stats.spent += cost;
    s.onlinePackingLevel++;
    this.commit();
    this.toast(`Khu đóng gói đã lên cấp ${s.onlinePackingLevel}.`);
    return true;
  }

  fulfillPackedRegularOrders() {
    const s = this.state;
    if (s.phase !== 'open') return false;
    const packed = s.regularOnlineOrders.filter(order => order.packed);
    if (!packed.length) return false;
    let netTotal = 0;
    let itemCount = 0;
    for (const order of packed) {
      const orderProducts = order.productIds.map(id => products.find(product => product.id === id)).filter((product): product is Product => !!product);
      for (const product of orderProducts) {
        s.inventory[product.id] = Math.max(0, (s.inventory[product.id] ?? 0) - 1);
        s.stats.soldProducts ??= {};
        s.stats.soldProducts[product.id] = (s.stats.soldProducts[product.id] ?? 0) + 1;
      }
      const net = Math.max(0, order.price - order.fee);
      netTotal += net;
      itemCount += orderProducts.length;
      s.stats.costOfGoods += orderProducts.reduce((sum, product) => sum + buyPrice(s, product), 0);
      s.onlineSales++;
      s.stats.served++;
      s.stats.happy++;
      s.xp += 3;
      this.progressCampaign(orderProducts, order.price, true);
      this.recordAdvancedSale(orderProducts, order.price, order.customerName);
    }
    s.money += netTotal;
    s.stats.revenue += netTotal;
    s.stats.sold += itemCount;
    s.regularOnlineOrders = s.regularOnlineOrders.filter(order => !order.packed);
    const stars = this.applyOnlineReview(4.5, .45);
    this.commit();
    this.toast(`Shipper tổng đã nhận ${packed.length} kiện · +${netTotal.toLocaleString('vi-VN')}₫ · ${stars.toFixed(1)} sao.`);
    return true;
  }

  cancelRegularOnlineOrder(orderId: string) {
    const s = this.state;
    const order = s.regularOnlineOrders.find(item => item.id === orderId);
    if (!order || s.phase === 'open') return false;
    s.regularOnlineOrders = s.regularOnlineOrders.filter(item => item.id !== orderId);
    this.applyOnlineReview(3, .35);
    this.commit();
    this.toast('Đã hủy đơn thường. Đánh giá online bị ảnh hưởng nhẹ.', 'error');
    return true;
  }

  listOnlineProduct(productId: string) {
    const s = this.state;
    const product = products.find(item => item.id === productId);
    if (!product || s.phase === 'open') { this.toast('Chỉ chỉnh gian hàng online trước hoặc sau giờ bán.', 'error'); return false; }
    if (this.onlineWarehouseQuantity(productId) < 1) { this.toast('Sản phẩm này không còn trong kho để đăng bán.', 'error'); return false; }
    if (s.onlineListings.includes(productId)) return false;
    s.onlineListings.push(productId);
    s.onlineChannelEnabled = true;
    this.commit(); this.toast(`Đã đăng ${product.name} lên kênh online.`); return true;
  }

  removeOnlineProduct(productId: string) {
    if (this.state.phase === 'open') { this.toast('Không thể gỡ sản phẩm khi shop đang mở cửa.', 'error'); return false; }
    const before = this.state.onlineListings.length;
    this.state.onlineListings = this.state.onlineListings.filter(id => id !== productId);
    if (before === this.state.onlineListings.length) return false;
    this.commit(); return true;
  }

  toggleOnlineChannel() {
    if (this.state.phase === 'open') { this.toast('Chỉ có thể bật hoặc tắt kênh online ngoài giờ bán.', 'error'); return false; }
    this.state.onlineChannelEnabled = !this.state.onlineChannelEnabled;
    this.commit();
    this.toast(this.state.onlineChannelEnabled ? 'Kênh online đã mở và sẵn sàng nhận đơn.' : 'Kênh online đã tạm đóng. Sản phẩm đang đăng vẫn được giữ nguyên.');
    return true;
  }

  fulfillOnlineOrder(orderId: string, handedProductIds: string | string[]) {
    const s = this.state;
    const order = s.onlineOrders.find(item => item.id === orderId);
    const handedIds = [...new Set(Array.isArray(handedProductIds) ? handedProductIds : [handedProductIds])];
    const handedProducts = handedIds.map(id => products.find(item => item.id === id)).filter((product): product is Product => !!product);
    const requestedIds = order ? this.onlineOrderProductIds(order) : [];
    if (!order || s.phase !== 'open' || handedProducts.length !== requestedIds.length || handedProducts.length !== handedIds.length || handedIds.some(id => this.onlineHandOverQuantity(id, orderId) < 1)) {
      this.toast(`Hãy chọn đủ ${requestedIds.length || 1} sản phẩm còn trong kho trước khi giao.`, 'error');
      return false;
    }
    for (const handedProductId of handedIds) {
      const warehouseAfterReservations = this.onlineWarehouseQuantity(handedProductId) - this.onlineReservedQuantity(handedProductId, orderId);
      if (warehouseAfterReservations < 1) this.consumeDisplayedItem(handedProductId);
      s.inventory[handedProductId] = Math.max(0, (s.inventory[handedProductId] ?? 0) - 1);
    }
    s.onlineOrders = s.onlineOrders.filter(item => item.id !== orderId);
    const correct = handedIds.length === requestedIds.length && handedIds.every(id => requestedIds.includes(id));
    if (!correct) {
      const stars = this.applyOnlineReview(1, 1.15);
      this.publishOnlineReview(order, stars, 'Shop giao nhầm sản phẩm mình đã đặt. Mong shop kiểm tra đơn kỹ hơn trước khi gửi cho khách.', 1);
      this.commit();
      this.toast(`Giao nhầm sản phẩm. Khách đánh giá ${stars} sao và uy tín shop bị giảm mạnh.`, 'error');
      return true;
    }
    const net = Math.max(0, order.price - order.fee);
    s.money += net;
    s.stats.revenue += net;
    s.stats.costOfGoods += handedProducts.reduce((total, product) => total + buyPrice(s, product), 0);
    s.stats.sold += handedProducts.length;
    s.stats.served++;
    s.stats.happy++;
    s.stats.soldProducts ??= {};
    for (const product of handedProducts) s.stats.soldProducts[product.id] = (s.stats.soldProducts[product.id] ?? 0) + 1;
    s.onlineSales++;
    const basePrice = handedProducts.reduce((total, product) => total + product.sellPrice, 0);
    const averageQuality = handedProducts.reduce((total, product) => total + product.quality, 0) / handedProducts.length;
    const priceRatio = order.price / Math.max(1, basePrice);
    const stars = this.applyOnlineReview(3.25 + (averageQuality - 75) / 14 - Math.max(0, priceRatio - 1) * 1.35 + Math.max(0, 1 - priceRatio) * .35);
    const onlineReviewText = stars >= 5
      ? 'Đơn được chuẩn bị rất chỉn chu, sản phẩm đẹp đúng như ảnh và giao nhanh. Mình sẽ quay lại mua tiếp!'
      : stars >= 4
        ? 'Sản phẩm đúng mô tả, đóng gói xinh và trải nghiệm mua online rất ổn.'
        : 'Đơn hàng đã nhận đủ. Sản phẩm ổn nhưng shop vẫn có thể cải thiện thêm trải nghiệm giao hàng.';
    this.publishOnlineReview(order, stars, onlineReviewText, stars >= 5 ? 12 : stars >= 4 ? 5 : 2);
    const newFollowers = 1 + Math.floor(this.random() * 3);
    s.followers += newFollowers;
    s.stats.followers += newFollowers;
    s.xp += 4;
    this.progressCampaign(handedProducts, order.price, true);
    this.recordAdvancedSale(handedProducts, order.price, order.customerName);
    this.commit();
    this.toast(`Giao đúng đơn online: +${net.toLocaleString('vi-VN')}₫ sau phí · khách đánh giá ${stars.toFixed(1)} sao.`);
    return true;
  }

  cancelOutOfStockOnlineOrder(orderId: string) {
    const s = this.state;
    const order = s.onlineOrders.find(item => item.id === orderId);
    if (!order || s.phase !== 'open' || this.onlineWarehouseQuantity(order.productId) > 0) return false;
    s.onlineOrders = s.onlineOrders.filter(item => item.id !== orderId);
    s.onlineOrders = s.onlineOrders.filter(item => item.id !== orderId);
    const stars = this.applyOnlineReview(2, .7);
    this.publishOnlineReview(order, stars, 'Mình đặt hàng nhưng shop báo hết sản phẩm sau đó. Mong shop cập nhật tồn kho online chính xác hơn.', 1);
    this.commit();
    this.toast('Đã báo hết hàng và hủy đơn. Khách đánh giá 2 sao nhưng mức phạt nhẹ hơn bỏ quên đơn.', 'error');
    return true;
  }

  cancelOnlineOrder(orderId: string) {
    const order = this.state.onlineOrders.find(item => item.id === orderId);
    if (!order) return false;
    this.state.onlineOrders = this.state.onlineOrders.filter(item => item.id !== orderId);
    this.commit();
    this.toast('Đã hủy đơn online. Đơn không tạo doanh thu và không ảnh hưởng tới shop.');
    return true;
  }

  private processStaffAssistance() {
    const staff = activeEmployees(this.state).filter(employee => (employee.assignment ?? 'service') === 'service').sort((a, b) => (b.service + b.persuasion + b.reliability * .5) - (a.service + a.persuasion + a.reliability * .5));
    if (!staff.length) return false;
    const assigned = new Set(this.state.activeVisits.map(visit => visit.assignedStaffUid).filter((uid): uid is string => !!uid));
    let changed = false;
    for (const visit of [...this.state.activeVisits]) {
      if (visit.mode !== 'advice') continue;
      if (visit.assignedStaffUid) {
        visit.staffResolveIn = Math.max(0, (visit.staffResolveIn ?? 1) - 1);
        if (!visit.staffResolveIn) return this.completeStaffAdvice(visit.uid, visit.assignedStaffUid) || changed;
        continue;
      }
      if (visit.staffAttempted || visit.maxPatience - visit.patience < 3) continue;
      const employee = staff.find(candidate => !assigned.has(candidate.uid));
      if (!employee) continue;
      visit.staffAttempted = true;
      changed = true;
      const chance = Math.min(.82, .08 + employee.service * .004 + employee.persuasion * .002 + employee.reliability * .001);
      if (this.random() >= chance) continue;
      visit.assignedStaffUid = employee.uid;
      visit.staffResolveIn = 4;
      assigned.add(employee.uid);
      this.toast(`${employee.name} đã chủ động nhận tư vấn cho khách.`);
    }
    if (changed) this.commit();
    return false;
  }

  private completeStaffAdvice(visitUid: string, employeeUid: string) {
    const visit = this.state.activeVisits.find(candidate => candidate.uid === visitUid);
    const employee = activeEmployees(this.state).find(candidate => candidate.uid === employeeUid);
    if (!visit || !employee || !this.focusVisit(visitUid)) return false;
    const customer = activeCustomer(this.state);
    if (!customer) return false;
    const suggestion = evaluateCustomerSelfPick(this.state, customer);
    if (!suggestion.items.length) {
      delete visit.assignedStaffUid;
      delete visit.staffResolveIn;
      visit.patience = Math.min(visit.maxPatience, visit.patience + 5);
      this.commit();
      this.toast(`${employee.name} chưa tìm được set phù hợp. Khách vẫn đang chờ bạn hỗ trợ.`, 'error');
      return false;
    }
    return !!this.serve(suggestion.items.map(item => item.id), employee.uid, true);
  }
  private hasDisplayedStock() {
    return Object.values(displayedInventory(this.state)).some(quantity => quantity > 0);
  }

  takeLoan(amount: number) {
    if (this.state.phase === 'open') { this.toast('Hãy xử lý khoản vay trước hoặc sau ca bán.', 'error'); return false; }
    const rounded = Math.round(amount / 10000) * 10000;
    const borrowed = this.state.loan?.principal ?? 0;
    const available = LOAN_MAX - borrowed;
    const minimum = Math.min(LOAN_MIN, available);
    if (!Number.isFinite(rounded) || available <= 0 || rounded < minimum || rounded > available) {
      this.toast(`Khoản vay cần từ ${minimum.toLocaleString('vi-VN')}₫ đến ${available.toLocaleString('vi-VN')}₫.`, 'error');
      return false;
    }
    if (this.state.loan) {
      this.state.loan.principal += rounded;
      this.state.loan.balance += rounded;
      this.state.loan.dailyRate = LOAN_DAILY_RATE;
    } else {
      this.state.loan = { principal: rounded, balance: rounded, dailyRate: LOAN_DAILY_RATE, paymentDue: 0, issuedDay: this.state.day, lastInterestDay: 0 };
    }
    this.state.money += rounded;
    this.commit();
    this.toast(`Đã giải ngân ${rounded.toLocaleString('vi-VN')}₫. Bắt đầu trả từ ${gameDate(3)}.`);
    return true;
  }

  payLoanDue() {
    const loan = this.state.loan;
    if (this.state.gameOverReason || this.state.phase === 'open' || !loan || loan.paymentDue <= 0) return false;
    const amount = Math.min(loan.balance, loan.paymentDue);
    if (this.state.money < amount) { this.toast(`Cần ${amount.toLocaleString('vi-VN')}₫ để thanh toán kỳ vay.`, 'error'); return false; }
    this.state.money -= amount;
    loan.balance = Math.max(0, loan.balance - amount);
    loan.paymentDue = 0;
    this.state.loanOverdueDays = 0;
    this.commit();
    this.toast(`Đã thanh toán ${amount.toLocaleString('vi-VN')}₫ tiền vay.`);
    return true;
  }

  payRentDue() {
    if (this.state.gameOverReason || this.state.phase === 'open' || this.state.rentDue <= 0) return false;
    if (this.state.money < this.state.rentDue) { this.toast(`Cần ${this.state.rentDue.toLocaleString('vi-VN')}₫ để thanh toán tiền thuê.`, 'error'); return false; }
    const amount = this.state.rentDue;
    this.state.money -= amount;
    this.state.rentDue = 0;
    this.state.rentOverdueDays = 0;
    this.commit();
    this.toast(`Đã thanh toán ${amount.toLocaleString('vi-VN')}₫ tiền thuê mặt bằng.`);
    return true;
  }

  payStaffWages(uid?: string) {
    if (this.state.gameOverReason || this.state.phase === 'open') return false;
    const employees = uid
      ? this.state.employees.filter(employee => employee.uid === uid)
      : this.state.employees.filter(employee => (employee.unpaidWages ?? 0) > 0);
    const amount = employees.reduce((sum, employee) => sum + (employee.unpaidWages ?? 0), 0);
    if (!employees.length || amount <= 0) return false;
    if (this.state.money < amount) {
      this.toast(`Cần ${amount.toLocaleString('vi-VN')}₫ để thanh toán khoản lương này.`, 'error');
      return false;
    }
    this.state.money -= amount;
    this.state.stats.staffWages += amount;
    for (const employee of employees) {
      employee.unpaidWages = 0;
      employee.unpaidShifts = 0;
      employee.morale = Math.min(100, employee.morale + 4);
    }
    this.commit();
    this.toast(uid ? `Đã thanh toán ${amount.toLocaleString('vi-VN')}₫ tiền lương.` : `Đã thanh toán toàn bộ ${amount.toLocaleString('vi-VN')}₫ tiền lương.`);
    return true;
  }

  closeDay(reason: 'manual' | 'time' | 'sold-out' = 'manual') {
    if (this.state.phase !== 'open') return;
    const missedOrders = [...this.state.onlineOrders];
    const missedOnlineOrders = missedOrders.length;
    if (missedOnlineOrders) {
      for (const order of missedOrders) {
        const stars = this.applyOnlineReview(1.5, .85);
        this.publishOnlineReview(order, stars, 'Đơn của mình không được xử lý trước khi shop đóng cửa. Trải nghiệm mua online lần này chưa tốt.', 0);
      }
      this.state.onlineOrders = [];
      this.toast(`${missedOnlineOrders} đơn online chưa giao trước khi đóng cửa. Đánh giá kênh bán bị giảm.`, 'error');
    }
    this.state.phase = 'closed';
    this.state.currentCustomerId = null;
    this.state.customerMode = null;
    this.state.activeVisits = [];
    this.state.currentVisitId = null;
    this.state.patience = 0;
    this.state.nextArrivalIn = 0;
    this.state.onlineNextOrderIn = 8;
    const rent = dailyRent(this.state);
    this.state.stats.rent = rent;
    this.state.rentDue += rent;
    const loan = this.state.loan;
    if (this.state.day >= 3 && loan && loan.balance > 0 && loan.lastInterestDay < this.state.day) {
      const interest = Math.max(1, Math.round(loan.balance * loan.dailyRate));
      loan.balance += interest;
      loan.lastInterestDay = this.state.day;
      this.state.stats.loanInterest = interest;
      const scheduled = Math.max(15000, Math.round(loan.principal * LOAN_PAYMENT_RATE));
      loan.paymentDue = Math.min(loan.balance, loan.paymentDue + scheduled);
    }
    this.state.rentOverdueDays = this.state.rentDue > 0 ? this.state.rentOverdueDays + 1 : 0;
    this.state.loanOverdueDays = (loan?.paymentDue ?? 0) > 0 ? this.state.loanOverdueDays + 1 : 0;
    if (this.state.loanOverdueDays > 7) this.state.gameOverReason = 'creditor';
    else if (this.state.rentOverdueDays > 7) this.state.gameOverReason = 'landlord';
    const shiftWorkers = activeEmployees(this.state);
    for (const employee of shiftWorkers) {
      employee.unpaidShifts = (employee.unpaidShifts ?? 0) + 1;
      employee.unpaidWages = (employee.unpaidWages ?? 0) + employee.salary;
      employee.totalShiftsWorked = (employee.totalShiftsWorked ?? 0) + 1;
    }
    this.awardStaffShiftExperience();
    this.processStaffShiftEnd();
    const staffFinancialNotice = {
      payrollAtRisk: this.state.employees
        .filter(employee => (employee.unpaidShifts ?? 0) === 3)
        .map(employee => ({
          uid: employee.uid,
          name: employee.name,
          amount: employee.unpaidWages ?? 0,
          shifts: employee.unpaidShifts ?? 0,
        })),
      departures: [] as { uid: string; name: string; amount: number }[],
    };
    for (const employee of [...this.state.employees]) {
      if ((employee.unpaidShifts ?? 0) <= 3) continue;
      const settledWages = this.settleDepartingStaffWages(employee);
      staffFinancialNotice.departures.push({ uid: employee.uid, name: employee.name, amount: settledWages });
      this.state.employees = this.state.employees.filter(item => item.uid !== employee.uid);
      this.state.staffLeaveRequests = this.state.staffLeaveRequests.filter(request => request.employeeUid !== employee.uid);
      this.toast(`${employee.name} đã nghỉ việc vì shop nợ lương quá 3 công.${settledWages ? ` ${settledWages.toLocaleString('vi-VN')}₫ công nợ đã bị trừ tự động.` : ''}`, 'error');
    }
    this.commit();
    const debtNeedsWarning = this.state.loanOverdueDays >= 5 || this.state.rentOverdueDays >= 5;
    const staffNeedsWarning = staffFinancialNotice.payrollAtRisk.length > 0 || staffFinancialNotice.departures.length > 0;
    this.emit(this.state.gameOverReason
      ? { type: 'game-over' }
      : debtNeedsWarning || staffNeedsWarning
        ? { type: 'debt-warning', staff: staffFinancialNotice }
        : { type: 'summary' });
    if (this.state.gameOverReason) {
      this.toast(this.state.gameOverReason === 'creditor' ? 'Khoản vay đã quá hạn hơn 7 ngày. Chủ nợ đã tới thu hồi boutique.' : 'Tiền thuê đã quá hạn hơn 7 ngày. Chủ nhà đã thu hồi mặt bằng.', 'error');
      return;
    }
    if (reason === 'sold-out') {
      this.toast(`Hàng trưng bày đã bán sạch! Shop tự động đóng cửa sớm sau khi bán ${this.state.stats.sold} món.`);
    } else if (this.state.stats.sold === 0) {
      this.toast('Hôm nay tiệm bị ế ẩm rồi! Không bán được bộ nào cả.', 'error');
    } else {
      this.toast(`Đã đóng cửa! Hôm nay bán được ${this.state.stats.sold} món.`);
    }
  }

  private awardStaffShiftExperience() {
    for (const employee of activeEmployees(this.state)) {
      const earned = 8 + (employee.shiftSales ?? 0) * 6 + Math.floor(employee.reliability / 35);
      employee.experience = (employee.experience ?? 0) + earned;
      employee.skillLevel = employee.skillLevel ?? 1;
      let threshold = 35 + employee.skillLevel * 15;
      let leveled = false;
      while (employee.experience >= threshold && employee.skillLevel < 20) {
        employee.experience -= threshold;
        employee.skillLevel++;
        employee.service = Math.min(99, employee.service + 2);
        employee.persuasion = Math.min(99, employee.persuasion + 2);
        employee.charm = Math.min(99, employee.charm + 1);
        employee.reliability = Math.min(99, employee.reliability + 1);
        threshold = 35 + employee.skillLevel * 15;
        leveled = true;
      }
      employee.shiftSales = 0;
      if (leveled) this.toast(`${employee.name} đã lên cấp nghề ${employee.skillLevel}! Chỉ số nhân viên được tăng.`);
    }
  }
  nextDay() {
    if (this.state.phase !== 'closed' || this.state.gameOverReason) return;
    this.state.day++;
    this.expireRegularOnlineOrders();
    this.expireCampaignIfNeeded();
    this.state.phase = 'preparation';
    this.state.customerIndex = 0;
    this.state.dayTimer = dayDuration(this.state);
    this.state.stats = emptyStats();
    this.state.currentCustomerId = null;
    this.state.customerMode = null;
    this.state.activeVisits = [];
    this.state.currentVisitId = null;
    this.state.lastCustomerId = null;
    this.state.nextArrivalIn = 0;
    this.state.patience = 0;
    this.receiveOrders();
    this.receiveTailoringJobs();
    this.processStaffNewDay();
    this.processAdvancedOperationsNewDay();
    this.commit();
    this.toast(`Chào ${gameDate(this.state.day)}! Khám phá xu hướng mới và chuẩn bị shop nhé.`);
  }

  private expireRegularOnlineOrders() {
    const expired = this.state.regularOnlineOrders.filter(order => order.dueDay < this.state.day);
    if (!expired.length) return;
    this.state.regularOnlineOrders = this.state.regularOnlineOrders.filter(order => order.dueDay >= this.state.day);
    for (const _order of expired) this.applyOnlineReview(2, .45);
    this.toast(`${expired.length} đơn thường đã quá hạn và bị hủy. Đánh giá online bị giảm.`, 'error');
  }
  /** Partial delivery keeps paid overflow in transit, including saves from older builds. */
  private receiveOrders() {
    const arrived: { productId: string; productName: string; quantity: number; supplierId?: string; kind?: 'product' | 'material' }[] = [];
    this.state.pendingOrders = this.state.pendingOrders.flatMap(o => {
      const p = products.find(p => p.id === o.productId);
      if (!p || o.arrivalDay > this.state.day) return [o];
      const stock = this.state.inventory[p.id] ?? 0;
      const received = Math.min(o.quantity, Math.max(0, 999 - stock));
      if (!received) return [o];
      this.state.inventory[p.id] = stock + received;
      arrived.push({ productId: p.id, productName: p.name, quantity: received, ...(o.supplierId ? { supplierId: o.supplierId } : {}) });
      this.toast(`Hàng về kho: ${p.name} × ${received}.`);
      if (received === o.quantity) return [];
      return [{ ...o, quantity: o.quantity - received, cost: Math.round(o.cost * (o.quantity - received) / o.quantity) }];
    });
    this.state.pendingMaterialOrders = (this.state.pendingMaterialOrders ?? []).flatMap(order => {
      const material = atelierMaterials.find(item => item.id === order.materialId);
      if (!material || order.arrivalDay > this.state.day) return [order];
      const stock = this.state.materialInventory[material.id] ?? 0;
      const received = Math.min(order.quantity, Math.max(0, 9999 - stock));
      if (!received) return [order];
      this.state.materialInventory[material.id] = stock + received;
      arrived.push({ productId: material.id, productName: material.name, quantity: received, kind: 'material', ...(order.supplierId ? { supplierId: order.supplierId } : {}) });
      this.toast(`Nguyên liệu về kho: ${material.name} ×${received}.`);
      if (received === order.quantity) return [];
      return [{ ...order, quantity: order.quantity - received, cost: Math.round(order.cost * (order.quantity - received) / order.quantity) }];
    });
    if (arrived.length) this.emit({ type: 'orders-arrived', items: arrived });
  }
  private receiveTailoringJobs() {
    const s = this.state;
    s.tailoringJobs = s.tailoringJobs.filter(job => {
      if (job.readyDay > s.day) return true;
      const product = s.customProducts.find(item => item.id === job.productId);
      if (!product) return false;
      const stock = s.inventory[product.id] ?? 0;
      const received = Math.min(job.quantity, Math.max(0, 999 - stock));
      if (!received) return true;
      s.inventory[product.id] = stock + received;
      this.toast(`Xưởng may hoàn thành: ${product.name} ×${received}.`);
      if (received === job.quantity) return false;
      job.quantity -= received;
      return true;
    });
  }
  private consumeDisplayedItem(productId: string) {
    for (const placed of this.state.layout) {
      const index = placed.displayItems?.indexOf(productId) ?? -1;
      if (index >= 0) { placed.displayItems!.splice(index, 1); return true; }
    }
    return false;
  }
  displayProduct(uid: string, productId: string) {
    const placed = this.state.layout.find(item => item.uid === uid);
    const def = placed && furniture.find(item => item.id === placed.id);
    const product = products.find(item => item.id === productId);
    if (!placed || !def?.display || !product || !def.display.categories.includes(product.category)) return false;
    placed.displayItems ??= [];
    if (placed.displayItems.length >= displayCapacity(def, placed)) { this.toast('Thiết bị trưng bày đã đầy.', 'error'); return false; }
    if (displayedQuantity(this.state, productId) + this.onlineReservedQuantity(productId) >= (this.state.inventory[productId] ?? 0)) { this.toast('Không còn món này trong kho để đem ra trưng.', 'error'); return false; }
    placed.displayItems.push(productId);
    this.commit();
    return true;
  }
  removeDisplayedProduct(uid: string, productId: string) {
    const placed = this.state.layout.find(item => item.uid === uid);
    const index = placed?.displayItems?.indexOf(productId) ?? -1;
    if (!placed || index < 0) return false;
    placed.displayItems!.splice(index, 1);
    this.commit();
    return true;
  }
  upgradeDisplay(uid: string) {
    const placed = this.state.layout.find(item => item.uid === uid);
    const def = placed && furniture.find(item => item.id === placed.id);
    if (!placed || !def?.display?.upgrade) return false;
    const cost = displayUpgradeCost(def, placed);
    if (cost === undefined) { this.toast('Thiết bị này đã đạt cấp trưng bày tối đa.', 'error'); return false; }
    if (this.state.money < cost) { this.toast('Chưa đủ tiền để nâng cấp thiết bị này.', 'error'); return false; }
    placed.displayLevel = displayLevel(def, placed) + 1;
    this.state.money -= cost;
    this.state.stats.spent += cost;
    this.commit();
    this.toast(`Đã nâng cấp ${def.name.toLowerCase()}: thêm ${def.display.upgrade.slotsPerLevel} slot.`);
    return true;
  }
  expandLand() {
    const next = nextLandExpansion(this.state);
    if (!next) { this.toast('Mặt bằng đã được mở rộng tối đa.', 'error'); return false; }
    if (this.state.phase === 'open') { this.toast('Chỉ có thể mở rộng mặt bằng khi shop đang đóng cửa.', 'error'); return false; }
    if (this.state.money < next.cost) { this.toast(`Cần ${next.cost.toLocaleString('vi-VN')}₫ để mở rộng mặt bằng.`, 'error'); return false; }
    this.state.money -= next.cost;
    this.state.stats.spent += next.cost;
    this.state.landLevel = Math.min(landExpansion.length - 1, (this.state.landLevel ?? 0) + 1);
    this.commit();
    this.toast(`Đã mở rộng mặt bằng lên ${next.size} × ${next.size} ô. Lượng khách và tiền thuê sẽ tăng theo.`);
    return true;
  }
  renameDisplayFixture(uid: string, name: string) {
    const fixture = this.state.layout.find(item => item.uid === uid);
    const definition = fixture && furniture.find(item => item.id === fixture.id);
    if (!fixture || !definition?.display) return false;
    const customName = name.trim().replace(/\s+/g, ' ').slice(0, 28);
    if ((fixture.customName ?? '') === customName) return true;
    fixture.customName = customName || undefined;
    this.commit();
    return true;
  }
  buyFurniture(id: string) {
    const def = furniture.find(f => f.id === id);
    if (!def || def.level > this.state.level) return;
    if (def.price > this.state.money) { this.toast('Chưa đủ tiền để mua món nội thất này.', 'error'); return; }
    let placed: PlacedFurniture | undefined;
    const size = landSize(this.state);
    for (let y = 0; y < size && !placed; y++) for (let x = 0; x < size && !placed; x++) {
      const candidate: PlacedFurniture = { uid: `f-${Date.now()}-${this.state.layout.length}`, id, x, y, rotation: 0, ...(def.display ? { displayItems: [] } : {}) };
      if (canPlace(this.state.layout, candidate, this.state.landLevel)) placed = candidate;
    }
    if (!placed) { this.toast('Shop đã đầy. Bán bớt nội thất để có thêm chỗ nhé.', 'error'); return; }
    this.state.money -= def.price; this.state.stats.spent += def.price; this.state.layout.push(placed);
    this.commit(); this.toast(`Một góc shop xinh hơn với ${def.name.toLowerCase()}!`);
    return placed.uid;
  }
  moveFurniture(uid: string, x: number, y: number, rotate = false) {
    const item = this.state.layout.find(p => p.uid === uid);
    if (!item) return false;
    const wallMounted = isWallFurnitureId(item.id);
    const nextRotation = rotate ? 1 - item.rotation : item.rotation;
    // Rotation chooses the wall for mounted decorations. Preserve the distance
    // from the corner by swapping the wall coordinates: (x, 0) <-> (0, x).
    let moved = {
      ...item,
      x: rotate && wallMounted ? item.y : x,
      y: rotate && wallMounted ? item.x : y,
      rotation: nextRotation,
    };
    if (rotate && wallMounted && !canPlace(this.state.layout, moved, this.state.landLevel)) {
      const definition = furniture.find(candidate => candidate.id === item.id);
      const maxSlot = Math.max(0, landSize(this.state) - (definition?.width ?? 1));
      const preferredSlot = item.rotation === 0 ? item.x : item.y;
      const nearestFreeSlot = Array.from({ length: maxSlot + 1 }, (_, slot) => slot)
        .sort((a, b) => Math.abs(a - preferredSlot) - Math.abs(b - preferredSlot))
        .find(slot => canPlace(this.state.layout, {
          ...moved,
          x: nextRotation === 1 ? 0 : slot,
          y: nextRotation === 1 ? slot : 0,
        }, this.state.landLevel));
      if (nearestFreeSlot !== undefined) {
        moved = {
          ...moved,
          x: nextRotation === 1 ? 0 : nearestFreeSlot,
          y: nextRotation === 1 ? nearestFreeSlot : 0,
        };
      }
    }
    if (!canPlace(this.state.layout, moved, this.state.landLevel)) {
      if (rotate && wallMounted) {
        this.toast('Tường bên kia không còn đủ chỗ. Hãy dời hoặc cất bớt đồ treo tường rồi xoay lại.', 'error');
        return false;
      }
      this.toast(isWallFurnitureId(item.id) ? 'Tranh và biển hiệu chỉ treo được sát tường. Hãy xoay món đồ để chuyển sang tường còn lại.' : 'Vị trí bị trùng hoặc chắn lối đi.', 'error');
      return false;
    }
    Object.assign(item, moved); this.commit();
    if (rotate && wallMounted) this.toast(`Đã chuyển sang tường ${nextRotation === 1 ? 'trái' : 'phải'}.`);
    return true;
  }
  sellFurniture(uid: string) {
    const p = this.state.layout.find(p => p.uid === uid); if (!p) return;
    const def = furniture.find(f => f.id === p.id)!;
    const returned = p.displayItems?.length ?? 0;
    this.state.money += Math.round(def.price / 2); this.state.layout = this.state.layout.filter(p => p.uid !== uid);
    this.commit(); this.toast(`Đã bán ${def.name.toLowerCase()}, hoàn lại 50% giá${returned ? ` và trả ${returned} món về kho` : ''}.`);
  }
  storeFurniture(uid: string) {
    const p = this.state.layout.find(p => p.uid === uid); if (!p) return;
    const def = furniture.find(f => f.id === p.id)!;
    const returned = p.displayItems?.length ?? 0;
    this.state.storedFurniture = this.state.storedFurniture ?? [];
    this.state.storedFurniture.push(p.id);
    this.state.layout = this.state.layout.filter(p => p.uid !== uid);
    this.commit(); this.toast(`Đã cất ${def.name.toLowerCase()} vào kho nội thất${returned ? `; ${returned} món đang trưng đã về kho hàng` : ''}`);
  }
  placeStoredFurniture(id: string) {
    this.state.storedFurniture = this.state.storedFurniture ?? [];
    const index = this.state.storedFurniture.indexOf(id);
    if (index === -1) return false;
    const def = furniture.find(f => f.id === id);
    if (!def) return false;
    let placed: PlacedFurniture | undefined;
    const size = landSize(this.state);
    for (let y = 0; y < size && !placed; y++) for (let x = 0; x < size && !placed; x++) {
      const candidate: PlacedFurniture = { uid: `f-${Date.now()}-${this.state.layout.length}`, id, x, y, rotation: 0, ...(def.display ? { displayItems: [] } : {}) };
      if (canPlace(this.state.layout, candidate, this.state.landLevel)) placed = candidate;
    }
    if (!placed) { this.toast('Shop đã đầy. Hãy dọn chỗ trước khi bày đồ nhé.', 'error'); return false; }
    this.state.storedFurniture.splice(index, 1);
    this.state.layout.push(placed);
    this.commit(); this.toast(`Đã đặt ${def.name.toLowerCase()} từ kho ra shop`);
    return placed.uid;
  }
  upgrade() {
    const next = levels[this.state.level]; if (!next) return;
    if (this.state.xp < next.xp || this.state.money < next.cost) { this.toast(`Cần ${next.xp} XP và ${next.cost.toLocaleString('vi-VN')}₫ để nâng cấp.`, 'error'); return; }
    this.state.money -= next.cost; this.state.level++; this.commit();
    this.toast(this.state.level === 3
      ? 'Lên cấp 3! Studio hợp tác đã mở: nhận hợp đồng thương hiệu kéo dài nhiều ngày.'
      : this.state.level === ATELIER_UNLOCK_LEVEL
        ? 'Lên cấp 8! Xưởng may cá nhân và kho nguyên vật liệu đã mở khóa.'
        : `Lên cấp ${this.state.level}! Thêm sản phẩm và nội thất mới đã mở khóa.`);
  }

  unlockLegacyStory() {
    const story = this.state.legacyStory;
    if (this.state.level < levels.length || story.stage !== 'locked') return false;
    story.stage = 'arrival';
    story.unlockedDay = this.state.day;
    this.commit();
    return true;
  }

  chooseLegacyStoryResponse(choice: LegacyStoryChoice) {
    const story = this.state.legacyStory;
    if (story.stage !== 'arrival' || !['curious', 'dress', 'observe'].includes(choice)) return false;
    story.firstChoice = choice;
    if (choice === 'curious') story.trust++;
    else if (choice === 'dress') { story.trust++; story.suspicion++; }
    else story.suspicion += 2;
    story.stage = 'room-search';
    this.commit();
    return true;
  }

  findLegacyRoom() {
    if (this.state.legacyStory.stage !== 'room-search' || this.state.phase === 'open') return false;
    this.state.legacyStory.stage = 'room-found';
    this.commit();
    this.toast('Đã tìm thấy cánh cửa bị che sau phòng thử đồ.');
    return true;
  }

  restoreLegacyRoom() {
    const story = this.state.legacyStory;
    const costs = [2000000, 5000000, 8000000, 15000000, 30000000];
    if (story.stage !== 'room-found' || this.state.phase === 'open' || story.restorationLevel >= costs.length) return false;
    const cost = costs[story.restorationLevel];
    if (this.state.money < cost) {
      this.toast(`Cần ${cost.toLocaleString('vi-VN')}₫ để tiếp tục khôi phục căn phòng.`, 'error');
      return false;
    }
    this.state.money -= cost;
    this.state.stats.spent += cost;
    story.restorationLevel++;
    this.commit();
    const messages = [
      'Bụi đã được dọn sạch. Một cuốn nhật ký thiếu trang xuất hiện dưới sàn.',
      'Tấm gương sáng trở lại và vừa gọi đúng tên bạn.',
      'Tủ đồ cổ đã mở. Một luồng sáng tím đang rò qua khe cửa.',
      'Cầu thang lên tầng trên đã được khôi phục.',
      'Nhà ga bí mật dưới boutique đã thức giấc lúc 00:00.',
    ];
    this.toast(messages[story.restorationLevel - 1]);
    return true;
  }
  startCampaign(id: string) {
    const s = this.state;
    if (s.level < 3) { this.toast('Studio hợp tác mở khóa khi boutique đạt cấp 3.', 'error'); return false; }
    if (s.phase === 'open') { this.toast('Hãy chọn hợp đồng trước hoặc sau giờ bán.', 'error'); return false; }
    if (s.activeCampaign) { this.toast('Boutique đang thực hiện một hợp đồng khác.', 'error'); return false; }
    if (s.day < s.campaignAvailableDay) { this.toast(`Đối tác mới sẽ gửi brief vào ${gameDate(s.campaignAvailableDay)}.`, 'error'); return false; }
    const offer = campaignOffers(s).find(candidate => candidate.id === id);
    if (!offer) return false;
    s.activeCampaign = { ...offer, startDay: s.day, deadlineDay: s.day + offer.durationDays - 1, units: 0, revenue: 0, onlineOrders: 0, status: 'active' };
    this.commit();
    this.toast(`Đã nhận “${offer.name}”. Bạn có ${offer.durationDays} ngày để hoàn thành brief.`);
    return true;
  }
  acknowledgeCampaignGuide() {
    if (this.state.claimed.includes(CAMPAIGN_GUIDE_SEEN)) return;
    this.state.claimed.push(CAMPAIGN_GUIDE_SEEN);
    this.commit();
  }
  claimCampaign() {
    const s = this.state;
    const campaign = s.activeCampaign;
    if (!campaign || campaign.status !== 'ready') return false;
    s.money += campaign.rewardMoney;
    s.xp += campaign.rewardXp;
    s.followers += campaign.rewardFollowers;
    s.industryReputation += campaign.prestigeReward;
    s.completedCampaigns.push(campaign.id);
    s.activeCampaign = null;
    s.campaignSeason++;
    s.campaignAvailableDay = s.day + 1;
    this.commit();
    this.toast(`Chiến dịch thành công! Danh tiếng ngành +${campaign.prestigeReward}.`);
    return true;
  }
  abandonCampaign() {
    const s = this.state;
    const campaign = s.activeCampaign;
    if (!campaign) return false;
    s.activeCampaign = null;
    s.campaignSeason++;
    s.campaignAvailableDay = s.day + 1;
    this.commit();
    this.toast(campaign.status === 'failed' ? 'Đã khép lại chiến dịch. Brief mới sẽ đến vào ngày mai.' : 'Đã rút khỏi chiến dịch. Brief mới sẽ đến vào ngày mai.', campaign.status === 'failed' ? 'error' : 'success');
    return true;
  }
  private progressCampaign(items: Product[], total: number, online: boolean) {
    const campaign = this.state.activeCampaign;
    if (!campaign || campaign.status !== 'active' || this.state.day > campaign.deadlineDay) return;
    const matching = items.filter(product => campaign.style
      ? product.style === campaign.style || product.secondaryStyles?.includes(campaign.style)
      : campaign.category ? product.category === campaign.category : true);
    if (matching.length) {
      campaign.units += matching.length;
      campaign.revenue += campaign.style || campaign.category
        ? matching.reduce((sum, product) => sum + sellPrice(this.state, product), 0)
        : total;
    }
    if (online) campaign.onlineOrders++;
    if (campaignIsComplete(campaign)) {
      campaign.status = 'ready';
      this.toast(`Hoàn thành “${campaign.name}”! Vào Studio hợp tác để nhận thưởng.`);
    }
  }
  private expireCampaignIfNeeded() {
    const campaign = this.state.activeCampaign;
    if (!campaign || campaign.status !== 'active' || this.state.day <= campaign.deadlineDay) return;
    campaign.status = campaignIsComplete(campaign) ? 'ready' : 'failed';
    if (campaign.status === 'failed') this.toast(`“${campaign.name}” đã hết hạn. Hãy khép lại chiến dịch để nhận brief mới.`, 'error');
  }
  claimQuest(id: string) {
    const key = `${this.state.day}:${id}`;
    const ready = id === 'sales' ? this.state.stats.sold >= 3 : id === 'trend' ? this.state.stats.trendSales >= 2 : false;
    if (!ready || this.state.claimed.includes(key)) return;
    this.state.claimed.push(key); this.state.money += 35000; this.state.xp += 10; this.commit(); this.toast('Hoàn thành mục tiêu! +35.000₫ và +10 XP.');
  }
  rescue() {
    this.toast('Hãy mở mục Tài chính để vay vốn nhập hàng cho boutique.', 'error');
  }
  settings(key: 'sound' | 'music' | 'tutorialDone', value: boolean) { this.state[key] = value; this.commit(); }
  setMusicVolume(value: number) {
    this.state.musicVolume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.55));
    this.commit();
  }
  setMusicTrack(track: string) {
    if (!['boutique-bloom', 'better-for-you-1', 'die-for-you-remix', 'daffodil-live'].includes(track)) return;
    this.state.musicTrack = track;
    this.commit();
  }
  setShopName(name: string) {
    const clean = name.trim().slice(0, 30);
    if (!clean) return;
    this.state.shopName = clean;
    this.state.hasNamedShop = true;
    this.commit();
    this.toast(`Đã đổi tên tiệm thành "${clean}"!`);
  }
  debug(action: string) {
    const s = this.state;
    const prepareRecruitment = () => {
      s.level = Math.max(s.level, 3 + s.employees.length * 2);
      s.landLevel = Math.max(s.landLevel ?? 0, 2);
      s.money = Math.max(s.money, 1500000);
      if (s.phase === 'open') {
        s.phase = 'preparation';
        s.activeVisits = [];
        s.currentVisitId = null;
        s.currentCustomerId = null;
        s.customerMode = null;
        s.patience = 0;
      }
    };
    const generateApplicantsNow = () => {
      prepareRecruitment();
      s.staffApplicants = [];
      s.recruitmentPost = { salary: 120000, postedDay: s.day, applicantsDay: s.day };
      this.generateStaffApplicants();
    };
    const prepareAtelier = (level = ATELIER_UNLOCK_LEVEL, materialQuantity = 20) => {
      if (s.phase !== 'preparation') {
        s.phase = 'preparation';
        s.activeVisits = [];
        s.currentVisitId = null;
        s.currentCustomerId = null;
        s.customerMode = null;
        s.patience = 0;
      }
      s.level = Math.max(s.level, level);
      s.xp = Math.max(s.xp, levels[Math.min(level - 1, levels.length - 1)]?.xp ?? 0);
      s.money = Math.max(s.money, 10000000);
      s.atelierOwned = true;
      for (const material of atelierMaterials.filter(item => item.level <= s.level)) {
        s.materialInventory[material.id] = Math.max(materialQuantity, s.materialInventory[material.id] ?? 0);
      }
    };
    const ensureDebugBlueprint = () => {
      const recipe = atelierRecipes.find(item => item.id === 'cloud-tee') ?? atelierRecipes[0];
      let product = s.customProducts.find(item => item.recipeId === recipe.id);
      if (!product) {
        product = {
          id: 'custom-debug-cloud-tee', name: recipe.name, category: recipe.category, style: recipe.style,
          color: recipe.color, colorName: recipe.colorName, buyPrice: atelierRecipeCost(recipe), sellPrice: recipe.sellPrice,
          quality: recipe.quality, level: ATELIER_UNLOCK_LEVEL, art: recipe.art, subcategory: 'Thiết kế cá nhân',
          occasions: ['city', 'party'], secondaryStyles: [], custom: true, recipeId: recipe.id, createdDay: s.day,
        };
        s.customProducts.push(product);
      }
      registerCustomProduct(product);
      s.inventory[product.id] = Math.max(1, s.inventory[product.id] ?? 0);
      s.prices[product.id] = product.sellPrice;
      return { product, recipe };
    };
    switch (action) {
      case 'funds':
        s.money += 1000000;
        this.commit(); this.toast('Debug: +1.000.000₫.'); return true;
      case 'xp':
        s.xp += 500;
        this.commit(); this.toast('Debug: +500 XP.'); return true;
      case 'stock':
        for (const product of products.filter(product => product.level <= s.level)) s.inventory[product.id] = Math.max(10, s.inventory[product.id] ?? 0);
        this.commit(); this.toast('Debug: Đã bổ sung 10 món cho toàn bộ sản phẩm đang mở khóa.'); return true;
      case 'online-stock': {
        if (s.phase !== 'preparation') {
          s.phase = 'preparation';
          s.activeVisits = [];
          s.currentVisitId = null;
          s.currentCustomerId = null;
          s.customerMode = null;
          s.patience = 0;
        }
        s.level = Math.max(2, s.level);
        const testProducts = products.filter(product => product.level <= s.level).slice(0, 8);
        for (const product of testProducts) s.inventory[product.id] = Math.max(6, s.inventory[product.id] ?? 0);
        s.onlineListings = testProducts.slice(0, 2).map(product => product.id);
        s.onlineChannelEnabled = true;
        this.commit();
        this.toast('Debug: Đã chuẩn bị kho và mở trình chọn sản phẩm online.');
        return true;
      }
      case 'livestream-reset': {
        if (s.phase !== 'preparation') {
          s.phase = 'preparation';
          s.activeVisits = [];
          s.currentVisitId = null;
          s.currentCustomerId = null;
          s.customerMode = null;
          s.patience = 0;
        }
        s.level = Math.max(2, s.level);
        const liveProducts = products.filter(product => product.level <= s.level).slice(0, 6);
        for (const product of liveProducts) s.inventory[product.id] = Math.max(8, s.inventory[product.id] ?? 0);
        s.onlineListings = liveProducts.map(product => product.id);
        s.onlineChannelEnabled = true;
        s.lastLivestreamDay = Math.max(0, s.day - 1);
        this.commit();
        this.toast('Debug: Phiên livestream hôm nay đã được khôi phục.');
        return true;
      }
      case 'regular-order': {
        if (s.phase === 'open') {
          s.phase = 'preparation';
          s.activeVisits = [];
          s.currentVisitId = null;
          s.currentCustomerId = null;
          s.customerMode = null;
          s.patience = 0;
        } else if (s.phase === 'closed') s.phase = 'preparation';
        const orderProducts = products.filter(product => product.level <= s.level).slice(0, 2);
        if (!orderProducts.length) return false;
        for (const product of orderProducts) {
          s.inventory[product.id] = Math.max(6, s.inventory[product.id] ?? 0);
          if (!s.onlineListings.includes(product.id)) s.onlineListings.push(product.id);
        }
        s.onlineChannelEnabled = true;
        if (s.regularOnlineOrders.length >= this.regularOnlineCapacity()) s.regularOnlineOrders.shift();
        const created = this.createRegularOnlineOrder(orderProducts.map(product => product.id), 'storefront');
        this.commit();
        this.toast(created ? 'Debug: Đã tạo một đơn hàng thường ảo.' : 'Debug: Không thể tạo đơn hàng thường.', created ? 'success' : 'error');
        return created;
      }
      case 'advanced-features': {
        if (s.phase === 'open') {
          s.phase = 'preparation'; s.activeVisits = []; s.currentVisitId = null; s.currentCustomerId = null; s.customerMode = null; s.patience = 0;
        } else if (s.phase === 'closed') s.phase = 'preparation';
        s.level = Math.max(5, s.level); s.xp = Math.max(2000, s.xp); s.landLevel = Math.max(2, s.landLevel ?? 0); s.money = Math.max(3000000, s.money);
        for (const product of products.filter(product => product.level <= 5)) s.inventory[product.id] = Math.max(12, s.inventory[product.id] ?? 0);
        const rack = s.layout.find(item => furniture.find(definition => definition.id === item.id)?.display?.kind === 'clothing');
        if (rack) rack.displayItems = ['baby-tee', 'ribbon-dress', 'silk'].filter(id => products.some(product => product.id === id));
        if (!s.employees.some(employee => employee.uid === 'staff-debug-operations') && s.employees.length < 3) s.employees.push({ id: 'debug-stylist', uid: 'staff-debug-operations', name: 'Mai Anh', role: 'Stylist vận hành', bio: 'Nhân viên mẫu để thử xếp ca và năng lượng.', appearance: 2, salary: 120000, service: 78, persuasion: 74, charm: 72, reliability: 82, appliedDay: s.day, hiredDay: s.day, morale: 84, deniedLeaves: 0, sales: 6, tipsEarned: 45000, energy: 42, assignment: 'service', experience: 18, skillLevel: 2, shiftSales: 0 });
        const shiftTester = s.employees.find(employee => employee.uid === 'staff-debug-operations') ?? s.employees[0];
        if (shiftTester) { shiftTester.energy = 42; shiftTester.assignment = 'service'; }
        s.returnCases = s.returnCases.filter(item => !item.id.startsWith('debug-'));
        s.returnCases.push({ id: 'debug-return', productId: 'baby-tee', customerName: 'Chloe', amount: sellPrice(s, products.find(product => product.id === 'baby-tee')!), reason: 'Khách muốn đổi sang kích cỡ phù hợp hơn', availableDay: s.day, deadlineDay: s.day + 2 });
        s.vipAppointments = s.vipAppointments.filter(item => !item.id.startsWith('debug-'));
        s.vipAppointments.push(
          { id: 'debug-vip-ready', customerName: 'Hạ Vy', style: 'Coquette', category: 'tops', budget: 900000, scheduledDay: s.day, minItems: 1, reward: 260000, status: 'accepted' },
          { id: 'debug-vip-offer', customerName: 'Yuna', style: 'Luxury', category: 'dresses', budget: 1500000, scheduledDay: s.day + 2, minItems: 1, reward: 340000, status: 'offered' },
        );
        s.coutureOrder = { id: 'debug-couture', clientName: 'Maison Rosée', brief: 'Thiết kế độc bản cho đêm gala, ưu tiên phom thanh lịch và chi tiết thủ công.', stage: 'materials', quality: 30, acceptedDay: s.day, deadlineDay: s.day + 4, reward: 1450000, status: 'active' };
        s.coutureAvailableDay = s.day;
        s.reputation = 3.2; s.reviews = Math.max(8, s.reviews);
        s.reputationCrisis = { startDay: s.day, deadlineDay: s.day + 3, positiveReviews: 1, sales: 2, targetReviews: 3, targetSales: 8 };
        s.pendingOrders = s.pendingOrders.filter(order => !order.id.startsWith('debug-'));
        s.pendingOrders.push(
          { id: 'debug-delivery-soon', productId: 'jeans', quantity: 5, cost: 250000, arrivalDay: s.day + 1, supplierId: 'wholesale' },
          { id: 'debug-delivery-later', productId: 'silk', quantity: 10, cost: 1800000, arrivalDay: s.day + 5, supplierId: 'global' },
        );
        this.commit(); this.toast('Debug: Đã tạo dữ liệu thử cho nguồn hàng, ca làm, đổi trả, VIP, couture và hàng chờ giao.'); return true;
      }
      case 'atelier-ready':
        prepareAtelier();
        this.commit(); this.toast('Debug: Đã mở shop cấp 8, sở hữu xưởng và thêm vật liệu cơ bản.'); return true;
      case 'atelier-max':
        prepareAtelier(10, 50);
        s.landLevel = Math.max(s.landLevel ?? 0, landExpansion.length - 1);
        this.commit(); this.toast('Debug: Đã mở cấp 10, mặt bằng tối đa và toàn bộ vật liệu cao cấp.'); return true;
      case 'atelier-sample': {
        prepareAtelier();
        const recipe = atelierRecipes.find(item => item.id === 'cloud-tee') ?? atelierRecipes[0];
        s.atelierDraft = {
          id: `custom-debug-draft-${s.day}`, name: recipe.name, category: recipe.category, style: recipe.style,
          color: recipe.color, colorName: recipe.colorName, buyPrice: atelierRecipeCost(recipe), sellPrice: recipe.sellPrice,
          quality: recipe.quality, level: ATELIER_UNLOCK_LEVEL, art: recipe.art, subcategory: 'Thiết kế cá nhân',
          occasions: ['city', 'party'], secondaryStyles: [], custom: true, recipeId: recipe.id, createdDay: s.day,
        };
        this.commit(); this.toast('Debug: Đã tạo mẫu thử chờ duyệt trong Xưởng may.'); return true;
      }
      case 'atelier-wrong-recipe':
        prepareAtelier();
        s.atelierDraft = null;
        s.materialInventory.cotton = Math.max(1, s.materialInventory.cotton ?? 0);
        s.materialInventory.ribbon = Math.max(1, s.materialInventory.ribbon ?? 0);
        this.createAtelierSample('Casual', { cotton: 1, ribbon: 1 });
        return true;
      case 'atelier-blueprint': {
        prepareAtelier();
        s.atelierDraft = null;
        const { product } = ensureDebugBlueprint();
        this.commit(); this.toast(`Debug: Đã duyệt ${product.name} và thêm 1 mẫu vào kho.`); return true;
      }
      case 'atelier-batch': {
        prepareAtelier();
        const { product, recipe } = ensureDebugBlueprint();
        for (const [materialId, amount] of Object.entries(recipe.materials)) {
          s.materialInventory[materialId] = Math.max(amount * 10, s.materialInventory[materialId] ?? 0) - amount * 10;
        }
        s.tailoringJobs.push({ id: `tailoring-debug-${Date.now()}`, productId: product.id, quantity: 10, readyDay: s.day + 2 });
        this.commit(); this.toast('Debug: Đã tạo đơn may 10 sản phẩm, hoàn thành sau 2 ngày.'); return true;
      }
      case 'atelier-deliver':
        prepareAtelier();
        if (!s.tailoringJobs.length) {
          const { product } = ensureDebugBlueprint();
          s.tailoringJobs.push({ id: `tailoring-debug-${Date.now()}`, productId: product.id, quantity: 10, readyDay: s.day });
        }
        for (const job of s.tailoringJobs) job.readyDay = s.day;
        this.receiveTailoringJobs();
        this.commit(); this.toast('Debug: Đã hoàn tất và nhập các đơn may vào kho.'); return true;
      case 'recruitment-ready':
        prepareRecruitment();
        this.commit(); this.toast('Debug: Shop cấp 3, mặt bằng cấp 3 và ngân sách đã sẵn sàng.'); return true;
      case 'applicants':
        generateApplicantsNow();
        this.commit(); this.toast('Debug: Đã tạo hồ sơ ứng viên ngay lập tức.'); return true;
      case 'hire': {
        if (!s.staffApplicants.length) generateApplicantsNow();
        const candidate = s.staffApplicants[0];
        if (!candidate) { this.commit(); this.toast('Debug: Không có hồ sơ ứng viên.', 'error'); return false; }
        const assignment: StaffAssignment = s.employees.filter(item => (item.assignment ?? 'service') !== 'off').length < staffCapacity(s) ? 'service' : 'off';
        s.employees.push({ ...candidate, uid: `staff-debug-${Date.now()}-${candidate.id}`, hiredDay: s.day, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, energy: 100, assignment });
        s.staffApplicants = s.staffApplicants.filter(item => item.id !== candidate.id);
        if (!s.staffApplicants.length) s.recruitmentPost = null;
        this.commit(); this.toast(`Debug: Đã nhận ${candidate.name} vào làm.`); return true;
      }
      case 'leave': {
        if (!s.employees.length) {
          generateApplicantsNow();
          const candidate = s.staffApplicants[0];
          if (candidate) s.employees.push({ ...candidate, uid: `staff-debug-${Date.now()}-${candidate.id}`, hiredDay: s.day, morale: 72, deniedLeaves: 1, sales: 0, tipsEarned: 0 });
          s.staffApplicants = [];
          s.recruitmentPost = null;
        }
        const employee = s.employees.find(item => (!item.leaveUntilDay || item.leaveUntilDay <= s.day)
          && !s.staffLeaveRequests.some(request => request.employeeUid === item.uid));
        if (!employee) { this.commit(); this.toast('Debug: Không có nhân viên phù hợp để tạo đơn nghỉ.', 'error'); return false; }
        const leaveDays = 1 + Math.floor(this.random() * 5);
        s.staffLeaveRequests.push({ employeeUid: employee.uid, requestedDay: s.day, days: leaveDays, reason: 'cần giải quyết việc cá nhân' });
        this.commit(); this.toast(`Debug: ${employee.name} đã xin nghỉ ${leaveDays} ngày.`); return true;
      }
      case 'next-day':
        s.phase = 'closed';
        this.nextDay();
        return true;
      case 'customer': {
        if (s.phase === 'closed') s.phase = 'preparation';
        s.inventory['baby-tee'] = Math.max(2, s.inventory['baby-tee'] ?? 0);
        const rack = s.layout.find(item => furniture.find(definition => definition.id === item.id)?.display);
        if (rack && !(rack.displayItems ?? []).length) rack.displayItems = ['baby-tee'];
        if (s.phase !== 'open') this.openShop();
        if (s.phase !== 'open') return false;
        this.admitCustomer();
        this.commit();
        this.toast('Debug: Đã gọi một khách vào shop.'); return true;
      }
      case 'online-order': {
        if (s.onlineOrders.length >= 5) { this.toast('Debug: Đã có tối đa 5 shipper đang chờ.', 'error'); return false; }
        if (s.phase === 'closed') s.phase = 'preparation';
        const testProducts = products.filter(item => item.level <= s.level).slice(0, 3);
        const testProductIds = testProducts.map(product => product.id);
        for (const productId of testProductIds) {
          const reserved = this.onlineReservedQuantity(productId);
          const displayed = displayedQuantity(s, productId);
          s.inventory[productId] = Math.max(s.inventory[productId] ?? 0, displayed + reserved + 2);
          if (!s.onlineListings.includes(productId)) s.onlineListings.push(productId);
        }
        const display = s.layout.find(item => furniture.find(definition => definition.id === item.id)?.display);
        if (display && !(display.displayItems ?? []).length) display.displayItems = [testProductIds[0]];
        if (s.phase !== 'open') this.openShop();
        if (s.phase !== 'open') { this.toast('Debug: Không thể mở shop để gọi shipper.', 'error'); return false; }
        return this.createOnlineOrder(testProductIds);
      }
      default: return false;
    }
  }
  reset() { clearRegisteredCustomProducts(); this.state = initialState(); this.commit(); }
}
