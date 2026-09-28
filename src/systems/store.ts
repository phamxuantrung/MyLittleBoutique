import { customers, furniture, levels, products } from '../data/catalog';
import type { Customer, GameEvent, GameState, LoyaltyTier, OnlineOrder, PendingOrder, PlacedFurniture, Product, SaleResult, StaffCandidate } from '../types';
import { activeCustomer, activeEmployees, activeVisit, buyPrice, canPlace, advicePatience, arrivalDelay, bulkDiscountFactor, bulkDiscountRate, currentEvent, customerNeedsAdvice, dailyRent, DAY_DURATION, displayCapacity, displayLevel, displayUpgradeCost, displayedInventory, displayedQuantity, evaluateCustomerSelfPick, isTrending, isWallFurnitureId, landExpansion, landSize, LOAN_DAILY_RATE, LOAN_MAX, LOAN_MIN, LOAN_PAYMENT_RATE, loyaltyMilestones, loyaltyPatienceBonus, loyaltyTier, matchScore, nextLandExpansion, nextStaffRequirement, onlineOrderChance, onlineProductDemandWeight, saleXp, sellPrice, staffAdviceBonus, staffCapacity, threshold, validOutfit } from './rules';
import { emptyStats, initialState, SaveSystem } from './save';
import { generateDayCustomers, registerCustomer } from './customerGen';
import { recordPublicShopReview } from './reviews';

