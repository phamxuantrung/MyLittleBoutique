import type { BrandCampaign, GameState, Style, Category } from '../types';

export const CAMPAIGN_GUIDE_SEEN = 'system:campaign-guide-v1';

const editorialStyles: Style[] = ['Coquette', 'Streetwear', 'Minimal', 'Y2K', 'Luxury', 'Balletcore', 'Clean Girl', 'K-pop', 'Vintage'];
const launchCategories: Category[] = ['tops', 'bottoms', 'dresses', 'shoes', 'bags', 'accessories'];

const styleNames: Record<Style, string> = {
  Coquette: 'Coquette', Y2K: 'Y2K', Streetwear: 'Streetwear', Minimal: 'Minimal', Casual: 'Casual', Preppy: 'Preppy', Vintage: 'Vintage', 'K-pop': 'K-pop', 'Soft Girl': 'Soft Girl', Luxury: 'Luxury', Balletcore: 'Balletcore', 'Clean Girl': 'Clean Girl', 'Sporty Chic': 'Sporty Chic', Blokecore: 'Blokecore', Gorpcore: 'Gorpcore', 'Dark Academia': 'Dark Academia', Cottagecore: 'Cottagecore', Boho: 'Boho', Grunge: 'Grunge', Poetcore: 'Poetcore',
};
const categoryNames: Record<Category, string> = {
  tops: 'Áo', bottoms: 'Quần & chân váy', dresses: 'Đầm', sets: 'Set phối sẵn', outerwear: 'Áo khoác', shoes: 'Giày', bags: 'Túi', accessories: 'Phụ kiện',
};

const rounded = (value: number, step: number) => Math.round(value / step) * step;

export function campaignOffers(state: Pick<GameState, 'campaignSeason' | 'level' | 'industryReputation'>): BrandCampaign[] {
  const season = Math.max(1, Math.floor(state.campaignSeason || 1));
  const level = Math.max(3, Math.floor(state.level));
  const prestige = Math.max(0, Math.floor(state.industryReputation || 0));
  const style = editorialStyles[(season - 1) % editorialStyles.length];
  const category = launchCategories[(season * 2 - 2) % launchCategories.length];
  const scale = 1 + Math.max(0, level - 3) * .16 + Math.max(0, season - 1) * .09;
  const rewardScale = 1 + Math.max(0, level - 3) * .22 + Math.max(0, season - 1) * .12;
  const lateGame = level >= 6 || prestige >= 8;
  return [
    {
      id: `s${season}-editorial`, name: `Editorial ${styleNames[style]}`, client: 'Tạp chí LUMIÈRE', kind: 'editorial', style,
      description: `Tạo một câu chuyện thời trang nhất quán với các thiết kế ${styleNames[style]}.`, durationDays: 4,
      targetUnits: Math.max(8, Math.round(10 * scale)), targetRevenue: rounded(850000 * scale, 50000), targetOnline: 0,
      rewardMoney: rounded(420000 * rewardScale, 10000), rewardXp: Math.round(90 * rewardScale), rewardFollowers: Math.round(45 * rewardScale), prestigeReward: 2,
    },
    {
      id: `s${season}-launch`, name: `Ra mắt ${categoryNames[category]}`, client: 'Maison Sunday', kind: 'category', category,
      description: `Biến ${categoryNames[category].toLowerCase()} thành tâm điểm mới của boutique.`, durationDays: 5,
      targetUnits: Math.max(10, Math.round(13 * scale)), targetRevenue: rounded(1200000 * scale, 50000), targetOnline: 0,
      rewardMoney: rounded(560000 * rewardScale, 10000), rewardXp: Math.round(125 * rewardScale), rewardFollowers: Math.round(65 * rewardScale), prestigeReward: 3,
    },
    {
      id: `s${season}-fashion-week`, name: lateGame ? 'Fashion Week: Global Edit' : 'Pop-up đa kênh', client: lateGame ? 'Global Fashion Council' : 'The Weekend Edit', kind: 'omnichannel',
      description: lateGame ? 'Điều hành một chiến dịch lớn đồng thời tại boutique và kênh online.' : 'Kết hợp trải nghiệm tại shop với những đơn giao hàng đầu tiên.', durationDays: lateGame ? 6 : 5,
      targetUnits: Math.max(14, Math.round((lateGame ? 22 : 16) * scale)), targetRevenue: rounded((lateGame ? 2800000 : 1700000) * scale, 50000), targetOnline: Math.max(2, Math.round((lateGame ? 5 : 3) * Math.min(1.7, scale))),
      rewardMoney: rounded((lateGame ? 1100000 : 720000) * rewardScale, 10000), rewardXp: Math.round((lateGame ? 240 : 160) * rewardScale), rewardFollowers: Math.round((lateGame ? 180 : 95) * rewardScale), prestigeReward: lateGame ? 5 : 4,
    },
  ];
}

export function campaignIsComplete(campaign: Pick<BrandCampaign, 'targetUnits' | 'targetRevenue' | 'targetOnline'> & { units: number; revenue: number; onlineOrders: number }) {
  return campaign.units >= campaign.targetUnits && campaign.revenue >= campaign.targetRevenue && campaign.onlineOrders >= campaign.targetOnline;
}

export function campaignRank(prestige: number) {
  if (prestige >= 30) return 'Biểu tượng toàn cầu';
  if (prestige >= 18) return 'Nhà mốt danh tiếng';
  if (prestige >= 9) return 'Đối tác được săn đón';
  if (prestige >= 3) return 'Tên tuổi mới';
  return 'Boutique triển vọng';
}

export { categoryNames, styleNames };
