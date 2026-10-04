import { describe, expect, it } from 'vitest';
import { products } from '../src/data/catalog';

describe('new tops collection', () => {
  const tops = products.filter(product => product.category === 'tops');

  it('contains thirteen tops after adding five and retiring Chrome Pixel Crop', () => {
    expect(tops.map(({ id, name, style, colorName, level }) => ({ id, name, style, colorName, level }))).toEqual([
      { id: 'ribbon-kiss-tee', name: 'Áo Ribbon Kiss', style: 'Coquette', colorName: 'Hồng', level: 1 },
      { id: 'pearl-kiss-camisole', name: 'Áo Hai Dây Pearl Kiss', style: 'Coquette', colorName: 'Kem', level: 2 },
      { id: 'rose-whisper-offshoulder', name: 'Áo Trễ Vai Rose Whisper', style: 'Luxury', colorName: 'Hồng', level: 5 },
      { id: 'lavender-haze-offshoulder', name: 'Áo Trễ Vai Lavender Haze', style: 'Balletcore', colorName: 'Tím', level: 4 },
      { id: 'city-girls-jersey', name: 'Jersey City Girls', style: 'Blokecore', colorName: 'Xanh', level: 2 },
      { id: 'vintage-maison-rose-corset', name: 'Corset Maison Rosé', style: 'Vintage', colorName: 'Kem', level: 4 },
      { id: 'urban-pulse-hoodie', name: 'Hoodie Urban Pulse', style: 'Streetwear', colorName: 'Đen', level: 2 },
      { id: 'pure-line-tee', name: 'Áo Thun Pure Line', style: 'Minimal', colorName: 'Kem', level: 1 },
      { id: 'daily-sky-shirt', name: 'Sơ Mi Daily Sky', style: 'Casual', colorName: 'Xanh', level: 2 },
      { id: 'ivy-prep-knit', name: 'Áo Len Ivy Prep', style: 'Preppy', colorName: 'Vàng', level: 3 },
      { id: 'retro-rose-blouse', name: 'Áo Blouse Retro Rose', style: 'Vintage', colorName: 'Đỏ', level: 3 },
      { id: 'stage-spark-top', name: 'Áo Stage Spark', style: 'K-pop', colorName: 'Tím', level: 5 },
      { id: 'mocha-luxe-corset-blouse', name: 'Áo Corset Mocha Luxe', style: 'Luxury', colorName: 'Nâu', level: 6 },
    ]);
  });

  it('removes every retired top from the live catalog', () => {
    const retired = ['chrome-pixel-crop', 'ribbon-beat-crop', 'baby-tee', 'hoodie', 'shirt', 'concert', 'atelier-oversize-tee', 'atelier-crop-top', 'atelier-camisole', 'atelier-off-shoulder', 'atelier-oversize-shirt', 'atelier-corset', 'ribbon-corset', 'off-shoulder', 'city-jersey'];
    expect(tops.some(product => retired.includes(product.id))).toBe(false);
  });
});

describe('new bottoms collection', () => {
  const bottoms = products.filter(product => product.category === 'bottoms');

  it('contains exactly the ten supplied products with their authored attributes', () => {
    expect(bottoms.map(({ id, name, style, colorName, level }) => ({ id, name, style, colorName, level }))).toEqual([
      { id: 'cloud-sky-jeans', name: 'Jeans Xanh Mây', style: 'Casual', colorName: 'Xanh', level: 1 },
      { id: 'cloud-nine-skirt', name: 'Chân Váy Cloud Nine', style: 'Soft Girl', colorName: 'Kem', level: 2 },
      { id: 'downtown-cargo', name: 'Cargo Downtown', style: 'Streetwear', colorName: 'Đen', level: 2 },
      { id: 'blue-hour-wide-jeans', name: 'Quần Jeans Ống Rộng Blue Hour', style: 'Y2K', colorName: 'Xanh', level: 3 },
      { id: 'daily-muse-straight-jeans', name: 'Quần Jeans Ống Suông Daily Muse', style: 'Minimal', colorName: 'Kem', level: 2 },
      { id: 'matcha-utility-cargo', name: 'Quần Cargo Matcha Utility', style: 'Gorpcore', colorName: 'Xanh lá', level: 3 },
      { id: 'picnic-day-shorts', name: 'Quần Short Jeans Picnic Day', style: 'Coquette', colorName: 'Hồng', level: 2 },
      { id: 'ribbon-campus-skirt', name: 'Chân Váy Xếp Ly Ribbon Campus', style: 'Preppy', colorName: 'Hồng', level: 2 },
      { id: 'cocoa-edit-skirt', name: 'Chân Váy Chữ A Cocoa Edit', style: 'Dark Academia', colorName: 'Nâu', level: 3 },
      { id: 'campus-crush-skirt', name: 'Váy Xếp Ly Campus Crush', style: 'K-pop', colorName: 'Tím', level: 4 },
    ]);
  });

  it('removes every retired bottom from the live catalog', () => {
    const retired = ['coquette-heart-skirt', 'cyber-pop-flare', 'city-beat-cargo', 'pure-line-skirt', 'easy-day-shorts', 'academy-charm-skirt', 'retro-bloom-skirt', 'idol-shine-skort', 'berry-cloud-skirt', 'golden-grace-trousers', 'jeans', 'mini-skirt', 'cargo', 'atelier-wide-jeans', 'atelier-straight-jeans', 'atelier-cargo', 'atelier-denim-shorts', 'atelier-pleated-skirt', 'atelier-aline-skirt', 'campus-pleats', 'bubble-skirt', 'parachute-pants', 'maison-rose-skirt'];
    expect(bottoms.some(product => retired.includes(product.id))).toBe(false);
  });
});

describe('ready-made sets', () => {
  it('contains no products', () => {
    expect(products.filter(product => product.category === 'sets')).toEqual([]);
  });
});
