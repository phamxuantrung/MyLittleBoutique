import type { Category, Product } from '../types';
import { tint } from './direction';

/**
 * Mapping from the numbered reference sheet to the fixed game catalogue.
 * Keeping this separate from `art` is intentional: several products share a
 * silhouette, while their numbered reference and finishing details stay unique.
 */
export const referenceProductOrder = {
  tops: ['ribbon-kiss-tee', 'pearl-kiss-camisole', 'rose-whisper-offshoulder', 'lavender-haze-offshoulder', 'city-girls-jersey', 'vintage-maison-rose-corset', 'urban-pulse-hoodie', 'pure-line-tee', 'daily-sky-shirt', 'ivy-prep-knit', 'retro-rose-blouse', 'stage-spark-top', 'mocha-luxe-corset-blouse'],
  bottoms: ['cloud-sky-jeans', 'cloud-nine-skirt', 'downtown-cargo', 'blue-hour-wide-jeans', 'daily-muse-straight-jeans', 'matcha-utility-cargo', 'picnic-day-shorts', 'ribbon-campus-skirt', 'cocoa-edit-skirt', 'campus-crush-skirt'],
  dresses: ['ribbon-dress', 'vintage', 'silk', 'atelier-mini-dress', 'atelier-maxi-dress', 'blue-slip', 'meadow-maxi', 'lace-maxi', 'nocturne-velvet-dress', 'global-runway-gown'],
  accessories: ['ribbon', 'pearl-necklace', 'oval-sunnies', 'club-cap', 'leg-warmers', 'daisy-clips', 'pearl-headband', 'satin-bow', 'heart-choker', 'pearl-earrings', 'charm-bracelet', 'heart-glasses', 'wire-glasses', 'ribbon-beret', 'star-bucket-hat', 'maison-pearl-choker', 'global-halo-glasses'],
  shoes: ['sneakers', 'loafers', 'atelier-sneakers', 'ballet-flats', 'mary-janes', 'retro-sneakers', 'ballet-sneakers', 'slim-sneakers', 'platform-sneakers', 'loafer-mules', 'kitten-heels', 'slingbacks', 'ribbon-sandals', 'fisherman-sandals', 'chunky-boots', 'chelsea-boots', 'western-boots', 'trail-shoes', 'mesh-flats', 'patent-mary-janes'],
  bags: ['bag', 'pearl-bag', 'canvas-tote', 'nylon-crescent', 'ribbon-bag', 'east-west-bag', 'bowling-bag', 'bucket-bag', 'suede-hobo', 'chain-bag', 'mini-handle', 'utility-bag', 'book-tote', 'satchel-bag', 'crochet-bag', 'metallic-pouch', 'charm-bag', 'fringe-bag', 'heart-bag', 'sculpture-clutch'],
  outerwear: ['blazer', 'atelier-cardigan', 'atelier-blazer', 'cloud-cardigan', 'rebel-jacket', 'poet-trench', 'nocturne-trench'],
  sets: [],
} satisfies Record<Category, readonly string[]>;

type ReferenceMeta = { category: Category; number: number };
const referenceById = new Map<string, ReferenceMeta>();
(Object.entries(referenceProductOrder) as [Category, readonly string[]][]).forEach(([category, ids]) => {
  ids.forEach((id, index) => referenceById.set(id, { category, number: index + 1 }));
});

export const referenceProductCount = referenceById.size;

const seamByCategory: Partial<Record<Category, string>> = {
  tops: '<path d="M38 76Q60 82 82 76"/><path d="M31 39Q35 43 38 48M89 39Q85 43 82 48"/>',
  bottoms: '<path d="M38 51Q60 56 82 51"/><path d="M43 61 39 119M77 61 81 119"/>',
  dresses: '<path d="M42 55Q60 62 78 55"/><path d="M27 105Q60 116 93 105"/>',
  outerwear: '<path d="M39 35 54 61M81 35 66 61"/><path d="M39 87Q60 92 81 87"/>',
  shoes: '<path d="M25 101Q59 108 96 98"/><path d="M34 83Q48 88 61 84"/>',
  bags: '<path d="M31 82Q60 91 89 82"/><path d="M42 55Q60 62 78 55"/>',
  sets: '<path d="M37 72Q60 79 83 72"/><path d="M44 105Q60 110 76 105"/>',
};

type ProductReferenceInput = Partial<Pick<Product, 'id' | 'category'>>;

/** Adds the soft shaded finish used by the supplied illustration sheet. */
export function finishReferenceProduct(body: string, product: ProductReferenceInput, color: string): string {
  const meta = product.id ? referenceById.get(product.id) : undefined;
  if (!meta) return body;

  const key = `ref-${meta.category}-${meta.number}`;
  const light = tint(color, '#ffffff', .58);
  const mid = tint(color, '#fff0f8', .22);
  const shade = tint(color, '#76506f', .28);
  const angle = (meta.number % 3) * 18 + 104;
  const polishedBody = body.split(`fill="${color}"`).join(`fill="url(#${key}-fabric)"`);
  const seam = seamByCategory[meta.category] ?? '';
  const detailOpacity = .12 + (meta.number % 4) * .025;

  return `
    <defs>
      <linearGradient id="${key}-fabric" gradientUnits="userSpaceOnUse" x1="18" y1="18" x2="${angle}" y2="132">
        <stop offset="0" stop-color="${light}"/><stop offset=".25" stop-color="${mid}"/>
        <stop offset=".7" stop-color="${color}"/><stop offset="1" stop-color="${shade}"/>
      </linearGradient>
      <filter id="${key}-depth" x="-22%" y="-18%" width="144%" height="150%" color-interpolation-filters="sRGB">
        <feDropShadow dx="0" dy="2.2" stdDeviation="1.5" flood-color="#6e3f67" flood-opacity=".2"/>
      </filter>
    </defs>
    <g filter="url(#${key}-depth)">${polishedBody}</g>
    ${seam ? `<g fill="none" stroke="#fff" stroke-width="1.15" stroke-linecap="round" opacity="${detailOpacity}">${seam}</g>` : ''}
  `;
}
