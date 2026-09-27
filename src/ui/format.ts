import { productSvg, svgUrl, characterSvg, furnitureSvg } from '../art/svg';
import { employeePortraitSvg } from '../art/characters';
import type { Customer, Furniture, Product } from '../types';

export const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}₫`;
export const compact = (value: number) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}tr` : value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export const productImage = (p: Product, cls = '') => `<img class="product-art ${cls}" src="${svgUrl(productSvg(p))}" alt="${escapeHtml(p.name)}" draggable="false" />`;
export const avatarImage = (c: Customer, happy = false, items: Product[] = []) => `<img data-outfit="${items.map(p => p.id).join(',')}" src="${svgUrl(characterSvg(c, happy ? 'happy' : 'normal', false, items))}" alt="${escapeHtml(c.name)}${items.length ? ` mặc ${escapeHtml(items.map(p => p.name).join(', '))}` : ''}" />`;
export const furnitureImage = (f: Furniture) => `<img class="furniture-art" src="${svgUrl(furnitureSvg(f.art))}" alt="${f.name}" draggable="false" />`;
export const staffImage = (appearance: number, name: string) => `<img class="staff-art" src="${svgUrl(employeePortraitSvg(appearance))}" alt="${escapeHtml(name)}" draggable="false" />`;
