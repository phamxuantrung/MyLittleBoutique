import type { Category, GameState, Style, SupplierId, VipAppointment } from '../types';

export const RETURN_EXCHANGE_SHIPPING_FEE = 20_000;

export interface SupplierDefinition {
  id: SupplierId;
  name: string;
  description: string;
  unlockLevel: number;
  priceFactor: number;
  deliveryDays: number;
  minOrder: number;
  reliability: number;
}

export const suppliers: SupplierDefinition[] = [
  { id: 'local', name: 'Xưởng địa phương', description: 'Giá ổn định, nhận hàng ngay.', unlockLevel: 1, priceFactor: 1, deliveryDays: 0, minOrder: 1, reliability: 1 },
  { id: 'wholesale', name: 'Chợ sỉ xu hướng', description: 'Giảm 5%, giao 1–2 ngày.', unlockLevel: 3, priceFactor: .95, deliveryDays: 1, minOrder: 10, reliability: .86 },
  { id: 'global', name: 'Xưởng thiết kế cao cấp', description: 'Giảm 12%, giao 2–3 ngày.', unlockLevel: 5, priceFactor: .88, deliveryDays: 2, minOrder: 25, reliability: .76 },
];

export const supplierFor = (state: GameState) => suppliers.find(item => item.id === state.activeSupplierId) ?? suppliers[0];

const vipBriefs: { style: Style; category: Category }[] = [
  { style: 'Coquette', category: 'tops' }, { style: 'Minimal', category: 'outerwear' },
  { style: 'Luxury', category: 'bags' }, { style: 'Vintage', category: 'dresses' },
  { style: 'K-pop', category: 'tops' }, { style: 'Luxury', category: 'dresses' },
];
const vipNames = ['Linh Chi', 'Hạ Vy', 'Mina', 'An Nhiên', 'Yuna', 'Khánh Ly'];

export function createVipAppointment(state: GameState): VipAppointment {
  const index = state.operationSequence % vipNames.length;
  const brief = vipBriefs[(state.day + index) % vipBriefs.length];
  return {
    id: `vip-${state.day}-${state.operationSequence}`,
    customerName: vipNames[index],
    style: brief.style,
    category: brief.category,
    budget: 650000 + state.level * 120000,
    scheduledDay: state.day + 2,
    minItems: state.level >= 6 ? 3 : 2,
    reward: 160000 + state.level * 50000,
    status: 'offered',
  };
}

export function crisisComplete(state: GameState) {
  const crisis = state.reputationCrisis;
  return !!crisis && crisis.positiveReviews >= crisis.targetReviews && crisis.sales >= crisis.targetSales;
}
