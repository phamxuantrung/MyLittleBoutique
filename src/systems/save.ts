import { customers, furniture, levels, products } from '../data/catalog';
import type { ActiveBrandCampaign, Category, CoutureOrder, CustomerLoyalty, CustomerVisit, DayStats, GameState, OnlineOrder, PendingOrder, PlacedFurniture, ReputationCrisis, ReturnCase, StaffCandidate, StaffLeaveRequest, StaffMember, Style, SupplierId, VipAppointment } from '../types';
import { advicePatience, canPlace, DAY_DURATION, dayDuration, displayCapacity, displayLevel, isWallFurnitureId, landExpansion, landSize, LOAN_DAILY_RATE, STAFF_SALARY_MIN } from './rules';
import { generateDayCustomers, lookupCustomer, registerCustomer } from './customerGen';

export const SAVE_KEY = 'little-boutique.save.v1';
const MOVABLE_DECOR_MIGRATION = 'system:wall-decor-v5';
const CAMPAIGN_LEVEL3_MIGRATION = 'system:campaign-level3-preview-v1';
const movableDecorStarters: PlacedFurniture[] = [
  { uid: 'starter-atelier-rug', id: 'atelier-rug', x: 2, y: 2, rotation: 0 },
  { uid: 'starter-fashion-print', id: 'fashion-print', x: 4, y: 0, rotation: 0 },
  { uid: 'starter-shop-sign', id: 'shop-sign', x: 1, y: 0, rotation: 0 },
  { uid: 'starter-window-left-a', id: 'boutique-window', x: 0, y: 2, rotation: 1 },
  { uid: 'starter-window-left-b', id: 'boutique-window', x: 0, y: 5, rotation: 1 },
];
export const emptyStats = (): DayStats => ({ revenue: 0, spent: 0, costOfGoods: 0, sold: 0, served: 0, happy: 0, trendSales: 0, followers: 0, rent: 0, loanInterest: 0, tips: 0, staffWages: 0, walkouts: 0, soldProducts: {} });
export function initialState(): GameState {
  return {
    version: 1, money: 500000, xp: 0, level: 1, reputation: 4.5, reviews: 0, followers: 0,
    shopReviewTotal: 0, shopReviewCount: 0,
    day: 1, phase: 'preparation', customerIndex: 0, patience: 0,
    currentCustomerId: null, customerMode: null, activeVisits: [], currentVisitId: null, nextArrivalIn: 0, lastCustomerId: null, landLevel: 0, customerLoyalty: {}, loan: null, rentDue: 0, loanOverdueDays: 0, rentOverdueDays: 0, gameOverReason: null,
    dayTimer: DAY_DURATION, dailyLuck: 'Nắng ấm nhẹ nhàng',
    inventory: {}, prices: {},
    pendingOrders: [],
    onlineListings: [], onlineOrders: [], onlineNextOrderIn: 8, onlineChannelEnabled: false,
    onlineRating: 5, onlineReviews: 0, onlineSales: 0,
    campaignSeason: 1, industryReputation: 0, activeCampaign: null, campaignAvailableDay: 1, completedCampaigns: [],
    activeSupplierId: 'local', supplierRelations: { local: 10, wholesale: 0, global: 0 },
    returnCases: [], vipAppointments: [], coutureOrder: null, coutureAvailableDay: 1, operationSequence: 0, reputationCrisis: null,
    storedFurniture: [],
    layout: [
      { uid: 'starter-rack', id: 'rack', x: 0, y: 2, rotation: 0, displayItems: [] },
      { uid: 'starter-mirror', id: 'mirror', x: 0, y: 0, rotation: 0 },
      { uid: 'starter-plant', id: 'plant', x: 6, y: 0, rotation: 0 },
      { uid: 'starter-counter', id: 'counter', x: 4, y: 4, rotation: 0 },
      ...movableDecorStarters.map(item => ({ ...item })),
    ], stats: emptyStats(), posts: [], claimed: [MOVABLE_DECOR_MIGRATION, CAMPAIGN_LEVEL3_MIGRATION], sound: true, music: false, musicVolume: 0.55, tutorialDone: false,
    employees: [], staffApplicants: [], recruitmentPost: null, staffLeaveRequests: [],
    shopName: 'My Little Boutique', hasNamedShop: false,
  };
}
const finite = (v: unknown, fallback: number, max = 1e12) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(max, v) : fallback;
const parseStaffCandidate = (raw: unknown): StaffCandidate | undefined => {
  if (!raw || typeof raw !== 'object') return;
  const value = raw as Record<string, unknown>;
  if (!['id', 'name', 'role', 'bio'].every(key => typeof value[key] === 'string')) return;
  return {
    id: String(value.id).slice(0, 80), name: String(value.name).slice(0, 40), role: String(value.role).slice(0, 60), bio: String(value.bio).slice(0, 180),
    appearance: Math.floor(finite(value.appearance, 0, 5)), salary: Math.max(STAFF_SALARY_MIN, Math.round(finite(value.salary, 80000, 400000))),
    service: Math.round(finite(value.service, 50, 100)), persuasion: Math.round(finite(value.persuasion, 50, 100)),
    charm: Math.round(finite(value.charm, 50, 100)), reliability: Math.round(finite(value.reliability, 50, 100)),
    appliedDay: Math.max(1, Math.floor(finite(value.appliedDay, 1, 99999))),
  };
};
export function parseSave(raw: string | null): GameState {
  const fresh = initialState();
  if (!raw) return fresh;
  try {
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || typeof s.inventory !== 'object' || !s.inventory) return fresh;
    const state: GameState = { ...fresh, money: finite(s.money, fresh.money), xp: Math.floor(finite(s.xp, 0)), level: Math.max(1, Math.floor(finite(s.level, 1, levels.length))), reputation: finite(s.reputation, 4.5, 5), reviews: Math.floor(finite(s.reviews, 0)), followers: Math.floor(finite(s.followers, 0)), day: Math.max(1, Math.floor(finite(s.day, 1, 99999))), dayTimer: finite(s.dayTimer, DAY_DURATION, DAY_DURATION), dailyLuck: typeof s.dailyLuck === 'string' ? s.dailyLuck : 'Nắng ấm nhẹ nhàng', inventory: {}, prices: {}, stats: emptyStats(), posts: [], claimed: [], storedFurniture: [], customerLoyalty: {}, shopName: typeof s.shopName === 'string' && s.shopName.trim() ? s.shopName.trim().slice(0, 30) : 'My Little Boutique', hasNamedShop: s.hasNamedShop === true };
    state.landLevel = Math.min(landExpansion.length - 1, Math.floor(finite(s.landLevel, 0, landExpansion.length - 1)));
    state.dayTimer = finite(s.dayTimer, dayDuration(state), dayDuration(state));
    state.rentDue = Math.round(finite(s.rentDue, 0, 999999999));
    state.loanOverdueDays = Math.floor(finite(s.loanOverdueDays, 0, 8));
    state.rentOverdueDays = Math.floor(finite(s.rentOverdueDays, 0, 8));
    state.gameOverReason = s.gameOverReason === 'creditor' || s.gameOverReason === 'landlord' ? s.gameOverReason : null;
    if (s.loan && typeof s.loan === 'object') {
      const principal = Math.round(finite(s.loan.principal, 0, 3000000));
      const balance = Math.round(finite(s.loan.balance, 0, 10000000));
      if (principal > 0) state.loan = {
        principal,
        balance,
        dailyRate: LOAN_DAILY_RATE,
        paymentDue: Math.min(balance, Math.round(finite(s.loan.paymentDue, 0, 10000000))),
        issuedDay: Math.max(1, Math.floor(finite(s.loan.issuedDay, 1, 99999))),
        lastInterestDay: Math.floor(finite(s.loan.lastInterestDay, 0, 99999)),
      };
    }
    if (s.customerLoyalty && typeof s.customerLoyalty === 'object') {
      const knownCustomerIds = new Set(customers.map(customer => customer.id));
      for (const [customerId, rawRelation] of Object.entries(s.customerLoyalty as Record<string, unknown>)) {
        if (!knownCustomerIds.has(customerId) || !rawRelation || typeof rawRelation !== 'object') continue;
        const relation = rawRelation as Record<string, unknown>;
        state.customerLoyalty[customerId] = {
          visits: Math.floor(finite(relation.visits, 0, 99999)),
          purchases: Math.floor(finite(relation.purchases, 0, 99999)),
          points: Math.floor(finite(relation.points, 0, 99999)),
          lastVisitDay: Math.floor(finite(relation.lastVisitDay, 0, 99999)),
          rewardsClaimed: Array.isArray(relation.rewardsClaimed)
            ? relation.rewardsClaimed.filter((value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && [25, 60, 120].includes(value)).slice(0, 3)
            : [],
        } satisfies CustomerLoyalty;
      }
    }
    const generatedCount = 15 + (state.day % 6) + landExpansion[state.landLevel].traffic * 2;
    for (const generated of generateDayCustomers(state.day, state.level, generatedCount)) registerCustomer(generated);
    for (const p of products) {
      state.inventory[p.id] = Math.floor(finite(s.inventory[p.id], 0, 999));
      if (s.prices?.[p.id] !== undefined) state.prices[p.id] = Math.round(finite(s.prices[p.id], p.sellPrice, 999999999));
    }
    for (const key of Object.keys(state.stats) as (keyof DayStats)[]) {
      if (key !== 'soldProducts') state.stats[key] = finite(s.stats?.[key], 0) as never;
    }
    state.stats.soldProducts = {};
    if (s.stats?.soldProducts && typeof s.stats.soldProducts === 'object') {
      for (const product of products) {
        const quantity = Math.floor(finite(s.stats.soldProducts[product.id], 0, 999));
        if (quantity > 0) state.stats.soldProducts[product.id] = quantity;
      }
    }
    state.phase = ['preparation', 'open', 'closed'].includes(s.phase) ? s.phase : 'preparation';
    state.customerIndex = Math.floor(finite(s.customerIndex, 0));
    const visitor = customers.find((c, index) => c.id === s.currentCustomerId && (c.minLevel ?? (index < 5 ? 1 : 3)) <= state.level) ?? (typeof s.currentCustomerId === 'string' ? lookupCustomer(s.currentCustomerId) : undefined);
    state.currentCustomerId = state.phase === 'open' && visitor ? visitor.id : null;
    state.customerMode = state.currentCustomerId ? (s.customerMode === 'browse' ? 'browse' : 'advice') : null;
    state.activeVisits = [];
    if (state.phase === 'open' && Array.isArray(s.activeVisits)) {
      const seen = new Set<string>();
      for (const rawVisit of s.activeVisits.slice(0, 5)) {
        if (!rawVisit || typeof rawVisit.uid !== 'string' || seen.has(rawVisit.uid) || typeof rawVisit.customerId !== 'string') continue;
        const visitCustomer = customers.find(c => c.id === rawVisit.customerId) ?? lookupCustomer(rawVisit.customerId);
        if (!visitCustomer) continue;
        const mode = rawVisit.mode === 'browse' ? 'browse' : 'advice';
        const maxPatience = finite(rawVisit.maxPatience, mode === 'advice' ? advicePatience(visitCustomer, state.level) : 15, 180);
        state.activeVisits.push({
          uid: rawVisit.uid.slice(0, 100),
          customerId: visitCustomer.id,
          mode,
          patience: finite(rawVisit.patience, maxPatience, maxPatience),
          maxPatience,
          ...(rawVisit.staffAttempted === true ? { staffAttempted: true } : {}),
          ...(typeof rawVisit.assignedStaffUid === 'string' ? { assignedStaffUid: rawVisit.assignedStaffUid.slice(0, 100) } : {}),
          ...(typeof rawVisit.staffResolveIn === 'number' ? { staffResolveIn: Math.max(0, Math.floor(finite(rawVisit.staffResolveIn, 0, 30))) } : {}),
        } satisfies CustomerVisit);
        seen.add(rawVisit.uid);
      }
    }
    if (!state.activeVisits.length && state.currentCustomerId && visitor) {
      const maxPatience = state.customerMode === 'advice' ? advicePatience(visitor, state.level) : 15;
      state.activeVisits.push({ uid: `legacy-${state.day}-${visitor.id}`, customerId: visitor.id, mode: state.customerMode ?? 'advice', patience: finite(s.patience, maxPatience, maxPatience), maxPatience });
    }
    const selectedVisit = state.activeVisits.find(visit => visit.uid === s.currentVisitId) ?? state.activeVisits.find(visit => visit.customerId === state.currentCustomerId) ?? state.activeVisits[0];
    state.currentVisitId = selectedVisit?.uid ?? null;
    state.currentCustomerId = selectedVisit?.customerId ?? null;
    state.customerMode = selectedVisit?.mode ?? null;
    state.lastCustomerId = (customers.some(c => c.id === s.lastCustomerId) || (typeof s.lastCustomerId === 'string' && !!lookupCustomer(s.lastCustomerId))) ? s.lastCustomerId : null;
    state.nextArrivalIn = Math.floor(finite(s.nextArrivalIn, 4, 30));
    state.patience = selectedVisit?.patience ?? 0;
    if (Array.isArray(s.layout)) {
      const hadDisplayData = s.layout.some((p: unknown) => !!p && typeof p === 'object' && Array.isArray((p as { displayItems?: unknown }).displayItems));
      state.layout = [];
      for (const p of s.layout.slice(0, 30)) {
        if (p && typeof p.uid === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(p.uid) && furniture.some(f => f.id === p.id) && [0, 1].includes(p.rotation) && !state.layout.some(f => f.uid === p.uid)) {
          const def = furniture.find(f => f.id === p.id)!;
          const size = landSize(state);
          const normalizedX = isWallFurnitureId(p.id) && p.rotation === 0 ? Math.min(p.x, size - def.width) : p.x;
          const normalizedY = isWallFurnitureId(p.id) && p.rotation === 1 ? Math.min(p.y, size - def.width) : p.y;
          const rawPlaced = { uid: p.uid, id: p.id, x: normalizedX, y: normalizedY, rotation: p.rotation, displayLevel: typeof p.displayLevel === 'number' ? p.displayLevel : 0 };
          if (!canPlace(state.layout, rawPlaced, state.landLevel)) continue;
          const normalizedDisplayLevel = displayLevel(def, rawPlaced);
          const capacity = displayCapacity(def, { ...rawPlaced, displayLevel: normalizedDisplayLevel });
          const displayItems = def.display && Array.isArray(p.displayItems)
            ? p.displayItems.filter((id: unknown) => typeof id === 'string' && products.some(product => product.id === id && def.display!.categories.includes(product.category))).slice(0, capacity)
            : undefined;
          const customName = typeof p.customName === 'string' ? p.customName.trim().slice(0, 28) : '';
          state.layout.push({ uid: p.uid, id: p.id, x: normalizedX, y: normalizedY, rotation: p.rotation, ...(displayItems ? { displayItems } : {}), ...(normalizedDisplayLevel ? { displayLevel: normalizedDisplayLevel } : {}), ...(customName ? { customName } : {}) });
        }
      }
      const allocated: Record<string, number> = {};
      for (const placed of state.layout) {
        if (!placed.displayItems) continue;
        placed.displayItems = placed.displayItems.filter(id => {
          allocated[id] = (allocated[id] ?? 0) + 1;
          if (allocated[id] <= (state.inventory[id] ?? 0)) return true;
          allocated[id]--;
          return false;
        });
      }
      // Saves made before display fixtures existed receive a sensible first display.
      if (!hadDisplayData) {
        for (const product of products) {
          let remaining = state.inventory[product.id] ?? 0;
          for (const placed of state.layout) {
            const def = furniture.find(f => f.id === placed.id);
            if (!def?.display?.categories.includes(product.category)) continue;
            placed.displayItems ??= [];
            while (remaining > 0 && placed.displayItems.length < displayCapacity(def, placed)) {
              placed.displayItems.push(product.id);
              remaining--;
            }
            if (!remaining) break;
          }
        }
      }
    }
    if (Array.isArray(s.storedFurniture)) {
      state.storedFurniture = s.storedFurniture.filter((id: unknown) => typeof id === 'string' && furniture.some(f => f.id === id)).slice(0, 100);
    }
    if (Array.isArray(s.posts)) state.posts = s.posts
      .filter((p: Record<string, unknown>) => p && ['id', 'name', 'handle', 'text', 'color'].every(k => typeof p[k] === 'string') && typeof p.viral === 'boolean' && typeof p.likes === 'number' && typeof p.day === 'number')
      .map((p: Record<string, unknown>) => ({ ...p, channel: p.channel === 'online' ? 'online' : 'shop', reviewStars: Math.max(1, Math.min(5, Math.round(finite(p.reviewStars, p.viral ? 5 : 4, 5)))) }))
      .slice(0, 40) as GameState['posts'];
    // Older saves only retain the latest 40 public posts. Use that known
    // history, then keep lifetime totals independently of the feed limit.
    const publicCount = s.shopReviewCount;
    const publicTotal = s.shopReviewTotal;
    const savedShopPosts = state.posts.filter(post => post.channel !== 'online');
    if (Number.isInteger(publicCount) && publicCount >= savedShopPosts.length && Number.isFinite(publicTotal) && publicTotal >= publicCount && publicTotal <= publicCount * 5) {
      state.shopReviewCount = publicCount;
      state.shopReviewTotal = publicTotal;
    } else {
      state.shopReviewCount = savedShopPosts.length;
      state.shopReviewTotal = savedShopPosts.reduce((sum, post) => sum + post.reviewStars, 0);
    }
    if (Array.isArray(s.staffApplicants)) state.staffApplicants = s.staffApplicants.map(parseStaffCandidate).filter((candidate: StaffCandidate | undefined): candidate is StaffCandidate => !!candidate).slice(0, 5);
    if (Array.isArray(s.employees)) {
      state.employees = s.employees.map((rawEmployee: unknown) => {
        const candidate = parseStaffCandidate(rawEmployee);
        if (!candidate || !rawEmployee || typeof rawEmployee !== 'object') return undefined;
        const value = rawEmployee as Record<string, unknown>;
        if (typeof value.uid !== 'string') return undefined;
        return {
          ...candidate, uid: value.uid.slice(0, 100), hiredDay: Math.max(1, Math.floor(finite(value.hiredDay, state.day, 99999))),
          morale: Math.round(finite(value.morale, 80, 100)), deniedLeaves: Math.floor(finite(value.deniedLeaves, 0, 99)),
          sales: Math.floor(finite(value.sales, 0, 999999)), tipsEarned: Math.round(finite(value.tipsEarned, 0)),
          experience: Math.floor(finite(value.experience, 0, 999999)), skillLevel: Math.max(1, Math.floor(finite(value.skillLevel, 1, 20))),
          shiftSales: Math.floor(finite(value.shiftSales, 0, 999)),
          energy: Math.round(finite(value.energy, 100, 100)),
          assignment: value.assignment === 'off' || value.assignment === 'cashier' || value.assignment === 'stock' ? value.assignment : 'service',
          ...(typeof value.leaveUntilDay === 'number' ? { leaveUntilDay: Math.floor(finite(value.leaveUntilDay, state.day, 99999)) } : {}),
          unpaidShifts: Math.max(0, Math.min(4, Math.floor(finite(value.unpaidShifts, 0, 4)))),
          unpaidWages: Math.max(0, Math.floor(finite(value.unpaidWages, 0, 999999999))),
          totalShiftsWorked: Math.max(0, Math.floor(finite(value.totalShiftsWorked, 0, 999999))),
        } satisfies StaffMember;
      }).filter((employee: StaffMember | undefined): employee is StaffMember => !!employee).slice(0, 30);
    }
    const activeStaffIds = new Set(state.employees.map(employee => employee.uid));
    for (const visit of state.activeVisits) {
      if (!visit.assignedStaffUid || activeStaffIds.has(visit.assignedStaffUid)) continue;
      delete visit.assignedStaffUid;
      delete visit.staffResolveIn;
      visit.staffAttempted = false;
    }
    if (s.recruitmentPost && typeof s.recruitmentPost === 'object') {
      state.recruitmentPost = {
        salary: Math.max(STAFF_SALARY_MIN, Math.round(finite(s.recruitmentPost.salary, 100000, 400000))),
        postedDay: Math.max(1, Math.floor(finite(s.recruitmentPost.postedDay, state.day, 99999))),
        applicantsDay: Math.max(state.day, Math.floor(finite(s.recruitmentPost.applicantsDay, state.day + 2, 99999))),
      };
    }
    if (Array.isArray(s.staffLeaveRequests)) {
      const employeeIds = new Set(state.employees.map(employee => employee.uid));
      state.staffLeaveRequests = s.staffLeaveRequests.filter((request: unknown): request is StaffLeaveRequest => {
        if (!request || typeof request !== 'object') return false;
        const value = request as Record<string, unknown>;
        return typeof value.employeeUid === 'string' && employeeIds.has(value.employeeUid) && typeof value.reason === 'string' && typeof value.requestedDay === 'number' && typeof value.days === 'number';
      }).map((request: StaffLeaveRequest) => ({ ...request, reason: request.reason.slice(0, 120), days: Math.max(1, Math.min(5, Math.floor(request.days))) })).slice(0, 3);
    }
    if (Array.isArray(s.claimed)) state.claimed = s.claimed.filter((x: unknown) => typeof x === 'string').slice(-300);
    // One-time preview migration for existing boutiques. A fresh/reset game still
    // starts at level 1 because initialState does not include this marker.
    if (!state.claimed.includes(CAMPAIGN_LEVEL3_MIGRATION)) {
      state.level = Math.max(3, state.level);
      state.xp = Math.max(650, state.xp);
      state.claimed.push(CAMPAIGN_LEVEL3_MIGRATION);
    }
    if (!state.claimed.includes(MOVABLE_DECOR_MIGRATION)) {
      state.storedFurniture ??= [];
      const starterSign = state.layout.find(item => item.uid === 'starter-shop-sign');
      if (starterSign?.x === 2 && starterSign.y === 0 && starterSign.rotation === 0) starterSign.x = 1;
      const starterPrint = state.layout.find(item => item.uid === 'starter-fashion-print');
      if (starterPrint?.x === 5 && starterPrint.y === 0 && starterPrint.rotation === 0) starterPrint.x = 4;
      const starterWindowA = state.layout.find(item => item.uid === 'starter-window-left-a');
      if (starterWindowA?.x === 0 && starterWindowA.y === 0 && starterWindowA.rotation === 1) starterWindowA.y = 2;
      const starterWindowB = state.layout.find(item => item.uid === 'starter-window-left-b');
      if (starterWindowB?.x === 0 && starterWindowB.y === 3 && starterWindowB.rotation === 1) starterWindowB.y = 5;
      for (const starter of movableDecorStarters) {
        if (state.layout.some(item => item.uid === starter.uid || (starter.id !== 'boutique-window' && item.id === starter.id))) continue;
        if (canPlace(state.layout, starter, state.landLevel)) state.layout.push({ ...starter });
        else state.storedFurniture.push(starter.id);
      }
      state.claimed.push(MOVABLE_DECOR_MIGRATION);
    }
    state.sound = typeof s.sound === 'boolean' ? s.sound : true;
    state.music = typeof s.music === 'boolean' ? s.music : false;
    state.musicVolume = finite(s.musicVolume, 0.55, 1);
    state.tutorialDone = s.tutorialDone === true;
    state.onlineRating = finite(s.onlineRating, 5, 5);
    state.onlineReviews = Math.floor(finite(s.onlineReviews, 0, 999999));
    state.onlineSales = Math.floor(finite(s.onlineSales, 0, 999999));
    state.onlineNextOrderIn = Math.floor(finite(s.onlineNextOrderIn, 8, 60));
    state.onlineChannelEnabled = typeof s.onlineChannelEnabled === 'boolean'
      ? s.onlineChannelEnabled
      : fresh.onlineChannelEnabled;
    state.campaignSeason = Math.max(1, Math.floor(finite(s.campaignSeason, 1, 9999)));
    state.industryReputation = Math.floor(finite(s.industryReputation, 0, 999999));
    state.campaignAvailableDay = Math.max(1, Math.floor(finite(s.campaignAvailableDay, 1, 99999)));
    state.completedCampaigns = Array.isArray(s.completedCampaigns)
      ? s.completedCampaigns.filter((id: unknown): id is string => typeof id === 'string').map((id: string) => id.slice(0, 80)).slice(-100)
      : [];
    const supplierIds: SupplierId[] = ['local', 'wholesale', 'global'];
    state.activeSupplierId = supplierIds.includes(s.activeSupplierId) ? s.activeSupplierId : 'local';
    state.supplierRelations = {
      local: Math.floor(finite(s.supplierRelations?.local, 10, 100)),
      wholesale: Math.floor(finite(s.supplierRelations?.wholesale, 0, 100)),
      global: Math.floor(finite(s.supplierRelations?.global, 0, 100)),
    };
    state.operationSequence = Math.floor(finite(s.operationSequence, 0, 999999));
    state.coutureAvailableDay = Math.max(1, Math.floor(finite(s.coutureAvailableDay, 1, 99999)));
    state.returnCases = Array.isArray(s.returnCases) ? s.returnCases.filter((raw: unknown): raw is ReturnCase => {
      if (!raw || typeof raw !== 'object') return false;
      const value = raw as ReturnCase;
      return typeof value.id === 'string' && products.some(product => product.id === value.productId)
        && typeof value.customerName === 'string' && typeof value.reason === 'string';
    }).map((item: ReturnCase) => ({
      id: item.id.slice(0, 100), productId: item.productId, customerName: item.customerName.slice(0, 40),
      amount: Math.round(finite(item.amount, 0, 999999999)), reason: item.reason.slice(0, 120),
      availableDay: Math.max(1, Math.floor(finite(item.availableDay, state.day, 99999))),
      deadlineDay: Math.max(1, Math.floor(finite(item.deadlineDay, state.day + 2, 99999))),
    })) : [];
    state.vipAppointments = Array.isArray(s.vipAppointments) ? s.vipAppointments.filter((raw: unknown): raw is VipAppointment => {
      if (!raw || typeof raw !== 'object') return false;
      const value = raw as VipAppointment;
      return typeof value.id === 'string' && typeof value.customerName === 'string' && ['offered', 'accepted'].includes(value.status);
    }).map((item: VipAppointment) => ({
      ...item, id: item.id.slice(0, 100), customerName: item.customerName.slice(0, 40),
      budget: Math.round(finite(item.budget, 500000, 999999999)), reward: Math.round(finite(item.reward, 100000, 999999999)),
      scheduledDay: Math.max(1, Math.floor(finite(item.scheduledDay, state.day + 1, 99999))),
      minItems: Math.max(1, Math.floor(finite(item.minItems, 2, 5))),
      style: item.style as Style, category: item.category as Category,
    })).slice(0, 3) : [];
    const rawCouture = s.coutureOrder as CoutureOrder | undefined;
    if (rawCouture && typeof rawCouture.id === 'string' && ['concept', 'materials', 'fitting', 'delivery'].includes(rawCouture.stage)) {
      state.coutureOrder = {
        id: rawCouture.id.slice(0, 100), clientName: String(rawCouture.clientName ?? 'Khách couture').slice(0, 50),
        brief: String(rawCouture.brief ?? '').slice(0, 180), stage: rawCouture.stage,
        quality: Math.floor(finite(rawCouture.quality, 0, 100)), acceptedDay: Math.max(1, Math.floor(finite(rawCouture.acceptedDay, state.day, 99999))),
        deadlineDay: Math.max(1, Math.floor(finite(rawCouture.deadlineDay, state.day + 5, 99999))),
        reward: Math.round(finite(rawCouture.reward, 500000, 999999999)), status: rawCouture.status === 'ready' ? 'ready' : 'active',
      };
    }
    const rawCrisis = s.reputationCrisis as ReputationCrisis | undefined;
    if (rawCrisis && typeof rawCrisis.startDay === 'number') state.reputationCrisis = {
      startDay: Math.max(1, Math.floor(finite(rawCrisis.startDay, state.day, 99999))),
      deadlineDay: Math.max(1, Math.floor(finite(rawCrisis.deadlineDay, state.day + 3, 99999))),
      positiveReviews: Math.floor(finite(rawCrisis.positiveReviews, 0, 999)), sales: Math.floor(finite(rawCrisis.sales, 0, 999)),
      targetReviews: Math.max(1, Math.floor(finite(rawCrisis.targetReviews, 3, 99))), targetSales: Math.max(1, Math.floor(finite(rawCrisis.targetSales, 8, 999))),
    };
    const rawCampaign = s.activeCampaign;
    if (rawCampaign && typeof rawCampaign === 'object' && ['editorial', 'category', 'omnichannel'].includes(rawCampaign.kind)) {
      const styles = new Set(products.flatMap(product => [product.style, ...(product.secondaryStyles ?? [])]));
      const categories = new Set(products.map(product => product.category));
      const style = styles.has(rawCampaign.style as Style) ? rawCampaign.style as Style : undefined;
      const category = categories.has(rawCampaign.category as Category) ? rawCampaign.category as Category : undefined;
      state.activeCampaign = {
        id: typeof rawCampaign.id === 'string' ? rawCampaign.id.slice(0, 80) : `legacy-${state.campaignSeason}`,
        name: typeof rawCampaign.name === 'string' ? rawCampaign.name.slice(0, 80) : 'Chiến dịch boutique',
        client: typeof rawCampaign.client === 'string' ? rawCampaign.client.slice(0, 80) : 'Đối tác thời trang',
        description: typeof rawCampaign.description === 'string' ? rawCampaign.description.slice(0, 240) : '',
        kind: rawCampaign.kind,
        durationDays: Math.max(1, Math.floor(finite(rawCampaign.durationDays, 4, 14))),
        targetUnits: Math.max(1, Math.floor(finite(rawCampaign.targetUnits, 10, 9999))),
        targetRevenue: Math.max(1, Math.round(finite(rawCampaign.targetRevenue, 500000, 999999999))),
        targetOnline: Math.floor(finite(rawCampaign.targetOnline, 0, 999)),
        ...(style ? { style } : {}), ...(category ? { category } : {}),
        rewardMoney: Math.round(finite(rawCampaign.rewardMoney, 0, 999999999)),
        rewardXp: Math.floor(finite(rawCampaign.rewardXp, 0, 999999)),
        rewardFollowers: Math.floor(finite(rawCampaign.rewardFollowers, 0, 999999)),
        prestigeReward: Math.max(1, Math.floor(finite(rawCampaign.prestigeReward, 1, 100))),
        startDay: Math.max(1, Math.floor(finite(rawCampaign.startDay, state.day, 99999))),
        deadlineDay: Math.max(state.day - 30, Math.floor(finite(rawCampaign.deadlineDay, state.day + 3, 99999))),
        units: Math.floor(finite(rawCampaign.units, 0, 99999)),
        revenue: Math.round(finite(rawCampaign.revenue, 0, 999999999)),
        onlineOrders: Math.floor(finite(rawCampaign.onlineOrders, 0, 99999)),
        status: rawCampaign.status === 'ready' || rawCampaign.status === 'failed' ? rawCampaign.status : 'active',
      } satisfies ActiveBrandCampaign;
    }
    state.onlineListings = Array.isArray(s.onlineListings)
      ? s.onlineListings.filter((id: unknown): id is string => typeof id === 'string' && products.some(product => product.id === id)).filter((id: string, index: number, all: string[]) => all.indexOf(id) === index)
      : [];
    state.onlineOrders = [];
    if (state.phase === 'open' && Array.isArray(s.onlineOrders)) {
      state.onlineOrders = s.onlineOrders.filter((raw: unknown): raw is OnlineOrder => {
        if (!raw || typeof raw !== 'object') return false;
        const order = raw as OnlineOrder;
        return typeof order.id === 'string' && products.some(product => product.id === order.productId)
          && typeof order.customerName === 'string' && typeof order.customerHandle === 'string'
          && Number.isFinite(order.price) && order.price > 0 && Number.isFinite(order.fee) && order.fee >= 0
          && Number.isSafeInteger(order.createdDay) && Number.isSafeInteger(order.courierVariant);
      }).map((order: OnlineOrder) => ({
        id: order.id.slice(0, 100), productId: order.productId,
        ...(Array.isArray(order.productIds) ? { productIds: order.productIds.filter((id, index, all) => typeof id === 'string' && products.some(product => product.id === id) && all.indexOf(id) === index).slice(0, 6) } : {}),
        customerName: order.customerName.slice(0, 40), customerHandle: order.customerHandle.slice(0, 40),
        price: Math.round(order.price), fee: Math.round(order.fee), createdDay: order.createdDay,
        courierVariant: Math.max(0, Math.min(2, order.courierVariant)),
      })).slice(0, 5);
    }
    // Pending international orders
    state.pendingOrders = [];
    if (Array.isArray(s.pendingOrders)) {
      state.pendingOrders = s.pendingOrders.filter((o: PendingOrder) =>
        o && typeof o.id === 'string' && products.some(p => p.id === o.productId) &&
        Number.isSafeInteger(o.quantity) && o.quantity > 0 &&
        Number.isFinite(o.cost) && o.cost >= 0 &&
        Number.isSafeInteger(o.arrivalDay) && o.arrivalDay > 0
      ).map((o: PendingOrder) => ({ id: o.id, productId: o.productId, quantity: o.quantity, cost: o.cost, arrivalDay: o.arrivalDay, ...(['local', 'wholesale', 'global'].includes(o.supplierId ?? '') ? { supplierId: o.supplierId } : {}) }));
    }
    return state;
  } catch { return fresh; }
}
export class SaveSystem {
  available = true;
  load() { try { return parseSave(localStorage.getItem(SAVE_KEY)); } catch { this.available = false; return initialState(); } }
  write(state: GameState) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); this.available = true; } catch { this.available = false; } }
}
