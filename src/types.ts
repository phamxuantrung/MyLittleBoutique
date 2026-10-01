export type Category = 'tops' | 'bottoms' | 'dresses' | 'sets' | 'outerwear' | 'shoes' | 'bags' | 'accessories';
export type Style = 'Coquette' | 'Y2K' | 'Streetwear' | 'Minimal' | 'Casual' | 'Preppy' | 'Vintage' | 'K-pop' | 'Soft Girl' | 'Luxury'
  | 'Balletcore' | 'Clean Girl' | 'Sporty Chic' | 'Blokecore' | 'Gorpcore' | 'Dark Academia' | 'Cottagecore' | 'Boho' | 'Grunge' | 'Poetcore';
export type Occasion = 'cafe' | 'campus' | 'concert' | 'city' | 'date' | 'active' | 'travel' | 'party';
export interface Product {
  id: string; name: string; category: Category; style: Style; color: string; colorName: string;
  buyPrice: number; sellPrice: number; quality: number; level: number; art: string;
  subcategory: string; occasions: Occasion[]; secondaryStyles?: Style[];
  designColor?: string;
  designStrokes?: ProductDesignStroke[];
  designMotif?: ProductDesignMotif;
  designAccentColor?: string;
  designMotifScale?: number;
  designMotifX?: number;
  designMotifY?: number;
  designFormWidth?: number;
  designFormLength?: number;
  designMotifRotation?: number;
  designMotifOpacity?: number;
  designMotifRepeat?: ProductDesignMotifRepeat;
  designShapePoints?: ProductDesignPoint[];
  designShapeSmooth?: boolean;
  designStrokeColor?: string;
  designStrokeWidth?: number;
  designStickers?: ProductDesignSticker[];
}
export interface ProductDesignPoint { x: number; y: number; }
export type ProductDesignBrushTip = 'round' | 'marker' | 'calligraphy' | 'neon' | 'eraser';
export interface ProductDesignStroke { color: string; width: number; points: ProductDesignPoint[]; tip?: ProductDesignBrushTip; }
export type ProductDesignMotif = 'none' | 'heart' | 'star' | 'bow' | 'flower' | 'stripes';
export type ProductDesignMotifRepeat = 1 | 3 | 5;
export type ProductDesignStickerKind = 'heart' | 'star' | 'bow' | 'flower'
  | 'round-collar' | 'vest-collar' | 'polo-collar'
  | 'pleats' | 'buttons' | 'pocket' | 'zipper' | 'belt' | 'seam' | 'cuffs' | 'text';
