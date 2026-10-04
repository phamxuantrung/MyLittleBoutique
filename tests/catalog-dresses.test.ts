import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';
import { externalProductArtwork } from '../src/art/productAssets';

describe('new dresses collection', () => {
  const dresses = products.filter(product => product.category === 'dresses');

  it('contains exactly the ten supplied dresses with their authored attributes and assigned levels', () => {
    expect(dresses.map(({ id, name, style, colorName, level }) => ({ id, name, style, colorName, level }))).toEqual([
      { id: 'ribbon-dress', name: 'Đầm Sunday Date', style: 'Coquette', colorName: 'Hồng', level: 1 },
      { id: 'vintage', name: 'Đầm Golden Hour', style: 'Luxury', colorName: 'Vàng', level: 5 },
      { id: 'silk', name: 'Đầm lụa Moonlight', style: 'Minimal', colorName: 'Bạc', level: 4 },
      { id: 'atelier-mini-dress', name: 'Váy Mini Pink Spotlight', style: 'Y2K', colorName: 'Hồng', level: 3 },
      { id: 'atelier-maxi-dress', name: 'Đầm Maxi Garden Waltz', style: 'Cottagecore', colorName: 'Xanh lá', level: 4 },
      { id: 'blue-slip', name: 'Đầm Slip Cool Blue', style: 'Clean Girl', colorName: 'Xanh', level: 2 },
      { id: 'meadow-maxi', name: 'Đầm Maxi Meadow Muse', style: 'Boho', colorName: 'Kem', level: 4 },
      { id: 'lace-maxi', name: 'Đầm ren Golden Lace', style: 'Vintage', colorName: 'Vàng', level: 5 },
      { id: 'nocturne-velvet-dress', name: 'Đầm nhung Midnight Column', style: 'Dark Academia', colorName: 'Đen', level: 6 },
      { id: 'global-runway-gown', name: 'Đầm Runway Aurora', style: 'K-pop', colorName: 'Tím', level: 7 },
    ]);
  });

  it('maps every dress to optimized external artwork', () => {
    expect(dresses.every(product => externalProductArtwork(product)?.endsWith('.webp'))).toBe(true);
  });
});
