export type Category = 'tops' | 'bottoms' | 'dresses' | 'sets' | 'outerwear' | 'shoes' | 'bags' | 'accessories';
export type Style = 'Coquette' | 'Y2K' | 'Streetwear' | 'Minimal' | 'Casual' | 'Preppy' | 'Vintage' | 'K-pop' | 'Soft Girl' | 'Luxury'
  | 'Balletcore' | 'Clean Girl' | 'Sporty Chic' | 'Blokecore' | 'Gorpcore' | 'Dark Academia' | 'Cottagecore' | 'Boho' | 'Grunge' | 'Poetcore';
export type Occasion = 'cafe' | 'campus' | 'concert' | 'city' | 'date' | 'active' | 'travel' | 'party';
export interface Product {
  id: string; name: string; category: Category; style: Style; color: string; colorName: string;
  buyPrice: number; sellPrice: number; quality: number; level: number; art: string;
  subcategory: string; occasions: Occasion[]; secondaryStyles?: Style[];
}
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
export interface SocialPost { id: string; name: string; handle: string; text: string; likes: number; day: number; viral: boolean; color: string; reviewStars: number; }
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
}
export interface RecruitmentPost { salary: number; postedDay: number; applicantsDay: number; }
export interface StaffLeaveRequest { employeeUid: string; requestedDay: number; days: number; reason: string; }
export interface PendingOrder { id: string; productId: string; quantity: number; cost: number; arrivalDay: number; }
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
export interface GameState {
  version: 1; money: number; xp: number; level: number; reputation: number; reviews: number; followers: number;
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
  onlineListings: string[]; onlineOrders: OnlineOrder[]; onlineNextOrderIn: number; onlineChannelEnabled: boolean;
  onlineRating: number; onlineReviews: number; onlineSales: number;
  stats: DayStats; posts: SocialPost[]; claimed: string[]; sound: boolean; music: boolean; tutorialDone: boolean;
  employees: StaffMember[]; staffApplicants: StaffCandidate[]; recruitmentPost: RecruitmentPost | null; staffLeaveRequests: StaffLeaveRequest[];
  shopName: string; hasNamedShop?: boolean;
}
export interface SaleResult { success: boolean; score: number; reason: string; total: number; followers: number; viral: boolean; customer: Customer; products: Product[]; isSelfPick?: boolean; isStaffAssisted?: boolean; visitUid?: string; xpEarned?: number; tip?: number; staffName?: string; loyaltyPoints?: number; loyaltyTier?: LoyaltyTier; loyaltyReward?: string; reviewStars?: number; }
export type GameEvent = { type: 'change' } | { type: 'toast'; message: string; tone?: 'success' | 'error' } | { type: 'sale'; result: SaleResult } | { type: 'customer' } | { type: 'summary' } | { type: 'debt-warning' } | { type: 'game-over' };
