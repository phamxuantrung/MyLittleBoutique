import { productSvg, svgUrl, characterSvg, furnitureSvg } from '../art/svg';
import { externalProductArtwork } from '../art/productAssets';
import { customerArtwork } from '../art/customerAssets';
import { employeeArtwork } from '../art/employeeAssets';
import { externalFurnitureArtwork } from '../art/furnitureAssets';
import type { Customer, Furniture, Product } from '../types';

export const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}₫`;
export const compactMoney = (value: number) => {
  const absolute = Math.abs(value);
  const format = (scaled: number, suffix: 'M' | 'B') => `${scaled.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}${suffix}₫`;
  if (absolute >= 1_000_000_000) return format(value / 1_000_000_000, 'B');
  if (absolute >= 1_000_000) return format(value / 1_000_000, 'M');
  return money(value);
};
export const compact = (value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}tr` : value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const productImage = (p: Product, cls = '') => {
  const external = externalProductArtwork(p);
  const source = external ?? svgUrl(productSvg(p));
  const sourceClass = external ? 'product-art-external' : 'product-art-generated';
  return `<img class="product-art ${sourceClass} ${cls}" src="${source}" alt="${escapeHtml(p.name)}" draggable="false" />`;
};
export const avatarImage = (c: Customer, happy = false, _items: Product[] = []) => {
  const external = customerArtwork(c.id, happy ? 'happy' : 'normal');
  const source = external ?? svgUrl(characterSvg(c, 'normal', false, []));
  const sourceClass = external ? 'customer-art-external' : 'customer-art-generated';
  return `<img class="customer-art ${sourceClass}" data-outfit="" src="${source}" alt="${escapeHtml(c.name)}" draggable="false" />`;
};
export const furnitureImage = (f: Furniture) => `<img class="furniture-art" src="${externalFurnitureArtwork(f.art) ?? svgUrl(furnitureSvg(f.art))}" alt="${escapeHtml(f.name)}" draggable="false" />`;
export const staffImage = (appearance: number, name: string) => `<img class="staff-art" src="${employeeArtwork(appearance)}" alt="${escapeHtml(name)}" draggable="false" />`;
