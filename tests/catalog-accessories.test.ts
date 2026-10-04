import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';
import { externalProductArtwork } from '../src/art/productAssets';

describe('new accessories collection', () => {
  const accessories = products.filter(product => product.category === 'accessories');

  it('contains exactly the seventeen supplied accessories with their authored attributes and assigned levels', () => {
    expect(accessories.map(({ id, name, style, colorName, level }) => ({ id, name, style, colorName, level }))).toEqual([
      { id: 'ribbon', name: 'Nơ Ballet Club', style: 'Balletcore', colorName: 'Hồng', level: 1 },
      { id: 'pearl-necklace', name: 'Vòng ngọc Tiny Pearls', style: 'Luxury', colorName: 'Kem', level: 2 },
      { id: 'oval-sunnies', name: 'Kính Oval Edit', style: 'Y2K', colorName: 'Đen', level: 2 },
      { id: 'club-cap', name: 'Mũ Little Sport Club', style: 'Sporty Chic', colorName: 'Xanh', level: 1 },
      { id: 'leg-warmers', name: 'Leg Warmer Cloud Steps', style: 'Soft Girl', colorName: 'Kem', level: 2 },
      { id: 'daisy-clips', name: 'Kẹp tóc Daisy Picnic', style: 'Cottagecore', colorName: 'Xanh lá', level: 1 },
      { id: 'pearl-headband', name: 'Băng đô Pearl Halo', style: 'Coquette', colorName: 'Bạc', level: 3 },
      { id: 'satin-bow', name: 'Nơ tóc Satin Ballet', style: 'Poetcore', colorName: 'Tím', level: 2 },
      { id: 'heart-choker', name: 'Choker Heart Signal', style: 'K-pop', colorName: 'Đỏ', level: 3 },
      { id: 'pearl-earrings', name: 'Hoa tai Pearl Drop', style: 'Clean Girl', colorName: 'Bạc', level: 3 },
      { id: 'charm-bracelet', name: 'Vòng tay Lucky Charms', style: 'Coquette', colorName: 'Hồng', level: 2 },
      { id: 'heart-glasses', name: 'Kính trái tim Pop Candy', style: 'Y2K', colorName: 'Hồng', level: 2 },
      { id: 'wire-glasses', name: 'Kính gọng mảnh Study Date', style: 'Preppy', colorName: 'Nâu', level: 3 },
      { id: 'ribbon-beret', name: 'Mũ Beret Ribbon Muse', style: 'Vintage', colorName: 'Kem', level: 3 },
      { id: 'star-bucket-hat', name: 'Mũ Bucket Star Club', style: 'Streetwear', colorName: 'Đen', level: 2 },
      { id: 'maison-pearl-choker', name: 'Choker Pearl Signature', style: 'Luxury', colorName: 'Bạc', level: 5 },
      { id: 'global-halo-glasses', name: 'Kính Halo Backstage', style: 'K-pop', colorName: 'Tím', level: 7 },
    ]);
  });

  it('maps every accessory to optimized external artwork', () => {
    expect(accessories.every(product => externalProductArtwork(product)?.endsWith('.webp'))).toBe(true);
  });
});
