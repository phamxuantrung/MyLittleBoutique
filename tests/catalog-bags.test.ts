import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';
import { externalProductArtwork } from '../src/art/productAssets';

describe('new bags collection', () => {
  const bags = products.filter(product => product.category === 'bags');

  it('uses the authored attributes and assigned levels for the twenty supplied bags', () => {
    expect(bags.slice(0, 20).map(({ id, name, style, colorName, level }) => ({ id, name, style, colorName, level }))).toEqual([
      { id: 'bag', name: 'Túi Little Baguette', style: 'Coquette', colorName: 'Hồng', level: 2 },
      { id: 'pearl-bag', name: 'Túi Pearl Muse', style: 'Luxury', colorName: 'Bạc', level: 4 },
      { id: 'canvas-tote', name: 'Tote Everyday Poetry', style: 'Poetcore', colorName: 'Xanh lá', level: 2 },
      { id: 'nylon-crescent', name: 'Túi bán nguyệt City Stroll', style: 'Minimal', colorName: 'Đen', level: 1 },
      { id: 'ribbon-bag', name: 'Túi vai Little Bow', style: 'Soft Girl', colorName: 'Tím', level: 3 },
      { id: 'east-west-bag', name: 'Túi East–West Blue Hour', style: 'Clean Girl', colorName: 'Xanh', level: 2 },
      { id: 'bowling-bag', name: 'Túi Bowling Club', style: 'Preppy', colorName: 'Đỏ', level: 3 },
      { id: 'bucket-bag', name: 'Túi Bucket Oat Milk', style: 'Cottagecore', colorName: 'Kem', level: 3 },
      { id: 'suede-hobo', name: 'Túi hobo Suede stories', style: 'Boho', colorName: 'Nâu', level: 3 },
      { id: 'chain-bag', name: 'Túi Chain After Dark', style: 'Y2K', colorName: 'Vàng', level: 4 },
      { id: 'mini-handle', name: 'Túi Mini Tea Time', style: 'Coquette', colorName: 'Hồng', level: 3 },
      { id: 'utility-bag', name: 'Túi Crossbody Trail Pocket', style: 'Gorpcore', colorName: 'Xanh lá', level: 3 },
      { id: 'book-tote', name: 'Tote Chapter One', style: 'Preppy', colorName: 'Kem', level: 3 },
      { id: 'satchel-bag', name: 'Túi Satchel Library Date', style: 'Dark Academia', colorName: 'Nâu', level: 4 },
      { id: 'crochet-bag', name: 'Túi Crochet Wildflower', style: 'Cottagecore', colorName: 'Xanh', level: 4 },
      { id: 'metallic-pouch', name: 'Túi Pouch Silver Encore', style: 'Minimal', colorName: 'Bạc', level: 4 },
      { id: 'charm-bag', name: 'Túi vai Charm Diary', style: 'Y2K', colorName: 'Tím', level: 4 },
      { id: 'fringe-bag', name: 'Túi tua rua Golden Dunes', style: 'Boho', colorName: 'Vàng', level: 5 },
      { id: 'heart-bag', name: 'Túi Heart to Heart', style: 'Soft Girl', colorName: 'Đỏ', level: 5 },
      { id: 'sculpture-clutch', name: 'Clutch Sculpted Moon', style: 'Luxury', colorName: 'Đen', level: 6 },
    ]);
  });

  it('maps every bag to optimized external artwork', () => {
    expect(bags).toHaveLength(23);
    expect(bags.every(product => externalProductArtwork(product)?.endsWith('.webp'))).toBe(true);
  });
});