export type ProductDesignTextFont = 'rounded' | 'handwritten' | 'serif';
export type ProductDesignTextEffect = 'none' | 'outline' | 'shadow' | 'glow';
export interface ProductDesignSticker {
  id: string;
  kind: ProductDesignStickerKind;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  text?: string;
  font?: ProductDesignTextFont;
  fontSize?: number;
  curve?: number;
  effect?: ProductDesignTextEffect;
}
export interface CustomProduct extends Product {
  custom: true;
  recipeId: string;
  createdDay: number;
}
export interface AtelierMaterial {
  id: string; name: string; description: string; level: number; price: number; color: string;
}
export interface AtelierRecipe {
  id: string; name: string; style: Style; category: Category; materials: Record<string, number>;
  art: string; color: string; colorName: string; quality: number; sellPrice: number;
}
export interface TailoringJob { id: string; productId: string; quantity: number; readyDay: number; }
export interface AtelierCraftHistoryEntry { id: string; style: Style; materials: Record<string, number>; recipeId?: string; success: boolean; day: number; }
export interface Customer {
  id: string; name: string; handle: string; personality: string; styles: Style[]; colors: string[];
  budget: number; patience: number; goal: string; skin: string; hair: string; outfit: string; hairStyle: number;
  minLevel?: number; occasion?: Occasion; preferredCategories?: Category[];
}
export interface Look { id: string; name: string; description: string; style: Style; occasion: Occasion; items: string[]; }
export interface Trend { name: string; subtitle: string; styles: Style[]; colors: string[]; bonus: number; tags: string[]; }
export type DisplayKind = 'clothing' | 'shoes' | 'bags' | 'accessories' | 'outfit';
export interface DisplayUpgrade { maxLevel: number; slotsPerLevel: number; baseCost: number; }
export interface FurnitureDisplay { kind: DisplayKind; capacity: number; categories: Category[]; upgrade?: DisplayUpgrade; }
export interface Furniture { id: string; name: string; price: number; appeal: number; level: number; art: string; width: number; height: number; style?: Style; description?: string; display?: FurnitureDisplay; }
export interface PlacedFurniture { uid: string; id: string; x: number; y: number; rotation: number; displayItems?: string[]; displayLevel?: number; customName?: string; }
export interface SocialPost {
  id: string; name: string; handle: string; text: string; likes: number; day: number; viral: boolean; color: string; reviewStars: number;
  createdAt?: number;
  channel?: 'shop' | 'online';
  avatar?: { id: string; skin: string; hair: string; outfit: string; hairStyle: number };
  likedByShop?: boolean;
}
export type DramaResponseTone = 'cute' | 'sassy' | 'business';
export interface SocialDramaChoice {
  id: string;
  tone: DramaResponseTone;
  text: string;
  resultText: string;
}
export interface SocialDramaThreadReply {
  id: string;
  shopText: string;
  tone: DramaResponseTone;
  communityAuthorName: string;
  communityAuthorHandle: string;
  communityText: string;
  source: 'ai' | 'fallback';
}
export interface SocialDrama {
  id: string;
  day: number;
  createdAt?: number;
  title: string;
  post: string;
  authorName: string;
  authorHandle: string;
  comments: string[];
  choices: SocialDramaChoice[];
  threadReplies: SocialDramaThreadReply[];
  source: 'ai' | 'fallback';
  resolvedChoiceId?: string;
  resolvedTone?: DramaResponseTone;
  shopReply?: string;
  outcome?: string;
}
export interface DayStats { revenue: number; spent: number; costOfGoods: number; sold: number; served: number; happy: number; trendSales: number; followers: number; rent: number; loanInterest: number; tips: number; staffWages: number; walkouts?: number; soldProducts?: Record<string, number>; }
export interface ShopLoan {
  principal: number;
  balance: number;
  dailyRate: number;
  paymentDue: number;
  issuedDay: number;
  lastInterestDay: number;
}
export interface StaffCandidate {
  id: string; name: string; role: string; bio: string; appearance: number; salary: number;
  service: number; persuasion: number; charm: number; reliability: number; appliedDay: number;
}
export interface StaffMember extends StaffCandidate {
  uid: string; hiredDay: number; morale: number; deniedLeaves: number; sales: number; tipsEarned: number;
  leaveUntilDay?: number; experience?: number; skillLevel?: number; shiftSales?: number;
  energy?: number; assignment?: StaffAssignment;
  unpaidShifts?: number; unpaidWages?: number; totalShiftsWorked?: number;
}
export type StaffAssignment = 'off' | 'service' | 'cashier' | 'stock';
export interface RecruitmentPost { salary: number; postedDay: number; applicantsDay: number; }
export interface StaffLeaveRequest { employeeUid: string; requestedDay: number; days: number; reason: string; }
export interface StaffFinancialNotice {
  payrollAtRisk: { uid: string; name: string; amount: number; shifts: number }[];
  departures: { uid: string; name: string; amount: number }[];
}
export interface PendingOrder { id: string; productId: string; quantity: number; cost: number; arrivalDay: number; supplierId?: string; }
export interface PendingMaterialOrder { id: string; materialId: string; quantity: number; cost: number; arrivalDay: number; supplierId?: string; }
export interface ArrivedOrderSummary { productId: string; productName: string; quantity: number; supplierId?: string; kind?: 'product' | 'material'; }
export type SupplierId = 'local' | 'wholesale' | 'global';
export interface ReturnCase {
  id: string; productId: string; customerName: string; amount: number; reason: string;
  availableDay: number; deadlineDay: number;
}
export interface VipAppointment {
  id: string; customerName: string; style: Style; category: Category; budget: number;
  scheduledDay: number; minItems: number; reward: number; status: 'offered' | 'accepted';
}
export interface CoutureOrder {
  id: string; clientName: string; brief: string; stage: 'concept' | 'materials' | 'fitting' | 'delivery';
  quality: number; acceptedDay: number; deadlineDay: number; reward: number; status: 'active' | 'ready';
}
export interface ReputationCrisis {
  startDay: number; deadlineDay: number; positiveReviews: number; sales: number;
  targetReviews: number; targetSales: number;
}
export interface OnlineOrder {
  id: string; productId: string; customerName: string; customerHandle: string;
  productIds?: string[];
  price: number; fee: number; createdDay: number; courierVariant: number;
}
export interface CustomerVisit {
  uid: string;
  customerId: string;
  mode: 'advice' | 'browse';
  patience: number;
  maxPatience: number;
  staffAttempted?: boolean;
  assignedStaffUid?: string;
  staffResolveIn?: number;
}
export type LoyaltyTier = 'Khách mới' | 'Khách quen' | 'Thân thiết' | 'VIP';
export interface CustomerLoyalty {
  visits: number;
  purchases: number;
  points: number;
  lastVisitDay: number;
  rewardsClaimed: number[];
}
export type CampaignKind = 'editorial' | 'category' | 'omnichannel';
export interface BrandCampaign {
  id: string;
  name: string;
  client: string;
  description: string;
  kind: CampaignKind;
  durationDays: number;
  targetUnits: number;
  targetRevenue: number;
  targetOnline: number;
  style?: Style;
  category?: Category;
  rewardMoney: number;
  rewardXp: number;
  rewardFollowers: number;
  prestigeReward: number;
}
export interface ActiveBrandCampaign extends BrandCampaign {
  startDay: number;
  deadlineDay: number;
  units: number;
  revenue: number;
  onlineOrders: number;
  status: 'active' | 'ready' | 'failed';
}
export interface GameState {
  version: 1; money: number; xp: number; level: number; reputation: number; reviews: number; followers: number;
  shopReviewTotal: number; shopReviewCount: number;
  day: number; phase: 'preparation' | 'open' | 'closed'; customerIndex: number; patience: number;
  dayTimer: number; dailyLuck?: string;
  currentCustomerId: string | null; customerMode: 'advice' | 'browse' | null;
  activeVisits: CustomerVisit[]; currentVisitId: string | null;
  nextArrivalIn: number; lastCustomerId: string | null; landLevel?: number;
  customerLoyalty: Record<string, CustomerLoyalty>;
  loan: ShopLoan | null; rentDue: number;
  loanOverdueDays: number; rentOverdueDays: number;
  gameOverReason: 'creditor' | 'landlord' | null;
  inventory: Record<string, number>; prices: Record<string, number>; layout: PlacedFurniture[];
  storedFurniture?: string[];
  pendingOrders: PendingOrder[];
  pendingMaterialOrders: PendingMaterialOrder[];
  onlineListings: string[]; onlineOrders: OnlineOrder[]; onlineNextOrderIn: number; onlineChannelEnabled: boolean;
  onlineRating: number; onlineReviews: number; onlineSales: number;
  stats: DayStats; posts: SocialPost[]; dramas: SocialDrama[]; dramaHeat: number; dramaTrust: number; nextDramaDay: number; claimed: string[]; sound: boolean; music: boolean; musicVolume: number; musicTrack: string; tutorialDone: boolean;
  employees: StaffMember[]; staffApplicants: StaffCandidate[]; recruitmentPost: RecruitmentPost | null; staffLeaveRequests: StaffLeaveRequest[];
  campaignSeason: number; industryReputation: number; activeCampaign: ActiveBrandCampaign | null; campaignAvailableDay: number;
  completedCampaigns: string[];
  activeSupplierId: SupplierId; supplierRelations: Record<SupplierId, number>;
  returnCases: ReturnCase[]; vipAppointments: VipAppointment[]; coutureOrder: CoutureOrder | null; coutureAvailableDay: number;
  operationSequence: number; reputationCrisis: ReputationCrisis | null;
  atelierOwned: boolean; materialInventory: Record<string, number>; craftedRecipeIds: string[]; atelierRecipeCards: string[]; atelierCraftHistory: AtelierCraftHistoryEntry[]; customProducts: CustomProduct[];
  tailoringJobs: TailoringJob[]; atelierDraft: CustomProduct | null;
  shopName: string; hasNamedShop?: boolean;
}
export interface SaleResult { success: boolean; score: number; reason: string; total: number; followers: number; viral: boolean; customer: Customer; products: Product[]; isSelfPick?: boolean; isStaffAssisted?: boolean; visitUid?: string; xpEarned?: number; tip?: number; staffName?: string; loyaltyPoints?: number; loyaltyTier?: LoyaltyTier; loyaltyReward?: string; reviewStars?: number; }
export type GameEvent = { type: 'change' } | { type: 'toast'; message: string; tone?: 'success' | 'error' } | { type: 'sale'; result: SaleResult } | { type: 'customer'; reason?: 'arrival' | 'focus' } | { type: 'summary' } | { type: 'debt-warning'; staff?: StaffFinancialNotice } | { type: 'game-over' } | { type: 'orders-arrived'; items: ArrivedOrderSummary[] };
