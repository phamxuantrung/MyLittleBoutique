import { products } from '../data/catalog';
import type { GameState } from '../types';
import { buyPrice, isTrending, productStyles } from './rules';

export interface CatalogFilters {
  category: string; style: string; subcategory: string; occasion: string;
  availability: string; query: string; sort: string;
}
export const defaultFilters = (): CatalogFilters => ({ category: 'all', style: 'all', subcategory: 'all', occasion: 'all', availability: 'all', query: '', sort: 'level' });
export const searchText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export function filterProducts(s: GameState, f: CatalogFilters) {
  const query = searchText(f.query);
  return products.filter(p =>
    (f.category === 'all' || p.category === f.category) &&
    (f.style === 'all' || productStyles(p).some(style => style === f.style)) &&
    (f.subcategory === 'all' || p.subcategory === f.subcategory) &&
    (f.occasion === 'all' || p.occasions.some(o => o === f.occasion)) &&
    (f.availability !== 'unlocked' || p.level <= s.level) &&
    (f.availability !== 'owned' || (s.inventory[p.id] ?? 0) > 0) &&
    (!query || searchText(`${p.name} ${productStyles(p).join(' ')} ${p.colorName}`).includes(query)),
  ).sort((a, b) => {
    if (f.sort === 'price') return buyPrice(s, a) - buyPrice(s, b);
    if (f.sort === 'stock') return (s.inventory[b.id] ?? 0) - (s.inventory[a.id] ?? 0) || a.level - b.level;
    if (f.sort === 'trend') return Number(isTrending(s, b)) - Number(isTrending(s, a)) || a.level - b.level;
    return a.level - b.level;
  });
}
