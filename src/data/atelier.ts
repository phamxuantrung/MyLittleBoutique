import type { AtelierMaterial, AtelierRecipe, CustomProduct, Product } from '../types';
import { products } from './catalog';

export const ATELIER_UNLOCK_LEVEL = 8;
export const ATELIER_PURCHASE_COST = 30000000;
export const ATELIER_RECIPE_CARD_COST = 750000;

export const atelierMaterials: AtelierMaterial[] = [
  { id: 'cotton', name: 'Cotton Cloud', description: 'Cotton mềm, dễ tạo phom cho thiết kế hằng ngày.', level: 8, price: 65000, color: '#f6efe5' },
  { id: 'linen', name: 'Linen Mộc', description: 'Sợi linen thoáng nhẹ với bề mặt tự nhiên.', level: 8, price: 82000, color: '#d9c7a4' },
  { id: 'denim', name: 'Denim Indigo', description: 'Vải denim chắc phom cho phong cách đường phố.', level: 8, price: 105000, color: '#7796c8' },
  { id: 'lace', name: 'Ren Chantilly', description: 'Lớp ren mềm tạo chi tiết nữ tính tinh xảo.', level: 8, price: 125000, color: '#f2cfe2' },
  { id: 'ribbon', name: 'Ruy băng Satin', description: 'Ruy băng bóng dùng làm nơ và đường viền.', level: 8, price: 58000, color: '#ed92bd' },
  { id: 'wool', name: 'Wool Merino', description: 'Len mịn giữ phom tốt cho áo khoác cao cấp.', level: 9, price: 185000, color: '#a78f83' },
  { id: 'silk', name: 'Lụa Mulberry', description: 'Lụa tơ tằm óng nhẹ dành cho thiết kế premium.', level: 9, price: 245000, color: '#cfb0dc' },
  { id: 'leather', name: 'Da Nappa', description: 'Da mềm, bền và sang cho phụ kiện thủ công.', level: 9, price: 290000, color: '#8b5f55' },
  { id: 'crystal', name: 'Pha lê Aurora', description: 'Đá pha lê bắt sáng cho chi tiết couture.', level: 10, price: 380000, color: '#9edff2' },
  { id: 'cashmere', name: 'Cashmere Ivory', description: 'Sợi cashmere hiếm với độ mềm và ấm vượt trội.', level: 10, price: 460000, color: '#efe4d0' },
];

export const atelierRecipes: AtelierRecipe[] = [
  { id: 'cloud-tee', name: 'Cloud Atelier Tee', style: 'Casual', category: 'tops', materials: { cotton: 2, ribbon: 1 }, art: 'atelier-cloud-tee', color: '#f4a8cb', colorName: 'Hồng', quality: 88, sellPrice: 429000 },
  { id: 'linen-poet', name: 'Linen Poet Blouse', style: 'Poetcore', category: 'tops', materials: { linen: 2, lace: 1 }, art: 'atelier-linen-poet', color: '#e7d7bd', colorName: 'Kem', quality: 91, sellPrice: 569000 },
  { id: 'indigo-street', name: 'Indigo Street Jeans', style: 'Streetwear', category: 'bottoms', materials: { denim: 3, cotton: 1 }, art: 'atelier-indigo-street', color: '#6f91c9', colorName: 'Xanh', quality: 90, sellPrice: 649000 },
  { id: 'ribbon-dream', name: 'Ribbon Dream Dress', style: 'Coquette', category: 'dresses', materials: { cotton: 2, lace: 2, ribbon: 2 }, art: 'atelier-ribbon-dream', color: '#efa4c9', colorName: 'Hồng', quality: 94, sellPrice: 890000 },
  { id: 'denim-y2k', name: 'Y2K Denim Set', style: 'Y2K', category: 'sets', materials: { denim: 3, ribbon: 1 }, art: 'atelier-denim-y2k', color: '#7f9ed4', colorName: 'Xanh', quality: 92, sellPrice: 980000 },
  { id: 'merino-prep', name: 'Merino Academy Coat', style: 'Preppy', category: 'outerwear', materials: { wool: 3, cotton: 1 }, art: 'atelier-merino-prep', color: '#8c6f67', colorName: 'Nâu', quality: 95, sellPrice: 1450000 },
  { id: 'silk-minimal', name: 'Silk Minimal Slip', style: 'Minimal', category: 'dresses', materials: { silk: 3, cotton: 1 }, art: 'atelier-silk-minimal', color: '#cbb7d8', colorName: 'Tím', quality: 97, sellPrice: 1750000 },
  { id: 'nappa-bag', name: 'Nappa Muse Bag', style: 'Luxury', category: 'bags', materials: { leather: 3, silk: 1 }, art: 'atelier-nappa-bag', color: '#9c7065', colorName: 'Nâu', quality: 97, sellPrice: 2100000 },
  { id: 'wool-grunge', name: 'Distressed Wool Jacket', style: 'Grunge', category: 'outerwear', materials: { wool: 2, denim: 2 }, art: 'atelier-wool-grunge', color: '#665b68', colorName: 'Tím', quality: 94, sellPrice: 1580000 },
  { id: 'aurora-couture', name: 'Aurora Crystal Gown', style: 'Luxury', category: 'dresses', materials: { silk: 3, crystal: 2, lace: 1 }, art: 'atelier-aurora-couture', color: '#a9ddea', colorName: 'Xanh', quality: 100, sellPrice: 3600000 },
  { id: 'cashmere-clean', name: 'Ivory Cashmere Coat', style: 'Clean Girl', category: 'outerwear', materials: { cashmere: 3, silk: 1 }, art: 'atelier-cashmere-clean', color: '#eee2cf', colorName: 'Kem', quality: 100, sellPrice: 3200000 },
  { id: 'crystal-ballet', name: 'Crystal Ballet Set', style: 'Balletcore', category: 'sets', materials: { silk: 2, crystal: 1, ribbon: 2 }, art: 'atelier-crystal-ballet', color: '#e6b9d5', colorName: 'Hồng', quality: 99, sellPrice: 2850000 },
];

export const atelierRecipeCost = (recipe: AtelierRecipe) => Object.entries(recipe.materials)
  .reduce((sum, [id, quantity]) => sum + (atelierMaterials.find(material => material.id === id)?.price ?? 0) * quantity, 0);

export function registerCustomProduct(product: CustomProduct): Product {
  const existing = products.find(item => item.id === product.id);
  if (existing) return existing;
  products.push(product);
  return product;
}

export function registerCustomProducts(customProducts: CustomProduct[]) {
  for (const product of customProducts) registerCustomProduct(product);
}

export function unregisterCustomProduct(productId: string) {
  const index = products.findIndex(product => product.id === productId && (product as Product & { custom?: boolean }).custom === true);
  if (index >= 0) products.splice(index, 1);
}

export function clearRegisteredCustomProducts() {
  for (let index = products.length - 1; index >= 0; index--) {
    if ((products[index] as Product & { custom?: boolean }).custom === true) products.splice(index, 1);
  }
}