export class GameStore {
  state: GameState;
  private listeners = new Set<(event: GameEvent) => void>();
  readonly save: SaveSystem;
  /** Runtime cache: danh sách khách procedural cho ngày hiện tại */
  private dayCustomers: Customer[] = [];
  private dayCustomersKey = -1; // số ngày đã generate
  constructor(state?: GameState, save = new SaveSystem(), private random: () => number = Math.random) { this.save = save; this.state = state ?? save.load(); this.ensureDayCustomers(); }
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
    this.emit({ type: 'customer' });
    return true;
  }

  private roundedStars(value: number) {
    return Math.max(1, Math.min(5, Math.round(value * 2) / 2));
  }

  private applyShopReview(stars: number, weight = 1) {
    const s = this.state;
    const normalized = this.roundedStars(stars);
    const effectiveHistory = Math.max(10, s.reviews);
    const impact = weight * (normalized < 3 ? 1.2 : 1);
    s.reputation = Math.max(1, Math.min(5, (s.reputation * effectiveHistory + normalized * impact) / (effectiveHistory + impact)));
    s.reviews++;
    return normalized;
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
      const overBudget = total > customer.budget;
      return this.roundedStars((overBudget ? 1.9 : 2.15) + Math.min(.6, score / 180) + Math.min(.3, patienceRatio * .3));
    }
    const priceRatio = customer.budget > 0 ? total / customer.budget : 1;
    const valueBonus = priceRatio <= .68 ? .2 : 0;
    const pricePenalty = Math.max(0, priceRatio - .85) * 1.35;
    const waitPenalty = Math.max(0, 1 - patienceRatio) * .65;
    const pickyPenalty = ['VIP', 'Khách kỹ tính'].includes(customer.personality) ? .1 : 0;
    const serviceBonus = assisted ? .18 : selfPick ? .1 : 0;
    return this.roundedStars(1.2 + score / 24.5 + valueBonus + serviceBonus - pricePenalty - waitPenalty - pickyPenalty);
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
  buy(id: string, quantity: number) {
    if (this.state.phase === 'open') {
      this.toast('Cửa hàng đang mở cửa đón khách! Không thể nhập hàng trong giờ bán.', 'error');
      return false;
    }
    const p = products.find(p => p.id === id);
    if (!p || ![1, 5, 10].includes(quantity) || p.level > this.state.level) return false;
    const cost = buyPrice(this.state, p) * quantity;
    if (cost > this.state.money) { this.toast('Ví hơi vơi rồi. Hãy bán thêm vài món nhé!', 'error'); return false; }
    if ((this.state.inventory[id] ?? 0) + quantity > 999) return false;
    this.state.money -= cost; this.state.stats.spent += cost;
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
    const reserved = this.state.pendingOrders.filter(o => o.productId === id).reduce((sum, o) => sum + o.quantity, 0);
    if ((this.state.inventory[id] ?? 0) + reserved + quantity > 999) {
      this.toast('Kho và hàng đang về đã đủ 999 món của mẫu này.', 'error'); return false;
    }
    const basePrice = buyPrice(this.state, p);
    const discount = bulkDiscountFactor(quantity);
    const totalCost = Math.round(basePrice * quantity * discount);
    if (totalCost > this.state.money) { this.toast('Không đủ tiền để nhập đơn này.', 'error'); return false; }
    const isInternational = p.level >= 4 || p.buyPrice >= 200000;
    this.state.money -= totalCost; this.state.stats.spent += totalCost;
    if (isInternational) {
      const daysToArrive = p.level >= 5 ? 3 : 2;
      const order: PendingOrder = {
        id: `order-${crypto.randomUUID()}`,
        productId: id, quantity, cost: totalCost,
        arrivalDay: this.state.day + daysToArrive,
      };
      this.state.pendingOrders.push(order);
      this.commit();
      this.toast(`Đã đặt hàng ${p.name} × ${quantity}. Dự kiến về sau ${daysToArrive} ngày.`);
    } else {
      if ((this.state.inventory[id] ?? 0) + quantity > 999) { this.state.money += totalCost; this.state.stats.spent -= totalCost; return false; }
      this.state.inventory[id] = (this.state.inventory[id] ?? 0) + quantity;
      const saved = Math.round(basePrice * quantity * bulkDiscountRate(quantity));
      this.commit();
      this.toast(saved > 0 ? `Nhập ${quantity} ${p.name.toLowerCase()}. Tiết kiệm ${saved.toLocaleString('vi-VN')}₫!` : `Đã nhập ${quantity} ${p.name.toLowerCase()}.`);
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
    const items = ids.map(id => products.find(p => p.id === id)!);
    if (items.some(p => p.level > this.state.level || (this.state.inventory[p.id] ?? 0) + quantity > 999)) return false;
    const baseCostPerSet = items.reduce((sum, p) => sum + buyPrice(this.state, p), 0);
    const discount = bulkDiscountFactor(quantity);
    const totalCost = Math.round(baseCostPerSet * quantity * discount);
    if (totalCost > this.state.money) { this.toast('Chưa đủ tiền để nhập trọn outfit này.', 'error'); return false; }
    const saved = Math.round(baseCostPerSet * quantity * bulkDiscountRate(quantity));
    this.state.money -= totalCost; this.state.stats.spent += totalCost;
    for (const p of items) this.state.inventory[p.id] = (this.state.inventory[p.id] ?? 0) + quantity;
    this.commit();
    this.toast(
      saved > 0
        ? `Đã nhập ×${quantity} bộ (${items.length * quantity} món). Tiết kiệm ${saved.toLocaleString('vi-VN')}₫!`
        : `Đã nhập ×${quantity} bộ (${items.length * quantity} món) vào kho!`
    );
    return true;
  }
  postRecruitment(salary: number) {
    const s = this.state;
    const requirement = nextStaffRequirement(s);
    if (s.phase === 'open') { this.toast('Hãy đăng tin tuyển dụng khi shop đã đóng cửa.', 'error'); return false; }
    if (s.employees.length >= staffCapacity(s) || s.level < requirement.level || (s.landLevel ?? 0) < requirement.landLevel) {
      this.toast(`Vị trí tiếp theo cần shop cấp ${requirement.level} và mặt bằng cấp ${requirement.landLevel + 1}.`, 'error'); return false;
    }
    if (s.recruitmentPost || s.staffApplicants.length) { this.toast('Shop đang có một đợt tuyển dụng chưa hoàn tất.', 'error'); return false; }
    const rounded = Math.round(salary / 5000) * 5000;
    if (!Number.isFinite(rounded) || rounded < 30000 || rounded > 180000) { this.toast('Mức lương theo ngày cần từ 30.000₫ đến 180.000₫.', 'error'); return false; }
    s.recruitmentPost = { salary: rounded, postedDay: s.day, applicantsDay: s.day + 2 };
    this.commit();
    this.toast(`Đã đăng tin tuyển nhân viên với lương ${rounded.toLocaleString('vi-VN')}₫/ngày. Hồ sơ dự kiến về sau 2 ngày.`);
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
    const names = ['Mai An', 'Thảo Nhi', 'Gia Hân', 'Bảo Trân', 'Minh Châu', 'Khánh Linh', 'Yến Vy', 'Hà My', 'Ngọc Lam', 'Tú Anh'];
    const roles = [
      ['Stylist tinh tế', 'Mạnh về đọc gu khách và hoàn thiện outfit chỉ trong vài phút.'],
      ['Tư vấn viên năng động', 'Giao tiếp tự nhiên, tạo cảm giác thoải mái cho khách mới.'],
      ['Chuyên viên bán hàng', 'Nhanh nhạy khi chốt đơn và giới thiệu món phối bổ sung.'],
      ['Boutique host', 'Chăm sóc trải nghiệm, ghi nhớ sở thích của khách quen.'],
      ['Fashion assistant', 'Tỉ mỉ, đáng tin cậy và luôn giữ quầy kệ gọn gàng.'],
    ];
    const salaryPower = Math.max(0, Math.min(1, (post.salary - 30000) / 150000));
    const base = 34 + salaryPower * 46;
    const used = new Set(this.state.employees.map(employee => employee.name));
    const usedAppearances = new Set(this.state.employees.map(employee => Math.abs(employee.appearance) % 6));
    const applicants: StaffCandidate[] = [];
    for (let index = 0; index < 3; index++) {
      const availableNames = names.filter(name => !used.has(name));
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
    if (!candidate || s.employees.length >= staffCapacity(s)) return false;
    s.employees.push({ ...candidate, uid: `staff-${Date.now()}-${candidate.id}`, hiredDay: s.day, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0, experience: 0, skillLevel: 1, shiftSales: 0 });
    s.staffApplicants = [];
    s.recruitmentPost = null;
    this.commit(); this.toast(`${candidate.name} đã gia nhập ${s.shopName}!`); return true;
  }
  fireStaff(uid: string) {
    const employee = this.state.employees.find(item => item.uid === uid);
    if (!employee) return false;
    this.state.employees = this.state.employees.filter(item => item.uid !== uid);
    this.state.staffLeaveRequests = this.state.staffLeaveRequests.filter(request => request.employeeUid !== uid);
    this.commit(); this.toast(`${employee.name} đã rời đội ngũ boutique.`, 'error'); return true;
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
      const quitChance = employee.deniedLeaves >= 2 ? .04 + employee.deniedLeaves * .07 + (100 - employee.morale) * .003 : 0;
      if (quitChance && this.random() < quitChance) {
        s.employees = s.employees.filter(item => item.uid !== employee.uid);
        s.staffLeaveRequests = s.staffLeaveRequests.filter(request => request.employeeUid !== employee.uid);
        this.toast(`${employee.name} đã xin nghỉ việc vì nhiều lần không được duyệt nghỉ.`, 'error');
        continue;
      }
      const alreadyRequested = s.staffLeaveRequests.some(request => request.employeeUid === employee.uid);
      if (!employee.leaveUntilDay && !alreadyRequested) {
        const leaveChance = .025 + (100 - employee.reliability) * .0012;
        if (this.random() < leaveChance) {
          s.staffLeaveRequests.push({ employeeUid: employee.uid, requestedDay: s.day, days: this.random() < .75 ? 1 : 2, reason: reasons[Math.floor(this.random() * reasons.length)] });
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
  openShop() {
    if (this.state.phase !== 'preparation') return;
    if (this.state.gameOverReason) return;
    if (!this.hasDisplayedStock()) { this.toast('Hãy trưng ít nhất một món lên sào, kệ, tủ hoặc ma-nơ-canh trước khi mở cửa.', 'error'); return; }
    this.state.phase = 'open';
    this.state.dayTimer = DAY_DURATION;
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
    // Refresh danh sách khách cho ngày mới
    this.dayCustomersKey = -1;
    this.ensureDayCustomers();
    this.commit();
    this.emit({ type: 'customer' });
    this.toast(`Mở cửa ngày ${this.state.day}! ${event.name}: ${event.description}`);
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
      recordPublicShopReview(s, reviewStars);
      s.posts.unshift({ id: `${s.day}-${s.customerIndex}`, name: customer.name, handle: customer.handle, text: viral ? 'Một chiếc boutique nhỏ xinh vừa xuất hiện trên feed của mình! Outfit đúng gu, chủ shop siêu có tâm. Mọi người phải ghé thử! #LittleBoutique #OOTD' : `${items.map(p => p.name).join(' + ')} xinh hơn mình tưởng! ${score >= 88 ? 'Đúng gu 100%, chắc chắn sẽ quay lại!' : 'Cảm ơn shop đã chọn đồ giúp mình.'}`, likes: viral ? 2431 : Math.round(score / 3), day: s.day, viral, color: customer.outfit, reviewStars });
      s.posts = s.posts.slice(0, 40);
    } else {
      s.stats.walkouts = (s.stats.walkouts ?? 0) + 1;
      this.applyShopReview(reviewStars, .72);
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
    recordPublicShopReview(s, reviewStars);
    s.posts.unshift({
      id: `${s.day}-${s.customerIndex}-self`,
      name: customer.name,
      handle: customer.handle,
      text: `${items.map(p => p.name).join(' + ')} ở boutique xinh xỉu! Vừa ghé đã chốt đơn liền tay. #BoutiqueLover`,
      likes: viral ? 1850 : Math.round(score / 4) + 10,
      day: s.day,
      viral,
      color: customer.outfit,
      reviewStars
    });
    s.posts = s.posts.slice(0, 40);
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
    this.applyShopReview(1.5, .8);
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
  tick() {
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
    if (!this.state.dayTimer) { this.closeDay('time'); return; }
    this.processOnlineChannel();
    this.state.nextArrivalIn = Math.max(0, this.state.nextArrivalIn - 1);
    if (!this.state.nextArrivalIn && this.state.activeVisits.length < this.maxConcurrentCustomers()) {
      this.state.nextArrivalIn = arrivalDelay(this.state, this.random);
      this.admitCustomer();
      const groupChance = Math.min(.24, .015 + Math.max(0, this.state.level - 1) * .03 + (this.state.landLevel ?? 0) * .025);
      if (this.state.activeVisits.length < this.maxConcurrentCustomers() && this.random() < groupChance) this.admitCustomer();
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
    return this.state.onlineOrders.reduce((total, order) => total + (order.id !== exceptOrderId && this.onlineOrderProductIds(order).includes(productId) ? 1 : 0), 0);
  }

  private onlineHandOverQuantity(productId: string, orderId: string) {
    return Math.max(0, (this.state.inventory[productId] ?? 0) - this.onlineReservedQuantity(productId, orderId));
  }

  private processOnlineChannel() {
    const s = this.state;
    if (!s.onlineChannelEnabled || !s.onlineListings.length || s.onlineOrders.length >= 5) return;
    s.onlineNextOrderIn = Math.max(0, s.onlineNextOrderIn - 1);
    if (s.onlineNextOrderIn > 0) return;
    s.onlineNextOrderIn = 7 + Math.floor(this.random() * 8);
    const eligible = s.onlineListings.filter(productId => {
      return this.onlineWarehouseQuantity(productId) > this.onlineReservedQuantity(productId);
    });
    if (!eligible.length) return;
    const orderChance = onlineOrderChance(s, eligible);
    if (this.random() >= orderChance) return;
    const weighted = eligible.map(id => ({ id, weight: onlineProductDemandWeight(s, products.find(product => product.id === id)!) }));
    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = this.random() * totalWeight;
    const productId = weighted.find(item => (roll -= item.weight) <= 0)?.id ?? weighted[weighted.length - 1].id;
    this.createOnlineOrder(productId);
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
    this.toast(`Có đơn online mới! Shipper đang chờ lấy ${orderedProducts.length} sản phẩm.`);
    return true;
  }

  listOnlineProduct(productId: string) {
    const s = this.state;
    const product = products.find(item => item.id === productId);
    if (!product || s.phase === 'open') { this.toast('Chỉ chỉnh gian hàng online trước hoặc sau giờ bán.', 'error'); return false; }
    if (this.onlineWarehouseQuantity(productId) < 1) { this.toast('Sản phẩm này không còn trong kho để đăng bán.', 'error'); return false; }
    if (s.onlineListings.includes(productId)) return false;
    s.onlineListings.push(productId);
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
    const newFollowers = 1 + Math.floor(this.random() * 3);
    s.followers += newFollowers;
    s.stats.followers += newFollowers;
    s.xp += 4;
    this.commit();
    this.toast(`Giao đúng đơn online: +${net.toLocaleString('vi-VN')}₫ sau phí · khách đánh giá ${stars.toFixed(1)} sao.`);
    return true;
  }

  cancelOutOfStockOnlineOrder(orderId: string) {
    const s = this.state;
    const order = s.onlineOrders.find(item => item.id === orderId);
    if (!order || s.phase !== 'open' || this.onlineWarehouseQuantity(order.productId) > 0) return false;
    s.onlineOrders = s.onlineOrders.filter(item => item.id !== orderId);
    this.applyOnlineReview(2, .7);
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
    const staff = activeEmployees(this.state).sort((a, b) => (b.service + b.persuasion + b.reliability * .5) - (a.service + a.persuasion + a.reliability * .5));
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
    this.toast(`Đã giải ngân ${rounded.toLocaleString('vi-VN')}₫. Bắt đầu trả từ ngày 3.`);
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

  closeDay(reason: 'manual' | 'time' | 'sold-out' = 'manual') {
    if (this.state.phase !== 'open') return;
    const missedOnlineOrders = this.state.onlineOrders.length;
    if (missedOnlineOrders) {
      for (let index = 0; index < missedOnlineOrders; index++) this.applyOnlineReview(1.5, .85);
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
    const wageDue = this.state.employees.reduce((sum, employee) => sum + employee.salary, 0);
    const wagesPaid = Math.min(this.state.money, wageDue);
    this.state.money -= wagesPaid;
    this.state.stats.staffWages = wagesPaid;
    if (wagesPaid < wageDue) {
      for (const employee of this.state.employees) employee.morale = Math.max(0, employee.morale - 22);
      this.toast(`Shop còn thiếu ${(wageDue - wagesPaid).toLocaleString('vi-VN')}₫ tiền lương. Tinh thần đội ngũ giảm mạnh.`, 'error');
    }
    this.awardStaffShiftExperience();
    this.processStaffShiftEnd();
    this.commit();
    const debtNeedsWarning = this.state.loanOverdueDays >= 5 || this.state.rentOverdueDays >= 5;
    this.emit({ type: this.state.gameOverReason ? 'game-over' : debtNeedsWarning ? 'debt-warning' : 'summary' });
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
    this.state.phase = 'preparation';
    this.state.customerIndex = 0;
    this.state.dayTimer = DAY_DURATION;
    this.state.stats = emptyStats();
    this.state.currentCustomerId = null;
    this.state.customerMode = null;
    this.state.activeVisits = [];
    this.state.currentVisitId = null;
    this.state.lastCustomerId = null;
    this.state.nextArrivalIn = 0;
    this.state.patience = 0;
    this.receiveOrders();
    this.processStaffNewDay();
    this.commit();
    this.toast(`Chào ngày ${this.state.day}! Khám phá xu hướng mới và chuẩn bị shop nhé.`);
  }
  /** Partial delivery keeps paid overflow in transit, including saves from older builds. */
  private receiveOrders() {
    this.state.pendingOrders = this.state.pendingOrders.flatMap(o => {
      const p = products.find(p => p.id === o.productId);
      if (!p || o.arrivalDay > this.state.day) return [o];
      const stock = this.state.inventory[p.id] ?? 0;
      const received = Math.min(o.quantity, Math.max(0, 999 - stock));
      if (!received) return [o];
      this.state.inventory[p.id] = stock + received;
      this.toast(`Hàng về kho: ${p.name} × ${received}.`);
      if (received === o.quantity) return [];
      return [{ ...o, quantity: o.quantity - received, cost: Math.round(o.cost * (o.quantity - received) / o.quantity) }];
    });
  }
  collectOrders() { this.receiveOrders(); this.commit(); }
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
    if (displayedQuantity(this.state, productId) >= (this.state.inventory[productId] ?? 0)) { this.toast('Không còn món này trong kho để đem ra trưng.', 'error'); return false; }
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
    this.state.money -= next.cost; this.state.level++; this.commit(); this.toast(`Lên cấp ${this.state.level}! Thêm sản phẩm và nội thất mới đã mở khóa.`);
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
      s.recruitmentPost = { salary: 90000, postedDay: s.day, applicantsDay: s.day };
      this.generateStaffApplicants();
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
      case 'recruitment-ready':
        prepareRecruitment();
        this.commit(); this.toast('Debug: Shop cấp 3, mặt bằng cấp 3 và ngân sách đã sẵn sàng.'); return true;
      case 'applicants':
        generateApplicantsNow();
        this.commit(); this.toast('Debug: Đã tạo hồ sơ ứng viên ngay lập tức.'); return true;
      case 'hire': {
        if (!s.staffApplicants.length) generateApplicantsNow();
        const candidate = s.staffApplicants[0];
        if (!candidate || s.employees.length >= staffCapacity(s)) { this.commit(); this.toast('Debug: Không còn vị trí nhân viên trống.', 'error'); return false; }
        s.employees.push({ ...candidate, uid: `staff-debug-${Date.now()}-${candidate.id}`, hiredDay: s.day, morale: 90, deniedLeaves: 0, sales: 0, tipsEarned: 0 });
        s.staffApplicants = [];
        s.recruitmentPost = null;
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
        const employee = s.employees.find(item => !s.staffLeaveRequests.some(request => request.employeeUid === item.uid));
        if (!employee) { this.commit(); this.toast('Debug: Mọi nhân viên đều đã có đơn nghỉ.', 'error'); return false; }
        s.staffLeaveRequests.push({ employeeUid: employee.uid, requestedDay: s.day, days: 2, reason: 'cần giải quyết việc cá nhân' });
        this.commit(); this.toast(`Debug: ${employee.name} đã gửi đơn xin nghỉ.`); return true;
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
  reset() { this.state = initialState(); this.commit(); }
}
