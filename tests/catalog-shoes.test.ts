import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';
import { externalProductArtwork } from '../src/art/productAssets';

describe('new shoes collection', () => {
  const shoes = products.filter(product => product.category === 'shoes');

  it('uses the authored attributes and assigned levels for the twenty supplied shoes', () => {
    expect(shoes.slice(0, 20).map(({ id, name, style, colorName, level }) => ({ id, name, style, colorName, level }))).toEqual([
      { id: 'sneakers', name: 'Sneaker sữa yến mạch', style: 'Casual', colorName: 'Kem', level: 1 },
      { id: 'loafers', name: 'Loafer The editor', style: 'Dark Academia', colorName: 'Nâu', level: 3 },
      { id: 'atelier-sneakers', name: 'Giày Sneaker Candy Runner', style: 'Y2K', colorName: 'Hồng', level: 2 },
      { id: 'ballet-flats', name: 'Búp bê Ribbon Rehearsal', style: 'Coquette', colorName: 'Tím', level: 2 },
      { id: 'mary-janes', name: 'Mary Jane After school', style: 'Preppy', colorName: 'Đen', level: 1 },
      { id: 'retro-sneakers', name: 'Sneaker Retro Cloud', style: 'Vintage', colorName: 'Xanh', level: 1 },
      { id: 'ballet-sneakers', name: 'Ballet Sneaker Pirouette', style: 'Balletcore', colorName: 'Bạc', level: 3 },
      { id: 'slim-sneakers', name: 'Sneaker Low Profile', style: 'Minimal', colorName: 'Xanh lá', level: 1 },
      { id: 'platform-sneakers', name: 'Sneaker Platform Crush', style: 'K-pop', colorName: 'Đỏ', level: 4 },
      { id: 'loafer-mules', name: 'Loafer Mule Sunday Edit', style: 'Luxury', colorName: 'Vàng', level: 4 },
      { id: 'kitten-heels', name: 'Kitten Heel Little Soirée', style: 'Coquette', colorName: 'Hồng', level: 3 },
      { id: 'slingbacks', name: 'Slingback The Muse', style: 'Luxury', colorName: 'Kem', level: 5 },
      { id: 'ribbon-sandals', name: 'Sandal Daisy Ribbon', style: 'Cottagecore', colorName: 'Xanh lá', level: 3 },
      { id: 'fisherman-sandals', name: 'Sandal Fisherman Diary', style: 'Casual', colorName: 'Xanh', level: 2 },
      { id: 'chunky-boots', name: 'Boots Midnight Rebel', style: 'Grunge', colorName: 'Đen', level: 4 },
      { id: 'chelsea-boots', name: 'Boots Library Walk', style: 'Dark Academia', colorName: 'Nâu', level: 4 },
      { id: 'western-boots', name: 'Boots Desert Bloom', style: 'Boho', colorName: 'Vàng', level: 4 },
      { id: 'trail-shoes', name: 'Giày Trail Day', style: 'Gorpcore', colorName: 'Bạc', level: 3 },
      { id: 'mesh-flats', name: 'Búp bê Mesh Whisper', style: 'Balletcore', colorName: 'Tím', level: 4 },
      { id: 'patent-mary-janes', name: 'Mary Jane Cherry gloss', style: 'Preppy', colorName: 'Đỏ', level: 5 },
    ]);
  });

  it('maps every shoe to optimized external artwork', () => {
    expect(shoes).toHaveLength(24);
    expect(shoes.every(product => externalProductArtwork(product)?.endsWith('.webp'))).toBe(true);
  });
});
