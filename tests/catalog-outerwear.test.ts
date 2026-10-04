import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';
import { externalProductArtwork } from '../src/art/productAssets';

describe('outerwear collection', () => {
  const outerwear = products.filter(product => product.category === 'outerwear');

  it('contains seven supplied coats plus the moved Mint Mellow cardigan', () => {
    expect(outerwear.map(({ id, name, style, colorName, level }) => ({ id, name, style, colorName, level }))).toEqual([
      { id: 'blazer', name: 'Blazer Atelier', style: 'Luxury', colorName: 'Kem', level: 5 },
      { id: 'mint-mellow-cardigan', name: 'Cardigan Mint Mellow', style: 'Soft Girl', colorName: 'Xanh lá', level: 4 },
      { id: 'atelier-cardigan', name: 'Áo Cardigan Strawberry Cream', style: 'Soft Girl', colorName: 'Hồng', level: 2 },
      { id: 'atelier-blazer', name: 'Áo Blazer Vanilla Office', style: 'Preppy', colorName: 'Vàng', level: 3 },
      { id: 'cloud-cardigan', name: 'Cardigan Strawberry Cloud', style: 'Coquette', colorName: 'Tím', level: 3 },
      { id: 'rebel-jacket', name: 'Jacket da Rebel Heart', style: 'Grunge', colorName: 'Đen', level: 4 },
      { id: 'poet-trench', name: 'Trench Autumn Letters', style: 'Dark Academia', colorName: 'Nâu', level: 5 },
      { id: 'nocturne-trench', name: 'Trench Eclipse Atelier', style: 'Minimal', colorName: 'Bạc', level: 6 },
    ]);
  });

  it('maps every outerwear product to optimized external artwork', () => {
    expect(outerwear).toHaveLength(8);
    expect(outerwear.every(product => externalProductArtwork(product)?.endsWith('.webp'))).toBe(true);
  });
});
