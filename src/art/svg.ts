import type { Customer, Product } from '../types';
import maliVietnameseFont from '@fontsource/mali/files/mali-vietnamese-700-normal.woff2?inline';
import cherryBombOneFont from '../assets/fonts/CherryBombOne-Regular.ttf?inline';
import { fashionShapes } from './fashionShapes';
import { artSvg, bowShape, cel, fabricColor, heartShape, paint, tint } from './direction';
import { characterIllustration, getCustomerArchetype, ownerIllustration, ownerPortraitSvg } from './characters';
import { atelierProductBody } from './atelierArt';
import { finishReferenceProduct } from './productReference';

const wrap = (body: string, w: number, h: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
// Phaser's XHR loader expects data URIs to contain base64 rather than URI escapes.
export const svgUrl = (svg: string) => `data:image/svg+xml;base64,${btoa(Array.from(new TextEncoder().encode(svg), byte => String.fromCharCode(byte)).join(''))}`;
const shadow = '<ellipse cx="90" cy="201" rx="67" ry="14" fill="#8850a8" opacity=".10"/>';
const bow = (color: string) => `<path d="M58 42Q36 22 35 43Q35 58 57 48Q81 23 83 42Q87 62 62 49L71 67L59 62L49 67L56 48" fill="${color}" stroke="#4a2d5a" stroke-width="1.5"/><circle cx="60" cy="46" r="5" fill="${color}"/>`;
const escapeSvgText = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]!));

type ProductSvgInput = Pick<Product, 'art' | 'color' | 'designColor' | 'designStrokes' | 'designMotif' | 'designAccentColor' | 'designMotifScale' | 'designMotifX' | 'designMotifY' | 'designFormWidth' | 'designFormLength' | 'designMotifRotation' | 'designMotifOpacity' | 'designMotifRepeat' | 'designShapePoints' | 'designShapeSmooth' | 'designStrokeColor' | 'designStrokeWidth' | 'designStickers'>
  & Partial<Pick<Product, 'id' | 'category'>>;

export function productSvg(product: ProductSvgInput, hanger = false) {
  const c = fabricColor(product.designColor ?? product.color);
  const shapes = fashionShapes(c);
  const atelierBody = atelierProductBody(product.art, c, product.designShapePoints, product.designShapeSmooth !== false, product.designStrokeColor, product.designStrokeWidth);
  const body = atelierBody ?? shapes[product.art] ?? shapes.tee;
  let customDrawing = '';
  (product.designStrokes ?? []).slice(0, 80).forEach((stroke, strokeIndex) => {
    const color = /^#[0-9a-f]{6}$/i.test(stroke.color) ? stroke.color : '#d4429a';
    const width = Math.max(.6, Math.min(8, Number(stroke.width) || 2));
    const points = stroke.points.slice(0, 240).map(point => ({ x: Math.max(0, Math.min(120, Number(point.x) || 0)), y: Math.max(0, Math.min(140, Number(point.y) || 0)) }));
    if (!points.length) return;
    const path = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const tip = (['round', 'marker', 'calligraphy', 'neon', 'eraser'] as string[]).includes(stroke.tip ?? '') ? stroke.tip : 'round';
    if (tip === 'eraser') {
      if (!customDrawing) return;
      const maskId = `custom-drawing-mask-${strokeIndex}`;
      customDrawing = `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="140"><rect width="120" height="140" fill="#fff"/><path d="${path}" fill="none" stroke="#000" stroke-width="${width * 2}" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><g mask="url(#${maskId})">${customDrawing}</g>`;
    } else if (tip === 'marker') {
      customDrawing += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width * 1.6}" stroke-linecap="square" stroke-linejoin="round" opacity=".55"/>`;
    } else if (tip === 'calligraphy') {
      customDrawing += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width * 1.35}" stroke-linecap="square" stroke-linejoin="bevel"/>`;
    } else if (tip === 'neon') {
      customDrawing += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width * 2.5}" stroke-linecap="round" stroke-linejoin="round" opacity=".32"/><path d="${path}" fill="none" stroke="#fff" stroke-width="${Math.max(1, width * .55)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      customDrawing += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  });
  const customLayer = customDrawing ? `<g class="custom-product-drawing">${customDrawing}</g>` : '';
  const motif = product.designMotif ?? 'none';
  const accent = /^#[0-9a-f]{6}$/i.test(product.designAccentColor ?? '') ? product.designAccentColor! : '#d4429a';
  const motifScale = Math.max(.7, Math.min(1.35, Number(product.designMotifScale) || 1));
  const motifX = Math.max(38, Math.min(82, Number(product.designMotifX) || 60));
  const motifY = Math.max(42, Math.min(100, Number(product.designMotifY) || 69));
  const formWidth = Math.max(.84, Math.min(1.16, Number(product.designFormWidth) || 1));
  const formLength = Math.max(.84, Math.min(1.18, Number(product.designFormLength) || 1));
  const motifRotation = Math.max(-40, Math.min(40, Number(product.designMotifRotation) || 0));
  const motifOpacity = Math.max(.4, Math.min(1, Number(product.designMotifOpacity) || 1));
  const motifRepeat = ([1, 3, 5] as number[]).includes(Number(product.designMotifRepeat)) ? Number(product.designMotifRepeat) : 1;
  const motifShapes: Record<string, string> = {
    heart: `<path d="M0 9C-15 1-12-12-3-10Q0-9 3-5Q6-9 10-9C18-5 13 4 0 13C-13 4-18-5-10-9Q-4-11 0-5Q3-9 6-9" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/>`,
    star: `<path d="M0-14 4-5 14-4 7 3 9 13 0 8-9 13-7 3-14-4-4-5Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/>`,
    bow: `<path d="M-3-3Q-18-14-18-1Q-17 10-3 3Q0 0 3 3Q17 10 18-1Q18-14 3-3L8 13 0 8-8 13Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/><circle cx="0" cy="0" r="4" fill="#fff4fa" stroke="#5b304d" stroke-width="1"/>`,
    flower: `<g fill="${accent}" stroke="#5b304d" stroke-width="1"><ellipse cy="-8" rx="5" ry="8"/><ellipse cy="8" rx="5" ry="8"/><ellipse cx="-8" rx="8" ry="5"/><ellipse cx="8" rx="8" ry="5"/><circle r="5" fill="#ffdc73"/></g>`,
    stripes: `<g fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"><path d="M-16-10 7 13"/><path d="M-7-14 16 9"/><path d="M-16 2-5 13"/></g>`,
  };
  const detailShapes: Record<string, string> = {
    ...motifShapes,
    'round-collar': `<path d="M-18-7Q0 12 18-7L12-12Q0 1-12-12Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/>`,
    'vest-collar': `<path d="M-18-14-3 0-10 16 1 4 0-2Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/><path d="M18-14 3 0 10 16-1 4 0-2Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/>`,
    'polo-collar': `<path d="M-18-10-4-15 0-4-10 3Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/><path d="M18-10 4-15 0-4 10 3Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/><path d="M0-4V18" stroke="#5b304d" stroke-width="2"/><circle cy="5" r="1.6" fill="#fff" stroke="#5b304d" stroke-width=".8"/>`,
    pleats: `<g fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round"><path d="M-18-17-12 17"/><path d="M-9-18-6 18"/><path d="M0-18V18"/><path d="M9-18 6 18"/><path d="M18-17 12 17"/></g><path d="M-20-18H20" stroke="#5b304d" stroke-width="1.2"/>`,
    buttons: `<g fill="${accent}" stroke="#5b304d" stroke-width=".8"><circle cy="-15" r="3"/><circle cy="-5" r="3"/><circle cy="5" r="3"/><circle cy="15" r="3"/></g>`,
    pocket: `<path d="M-16-13H16V9Q0 21-16 9Z" fill="${accent}" fill-opacity=".78" stroke="#5b304d" stroke-width="1.3"/><path d="M-13-8H13" stroke="#fff" stroke-width="1.3" opacity=".8"/>`,
    zipper: `<path d="M0-20V20" stroke="#5b304d" stroke-width="2"/><path d="M-5-17H0M0-13H5M-5-9H0M0-5H5M-5-1H0M0 3H5M-5 7H0M0 11H5M-5 15H0" stroke="${accent}" stroke-width="2"/><path d="M0 17l5 5-5 4-5-4Z" fill="${accent}" stroke="#5b304d" stroke-width="1"/>`,
    belt: `<path d="M-23-5H23V6H-23Z" fill="${accent}" stroke="#5b304d" stroke-width="1.2"/><rect x="-7" y="-8" width="14" height="17" rx="2" fill="#fff7dc" stroke="#5b304d" stroke-width="1.4"/><path d="M0-7V8" stroke="#5b304d" stroke-width="1"/>`,
    seam: `<path d="M-23 0Q-12-12 0 0T23 0" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round"/>`,
    cuffs: `<g fill="${accent}" stroke="#5b304d" stroke-width="1.2"><path d="M-24-8H-7V8H-22Z"/><path d="M24-8H7V8H22Z"/></g><path d="M-20-3H-10M20-3H10" stroke="#fff" stroke-width="1.3" opacity=".8"/>`,
  };
  const motifBody = motifShapes[motif] ?? '';
  const motifOffsets = motifRepeat === 5
    ? [[0, 0], [-17, -16], [17, -16], [-17, 16], [17, 16]]
    : motifRepeat === 3 ? [[-18, 0], [0, 0], [18, 0]] : [[0, 0]];
  const motifLayer = motifBody ? `<g class="custom-product-motif" opacity="${motifOpacity}">${motifOffsets.map(([offsetX, offsetY]) => `<g transform="translate(${motifX + offsetX} ${motifY + offsetY}) rotate(${motifRotation}) scale(${motifScale})">${motifBody}</g>`).join('')}</g>` : '';
  const stickerLayer = (product.designStickers ?? []).slice(0, 24).map((sticker, index) => {
    const kind = sticker.kind === 'text' || Object.hasOwn(detailShapes, sticker.kind) ? sticker.kind : 'heart';
    const color = /^#[0-9a-f]{6}$/i.test(sticker.color) ? sticker.color : '#d4429a';
    const x = Math.max(6, Math.min(114, Number(sticker.x) || 60));
    const y = Math.max(7, Math.min(133, Number(sticker.y) || 69));
    const scale = Math.max(.35, Math.min(2.5, Number(sticker.scale) || 1));
    const rotation = Math.max(-180, Math.min(180, Number(sticker.rotation) || 0));
    const id = /^[a-z0-9-]{1,50}$/i.test(sticker.id) ? sticker.id : `sticker-${index}`;
    let stickerBody = (detailShapes[kind] ?? detailShapes.heart).split(accent).join(color);
    let hitWidth = 42;
    if (kind === 'text') {
      const text = escapeSvgText((sticker.text?.trim() || 'Boutique').slice(0, 18));
      const fontSize = Math.max(8, Math.min(32, Math.round(Number(sticker.fontSize) || 14)));
      const curve = Math.max(-60, Math.min(60, Math.round(Number(sticker.curve) || 0)));
      const font = sticker.font === 'handwritten' ? "'Atelier Mali','Segoe Print',cursive" : sticker.font === 'serif' ? "Georgia,'Times New Roman',serif" : "'Arial Rounded MT Bold','Trebuchet MS',sans-serif";
      const effect = (['none', 'outline', 'shadow', 'glow'] as string[]).includes(sticker.effect ?? '') ? sticker.effect : 'none';
      hitWidth = Math.max(42, Math.min(112, text.length * fontSize * .58 + 12));
      const curveId = `text-curve-${id}`;
      const curvePath = curve ? `<path id="${curveId}" d="M${(-hitWidth / 2 + 4).toFixed(1)} 0Q0 ${(-curve * .4).toFixed(1)} ${(hitWidth / 2 - 4).toFixed(1)} 0" fill="none"/>` : '';
      const content = curve ? `<textPath href="#${curveId}" startOffset="50%">${text}</textPath>` : text;
      const attrs = `class="custom-product-text-value" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="${fontSize}" font-weight="800"`;
      const main = `<text ${attrs} x="0" y="0" fill="${color}"${effect === 'outline' ? ' stroke="#fff" stroke-width="2.2" paint-order="stroke fill"' : ''}>${content}</text>`;
      stickerBody = `<style>@font-face{font-family:'Atelier Mali';src:url('${maliVietnameseFont}') format('woff2');font-weight:700}</style>${curvePath}${effect === 'shadow' ? `<text ${attrs} x="0" y="0" transform="translate(1.8 2)" fill="#512d45" opacity=".45">${content}</text>` : ''}${effect === 'glow' ? `<text ${attrs} x="0" y="0" fill="none" stroke="${color}" stroke-width="5" opacity=".3">${content}</text>` : ''}${main}`;
    }
    return `<g class="custom-product-sticker" data-design-sticker="${id}" transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})"><rect class="custom-product-sticker-hit" x="${-hitWidth / 2}" y="-21" width="${hitWidth}" height="42" rx="3" fill="transparent" stroke="none"/>${stickerBody}</g>`;
  }).join('');
  const formTransform = `translate(60 26) scale(${formWidth} ${formLength}) translate(-60 -26)`;
  const hangerPath = hanger
    ? '<path d="M56 16Q55 8 61 8Q69 8 65 16L60 20L26 36H94L60 20" stroke="#a88d6a" stroke-width="2.2" fill="none"/>'
    : '';
  if (atelierBody) {
    const rendered = `<g transform="${formTransform}"><g fill="none" stroke-linecap="round" stroke-linejoin="round">${atelierBody}</g>${customLayer}</g>${motifLayer}${stickerLayer}`;
    return wrap(finishReferenceProduct(rendered, product, c), 120, 140);
  }
  const rendered = `${cel(`${hangerPath}<g transform="${formTransform}"><g stroke-linejoin="round">${body}</g>${customLayer}</g>`)}${motifLayer}${stickerLayer}`;
  return wrap(finishReferenceProduct(rendered, product, c), 120, 140);
}

export const characterSvg = characterIllustration;
export { getCustomerArchetype };
export const ownerSvg = () => ownerIllustration(false);
export const ownerPcSvg = () => ownerIllustration(true);
export const ownerPortrait = ownerPortraitSvg;
export const heartSvg = () => artSvg(heartShape(), 24, 24);

export function courierSvg(variant = 0) {
  const palettes = [
    { jacket: '#58b8a8', dark: '#28766f', accent: '#ffe07b', helmet: '#47a99c' },
    { jacket: '#769ce4', dark: '#405f9f', accent: '#ffcf72', helmet: '#688dd4' },
    { jacket: '#e887a8', dark: '#9d4d72', accent: '#bcebd8', helmet: '#d86f96' },
  ];
  const c = palettes[Math.abs(variant) % palettes.length];
  return wrap(`
    <ellipse cx="76" cy="207" rx="46" ry="9" fill="#704b78" opacity=".13"/>
    <g stroke="#4b3155" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round">
      <path d="M58 151l-5 43 18 1 5-44z" fill="#40506e"/><path d="M77 151l7 44 18-2-8-47z" fill="#35445f"/>
      <path d="M51 194h22l2 10H46q-3-7 5-10z" fill="#f4f1f5"/><path d="M83 194h20l7 9H80q-2-6 3-9z" fill="#f4f1f5"/>
      <path d="M51 91q7-15 27-16 22 0 30 18l-9 62q-19 10-43 0z" fill="${c.jacket}"/>
      <path d="M78 77v77" stroke="${c.dark}"/><path d="M57 101l43 23" stroke="#fff" opacity=".75" stroke-width="7"/>
      <path d="M50 93q-12 13-15 42l13 4 15-35" fill="${c.jacket}"/><path d="M108 94q12 17 13 37l-13 5-13-34" fill="${c.jacket}"/>
      <path d="M34 132q3-5 10-2l7 7-9 8q-10-3-8-13z" fill="#edb58e"/><path d="M110 130q5-5 11 0l2 10-12 1z" fill="#edb58e"/>
      <path d="M62 55q2-21 18-22 17 0 19 21l-3 18q-7 11-17 11-11-1-16-11z" fill="#efbc96"/>
      <path d="M61 52q1-22 19-24 19 1 21 24-18-8-40 0z" fill="${c.helmet}"/>
      <path d="M58 50q20-13 47 0l-2 8q-24-8-45 0z" fill="${c.accent}"/>
      <path d="M68 58q6-8 10-8 9 7 20 7" fill="#3e2b42"/><path d="M71 64h1M91 64h1"/>
      <path d="M77 72q5 4 10 0" fill="none"/>
      <path d="M49 111l-8 41 27 6 8-39z" fill="#fff8ec"/><path d="M44 119l28 7M43 131l20 5" stroke="#e3cda7"/>
      <path d="M93 98l22 13-9 31-22-13z" fill="${c.dark}"/><path d="M98 106l11 6-4 16-11-6z" fill="#dff4ff"/>
      <circle cx="67" cy="91" r="5" fill="${c.accent}"/><path d="M65 89l4 4"/>
    </g>
  `, 150, 220);
}

const decorColors: Record<string, string> = {
  '#b39c7e': '#d99aa8', '#d7b78b': '#f392bd', '#b49470': '#985e85', '#d9e4df': '#c6e5f6',
  '#bfcfc7': '#a3c3eb', '#ddc4a6': '#ef9cbe', '#e9d7bc': '#ffe5ed', '#b89c7f': '#ab7795',
  '#86705b': '#9a7284', '#7f8963': '#729b91', '#9aac89': '#a2dcc0', '#7e967a': '#7bbeaf',
  '#c7d0a4': '#d8efc1', '#f5e5cf': '#fff1df', '#d3bba1': '#be829e', '#d9b197': '#f1b4d1',
  '#ba937d': '#ca8eb8', '#efcdb1': '#ffe0eb', '#e8d1b6': '#b8c9ee', '#bda88b': '#8a7aaa',
  '#eddbc0': '#ffe6d7', '#cbb391': '#b382a1', '#cfb493': '#dba6c4', '#afbdad': '#b1d9ed',
  '#94a592': '#92b4d4', '#e8b8bd': '#f3adce', '#d39ea7': '#d281ad', '#d7a4a6': '#e892bd',
  '#edc3bf': '#ffc5df', '#dfaead': '#ed9bc5', '#c89a9b': '#c77da9', '#ebc0bd': '#ffc5df',
  '#e9bbb6': '#f6b2d5', '#f7dfc7': '#fff0c8', '#f1decc': '#c4b7ef', '#daa4a4': '#ef8cb7',
  '#f4d695': '#ffdd91', '#ebc0b9': '#f6a4cd', '#c69a90': '#ae759b', '#e4c9a7': '#fff0d9',
  '#deb4ba': '#e6a5d6', '#c998a5': '#bd8cbd', '#f0d5d1': '#ffe4ee', '#bba482': '#dca985',
};
const decorPaint = (body: string) => body.replace(/#[0-9a-f]{6}/gi, hex => decorColors[hex] ?? hex);

export function rackSvg() {
  return `
    <g id="clothing-rack" stroke-linecap="round" stroke-linejoin="round">
      <!-- 1. Soft Floor Shadow under feet and clothes (lùi vào trong lòng phòng) -->
      <ellipse cx="112" cy="205" rx="46" ry="13" fill="#8850a8" opacity=".12"/>
      <ellipse cx="78" cy="189" rx="12" ry="5" fill="#8850a8" opacity=".16"/>
      <ellipse cx="146" cy="223" rx="12" ry="5" fill="#8850a8" opacity=".16"/>

      <!-- 2. Back / Left Post & Foot (x = 76, y = 188 - cách tường an toàn > 10px) -->
      <!-- Left caster wheels -->
      <circle cx="70" cy="186" r="3.2" fill="#4a2d5a"/>
      <circle cx="70" cy="185.5" r="2.2" fill="#ffd566"/>
      <circle cx="88" cy="195" r="3.2" fill="#4a2d5a"/>
      <circle cx="88" cy="194.5" r="2.2" fill="#ffd566"/>
      <!-- Left horizontal foot bar (slope -0.5, gọn gàng trong lòng phòng) -->
      <path d="M70 185 L88 194" stroke="#4a2d5a" stroke-width="7"/>
      <path d="M70 185 L88 194" stroke="#f49eb7" stroke-width="4.2"/>
      <path d="M71 184 L87 192" stroke="#ffe0ec" stroke-width="1.4"/>
      <!-- Left vertical upright tube (đứng thẳng từ 76, 188 lên 76, 78) -->
      <path d="M76 188 V78" stroke="#4a2d5a" stroke-width="6.5"/>
      <path d="M76 188 V78" stroke="#f49eb7" stroke-width="4"/>
      <path d="M75 186 V80" stroke="#ffe0ec" stroke-width="1.2"/>
      <!-- Left top decorative ball finial -->
      <circle cx="76" cy="77" r="5" fill="#4a2d5a"/>
      <circle cx="76" cy="77" r="3.8" fill="#ffda8a"/>
      <circle cx="75" cy="75.5" r="1.2" fill="#ffffff"/>

      <!-- 3. Bottom Storage Shelf (nằm gọn gàng giữa 2 cột sào, không nhô ra ngoài tường) -->
      <path d="M73 181 L141 215 L148 218 L80 184 Z" fill="#fff7f0" stroke="#4a2d5a" stroke-width="1.8"/>
      <!-- Rose-gold wire slats across shelf -->
      <path d="M75 182 L143 216 M77 183 L145 217" stroke="#f49eb7" stroke-width="1.5" opacity="0.75"/>
      <!-- Front lip of shelf -->
      <path d="M80 184 L148 218 V221 L80 187 Z" fill="#e889a5" stroke="#4a2d5a" stroke-width="1.4"/>

      <!-- 4. Top Hanging Rail (from 72, 76 to 148, 114 - slope 0.5) -->
      <path d="M72 76 L148 114" stroke="#4a2d5a" stroke-width="6"/>
      <path d="M72 76 L148 114" stroke="#f49eb7" stroke-width="3.8"/>
      <path d="M72 75 L148 113" stroke="#ffe5f0" stroke-width="1.2"/>
      <!-- Rail end-caps -->
      <circle cx="72" cy="76" r="3" fill="#4a2d5a"/>
      <circle cx="72" cy="76" r="2" fill="#ffda8a"/>
      <circle cx="148" cy="114" r="3" fill="#4a2d5a"/>
      <circle cx="148" cy="114" r="2" fill="#ffda8a"/>

      <!-- 5. GARMENT 1: Pastel Pink Tweed Cropped Jacket (x ~ 83, y ~ 81.5) -->
      <g id="garment-1-tweed-jacket">
        <!-- Gold swivel hanger hook -->
        <path d="M83 81.5 C83 73.5 87 72.5 87 76.5 C87 80.5 83 80.5 83 84.5" fill="none" stroke="#ffda8a" stroke-width="1.8"/>
        <!-- Wooden hanger contoured shoulders -->
        <path d="M71 90 L83 85 L95 89" stroke="#4a2d5a" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M71 90 L83 85 L95 89" stroke="#ecd0b2" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Jacket inside back collar / lining (depth) -->
        <path d="M77 87 Q83 91 89 88 L88 96 Q83 98 78 95 Z" fill="#c75c87" stroke="#4a2d5a" stroke-width="1.5"/>
        <!-- Left sleeve draped back/side -->
        <path d="M70 91 L66 110 L72 114 L75 95 Z" fill="#e87ca6" stroke="#4a2d5a" stroke-width="1.6"/>
        <!-- White cuff on left sleeve -->
        <path d="M65 110 L72 114 L71 117 L64 113 Z" fill="#ffffff" stroke="#4a2d5a" stroke-width="1.2"/>
        <!-- Main jacket body -->
        <path d="M72 91 Q75 87 80 88 L83 103 L86 88 Q91 87 94 90 L92 125 Q83 129 74 124 Z" fill="#fca5c6" stroke="#4a2d5a" stroke-width="1.8"/>
        <!-- Soft cel shadow on lower left -->
        <path d="M72 95 L71 123 Q77 126 82 125 L80 102 Z" fill="#eb7ea7" opacity="0.85"/>
        <!-- Tweed texture pattern lines & bright highlights -->
        <path d="M75 108 H81 M74 116 H82 M73 121 H83" stroke="#ffffff" stroke-width="1.2" opacity="0.6"/>
        <!-- Chic collar lapels in cream -->
        <path d="M78 88 L82 102 L78 100 Z" fill="#fff3f7" stroke="#4a2d5a" stroke-width="1.2"/>
        <path d="M88 89 L84 102 L88 100 Z" fill="#fff3f7" stroke="#4a2d5a" stroke-width="1.2"/>
        <!-- 3 small golden boutique buttons -->
        <circle cx="83" cy="108" r="1.5" fill="#ffda8a" stroke="#4a2d5a" stroke-width="0.8"/>
        <circle cx="82.5" cy="114" r="1.5" fill="#ffda8a" stroke="#4a2d5a" stroke-width="0.8"/>
        <circle cx="82" cy="120" r="1.5" fill="#ffda8a" stroke="#4a2d5a" stroke-width="0.8"/>
        <!-- Hanging boutique swing tag on string -->
        <path d="M89 94 L93 102" stroke="#d49272" stroke-width="0.8"/>
        <polygon points="91,102 95,101 96,108 92,109" fill="#ffffff" stroke="#4a2d5a" stroke-width="0.9"/>
        <circle cx="93.5" cy="105" r="1" fill="#f490c0"/>
      </g>

      <!-- 6. GARMENT 2: Cream Knit Cardigan (x ~ 97, y ~ 88.5) -->
      <g id="garment-2-cream-cardigan">
        <!-- Hanger hook -->
        <path d="M97 88.5 C97 80.5 101 79.5 101 83.5 C101 87.5 97 87.5 97 91.5" fill="none" stroke="#ffda8a" stroke-width="1.8"/>
        <!-- Wooden hanger -->
        <path d="M85 97 L97 92 L109 96" stroke="#4a2d5a" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M85 97 L97 92 L109 96" stroke="#ecd0b2" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Inside back neck -->
        <path d="M91 94 Q97 98 103 95 L102 102 Q97 104 92 101 Z" fill="#d9be9e" stroke="#4a2d5a" stroke-width="1.5"/>
        <!-- Draped relaxed cardigan body -->
        <path d="M86 98 L83 123 L87 143 Q97 147 107 141 L109 121 L108 97 Q102 95 97 100 Q92 95 86 98 Z" fill="#fff5e4" stroke="#4a2d5a" stroke-width="1.8"/>
        <!-- Shadow fold on left side -->
        <path d="M86 98 L83 123 L87 143 Q92 145 96 144 L93 112 Z" fill="#e8d3ba" opacity="0.8"/>
        <!-- Deep V-neck placket trim -->
        <path d="M92 95 L97 113 L102 95" fill="none" stroke="#dfc4a4" stroke-width="2.2"/>
        <!-- Cable knit columns -->
        <path d="M89 114 Q91 122 89 130 Q91 138 89 143" fill="none" stroke="#dfc4a4" stroke-width="1.4" opacity="0.6"/>
        <path d="M103 112 Q105 120 103 128 Q105 136 103 140" fill="none" stroke="#dfc4a4" stroke-width="1.4" opacity="0.6"/>
        <!-- Ribbed hem detail -->
        <path d="M87 141 Q97 145 107 139" stroke="#d5b793" stroke-width="3" fill="none"/>
        <!-- Tortoiseshell round buttons -->
        <circle cx="97" cy="116" r="1.6" fill="#7a4b2a" stroke="#4a2d5a" stroke-width="0.8"/>
        <circle cx="97" cy="125" r="1.6" fill="#7a4b2a" stroke="#4a2d5a" stroke-width="0.8"/>
        <circle cx="97" cy="134" r="1.6" fill="#7a4b2a" stroke="#4a2d5a" stroke-width="0.8"/>
      </g>

      <!-- 7. GARMENT 3: Lavender Tiered Ruffle Sundress (x ~ 111, y ~ 95.5) -->
      <g id="garment-3-lavender-dress">
        <!-- Hanger hook -->
        <path d="M111 95.5 C111 87.5 115 86.5 115 90.5 C115 94.5 111 94.5 111 98.5" fill="none" stroke="#ffda8a" stroke-width="1.8"/>
        <!-- Wooden hanger with strap notches -->
        <path d="M99 104 L111 99 L123 103" stroke="#4a2d5a" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M99 104 L111 99 L123 103" stroke="#ecd0b2" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Thin spaghetti straps -->
        <path d="M104 102 V109 M118 102 V109" stroke="#9d76df" stroke-width="1.6"/>
        <!-- Sweetheart bodice -->
        <path d="M102 109 Q106 107 111 110 Q116 107 120 109 L120 124 Q111 127 102 124 Z" fill="#cbb2f8" stroke="#4a2d5a" stroke-width="1.6"/>
        <!-- Inside back neck depth -->
        <path d="M105 109 Q111 112 117 109 V111 Q111 114 105 111 Z" fill="#9b73dc"/>
        <!-- Bodice shadow & waist ribbon in rose pink -->
        <path d="M102 122 Q111 125 120 122 L120 125 Q111 128 102 125 Z" fill="#ff7da7" stroke="#4a2d5a" stroke-width="1"/>
        <!-- Cute pink bow on center chest -->
        <circle cx="111" cy="110" r="1.8" fill="#ff7da7"/>
        <path d="M108 109 L114 111 M108 111 L114 109" stroke="#ff7da7" stroke-width="1.5"/>
        <!-- Tier 1 flared ruffle -->
        <path d="M101 125 Q96 138 97 143 Q111 149 123 142 Q123 137 121 125 Z" fill="#c2a5f5" stroke="#4a2d5a" stroke-width="1.6"/>
        <path d="M97 143 Q103 147 110 144 Q117 148 123 142" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
        <!-- Tier 2 bottom ruffle with breezy flow -->
        <path d="M97 141 Q92 158 94 164 Q109 172 126 162 Q125 154 123 140 Z" fill="#b695ee" stroke="#4a2d5a" stroke-width="1.8"/>
        <!-- Left shadow side -->
        <path d="M97 141 L93 163 Q101 168 107 167 L104 143 Z" fill="#9d74e0" opacity="0.85"/>
        <!-- Chiffon wavy lettuce hem highlights -->
        <path d="M94 163 Q102 169 110 165 Q118 170 126 161" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.7"/>
        <!-- Vertical flow folds -->
        <path d="M105 128 Q104 151 103 165 M116 128 Q117 148 118 163" stroke="#9065d6" stroke-width="1.2" opacity="0.5"/>
      </g>

      <!-- 8. GARMENT 4: Mint Green Puff-Sleeve Blouse (x ~ 125, y ~ 102.5) -->
      <g id="garment-4-mint-blouse">
        <!-- Hanger hook -->
        <path d="M125 102.5 C125 94.5 129 93.5 129 97.5 C129 101.5 125 101.5 125 105.5" fill="none" stroke="#ffda8a" stroke-width="1.8"/>
        <!-- Wooden hanger -->
        <path d="M113 111 L125 106 L137 110" stroke="#4a2d5a" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M113 111 L125 106 L137 110" stroke="#ecd0b2" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Inside back neck -->
        <path d="M119 108 Q125 111 131 109 L130 114 Q125 116 120 113 Z" fill="#6db89c" stroke="#4a2d5a" stroke-width="1.2"/>
        <!-- Puffed sleeve on left -->
        <path d="M113 111 Q108 117 109 126 Q113 129 116 125 L117 115 Z" fill="#8fe0c2" stroke="#4a2d5a" stroke-width="1.6"/>
        <!-- Main blouse torso -->
        <path d="M116 112 L115 143 Q125 148 136 141 L135 112 Q130 109 125 114 Q120 109 116 112 Z" fill="#a4ebd0" stroke="#4a2d5a" stroke-width="1.8"/>
        <!-- Puffed sleeve on right -->
        <path d="M134 112 L136 124 Q140 127 142 119 Q142 112 137 110 Z" fill="#8fe0c2" stroke="#4a2d5a" stroke-width="1.6"/>
        <!-- Left shadow area -->
        <path d="M116 113 L115 143 Q121 146 125 145 L123 116 Z" fill="#75cca9" opacity="0.85"/>
        <!-- White rounded Peter Pan collar -->
        <path d="M119 109 Q124 114 126 113 Q124 107 119 109 Z" fill="#ffffff" stroke="#4a2d5a" stroke-width="1.3"/>
        <path d="M131 109 Q126 114 124 113 Q126 107 131 109 Z" fill="#ffffff" stroke="#4a2d5a" stroke-width="1.3"/>
        <!-- Center placket pintuck & tiny pearl buttons -->
        <line x1="125" y1="114" x2="125" y2="143" stroke="#ffffff" stroke-width="1.8"/>
        <circle cx="125" cy="120" r="1.3" fill="#ffffff" stroke="#4a2d5a" stroke-width="0.7"/>
        <circle cx="125" cy="128" r="1.3" fill="#ffffff" stroke="#4a2d5a" stroke-width="0.7"/>
        <circle cx="125" cy="136" r="1.3" fill="#ffffff" stroke="#4a2d5a" stroke-width="0.7"/>
      </g>

      <!-- 9. GARMENT 5: Baby Blue Box-Pleated Skirt (x ~ 138, y ~ 109) -->
      <g id="garment-5-pleated-skirt">
        <!-- Clip hanger hook -->
        <path d="M138 109 C138 101 142 100 142 104 C142 108 138 108 138 112" fill="none" stroke="#ffda8a" stroke-width="1.8"/>
        <!-- Straight wood hanger bar -->
        <path d="M127 116 L149 121" stroke="#4a2d5a" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M127 116 L149 121" stroke="#ecd0b2" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Dual golden spring clips gripping waistband -->
        <rect x="129" y="117" width="3.2" height="6.5" rx="1" fill="#ffda8a" stroke="#4a2d5a" stroke-width="1"/>
        <rect x="143" y="120" width="3.2" height="6.5" rx="1" fill="#ffda8a" stroke="#4a2d5a" stroke-width="1"/>
        <!-- High-waisted waistband -->
        <path d="M128 123 L148 128 L147 133 L127 128 Z" fill="#79b2e8" stroke="#4a2d5a" stroke-width="1.5"/>
        <path d="M128 124 L148 129" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
        <!-- Main flared pleated skirt body -->
        <path d="M127 128 L121 157 Q136 165 151 155 L147 133 Z" fill="#9ccaf7" stroke="#4a2d5a" stroke-width="1.8"/>
        <!-- 4 crisp box pleats with 3D shadow crevices -->
        <path d="M127 128 L121 157 L126 159 L132 130 Z" fill="#76aee6" stroke="#4a2d5a" stroke-width="1.2"/>
        <path d="M133 130 L128 160 L134 161 L139 131 Z" fill="#88bdf0" stroke="#4a2d5a" stroke-width="1.2"/>
        <path d="M140 131 L136 161 L142 160 L145 132 Z" fill="#76aee6" stroke="#4a2d5a" stroke-width="1.2"/>
        <path d="M146 132 L144 159 L150 156 L147 133 Z" fill="#88bdf0" stroke="#4a2d5a" stroke-width="1.2"/>
        <!-- Crisp pleat shadow lines -->
        <line x1="126" y1="159" x2="132" y2="130" stroke="#4a2d5a" stroke-width="1.4"/>
        <line x1="134" y1="161" x2="139" y2="131" stroke="#4a2d5a" stroke-width="1.4"/>
        <line x1="142" y1="160" x2="145" y2="132" stroke="#4a2d5a" stroke-width="1.4"/>
      </g>

      <!-- 10. Front / Right Post & Foot (x = 144, y = 222) -->
      <!-- Right caster wheels -->
      <circle cx="138" cy="220" r="3.2" fill="#4a2d5a"/>
      <circle cx="138" cy="219.5" r="2.2" fill="#ffd566"/>
      <circle cx="156" cy="229" r="3.2" fill="#4a2d5a"/>
      <circle cx="156" cy="228.5" r="2.2" fill="#ffd566"/>
      <!-- Right horizontal foot bar (slope -0.5) -->
      <path d="M138 219 L156 228" stroke="#4a2d5a" stroke-width="7"/>
      <path d="M138 219 L156 228" stroke="#f49eb7" stroke-width="4.2"/>
      <path d="M139 218 L155 226" stroke="#ffe0ec" stroke-width="1.4"/>
      <!-- Right vertical upright tube (from 144, 222 up to 144, 112) -->
      <path d="M144 222 V112" stroke="#4a2d5a" stroke-width="6.5"/>
      <path d="M144 222 V112" stroke="#f49eb7" stroke-width="4"/>
      <path d="M143 220 V114" stroke="#ffe0ec" stroke-width="1.2"/>
      <!-- Right top decorative ball finial -->
      <circle cx="144" cy="111" r="5" fill="#4a2d5a"/>
      <circle cx="144" cy="111" r="3.8" fill="#ffda8a"/>
      <circle cx="143" cy="109.5" r="1.2" fill="#ffffff"/>

      <!-- 11. Boutique Gift Box / Shoebox on Bottom Shelf (Isometric at x=100, y=184) -->
      <g id="shelf-shoebox" transform="translate(100, 184)">
        <!-- Box shadow -->
        <path d="M-2 15 L20 4 L44 14 L22 25 Z" fill="#8850a8" opacity=".2"/>
        <!-- Box top lid (pastel pink) -->
        <path d="M0 10 L18 1 L38 9 L20 18 Z" fill="#ffb8d6" stroke="#4a2d5a" stroke-width="1.6"/>
        <!-- Box left side -->
        <path d="M0 10 V18 L20 26 V18 Z" fill="#f08cb3" stroke="#4a2d5a" stroke-width="1.6"/>
        <!-- Box right side -->
        <path d="M20 26 L38 17 V9 L20 18 Z" fill="#d96c97" stroke="#4a2d5a" stroke-width="1.6"/>
        <!-- Cream satin cross ribbons -->
        <path d="M10 5 L19 18 M29 5 L20 18" stroke="#ffffff" stroke-width="2.5"/>
        <path d="M10 14 V22 M29 13 V21" stroke="#ffffff" stroke-width="2.5"/>
        <!-- Gold boutique bow on lid -->
        <circle cx="19" cy="9" r="2.5" fill="#ffd566" stroke="#4a2d5a" stroke-width="1"/>
        <path d="M15 8 Q13 6 15 5 Q18 6 18 9 Q18 6 22 5 Q24 6 22 8 Z" fill="#ffd566" stroke="#4a2d5a" stroke-width="1"/>
      </g>
    </g>
  `;
}

export const wallArtAssets = ['boutique-window', 'blush-blinds', 'shop-sign', 'fashion-print', 'gallery-print', 'botanical-print', 'runway-print', 'parfum-print', 'shoe-sketch-print', 'ribbon-sign', 'neon-sign', 'lightbox-sign'] as const;
export const isWallArtAsset = (art: string) => (wallArtAssets as readonly string[]).includes(art);

export function furnitureSvg(art: string, wallSide: 'left' | 'right' = 'right', shopName = 'My Little Boutique', includeShopName = true) {
  // Tên biến tương thích với template cũ; dữ liệu thực tế là Mali Bold Vietnamese được nhúng hoàn toàn.
  const shopSignFont = cherryBombOneFont;
  const escapeSvgText = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] ?? char);
  const rawShopName = (shopName.trim() || 'My Little Boutique').normalize('NFC');
  const nameWords = rawShopName.split(/\s+/);
  let signLines = [rawShopName];
  if (rawShopName.length > 13) {
    if (nameWords.length > 1) {
      let bestIndex = 1;
      let bestDifference = Number.POSITIVE_INFINITY;
      for (let index = 1; index < nameWords.length; index++) {
        const firstLength = nameWords.slice(0, index).join(' ').length;
        const secondLength = nameWords.slice(index).join(' ').length;
        const difference = Math.abs(firstLength - secondLength);
        if (difference < bestDifference) {
          bestDifference = difference;
          bestIndex = index;
        }
      }
      signLines = [nameWords.slice(0, bestIndex).join(' '), nameWords.slice(bestIndex).join(' ')];
    } else {
      const middle = Math.ceil(rawShopName.length / 2);
      signLines = [rawShopName.slice(0, middle), rawShopName.slice(middle)];
    }
  }
  const longestSignLine = Math.max(...signLines.map(line => line.length));
  const signFontSize = longestSignLine > 20 ? 14 : longestSignLine > 16 ? 17 : longestSignLine > 12 ? 20 : 24;
  const signText = includeShopName ? signLines.map((line, index) => {
    const y = signLines.length === 1 ? 108 : 98 + index * 24;
    return `<tspan x="90" y="${y}">${escapeSvgText(line)}</tspan>`;
  }).join('') : '';
  const signDecorY = signLines.length === 1 ? 128 : 140;
  const demoTop = (x: number, y: number, color: string) => `<path d="M${x - 12} ${y + 5}L${x - 20} ${y + 13}L${x - 16} ${y + 22}L${x - 9} ${y + 18}V${y + 38}Q${x} ${y + 42} ${x + 9} ${y + 38}V${y + 18}L${x + 16} ${y + 22}L${x + 20} ${y + 13}L${x + 12} ${y + 5}Q${x} ${y + 9} ${x - 12} ${y + 5}Z" fill="${color}" stroke="#4a2d5a" stroke-width="1.6"/><path d="M${x - 4} ${y + 7}Q${x} ${y + 13} ${x + 4} ${y + 7}" fill="none" stroke="#fff2f8" stroke-width="1.5"/>`;
  const demoIsoTop = (x: number, y: number, color: string) => `<g transform="matrix(.62,.31,0,.62,${x},${y})" stroke-linejoin="round"><path d="M-11 3L-20 10L-16 19L-9 15V37Q0 41 9 37V15L16 19L20 10L11 3Q0 8-11 3Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-5 4Q0 11 5 4" fill="none" stroke="#fff7fb" stroke-width="2"/></g>`;
  const sundayGarment = (id: string, dx: number, dy: number) => {
    const garment = rackSvg().match(new RegExp(`<g id="${id}">[\\s\\S]*?</g>`))?.[0] ?? '';
    return garment ? `<g transform="translate(${dx} ${dy})">${garment}</g>` : '';
  };
  const demoShoe = (x: number, y: number, color: string) => `<path d="M${x - 16} ${y + 11}Q${x - 7} ${y + 8} ${x - 3} ${y - 4}L${x + 4} ${y - 2}L${x + 8} ${y + 8}Q${x + 18} ${y + 10} ${x + 18} ${y + 16}Q${x + 4} ${y + 20} ${x - 16} ${y + 17}Z" fill="${color}" stroke="#4a2d5a" stroke-width="1.5"/><path d="M${x - 8} ${y + 11}H${x + 7}" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`;
  const demoIsoShoe = (x: number, y: number, color: string) => `<g transform="matrix(.72,.36,0,.72,${x},${y})" stroke-linejoin="round"><path d="M-17 4Q-9 2-5-9L2-7L7 2Q16 4 18 10Q3 15-17 9Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-16 8Q2 13 17 9" fill="none" stroke="#fff9fd" stroke-width="2" stroke-linecap="round"/><path d="M-4-6L3-3M-6-2L5 1" stroke="#fff9fd" stroke-width="1.4" stroke-linecap="round"/></g>`;
  const displayIsoShoe = (x: number, y: number, color: string, kind: 'sneaker' | 'heel' | 'loafer') => {
    const shape = kind === 'heel'
      ? `<path d="M-17 8Q-8 6-3-10L5-7L8 4Q15 6 18 11Q3 15-17 12Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-9 10L-12 19M12 11L15 16" stroke="#4a2d5a" stroke-width="2.5"/><path d="M-3-8L5-5" stroke="#fff" stroke-width="2"/>`
      : kind === 'loafer'
        ? `<path d="M-18 4Q-7 1-2-8L6-5L10 3Q17 4 19 10Q2 15-18 10Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-7-1Q0 5 9 1M-3 1L5-2" fill="none" stroke="#fff7fb" stroke-width="2"/><circle cx="2" cy="1" r="2" fill="#ffd76f"/>`
        : `<path d="M-18 5Q-9 2-5-10L4-7L9 3Q17 5 19 11Q2 16-18 11Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-17 9Q1 14 18 10" fill="none" stroke="#fff" stroke-width="3"/><path d="M-5-6L5-2M-7-2L7 2" stroke="#fff" stroke-width="1.7"/>`;
    return `<g transform="matrix(.82,.41,0,.82,${x},${y})" stroke-linejoin="round">${shape}</g>`;
  };
  const demoBag = (x: number, y: number, color: string) => `<path d="M${x - 14} ${y + 10}Q${x} ${y - 10} ${x + 14} ${y + 10}" fill="none" stroke="#4a2d5a" stroke-width="2"/><rect x="${x - 18}" y="${y + 8}" width="36" height="23" rx="6" fill="${color}" stroke="#4a2d5a" stroke-width="1.8"/><path d="M${x - 11} ${y + 14}H${x + 11}" stroke="#fff4fa" stroke-width="2"/><circle cx="${x}" cy="${y + 19}" r="2.5" fill="#ffd76f" stroke="#4a2d5a" stroke-width=".8"/>`;
  const demoIsoBag = (x: number, y: number, color: string) => `<g transform="matrix(.72,.36,0,.72,${x},${y})" stroke-linejoin="round"><path d="M-13 4Q0-14 13 4" fill="none" stroke="#4a2d5a" stroke-width="2.4" stroke-linecap="round"/><path d="M-17 3H17L15 25Q0 29-15 23Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-12 7Q0 10 12 7" fill="none" stroke="#fff7fb" stroke-width="2" stroke-linecap="round"/><path d="M-4 8Q0 12 4 8Q3 15 0 17Q-3 15-4 8Z" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1.2"/></g>`;
  const displayIsoBag = (x: number, y: number, color: string, kind: 'tote' | 'saddle' | 'baguette') => {
    const shape = kind === 'tote'
      ? `<path d="M-11 3Q0-13 11 3" fill="none" stroke="#4a2d5a" stroke-width="2.5"/><path d="M-17 2H17L14 27H-14Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-10 7V23M10 7V23" stroke="#fff6fb" stroke-width="1.6"/><circle cx="0" cy="9" r="2" fill="#ffd76f"/>`
      : kind === 'saddle'
        ? `<path d="M-12 4Q0-12 12 4" fill="none" stroke="#4a2d5a" stroke-width="2.5"/><path d="M-18 5Q0-2 18 5V20Q0 31-18 20Z" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-17 7Q0 19 17 7" fill="none" stroke="#fff7fb" stroke-width="2"/><path d="M-4 10H4V17H-4Z" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/>`
        : `<path d="M-12 4Q0-10 12 4" fill="none" stroke="#4a2d5a" stroke-width="2.4"/><rect x="-20" y="3" width="40" height="20" rx="7" fill="${color}" stroke="#4a2d5a" stroke-width="2"/><path d="M-14 8Q0 13 14 8" fill="none" stroke="#fff7fb" stroke-width="2"/><circle cx="0" cy="13" r="2.3" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/>`;
    return `<g transform="matrix(.82,.41,0,.82,${x},${y})" stroke-linejoin="round">${shape}</g>`;
  };
  if (art === 'couture-rack') return wrap(`
    <defs><linearGradient id="coutureGold" x1="0" x2="1"><stop stop-color="#b57a3d"/><stop offset=".45" stop-color="#ffe3a0"/><stop offset="1" stop-color="#9a6030"/></linearGradient></defs>
    <ellipse cx="88" cy="207" rx="66" ry="14" transform="rotate(26.565 88 207)" fill="#50384f" opacity=".15"/>
    <path d="M31 195V92Q31 43 72 50L141 85Q151 90 151 106V217" fill="none" stroke="#4a2d5a" stroke-width="8" stroke-linecap="round"/>
    <path d="M31 195V92Q31 43 72 50L141 85Q151 90 151 106V217" fill="none" stroke="url(#coutureGold)" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M30 91L149 150" stroke="#4a2d5a" stroke-width="7"/><path d="M30 91L149 150" stroke="#d9a95f" stroke-width="3.5"/>
    <!-- Reuse Sunday's silhouettes and back-to-front order. A uniform scale
         preserves the garment tilt; the hooks follow this rail's 1:2 slope. -->
    <g transform="translate(-44 6) scale(1.2)" stroke-linecap="round" stroke-linejoin="round">
      ${sundayGarment('garment-1-tweed-jacket', 0, 0)}
      ${sundayGarment('garment-2-cream-cardigan', 0, 0)}
      ${sundayGarment('garment-3-lavender-dress', 0, 0)}
      ${sundayGarment('garment-4-mint-blouse', 0, 0)}
      ${sundayGarment('garment-5-pleated-skirt', 0, 0)}
    </g>
    <!-- The near upright sits in front of the hanging clothes. -->
    <path d="M151 106V217" stroke="#4a2d5a" stroke-width="8" stroke-linecap="round"/>
    <path d="M151 106V217" stroke="url(#coutureGold)" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Floor stabilisers use the opposite isometric axis (-26.565deg),
         centred directly beneath each upright. -->
    <path d="M18 202L44 189M138 224L164 211" stroke="#4a2d5a" stroke-width="8" stroke-linecap="round"/>
    <path d="M19 200.5L43 188.5M139 222.5L163 210.5" stroke="#d7a45a" stroke-width="4" stroke-linecap="round"/>
    <path d="M21 198.8L41 188.8M141 220.8L161 210.8" stroke="#ffe4a3" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>
    <g fill="#d7a45a" stroke="#4a2d5a" stroke-width="1.4">
      <circle cx="18" cy="202" r="3.1"/><circle cx="44" cy="189" r="3.1"/>
      <circle cx="138" cy="224" r="3.1"/><circle cx="164" cy="211" r="3.1"/>
    </g>
    <circle cx="31" cy="90" r="5" fill="#fff1bd" stroke="#4a2d5a" stroke-width="1.5"/><circle cx="150" cy="149" r="5" fill="#fff1bd" stroke="#4a2d5a" stroke-width="1.5"/>
  `, 180, 230);
  if (art === 'jewel-shoe-wall') return wrap(`
    <defs><linearGradient id="jewelGlass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9fbff" stop-opacity=".78"/><stop offset="1" stop-color="#9588a9" stop-opacity=".34"/></linearGradient></defs>
    <ellipse cx="87" cy="210" rx="61" ry="13" transform="rotate(26.565 87 210)" fill="#443347" opacity=".15"/>
    <path d="M43 42L139 90V211L43 163Z" fill="#776b82" stroke="#4a2d5a" stroke-width="3"/>
    <path d="M27 51L123 99V220L27 172Z" fill="url(#jewelGlass)" stroke="#4a2d5a" stroke-width="3"/>
    <path d="M123 99L139 90V211L123 220Z" fill="#665a72" stroke="#4a2d5a" stroke-width="2"/>
    <path d="M28 87L123 134L138 126M28 127L123 174L138 166M28 167L123 214L138 206" fill="none" stroke="#d9b96e" stroke-width="4"/>
    <path d="M30 84L123 130L136 123M30 124L123 170L136 163M30 164L123 210L136 203" fill="none" stroke="#fff3bd" stroke-width="1.5"/>
    ${displayIsoShoe(51, 76, '#e5ded1', 'heel')}${displayIsoShoe(91, 96, '#31323a', 'loafer')}${displayIsoShoe(51, 116, '#aa8991', 'heel')}${displayIsoShoe(91, 136, '#dadde4', 'sneaker')}${displayIsoShoe(51, 156, '#756457', 'loafer')}${displayIsoShoe(91, 176, '#efe7db', 'heel')}
    <!-- Close the top plane between the rear panel and the front uprights. -->
    <path d="M27 51L43 42L139 90L123 99Z" fill="#c8bbd3" stroke="#4a2d5a" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M27 51L123 99L139 90" fill="none" stroke="#d9b96e" stroke-width="3" stroke-linejoin="round"/>
    <path d="M32 50L43 44L134 90" fill="none" stroke="#fff1c3" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M27 172V51M123 220V99" stroke="#4a2d5a" stroke-width="6"/><path d="M27 170V54M123 217V102" stroke="#c79b53" stroke-width="2.8"/>
  `, 180, 230);
  if (art === 'atelier-island') return wrap(`
    <ellipse cx="91" cy="205" rx="70" ry="17" transform="rotate(26.565 91 205)" fill="#493b4b" opacity=".14"/>
    <path d="M22 124L76 94L163 138L108 169Z" fill="#fffaf2" stroke="#4a2d5a" stroke-width="2.5"/>
    <path d="M22 124V166L108 209V169Z" fill="#ded5cb" stroke="#4a2d5a" stroke-width="2"/><path d="M108 169L163 138V180L108 209Z" fill="#bcae9f" stroke="#4a2d5a" stroke-width="2"/>
    <path d="M32 128L77 103L151 140L107 164Z" fill="#f5efe8" stroke="#c79b53" stroke-width="1.6"/>
    <g fill="#fff" stroke="#4a2d5a" stroke-width="1.4"><path d="M46 123L62 114L79 123L62 132Z"/><path d="M86 129L103 120L121 129L103 139Z"/><path d="M117 146L133 137L149 146L133 155Z"/></g>
    <path d="M55 121Q62 112 69 121M95 128Q103 116 111 128M126 144Q133 133 140 144" fill="none" stroke="#d7a55a" stroke-width="2"/>
    <circle cx="62" cy="123" r="3" fill="#d7a3af"/><circle cx="103" cy="129" r="3" fill="#8795a9"/><circle cx="133" cy="146" r="3" fill="#d9bd76"/>
    <path d="M35 171V184M96 201V216M146 181V194" stroke="#4a2d5a" stroke-width="7"/><path d="M35 171V183M96 201V215M146 181V193" stroke="#c79b53" stroke-width="3"/>
  `, 180, 230);
  if (art === 'runway-mannequin') return wrap(`
    <ellipse cx="90" cy="211" rx="54" ry="13" fill="#553c58" opacity=".15"/>
    <path d="M38 184L90 158L143 184L90 212Z" fill="#262530" stroke="#4a2d5a" stroke-width="2.5"/><path d="M48 181L90 161L133 183L90 205Z" fill="#f0c8db" stroke="#ffd76f" stroke-width="2"/>
    <path d="M90 162V72" stroke="#4a2d5a" stroke-width="6"/><path d="M90 162V72" stroke="#c99c58" stroke-width="2.5"/><ellipse cx="90" cy="58" rx="11" ry="15" fill="#ead7c4" stroke="#4a2d5a" stroke-width="2"/>
    <path d="M70 82Q90 68 110 82L106 126L124 159Q90 176 56 159L74 126Z" fill="#9a6f86" stroke="#4a2d5a" stroke-width="2.5"/><path d="M73 98Q90 108 107 98M63 148Q90 159 117 148" fill="none" stroke="#f7dce8" stroke-width="2"/>
    <path d="M55 190L43 201M125 190L138 201" stroke="#ffd76f" stroke-width="3"/><circle cx="43" cy="201" r="3" fill="#fff"/><circle cx="138" cy="201" r="3" fill="#fff"/>
  `, 180, 230);
  if (art === 'global-showcase') return wrap(`
    <defs><linearGradient id="flagshipGlass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".78"/><stop offset=".5" stop-color="#d8e8f1" stop-opacity=".3"/><stop offset="1" stop-color="#b8a6ce" stop-opacity=".5"/></linearGradient></defs>
    <ellipse cx="87" cy="211" rx="66" ry="14" transform="rotate(26.565 87 211)" fill="#3f3045" opacity=".16"/>
    <path d="M47 35L145 84V211L47 162Z" fill="#534b61" stroke="#4a2d5a" stroke-width="3"/><path d="M26 47L124 96V223L26 174Z" fill="url(#flagshipGlass)" stroke="#4a2d5a" stroke-width="3"/><path d="M124 96L145 84V211L124 223Z" fill="#74677f" stroke="#4a2d5a" stroke-width="2"/>
    <path d="M27 91L124 139L144 128M27 133L124 181L144 170M27 174L124 222L144 211" fill="none" stroke="#ffd76f" stroke-width="4"/><path d="M30 87L124 134L141 125M30 129L124 176L141 167M30 170L124 217L141 208" fill="none" stroke="#fff8d6" stroke-width="1.6"/>
    ${displayIsoBag(51, 77, '#e9e0d4', 'baguette')}${displayIsoBag(91, 97, '#32333b', 'tote')}${displayIsoBag(51, 119, '#9a7a73', 'saddle')}${displayIsoBag(91, 139, '#d8d4dd', 'baguette')}${displayIsoBag(51, 161, '#6e617d', 'tote')}${displayIsoBag(91, 181, '#c4a263', 'saddle')}
    <!-- A complete glass top and gold rim join all four upper corners. -->
    <path d="M26 47L47 35L145 84L124 96Z" fill="#b8accb" stroke="#4a2d5a" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M26 47L124 96L145 84" fill="none" stroke="#ffd76f" stroke-width="3" stroke-linejoin="round"/>
    <path d="M31 46L47 37L140 84M57 46L66 50M73 54L94 64" fill="none" stroke="#fff8df" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 174V47M124 223V96" stroke="#4a2d5a" stroke-width="6"/><path d="M26 171V50M124 220V99" stroke="#d5aa5e" stroke-width="2.8"/><circle cx="26" cy="46" r="5" fill="#fff" stroke="#ffd76f" stroke-width="2"/><circle cx="124" cy="95" r="5" fill="#fff" stroke="#ffd76f" stroke-width="2"/>
  `, 180, 230);
  if (art === 'champagne-sofa') return wrap(`
    <ellipse cx="91" cy="204" rx="73" ry="17" transform="rotate(26.565 91 204)" fill="#47394a" opacity=".15"/>
    <path d="M24 117Q25 88 47 88L126 127Q153 141 154 169L154 184L96 216L24 180Z" fill="#b88c65" stroke="#4a2d5a" stroke-width="2.5"/>
    <path d="M31 112Q33 82 53 92L130 131Q146 139 147 160L147 173L94 202L31 171Z" fill="#eadcc8" stroke="#4a2d5a" stroke-width="2.5"/>
    <path d="M42 139L83 160L112 144L137 157L94 181Z" fill="#fff5e8" stroke="#4a2d5a" stroke-width="2"/><path d="M42 139V165L94 191V181M94 181V202M112 144V170" fill="none" stroke="#c4aa91" stroke-width="1.8"/>
    <path d="M53 113L72 123L62 141L43 131Z" fill="#b7a6c8" stroke="#4a2d5a" stroke-width="1.5"/><path d="M107 137L127 147L116 164L97 154Z" fill="#d6ad83" stroke="#4a2d5a" stroke-width="1.5"/>
    <path d="M37 178V193M91 205V220M139 181V195" stroke="#4a2d5a" stroke-width="7"/><path d="M37 178V192M91 205V219M139 181V194" stroke="#c99a51" stroke-width="3"/>
  `, 180, 230);
  if (art === 'rack') {
    return wrap(rackSvg(), 180, 230);
  }
  if (art === 'lux-rack') return wrap(`
    <defs>
      <linearGradient id="luxGold" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="#916021"/><stop offset=".18" stop-color="#eebc48"/>
        <stop offset=".36" stop-color="#fff3b0"/><stop offset=".49" stop-color="#d59a27"/>
        <stop offset=".72" stop-color="#ffdc70"/><stop offset="1" stop-color="#a56b20"/>
      </linearGradient>
      <linearGradient id="luxBase" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#fff1bd"/><stop offset=".42" stop-color="#eec45a"/><stop offset="1" stop-color="#ad7528"/>
      </linearGradient>
    </defs>
    <ellipse cx="92" cy="201" rx="68" ry="13" transform="rotate(26.565 92 201)" fill="#6c4d30" opacity=".15"/>
    <g stroke-linecap="round" stroke-linejoin="round">
      <!-- A continuous golden arch, projected along the shop floor. -->
      <path d="M43 181V70C43 13 139 61 139 118V229" transform="translate(0 -10)" fill="none" stroke="#654329" stroke-width="10"/>
      <path d="M43 181V70C43 13 139 61 139 118V229" transform="translate(0 -10)" fill="none" stroke="url(#luxGold)" stroke-width="7"/>
      <path d="M41 165V60C41 32 68 36 87 46" fill="none" stroke="#fff7cc" stroke-width="1.7"/>
      <path d="M46 72L136 117" stroke="#654329" stroke-width="8"/>
      <path d="M46 72L136 117" stroke="url(#luxGold)" stroke-width="5.5"/>
      <path d="M47 70L135 114" stroke="#fff6c4" stroke-width="1.3"/>
      <!-- Move Sunday's complete row together: preserve its tilt, spacing and
           overlap while aligning every hook with the gold rail. -->
      <g transform="translate(-18 0)">
        ${sundayGarment('garment-1-tweed-jacket', 0, 0)}
        ${sundayGarment('garment-2-cream-cardigan', 0, 0)}
        ${sundayGarment('garment-3-lavender-dress', 0, 0)}
        ${sundayGarment('garment-4-mint-blouse', 0, 0)}
        ${sundayGarment('garment-5-pleated-skirt', 0, 0)}
      </g>
      <!-- Gold shelf, bevelled edge and matching stabilising feet. -->
      <path d="M32 172L49 163L150 214L133 223Z" fill="#ffeb9e" stroke="#79502c" stroke-width="2"/>
      <path d="M32 172L133 223V228L32 177Z" fill="url(#luxBase)" stroke="#79502c" stroke-width="1.5"/>
      <path d="M133 223L150 214V219L133 228Z" fill="#b47c28" stroke="#79502c" stroke-width="1.5"/>
      <path d="M44 171L137 217M47 169L140 215" stroke="#bc8c34" stroke-width="1.2"/>
      <path d="M43 79V174M139 118V220" stroke="#654329" stroke-width="9"/>
      <path d="M43 79V174M139 118V220" stroke="url(#luxGold)" stroke-width="6"/>
      <path d="M41 82V168M137 121V214" stroke="#fff5b9" stroke-width="1.5"/>
      <path d="M32 179L52 169M128 225L150 214" stroke="#654329" stroke-width="8"/>
      <path d="M32 179L52 169M128 225L150 214" stroke="url(#luxGold)" stroke-width="5"/>
      <path d="M43 94V105M139 153V165" stroke="#fffdf0" stroke-width="2.2"/>
      <path d="M87 39L89 45L95 47L89 49L87 55L85 49L79 47L85 45Z" fill="#fff9d8" stroke="#dfb64b" stroke-width=".8"/>
    </g>
  `, 180, 240);
  if (art === 'wall-rack') {
    return wrap(`
      <ellipse cx="86" cy="204" rx="64" ry="14" transform="rotate(26.565 86 204)" fill="#65406f" opacity=".12"/>

      <!-- Rear blue rail: pushed deep enough to remain visually separate -->
      <path d="M68 178V52M143 216V90" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M68 178V52M143 216V90" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M64 53L147 94" stroke="#4a2d5a" stroke-width="6.5"/>
      <path d="M64 53L147 94" stroke="#ee91bd" stroke-width="3.8"/>
      <path d="M66 51L145 90" stroke="#f1ecff" stroke-width="1.2"/>
      ${sundayGarment('garment-1-tweed-jacket', -1, -20)}
      ${sundayGarment('garment-3-lavender-dress', -6, -22)}
      ${sundayGarment('garment-4-mint-blouse', 3, -18)}
      <path d="M143 216V90" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/><path d="M143 216V90" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>

      <!-- Front blush rail: offset down-left along the other floor axis -->
      <path d="M27 199V76M102 228V113" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M27 199V76M102 228V113" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M23 77L106 118" stroke="#4a2d5a" stroke-width="6.5"/>
      <path d="M23 77L106 118" stroke="#ee91bd" stroke-width="3.8"/>
      <path d="M25 75L104 114" stroke="#f1ecff" stroke-width="1.2"/>
      ${sundayGarment('garment-2-cream-cardigan', -55, -2)}
      ${sundayGarment('garment-5-pleated-skirt', -70, -10)}
      ${sundayGarment('garment-1-tweed-jacket', 9, 29)}
      <path d="M102 228V113" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/><path d="M102 228V113" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>

      <!-- Four depth bridges make the double-sided construction explicit -->
      <path d="M27 76L68 52M102 113L143 90M27 191L68 169M102 220L143 207" stroke="#4a2d5a" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M28 76L67 53M103 113L142 91" stroke="#ee91bd" stroke-width="2.2" stroke-linecap="round"/>

      <!-- Sunday-style gold caps and slim rolling feet -->
      <g fill="#ffd76f" stroke="#4a2d5a" stroke-width="1.4">
        <circle cx="27" cy="75" r="4.2"/><circle cx="68" cy="51" r="4.2"/>
        <circle cx="102" cy="112" r="4.2"/><circle cx="143" cy="89" r="4.2"/>
      </g>
      <path d="M17 195L38 205M58 173L79 183M92 223L113 229M133 210L154 220" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M18 194L37 203M59 172L78 181M93 222L112 227M134 209L153 218" stroke="#ee91bd" stroke-width="3.2" stroke-linecap="round"/>
      <g fill="#ffd76f" stroke="#4a2d5a" stroke-width="1">
        <circle cx="17" cy="195" r="2.6"/><circle cx="38" cy="205" r="2.6"/>
        <circle cx="92" cy="223" r="2.6"/><circle cx="113" cy="229" r="2.6"/>
      </g>
    `, 180, 230);
  }
  if (art === 'shoe-shelf') return wrap(`
    <!-- Floor contact follows the same diagonal axes as the boutique tiles -->
    <ellipse cx="78" cy="207" rx="52" ry="11" transform="rotate(26.565 78 207)" fill="#563461" opacity=".13"/>
    <ellipse cx="39" cy="199" rx="10" ry="4" fill="#563461" opacity=".12"/>
    <ellipse cx="108" cy="223" rx="11" ry="4" fill="#563461" opacity=".14"/>

    <!-- Rear uprights establish the isometric depth -->
    <path d="M52 188V44M118 221V77" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M52 188V44M118 221V77" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M51 185V47M117 218V80" stroke="#ffe7f2" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>

    <!-- Three thick candy shelves, projected onto the floor axes -->
    <g stroke="#4a2d5a" stroke-linejoin="round">
      <path d="M52 70L118 103L105 110L39 77Z" fill="#fff5fb" stroke-width="1.8"/>
      <path d="M39 77L105 110V115L39 82Z" fill="#e98db8" stroke-width="1.5"/>
      <path d="M105 110L118 103V108L105 115Z" fill="#c76598" stroke-width="1.3"/>
      <path d="M52 112L118 145L105 152L39 119Z" fill="#fff8ef" stroke-width="1.8"/>
      <path d="M39 119L105 152V157L39 124Z" fill="#f0a7c8" stroke-width="1.5"/>
      <path d="M105 152L118 145V150L105 157Z" fill="#cc77a3" stroke-width="1.3"/>
      <path d="M52 154L118 187L105 194L39 161Z" fill="#fff5fb" stroke-width="1.8"/>
      <path d="M39 161L105 194V199L39 166Z" fill="#e98db8" stroke-width="1.5"/>
      <path d="M105 194L118 187V192L105 199Z" fill="#c76598" stroke-width="1.3"/>
    </g>
    <path d="M46 75L108 106M46 117L108 148M46 159L108 190" stroke="#fff" stroke-width="1.5" opacity=".9"/>

    <!-- Shoes rest on each shelf and inherit its 26.5 degree axis -->
    ${displayIsoShoe(61, 68, '#e8e1d7', 'sneaker')}${displayIsoShoe(94, 85, '#6f7885', 'loafer')}
    ${displayIsoShoe(61, 110, '#b69b87', 'heel')}${displayIsoShoe(94, 127, '#f1ede5', 'sneaker')}
    ${displayIsoShoe(61, 152, '#5c626c', 'loafer')}${displayIsoShoe(94, 169, '#b99e95', 'heel')}

    <!-- Front uprights cover the shelf joints for believable construction -->
    <path d="M39 195V51M105 225V84" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M39 195V51M105 225V84" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M38 192V54M104 222V87" stroke="#ffe2ef" stroke-width="1.2" stroke-linecap="round"/>

    <!-- Heart finials and stable feet -->
    <path d="M39 49C34 43 27 47 30 53C32 57 39 61 39 61C39 61 46 57 48 53C51 47 44 43 39 49Z" fill="#ff9fc5" stroke="#4a2d5a" stroke-width="1.5"/>
    <path d="M105 82C100 76 93 80 96 86C98 90 105 94 105 94C105 94 112 90 114 86C117 80 110 76 105 82Z" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1.5"/>
    <path d="M29 190L49 200M95 220L115 227" stroke="#4a2d5a" stroke-width="7" stroke-linecap="round"/>
    <path d="M30 189L48 198M96 219L114 226" stroke="#ee91bd" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="29" cy="190" r="3" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/><circle cx="49" cy="200" r="3" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/>
    <circle cx="95" cy="220" r="3" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/><circle cx="115" cy="227" r="3" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/>
  `, 180, 230);
  if (art === 'bag-stand') return wrap(`
    <!-- Isometric footprint aligned to the boutique floor grid -->
    <ellipse cx="80" cy="207" rx="53" ry="11" transform="rotate(26.565 80 207)" fill="#563461" opacity=".13"/>
    <ellipse cx="37" cy="196" rx="10" ry="4" fill="#563461" opacity=".12"/>
    <ellipse cx="111" cy="224" rx="11" ry="4" fill="#563461" opacity=".14"/>

    <!-- Rear pair is offset along the second floor axis -->
    <path d="M53 188V45M121 222V79" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M53 188V45M121 222V79" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M52 185V48M120 219V82" stroke="#ffe7f2" stroke-width="1.2" stroke-linecap="round"/>

    <!-- Solid shelf planes make the rack read as one isometric volume -->
    <g stroke="#4a2d5a" stroke-linejoin="round">
      <path d="M53 79L121 113L107 120L39 86Z" fill="#fff8fc" stroke-width="1.8"/>
      <path d="M39 86L107 120V126L39 92Z" fill="#ed91bd" stroke-width="1.5"/>
      <path d="M107 120L121 113V119L107 126Z" fill="#c96f9f" stroke-width="1.3"/>
      <path d="M53 124L121 158L107 165L39 131Z" fill="#fff8ee" stroke-width="1.8"/>
      <path d="M39 131L107 165V171L39 137Z" fill="#f0a5c8" stroke-width="1.5"/>
      <path d="M107 165L121 158V164L107 171Z" fill="#cb77a4" stroke-width="1.3"/>
      <path d="M53 169L121 203L107 210L39 176Z" fill="#fff8fc" stroke-width="1.8"/>
      <path d="M39 176L107 210V216L39 182Z" fill="#ed91bd" stroke-width="1.5"/>
      <path d="M107 210L121 203V209L107 216Z" fill="#c96f9f" stroke-width="1.3"/>
    </g>
    <path d="M46 84L111 116M46 129L111 161M46 174L111 206" stroke="#fff" stroke-width="1.5" opacity=".9"/>

    <!-- Handbags share the shelf axis instead of facing the camera flat -->
    ${displayIsoBag(63, 71, '#d6c5b7', 'tote')}${displayIsoBag(97, 88, '#717681', 'baguette')}
    ${displayIsoBag(63, 116, '#eee7dc', 'saddle')}${displayIsoBag(97, 133, '#9f8173', 'tote')}
    ${displayIsoBag(63, 161, '#5f6068', 'baguette')}${displayIsoBag(97, 178, '#b3958e', 'saddle')}

    <!-- Front pair remains visible and clearly displaced from the rear pair -->
    <path d="M39 194V52M107 228V86" stroke="#4a2d5a" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M39 194V52M107 228V86" stroke="#ee91bd" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M38 191V55M106 225V89" stroke="#ffe4f0" stroke-width="1.2" stroke-linecap="round"/>

    <!-- Ribbon finials preserve the original Coquette identity -->
    <g fill="#ff9fc5" stroke="#4a2d5a" stroke-width="1.5" stroke-linejoin="round">
      <path d="M39 55Q29 47 27 55Q27 63 38 60L39 66L40 60Q51 63 51 55Q49 47 39 55Z"/>
      <path d="M107 89Q97 81 95 89Q95 97 106 94L107 100L108 94Q119 97 119 89Q117 81 107 89Z"/>
    </g>
    <circle cx="39" cy="57" r="3" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/><circle cx="107" cy="91" r="3" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/>
    <path d="M29 190L49 200M97 221L117 228" stroke="#4a2d5a" stroke-width="7" stroke-linecap="round"/>
    <path d="M30 189L48 198M98 220L116 227" stroke="#ee91bd" stroke-width="3.5" stroke-linecap="round"/>
  `, 180, 230);
  if (art === 'shoe-cabinet') return wrap(`
    <ellipse cx="84" cy="207" rx="58" ry="12" transform="rotate(26.565 84 207)" fill="#563461" opacity=".13"/>
    <!-- Cloud cabinet: back shell, front face and right depth face -->
    <path d="M49 39L136 82V211L49 168Z" fill="#c8eaf8" stroke="#4a2d5a" stroke-width="2.5"/>
    <path d="M34 48L121 91V220L34 177Z" fill="#effaff" stroke="#4a2d5a" stroke-width="2.8"/>
    <path d="M121 91L136 82V211L121 220Z" fill="#9dcfe9" stroke="#4a2d5a" stroke-width="2"/>
    <path d="M34 48L49 39L136 82L121 91Z" fill="#fff" stroke="#4a2d5a" stroke-width="2"/>
    <!-- Rear posts belong behind the displayed shoes -->
    <path d="M49 168V39M136 211V82" fill="none" stroke="#4a2d5a" stroke-width="5" stroke-linecap="round"/>
    <path d="M49 166V42M136 208V85" fill="none" stroke="#a9dcef" stroke-width="2.3"/>
    <!-- A soft cloud crown gives this cabinet its own silhouette -->
    <path d="M35 49Q39 35 51 43Q58 27 70 48Q79 37 88 57Q98 45 107 67Q116 58 122 90Z" fill="#f9fdff" stroke="#4a2d5a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M42 48Q49 41 55 47M72 49Q78 45 84 53M98 65Q104 61 111 70" fill="none" stroke="#b9e8fa" stroke-width="2.2" stroke-linecap="round"/>
    <!-- Illuminated shelf planes -->
    <path d="M35 89L121 132L135 125M35 132L121 175L135 168M35 175L121 218L135 211" fill="none" stroke="#4a2d5a" stroke-width="4"/>
    <path d="M36 86L121 128L134 122M36 129L121 171L134 165M36 172L121 214L134 208" fill="none" stroke="#b7e8ff" stroke-width="2.3"/>
    <!-- Curated neutral footwear: larger silhouettes and fewer pieces per shelf -->
    ${displayIsoShoe(59, 76, '#e7e0d5', 'sneaker')}${displayIsoShoe(98, 96, '#788596', 'loafer')}
    ${displayIsoShoe(59, 119, '#b69b87', 'heel')}${displayIsoShoe(98, 139, '#f0ece4', 'sneaker')}
    ${displayIsoShoe(59, 162, '#5f6570', 'loafer')}${displayIsoShoe(98, 182, '#c4afa5', 'heel')}
    <!-- Only the front frame is painted over the merchandise -->
    <path d="M34 177V48M121 220V91" fill="none" stroke="#4a2d5a" stroke-width="5" stroke-linecap="round"/>
    <path d="M34 177V48M121 220V91" fill="none" stroke="#8ed4f2" stroke-width="2.5"/>
    <path d="M38 47Q44 35 50 43Q56 31 63 50Q52 55 38 47ZM107 81Q113 69 119 77Q125 65 132 84Q121 89 107 81Z" fill="#fff" stroke="#4a2d5a" stroke-width="1.4"/>
  `, 180, 230);
  if (art === 'bag-cabinet') return wrap(`
    <ellipse cx="84" cy="207" rx="58" ry="12" transform="rotate(26.565 84 207)" fill="#563461" opacity=".13"/>
    <!-- Blush cabinet is a deep boutique case instead of a flat board -->
    <path d="M49 39L136 82V211L49 168Z" fill="#e7a5c7" stroke="#4a2d5a" stroke-width="2.5"/>
    <path d="M34 48L121 91V220L34 177Z" fill="#fff3f9" stroke="#4a2d5a" stroke-width="2.8"/>
    <path d="M121 91L136 82V211L121 220Z" fill="#c96f9e" stroke="#4a2d5a" stroke-width="2"/>
    <path d="M34 48L49 39L136 82L121 91Z" fill="#ffd8e9" stroke="#4a2d5a" stroke-width="2"/>
    <!-- Rear frame and internal divider stay behind the handbags -->
    <path d="M49 168V39M136 211V82" fill="none" stroke="#4a2d5a" stroke-width="5" stroke-linecap="round"/>
    <path d="M49 166V42M136 208V85" fill="none" stroke="#dfa0c0" stroke-width="2.3"/>
    <path d="M77 69V198" stroke="#4a2d5a" stroke-width="3"/><path d="M77 69V198" stroke="#f0a0c5" stroke-width="1.4"/>
    <!-- Arched boutique niches distinguish Blush from the open Cloud shelves -->
    <g transform="matrix(1,.494,0,1,34,31)" fill="#fffafd" fill-opacity=".58" stroke="#d47aa6" stroke-width="1.8">
      <path d="M7 70V37Q7 25 19 25H35Q43 25 43 37V70Z"/>
      <path d="M45 70V37Q45 25 57 25H73Q81 25 81 37V70Z"/>
      <path d="M7 123V91Q7 79 19 79H35Q43 79 43 91V123Z"/>
      <path d="M45 123V91Q45 79 57 79H73Q81 79 81 91V123Z"/>
    </g>
    <path d="M35 106L121 149L135 142M35 158L121 201L135 194" fill="none" stroke="#4a2d5a" stroke-width="4"/>
    <path d="M36 103L121 145L134 139M36 155L121 197L134 191" fill="none" stroke="#f7bad7" stroke-width="2.3"/>
    <!-- Boutique bags use restrained leather and canvas tones -->
    ${displayIsoBag(59, 77, '#d5c4b5', 'tote')}${displayIsoBag(99, 97, '#727783', 'baguette')}
    ${displayIsoBag(59, 129, '#eee7dc', 'saddle')}${displayIsoBag(99, 149, '#a98378', 'tote')}
    <path d="M34 177V48M121 220V91" fill="none" stroke="#4a2d5a" stroke-width="5" stroke-linecap="round"/>
    <path d="M34 177V48M121 220V91" fill="none" stroke="#f18fbd" stroke-width="2.5"/>
    <!-- Crown ribbons are duplicated at the staggered front corners -->
    <path d="M34 50Q23 40 22 50Q22 59 33 55L34 63L35 55Q47 59 47 50Q45 40 34 50Z" fill="#ff91c2" stroke="#4a2d5a" stroke-width="1.5"/>
    <path d="M121 93Q110 83 109 93Q109 102 120 98L121 106L122 98Q134 102 134 93Q132 83 121 93Z" fill="#ff91c2" stroke="#4a2d5a" stroke-width="1.5"/>
    <circle cx="34" cy="52" r="3" fill="#ffd76f"/><circle cx="121" cy="95" r="3" fill="#ffd76f"/>
  `, 180, 230);
  if (art === 'glass-showcase') return wrap(`
    <defs>
      <linearGradient id="crystalGlass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".62"/><stop offset=".55" stop-color="#bcecff" stop-opacity=".22"/><stop offset="1" stop-color="#d9c7ff" stop-opacity=".48"/></linearGradient>
      <filter id="ledGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter>
    </defs>
    <ellipse cx="84" cy="211" rx="49" ry="11" transform="rotate(26.565 84 211)" fill="#563461" opacity=".14"/>
    <!-- Rear glass face is displaced up-right along the second tile axis -->
    <path d="M57 41L126 75V207L57 173Z" fill="url(#crystalGlass)" stroke="#4a2d5a" stroke-width="2.2"/>
    <path d="M42 49L111 83V215L42 181Z" fill="url(#crystalGlass)" stroke="#4a2d5a" stroke-width="2.5"/>
    <path d="M111 83L126 75V207L111 215Z" fill="#bde8fa" fill-opacity=".38" stroke="#4a2d5a" stroke-width="1.8"/>
    <path d="M42 49L57 41L126 75L111 83Z" fill="#f9f4ff" fill-opacity=".78" stroke="#4a2d5a" stroke-width="1.8"/>
    <!-- Rear LED posts are occluded naturally by bags on the shelves -->
    <path d="M57 173V41M126 207V75" fill="none" stroke="#4a2d5a" stroke-width="5" stroke-linecap="round"/>
    <path d="M57 173V41M126 207V75" fill="none" stroke="#c5a7ff" stroke-width="2.5"/>
    <!-- LED-lit crystal shelves -->
    <g fill="#b8ecff" fill-opacity=".48" stroke="#4a2d5a" stroke-width="1.5" stroke-linejoin="round">
      <path d="M42 91L111 125L126 117L57 83Z"/><path d="M42 134L111 168L126 160L57 126Z"/><path d="M42 177L111 211L126 203L57 169Z"/>
    </g>
    <path d="M44 88L111 121L124 114M44 131L111 164L124 157M44 174L111 207L124 200" fill="none" stroke="#8ee8ff" stroke-width="4" opacity=".48" filter="url(#ledGlow)"/>
    <path d="M44 88L111 121L124 114M44 131L111 164L124 157M44 174L111 207L124 200" fill="none" stroke="#e9fbff" stroke-width="1.7"/>
    ${displayIsoBag(58, 74, '#34343b', 'baguette')}${displayIsoBag(94, 92, '#e5ddd1', 'tote')}
    ${displayIsoBag(58, 117, '#9a806f', 'saddle')}${displayIsoBag(94, 135, '#cec1b2', 'baguette')}
    ${displayIsoBag(58, 160, '#686570', 'tote')}${displayIsoBag(94, 178, '#ae8e86', 'saddle')}
    <!-- Front LED posts remain above the contents -->
    <path d="M42 181V49M111 215V83" fill="none" stroke="#4a2d5a" stroke-width="5" stroke-linecap="round"/>
    <path d="M42 181V49M111 215V83" fill="none" stroke="#72dbff" stroke-width="2.5"/>
    <path d="M38 180L48 185M107 213L117 218M53 171L63 176M122 205L132 210" stroke="#ffd76f" stroke-width="5" stroke-linecap="round"/>
    <circle cx="42" cy="48" r="4" fill="#fff" stroke="#ffd76f" stroke-width="1.5"/><circle cx="111" cy="82" r="4" fill="#fff" stroke="#ffd76f" stroke-width="1.5"/>
  `, 180, 230);
  const shapes: Record<string, string> = {
    mirror: `<path d="M55 191V70Q54 13 99 26Q133 36 132 79V182Z" fill="#d7b78b" stroke="#b49470" stroke-width="3"/><path d="M64 184V72Q61 24 99 36Q123 45 124 80V175Z" fill="#d9e4df"/><path d="M72 73L119 61M68 118L122 86M70 134L122 102" stroke="white" stroke-opacity=".7" stroke-width="9"/><path d="M66 177L121 154V174Z" fill="#bfcfc7"/>`,
    plant: `<path d="M61 157L67 194Q90 207 114 193L120 157Z" fill="#ddc4a6" stroke="#b89c7f" stroke-width="2"/><ellipse cx="90" cy="157" rx="30" ry="10" fill="#e9d7bc"/><ellipse cx="90" cy="157" rx="23" ry="6" fill="#86705b"/><path d="M88 155V62M88 104L60 84M88 126L116 103M88 82L107 61" fill="none" stroke="#7f8963" stroke-width="4"/>
      ${[[65, 74, -35], [109, 61, 25], [59, 102, -40], [117, 108, 35], [86, 48, -10], [86, 88, 35], [113, 135, 55], [65, 133, -45]].map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="23" transform="rotate(${r} ${x} ${y})" fill="${i % 2 ? '#9aac89' : '#7e967a'}"/><path d="M${x} ${y - 12}V${y + 12}" stroke="#c7d0a4" opacity=".4" transform="rotate(${r} ${x} ${y})"/>`).join('')}`,
    counter: `<path d="M13 136L65 107L165 158L111 190Z" fill="#f5e5cf" stroke="#d3bba1" stroke-width="2"/>
      <path d="M13 136V176L111 221V187Z" fill="#d9b197"/>
      <path d="M111 187L165 158V193L111 221Z" fill="#ba937d"/>
      <path d="M26 147V175M41 153V182M56 159V189M71 166V196M86 173V202M101 180V209" stroke="#efcdb1" stroke-width="3"/>
      <!-- Máy in hóa đơn mini đặt gọn trên bàn cạnh máy tính -->
      <path d="M73 140L83 145L79 151L69 146Z" fill="#4d5751" stroke="#3d4641" stroke-width="1"/>
      <path d="M72 143L78 140L80 142" fill="none" stroke="#fff" stroke-width="2"/>
      <!-- Bàn phím & chân đế máy tính đặt dịch sâu vào lòng bàn, quay vào chủ shop -->
      <path d="M87 138L115 152L122 147L94 133Z" fill="#4f5953"/>
      <path d="M89 134L109 144L106 149L86 139Z" fill="#353e38"/>
      <!-- Lưng màn hình máy tính quay ra phía trước đón khách -->
      <path d="M90 139L89 112L116 126L117 153Z" fill="#6d7b73" stroke="#48534c" stroke-width="2.5"/>
      <path d="M89 112L116 126" stroke="#a6b7ad" stroke-width="1.8"/>
      <!-- Màn hình phụ mini hiển thị giá tiền cho khách hàng gọn gàng -->
      <path d="M96 127L110 134L109 140L95 133Z" fill="#1b211e" stroke="#8da095" stroke-width="1"/>
      <rect x="98" y="130" width="8" height="3" rx=".8" transform="rotate(25 102 131)" fill="#75e297"/>
      <!-- Logo trái tim bạc trên lưng máy tính -->
      <path d="M105 118Q103 115 105 113Q107 115 109 113Q111 115 109 118L107 120Z" fill="#e8f3ec" opacity=".85"/>
      <!-- Túi giấy boutique bên trái bàn -->
      <path d="M42 120V100L62 110V130Z" fill="#e8d1b6"/>
      <path d="M48 103V92Q54 88 60 97V109" fill="none" stroke="#bda88b" stroke-width="2"/>`,
    table: `
      <!-- Soft contact shadow grounded to the isometric floor -->
      <ellipse cx="91" cy="207" rx="66" ry="16" fill="#76456f" opacity=".12"/>
      <ellipse cx="35" cy="190" rx="9" ry="3.5" fill="#76456f" opacity=".14"/>
      <ellipse cx="91" cy="216" rx="10" ry="4" fill="#76456f" opacity=".15"/>
      <ellipse cx="143" cy="190" rx="9" ry="3.5" fill="#76456f" opacity=".12"/>

      <!-- All legs are painted before the body, so the apron hides their joints -->
      <path d="M76 113L85 117L83 164Q81 168 77 165Z" fill="#c39173" stroke="#4a2d5a" stroke-width="1.7"/>
      <path d="M78 116L81 117L80 161" fill="none" stroke="#ffe6cf" stroke-width="1.4" opacity=".72"/>
      <path d="M139 139L149 143L147 187Q145 192 141 188Z" fill="#b77e68" stroke="#4a2d5a" stroke-width="1.7"/>
      <path d="M141 143L144 144L144 184" fill="none" stroke="#f7cfba" stroke-width="1.4" opacity=".68"/>
      <path d="M30 137L42 143L40 187Q38 193 33 189Z" fill="#d29a78" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M33 143L37 145L36 184" fill="none" stroke="#ffe8cf" stroke-width="1.6" opacity=".8"/>
      <path d="M86 168L98 174L96 212Q93 219 88 214Z" fill="#c78a70" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M89 175L93 177L92 209" fill="none" stroke="#ffe3ce" stroke-width="1.6" opacity=".78"/>
      <path d="M31 189Q36 193 41 188M87 213Q92 218 97 212M140 188Q145 192 148 187M77 164Q81 168 84 163" fill="none" stroke="#ffd76f" stroke-width="2.2"/>

      <!-- Solid boutique tabletop with a believable thick apron -->
      <path d="M21 127L81 97L158 134L94 168Z" fill="#fff1df" stroke="#4a2d5a" stroke-width="2.5"/>
      <path d="M27 126L82 101L151 134L94 163Z" fill="#ffe5d0" stroke="#e6b9a4" stroke-width="1.2"/>
      <path d="M21 127V138L94 176V168Z" fill="#e89eb9" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M94 168V176L158 143V134Z" fill="#c8789c" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M27 132L93 166" stroke="#ffd7e8" stroke-width="2" opacity=".9"/>
      <path d="M99 168L152 140" stroke="#f0a9c9" stroke-width="1.5" opacity=".75"/>

      <!-- Slim velvet trays follow the isometric tabletop -->
      <path d="M42 124L72 109L100 123L69 139Z" fill="#d9edf1" stroke="#4a2d5a" stroke-width="1.4"/>
      <path d="M42 124V128L69 142L100 126V123L69 139Z" fill="#91bdca" stroke="#4a2d5a" stroke-width="1"/>
      <path d="M91 139L116 126L142 139L116 153Z" fill="#ffe2ef" stroke="#4a2d5a" stroke-width="1.4"/>
      <path d="M91 139V143L116 157L142 143V139L116 153Z" fill="#df96b9" stroke="#4a2d5a" stroke-width="1"/>

      <!-- Sunglasses and pearl necklace instead of bags or boxes -->
      <g transform="matrix(.82,.41,-.82,.41,69,123)" fill="none" stroke="#4a2d5a" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="-12" cy="0" rx="8" ry="6" fill="#8fd4e8" fill-opacity=".72" stroke-width="1.8"/>
        <ellipse cx="12" cy="0" rx="8" ry="6" fill="#ef9bc4" fill-opacity=".72" stroke-width="1.8"/>
        <path d="M-4 0Q0-3 4 0M-20-1L-27-5M20-1L27-5" stroke-width="2"/>
        <path d="M-16-2Q-12-5-8-2M8-2Q12-5 16-2" stroke="#fff" stroke-width="1.2" opacity=".8"/>
      </g>
      <path d="M101 137Q115 146 132 137" fill="none" stroke="#fffdf8" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M101 137Q115 146 132 137" fill="none" stroke="#d7a83b" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="1.2 3"/>
      <path d="M115 144l3 5 3-5-3-3Z" fill="#f06eaa" stroke="#4a2d5a" stroke-width="1"/>

      <!-- Bracelet, rings and a small ribbon hair clip -->
      <ellipse cx="121" cy="132" rx="8" ry="4" transform="rotate(26 121 132)" fill="none" stroke="#d49322" stroke-width="2"/>
      <circle cx="132" cy="138" r="2.4" fill="#a8dcf0" stroke="#4a2d5a" stroke-width=".8"/>
      <circle cx="137" cy="140" r="2.1" fill="#ffd56c" stroke="#4a2d5a" stroke-width=".8"/>
      <path d="M52 117Q45 110 45 118Q45 124 53 120Q61 112 62 119Q63 126 54 121L57 127L52 124L48 126L51 120" fill="#f378b3" stroke="#4a2d5a" stroke-width="1.1"/>
      <circle cx="53" cy="120" r="2.5" fill="#ffd76f" stroke="#4a2d5a" stroke-width=".7"/>
    `,
    sofa: `
      <!-- Grounding shadow and four tapered wooden legs -->
      <ellipse cx="91" cy="207" rx="69" ry="16" transform="rotate(26.565 91 207)" fill="#684268" opacity=".13"/>

      <!-- Tall channel-tufted back, following the long isometric axis -->
      <path d="M42 143V99Q42 82 57 88L142 130Q155 137 155 153V181L142 188L42 143Z" fill="#d979a9" stroke="#4a2d5a" stroke-width="2.5"/>
      <path d="M48 139V102Q48 92 58 96L139 136Q149 141 149 152V174L139 179Z" fill="#f0a1c7" stroke="#f8c4dd" stroke-width="1.5"/>
      <path d="M70 101V149M94 113V160M118 125V171M141 138V177" stroke="#ce6f9f" stroke-width="2" opacity=".72"/>
      <path d="M49 105Q94 126 148 153" fill="none" stroke="#ffd2e6" stroke-width="2" opacity=".8"/>
      <g fill="#ffd76f" stroke="#4a2d5a" stroke-width=".8"><circle cx="69" cy="116" r="2.2"/><circle cx="94" cy="128" r="2.2"/><circle cx="119" cy="141" r="2.2"/><circle cx="142" cy="152" r="2.2"/></g>

      <!-- Four new legs follow the projected corners of the sofa footprint -->
      <g stroke="#4a2d5a" stroke-width="1.7" stroke-linejoin="round">
        <!-- rear-left: shorter and tucked under the far edge -->
        <path d="M48 177L55 180L54 194Q52 198 48 195Z" fill="#b97962"/>
        <!-- front-left -->
        <path d="M27 173L35 177L34 196Q32 201 27 197Z" fill="#c98d70"/>
        <!-- front-right -->
        <path d="M108 211L117 215L116 226Q113 231 108 227Z" fill="#bd7f68"/>
        <!-- rear-right: visibly shorter because it sits farther away -->
        <path d="M146 187L153 190L152 202Q150 206 146 203Z" fill="#aa705e"/>
      </g>
      <path d="M28 195Q31 199 34 195M49 193Q52 197 54 193M109 225Q113 229 116 225M147 201Q150 205 152 201" fill="none" stroke="#ffd76f" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M30 177L29 192M51 181L50 191M112 216L111 222M149 191L148 199" stroke="#f5c8aa" stroke-width="1.2" opacity=".75"/>

      <!-- Solid upholstered base -->
      <path d="M25 145L52 131L158 182L113 207Z" fill="#ffd0e3" stroke="#4a2d5a" stroke-width="2.5"/>
      <path d="M25 145V177L113 220V207Z" fill="#df84ae" stroke="#4a2d5a" stroke-width="2"/>
      <path d="M113 207V220L158 195V182Z" fill="#bd6692" stroke="#4a2d5a" stroke-width="2"/>
      <path d="M31 150L111 189V211L31 172Z" fill="#ec9fc2" opacity=".76"/>
      <!-- Two plump seat cushions with a narrow natural seam -->
      <path d="M34 143L57 132L103 154L78 167Q68 171 58 166L34 154Q26 150 34 143Z" fill="#ffc6de" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M82 167L107 154L151 176Q160 181 151 186L127 199Q119 203 110 198L82 184Q74 179 82 167Z" fill="#f7b2d1" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M38 147Q57 151 78 164M108 158Q128 164 149 179" fill="none" stroke="#ffe8f2" stroke-width="2.2"/>

      <!-- Boutique cushions rest against the back instead of floating above it -->
      <path d="M59 119L76 110L93 128L83 151L62 144Z" fill="#fff0d5" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M106 139L123 131L139 148L129 170L109 163Z" fill="#cab7f1" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M64 122L82 144M111 142L130 163" stroke="#fff" stroke-width="1.8" opacity=".72"/>
    `,
    flowers: `<path d="M71 163Q65 151 76 144H106Q116 151 109 164L116 190Q91 204 66 190Z" fill="#f1decc" stroke="#d5bca5" stroke-width="2"/><path d="M86 153L72 107M94 153L109 111M92 153V93" stroke="#889b74" stroke-width="3"/>${[[70, 106], [92, 93], [111, 109]].map(([x, y]) => `<g fill="#daa4a4"><circle cx="${x - 8}" cy="${y}" r="9"/><circle cx="${x + 8}" cy="${y}" r="9"/><circle cx="${x}" cy="${y - 8}" r="9"/><circle cx="${x}" cy="${y + 8}" r="9"/><circle cx="${x}" cy="${y}" r="5" fill="#f4d695"/></g>`).join('')}`,
    mannequin: `<ellipse cx="91" cy="199" rx="33" ry="12" fill="#bba482"/><path d="M91 193V150" stroke="#ad9376" stroke-width="5"/><path d="M88 39H98V54L117 65L108 94L132 156Q93 177 52 154L76 94L68 65L87 54Z" fill="#ebc0b9" stroke="#c69a90" stroke-width="2"/><path d="M77 94L108 94M86 105L78 156M96 107L98 162" stroke="#fff1df" stroke-width="3"/><ellipse cx="93" cy="34" rx="16" ry="21" fill="#e4c9a7"/><path d="M78 77Q91 85 106 77L112 113L129 159Q93 176 57 156L72 113Z" fill="#f59bc3" stroke="#4a2d5a" stroke-width="2"/><path d="M72 113Q91 120 112 113" stroke="#ffd76f" stroke-width="3"/><path d="M65 151Q92 164 121 153" fill="none" stroke="#fff0f8" stroke-width="3"/><circle cx="91" cy="100" r="4" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1"/>`,
    'shoe-shelf': `<ellipse cx="90" cy="205" rx="48" ry="10" fill="#8850a8" opacity=".12"/><path d="M45 65V198M135 65V198" stroke="#4a2d5a" stroke-width="6"/><path d="M45 65V198M135 65V198" stroke="#f49eb7" stroke-width="3.5"/><path d="M42 78H138M42 118H138M42 158H138M42 198H138" stroke="#4a2d5a" stroke-width="5"/><path d="M44 76H136M44 116H136M44 156H136M44 196H136" stroke="#ffe0ec" stroke-width="2.5"/>`,
    'bag-stand': `<ellipse cx="90" cy="205" rx="38" ry="10" fill="#8850a8" opacity=".12"/><path d="M90 54V198M50 82H130M56 130H124M64 176H116" stroke="#4a2d5a" stroke-width="6" stroke-linecap="round"/><path d="M90 54V198M50 82H130M56 130H124M64 176H116" stroke="#f49eb7" stroke-width="3.5" stroke-linecap="round"/><path d="M79 48Q69 35 76 29Q86 32 90 43Q94 32 104 29Q111 35 101 48Z" fill="#ff9fc5" stroke="#4a2d5a" stroke-width="2"/><ellipse cx="90" cy="202" rx="28" ry="7" fill="#ffd566" stroke="#4a2d5a" stroke-width="2"/>`,
    'wall-rack': `<ellipse cx="90" cy="205" rx="62" ry="11" fill="#8850a8" opacity=".12"/><path d="M35 58V198M145 58V198M31 56H149M31 112H149" stroke="#4a2d5a" stroke-width="7" stroke-linecap="round"/><path d="M35 58V198M145 58V198M31 56H149M31 112H149" stroke="#b99cf5" stroke-width="4" stroke-linecap="round"/><path d="M27 197H55M125 197H153" stroke="#4a2d5a" stroke-width="7" stroke-linecap="round"/>`,
    'shoe-cabinet': `<ellipse cx="90" cy="205" rx="62" ry="10" fill="#8850a8" opacity=".12"/><rect x="28" y="54" width="124" height="145" rx="10" fill="#eef9ff" stroke="#4a2d5a" stroke-width="3"/><path d="M32 92H148M32 128H148M32 164H148" stroke="#9ccaf7" stroke-width="4"/><path d="M42 65H138" stroke="#ffffff" stroke-width="5" opacity=".8"/><circle cx="90" cy="181" r="3" fill="#ffd566"/>`,
    'bag-cabinet': `<ellipse cx="90" cy="205" rx="62" ry="10" fill="#8850a8" opacity=".12"/><path d="M28 62Q28 48 42 48H138Q152 48 152 62V198H28Z" fill="#fff2f8" stroke="#4a2d5a" stroke-width="3"/><path d="M32 94H148M32 141H148M68 52V194M112 52V194" stroke="#efafd0" stroke-width="3"/><path d="M75 45Q66 34 72 28Q82 30 90 40Q98 30 108 28Q114 34 105 45Z" fill="#ff9fc5" stroke="#4a2d5a" stroke-width="2"/>`,
    fitting: `
      <!-- Floor shadow and raised fitting-room platform -->
      <ellipse cx="91" cy="207" rx="65" ry="14" transform="rotate(26.565 91 207)" fill="#654267" opacity=".13"/>
      <path d="M27 183L70 162L153 202L110 225Z" fill="#fff3f8" stroke="#4a2d5a" stroke-width="2"/>
      <path d="M27 183V190L110 228V225Z" fill="#df8fb5" stroke="#4a2d5a" stroke-width="1.6"/>
      <path d="M110 225V228L153 207V202Z" fill="#bd6f98" stroke="#4a2d5a" stroke-width="1.6"/>

      <!-- Rear structure and softly lit side mirror -->
      <path d="M69 164V29M150 202V67" stroke="#4a2d5a" stroke-width="7" stroke-linecap="round"/>
      <path d="M69 164V29M150 202V67" stroke="#e6a0c2" stroke-width="4" stroke-linecap="round"/>
      <path d="M113 89L146 72V187L113 205Z" fill="#f9eefa" stroke="#4a2d5a" stroke-width="2.3"/>
      <path d="M119 94L140 83V178L119 190Z" fill="#dff3fb" stroke="#d0a8c8" stroke-width="1.3"/>
      <path d="M122 101L138 92M121 128L139 111M121 145L139 128" stroke="#fff" stroke-width="5" opacity=".8"/>

      <!-- Two overlapping velvet curtains on the front plane -->
      <path d="M34 54L73 73V190L64 192L34 177Z" fill="#e799c8" stroke="#4a2d5a" stroke-width="2.2"/>
      <path d="M73 73L110 91V210L82 196L73 190Z" fill="#d987bd" stroke="#4a2d5a" stroke-width="2.2"/>
      <path d="M42 59V177M53 64V183M64 70V189" stroke="#f8c7e1" stroke-width="3" opacity=".72"/>
      <path d="M82 78V195M93 84V201M103 89V206" stroke="#efb6d8" stroke-width="3" opacity=".68"/>
      <path d="M68 75Q71 72 75 75V187Q72 192 68 188Z" fill="#b9649d" opacity=".64"/>
      <path d="M34 174Q48 181 64 188M82 193Q96 201 110 207" fill="none" stroke="#bc6198" stroke-width="2"/>

      <!-- Pearl tiebacks make the curtains read as fabric rather than flat panels -->
      <path d="M36 126Q52 139 69 136M76 140Q93 153 109 151" fill="none" stroke="#ffd76f" stroke-width="2.4"/>
      <circle cx="52" cy="134" r="3.5" fill="#fff8e8" stroke="#4a2d5a" stroke-width="1"/>
      <circle cx="93" cy="148" r="3.5" fill="#fff8e8" stroke="#4a2d5a" stroke-width="1"/>

      <!-- Front posts cover curtain edges for correct depth -->
      <path d="M31 185V49M113 222V87" stroke="#4a2d5a" stroke-width="7" stroke-linecap="round"/>
      <path d="M31 185V49M113 222V87" stroke="#ee91bd" stroke-width="4" stroke-linecap="round"/>
      <path d="M30 182V52M112 219V90" stroke="#ffe3f0" stroke-width="1.2"/>

      <!-- Padded isometric canopy with a scalloped boutique valance -->
      <path d="M31 49L69 28L151 67L113 88Z" fill="#fff1f7" stroke="#4a2d5a" stroke-width="2.7"/>
      <path d="M38 49L70 33L144 68L113 84Z" fill="#f8c6dc" stroke="#ffddec" stroke-width="1.3"/>
      <path d="M31 49L113 88V98Q106 101 99 94Q92 97 85 87Q78 91 71 80Q64 84 57 73Q50 77 43 66Q37 69 31 63Z" fill="#e98db9" stroke="#4a2d5a" stroke-width="1.8"/>
      <path d="M36 51L109 86" stroke="#ffe8f3" stroke-width="2"/>
      <circle cx="31" cy="49" r="4" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1.2"/>
      <circle cx="113" cy="88" r="4" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1.2"/>
    `,
    'heart-rug': `<path d="M90 178 C68 152 38 166 48 188 C58 206 90 220 90 220 C90 220 122 206 132 188 C142 166 112 152 90 178 Z" fill="#ffd1dc" stroke="#f472b6" stroke-width="2.5"/><path d="M90 182 C71 158 44 170 53 189 C61 203 90 216 90 216 C90 216 119 203 127 189 C136 170 109 158 90 182 Z" fill="#ffe4e6"/><ellipse cx="90" cy="196" rx="6" ry="3" fill="#ffffff" opacity=".7"/>`,
    'checkered-rug': `<path d="M38 185 L90 158 L142 185 L90 212 Z" fill="#ffffff" stroke="#2c1810" stroke-width="2"/><path d="M64 171.5 L90 158 L116 171.5 L90 185 Z" fill="#2c1810"/><path d="M38 185 L64 171.5 L90 185 L64 198.5 Z" fill="#f1f5f9"/><path d="M90 185 L116 171.5 L142 185 L116 198.5 Z" fill="#2c1810"/><path d="M64 198.5 L90 185 L116 198.5 L90 212 Z" fill="#f1f5f9"/>`,
    'atelier-rug': `<path d="M17 181L89 145L163 182L90 219Z" fill="#efc4d9" stroke="#c783a9" stroke-width="2.5"/><path d="M25 181L89 150L155 182L90 214Z" fill="none" stroke="#fbe8f2" stroke-width="2"/>`,
    'tulip-lamp': `<ellipse cx="90" cy="205" rx="20" ry="8" fill="#ffd566" stroke="#4a2d5a" stroke-width="1.8"/><path d="M90 205 V75" stroke="#ffda8a" stroke-width="4.5" stroke-linecap="round"/><path d="M90 125 Q70 115 65 100 M90 105 Q110 95 115 85" fill="none" stroke="#ffda8a" stroke-width="3" stroke-linecap="round"/><path d="M58 100 C55 85 75 85 72 100 Z" fill="#f472b6" stroke="#4a2d5a" stroke-width="1.5"/><circle cx="65" cy="90" r="7" fill="#fbcfe8"/><path d="M108 85 C105 70 125 70 122 85 Z" fill="#fef08a" stroke="#4a2d5a" stroke-width="1.5"/><circle cx="115" cy="75" r="7" fill="#fef9c3"/><path d="M83 75 C80 60 100 60 97 75 Z" fill="#c084fc" stroke="#4a2d5a" stroke-width="1.5"/><circle cx="90" cy="65" r="7" fill="#f3e8ff"/>`,
    beanbag: `<ellipse cx="90" cy="190" rx="38" ry="16" fill="#8850a8" opacity=".2"/><ellipse cx="90" cy="180" rx="36" ry="24" fill="#c084fc" stroke="#4a2d5a" stroke-width="2"/><ellipse cx="90" cy="174" rx="28" ry="18" fill="#e9d5ff"/><ellipse cx="90" cy="172" rx="16" ry="10" fill="#f3e8ff"/><path d="M85 160 Q90 152 95 160" stroke="#7c3aed" stroke-width="2" fill="none"/>`,
    'coquette-mirror': `<ellipse cx="90" cy="200" rx="28" ry="9" fill="#ffd566" stroke="#4a2d5a" stroke-width="1.8"/><path d="M58 190 V70 Q58 20 90 20 Q122 20 122 70 V190 Z" fill="#fed7aa" stroke="#4a2d5a" stroke-width="2.5"/><path d="M64 185 V72 Q64 28 90 28 Q116 28 116 72 V185 Z" fill="#cffafe"/><path d="M70 70 L110 50 M68 110 L112 85" stroke="#ffffff" stroke-width="6" opacity=".7"/><path d="M80 18 Q68 6 74 24 Q82 22 90 20 Q98 22 106 24 Q112 6 100 18 Z" fill="#ff7da7" stroke="#4a2d5a" stroke-width="1.6"/><circle cx="90" cy="19" r="3.5" fill="#fbbf24"/>`,
    'wavy-mirror': `<ellipse cx="90" cy="202" rx="30" ry="10" fill="#f43f5e" opacity=".2"/><path d="M54 195 Q50 180 56 165 Q50 150 56 135 Q50 120 56 105 Q50 90 56 75 Q50 45 90 40 Q130 45 124 75 Q130 90 124 105 Q130 120 124 135 Q130 150 124 165 Q130 180 126 195 Z" fill="#ff80b0" stroke="#4a2d5a" stroke-width="2.4"/><path d="M58 190 Q54 178 60 165 Q54 152 60 137 Q54 122 60 107 Q54 92 60 77 Q56 50 90 46 Q124 50 120 77 Q126 92 120 107 Q126 122 120 137 Q126 152 120 165 Q126 178 122 190 Z" fill="#fecdd3"/><rect x="66" y="58" width="48" height="126" rx="14" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5"/><path d="M72 80 L108 60 M70 125 L110 100" stroke="#ffffff" stroke-width="5" opacity=".7"/>`,
    'monstera-plant': `<ellipse cx="90" cy="198" rx="26" ry="10" fill="#5c4a3b" opacity=".2"/><path d="M68 160 L74 198 Q90 208 106 198 L112 160 Z" fill="#f8fafc" stroke="#4a2d5a" stroke-width="1.8"/><circle cx="82" cy="175" r="1.5" fill="#f43f5e"/><circle cx="98" cy="182" r="1.5" fill="#3b82f6"/><circle cx="88" cy="192" r="1.5" fill="#fbbf24"/><ellipse cx="90" cy="160" rx="22" ry="7" fill="#78350f"/><path d="M90 160 Q80 120 60 100" stroke="#166534" stroke-width="3" fill="none"/><path d="M90 160 Q100 115 120 95" stroke="#166534" stroke-width="3" fill="none"/><path d="M90 160 V75" stroke="#166534" stroke-width="3.5" fill="none"/><path d="M60 100 C40 70 30 110 60 125 C75 115 80 90 60 100 Z" fill="#22c55e" stroke="#4a2d5a" stroke-width="1.5"/><path d="M120 95 C140 65 150 105 120 120 C105 110 100 85 120 95 Z" fill="#15803d" stroke="#4a2d5a" stroke-width="1.5"/><path d="M90 75 C65 40 115 40 90 75 Z" fill="#4ade80" stroke="#4a2d5a" stroke-width="1.5"/>`,
    'vinyl-player': `<defs><linearGradient id="playerPinkTop" x1="0" x2="1"><stop stop-color="#fff4f9"/><stop offset=".55" stop-color="#fde8f4"/><stop offset="1" stop-color="#f4b8da"/></linearGradient></defs><ellipse cx="90" cy="190" rx="43" ry="9" fill="#3a1a48" opacity=".14"/><path d="M44 153L90 130L137 153L90 178Z" fill="url(#playerPinkTop)" stroke="#3a1a48" stroke-width="2.5"/><path d="M44 153V181L90 204V178Z" fill="#d4429a" stroke="#3a1a48" stroke-width="2.5"/><path d="M90 178V204L137 181V153Z" fill="#b83588" stroke="#3a1a48" stroke-width="2.5"/><path d="M52 164V177L84 193V180Z" fill="#f07898" stroke="#7d2d68" stroke-width="1.2"/><path d="M58 168L77 178M58 174L77 184" stroke="#ffeef4" stroke-width="1.5"/><ellipse cx="83" cy="151" rx="23" ry="11.5" fill="#3a1a48" stroke="#fff8fc" stroke-width="1.5"/><ellipse cx="83" cy="151" rx="12" ry="6" fill="#5a3870"/><circle cx="83" cy="151" r="5" fill="#d4429a"/><circle cx="83" cy="151" r="1.4" fill="#fff"/><circle cx="118" cy="145" r="3.5" fill="#f0b840" stroke="#5a3870" stroke-width="1.2"/><path d="M118 145Q112 146 108 154" fill="none" stroke="#fff8e0" stroke-width="3.5" stroke-linecap="round"/><path d="M118 145Q112 146 108 154" fill="none" stroke="#9070a8" stroke-width="1.2" stroke-linecap="round"/><circle cx="127" cy="157" r="2.5" fill="#fff" stroke="#5a3870" stroke-width="1"/>`,
    'boutique-window': `<defs><linearGradient id="decorWindowGlass" x2="0" y2="1"><stop stop-color="#bde7f8"/><stop offset="1" stop-color="#d9e5fb"/></linearGradient></defs><path d="M39 181V76Q39 26 90 26Q141 26 141 76V181Z" fill="#f8b4d8" stroke="#fff2e3" stroke-width="9"/><path d="M47 175V77Q47 35 90 35Q133 35 133 77V175Z" fill="url(#decorWindowGlass)" stroke="#4a2d5a" stroke-width="2.5"/><path d="M90 35V176M47 98H133" stroke="#fff5e7" stroke-width="5"/><path d="M53 76L81 53M98 166L127 138" stroke="#fff" opacity=".58" stroke-width="10"/><path d="M27 191H153" stroke="#d090c0" stroke-width="9" stroke-linecap="round"/>`,
    'blush-blinds': `<defs><linearGradient id="blindGlow" x2="0" y2="1"><stop stop-color="#fffaf3"/><stop offset="1" stop-color="#f7dce8"/></linearGradient><filter id="blindShadow" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="2" dy="4" stdDeviation="2" flood-color="#70365f" flood-opacity=".18"/></filter></defs><g filter="url(#blindShadow)"><rect x="29" y="37" width="122" height="24" rx="8" fill="#f3a8ca" stroke="#4a2d5a" stroke-width="2.5"/><rect x="36" y="43" width="108" height="8" rx="4" fill="#ffe9f2"/><path d="M35 60V172H145V60Z" fill="url(#blindGlow)" stroke="#4a2d5a" stroke-width="2"/>${Array.from({ length: 9 }, (_, index) => { const y = 66 + index * 11; return `<path d="M37 ${y}Q90 ${y + 7} 143 ${y}V${y + 7}Q90 ${y + 14} 37 ${y + 7}Z" fill="${index % 2 ? '#f0b5cf' : '#f8cadd'}" stroke="#b96d98" stroke-width="1"/><path d="M42 ${y + 2}Q90 ${y + 7} 138 ${y + 2}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".72"/>`; }).join('')}<path d="M42 61V166M138 61V166" stroke="#d58bae" stroke-width="1.4"/><path d="M148 54V157" stroke="#4a2d5a" stroke-width="2"/><path d="M148 54V157" stroke="#ffd4e7" stroke-width="1"/><path d="M148 157Q141 165 148 172Q155 165 148 157Z" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1.3"/><path d="M31 176H149" stroke="#d090c0" stroke-width="6" stroke-linecap="round"/></g>`,
    'shop-sign': `<defs><style>@font-face{font-family:'Boutique Cherry';src:url('${shopSignFont}') format('truetype');font-style:normal;font-weight:400;font-display:block}</style><filter id="shopNameShadow" x="-30%" y="-40%" width="160%" height="190%"><feDropShadow dx="1.5" dy="3" stdDeviation="1.8" flood-color="#7b3865" flood-opacity=".24"/></filter></defs><g filter="url(#shopNameShadow)"><path d="M45 ${signDecorY}C62 ${signDecorY + 5} 74 ${signDecorY + 5} 86 ${signDecorY}C98 ${signDecorY - 5} 113 ${signDecorY - 5} 132 ${signDecorY}M132 ${signDecorY}q8 4 12-3" fill="none" stroke="#fff9fc" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M45 ${signDecorY}C62 ${signDecorY + 5} 74 ${signDecorY + 5} 86 ${signDecorY}C98 ${signDecorY - 5} 113 ${signDecorY - 5} 132 ${signDecorY}M132 ${signDecorY}q8 4 12-3" fill="none" stroke="#d48a31" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 88v13M24.5 94.5h13M27 90.5l8 8M35 90.5l-8 8" stroke="#fff9fc" stroke-width="4.5" stroke-linecap="round"/><path d="M31 88v13M24.5 94.5h13M27 90.5l8 8M35 90.5l-8 8" stroke="#e6a83b" stroke-width="1.4" stroke-linecap="round"/><path d="M149 108v10M144 113h10" stroke="#fff9fc" stroke-width="4" stroke-linecap="round"/><path d="M149 108v10M144 113h10" stroke="#e6a83b" stroke-width="1.3" stroke-linecap="round"/><path d="M145 78C140 71 130 75 133 82C136 88 145 92 145 92C145 92 154 88 157 82C160 75 150 71 145 78Z" fill="#ef79b1" stroke="#fff9fc" stroke-width="4.5" paint-order="stroke fill" opacity="1"/><text x="90" text-anchor="middle" dominant-baseline="middle" font-family="'Boutique Cherry','Arial Rounded MT Bold',sans-serif" font-size="${signFontSize}" font-style="normal" font-weight="400" letter-spacing="-.35" fill="#873568" stroke="#fff9fc" stroke-width="4.5" stroke-linejoin="round" paint-order="stroke fill">${signText}</text></g>`,
    'fashion-print': `<rect x="9" y="63" width="49" height="103" rx="5" fill="#efb1cf" stroke="#4a2d5a" stroke-width="2.5"/><rect x="14" y="68" width="39" height="93" fill="#fff9fc"/><circle cx="34" cy="91" r="10" fill="#ffd4c1" stroke="#4a2d5a" stroke-width="1.3"/><path d="M24 91Q23 75 34 76Q47 76 45 94Q39 86 26 86Z" fill="#8159c6" stroke="#4a2d5a" stroke-width="1.4"/><path d="M20 148Q23 108 34 105Q46 109 49 148Z" fill="#ef85b9" stroke="#4a2d5a" stroke-width="1.4"/><path d="M27 108L34 118L41 108" fill="#fff" stroke="#4a2d5a" stroke-width="1"/><rect x="65" y="47" width="51" height="122" rx="5" fill="#ffd76f" stroke="#4a2d5a" stroke-width="2.5"/><rect x="70" y="52" width="41" height="112" fill="#fff7fb"/><path d="M77 145Q80 103 86 89L82 77Q91 69 100 77L96 89Q103 105 107 145Q91 155 77 145Z" fill="#f08abb" stroke="#4a2d5a" stroke-width="1.5"/><path d="M84 78Q91 86 98 78M81 128Q91 134 103 128" fill="none" stroke="#fff" stroke-width="2"/><circle cx="91" cy="65" r="3" fill="#e9a7c7"/><rect x="123" y="67" width="48" height="99" rx="5" fill="#9eccea" stroke="#4a2d5a" stroke-width="2.5"/><rect x="128" y="72" width="38" height="89" fill="#fffdf9"/><path d="M132 132Q141 130 146 111L153 114L155 128Q164 131 165 140Q149 146 132 140Z" fill="#f29ac3" stroke="#4a2d5a" stroke-width="1.4"/><path d="M136 135H157M147 115L154 119" stroke="#fff" stroke-width="1.5"/><path d="M135 87H159M138 95H156" stroke="#b9afc2" stroke-width="1.3" stroke-linecap="round"/>`,
    'runway-print': `<rect x="39" y="43" width="102" height="145" rx="5" fill="#d7b6f2" stroke="#4a2d5a" stroke-width="3"/><rect x="47" y="51" width="86" height="129" fill="#fff8fd"/><path d="M66 158Q72 113 81 94L76 79Q90 69 104 79L99 94Q109 116 116 158Q90 174 66 158Z" fill="#ef8fbd" stroke="#4a2d5a" stroke-width="2"/><path d="M80 80Q90 91 100 80M73 128Q90 138 109 128" fill="none" stroke="#fff2f8" stroke-width="3"/><path d="M62 65H118M69 171H111" stroke="#e3bdd7" stroke-width="2" stroke-linecap="round"/><circle cx="90" cy="63" r="4" fill="#ffd76f"/>`,
    'parfum-print': `<rect x="40" y="48" width="100" height="137" rx="5" fill="#f2b7cd" stroke="#4a2d5a" stroke-width="3"/><rect x="48" y="56" width="84" height="121" fill="#fff8ef"/><path d="M74 105Q74 94 84 91H96Q106 94 106 105V148Q106 157 97 157H83Q74 157 74 148Z" fill="#f4a6c7" stroke="#4a2d5a" stroke-width="2"/><rect x="83" y="78" width="14" height="14" rx="2" fill="#ffd76f" stroke="#4a2d5a" stroke-width="1.5"/><path d="M79 117H101M81 139Q90 146 99 139" stroke="#fff7fb" stroke-width="2"/><path d="M61 70H119M61 166H119" stroke="#dca5bc" stroke-width="2" stroke-linecap="round"/><circle cx="116" cy="81" r="6" fill="#d8b7ef"/>`,
    'shoe-sketch-print': `<rect x="41" y="45" width="98" height="141" rx="5" fill="#98c9e8" stroke="#4a2d5a" stroke-width="3"/><rect x="49" y="53" width="82" height="125" fill="#fffdf8"/><path d="M63 132Q78 128 87 99L99 103L101 126Q116 130 118 143Q91 151 62 143Z" fill="#f39ac4" stroke="#4a2d5a" stroke-width="2.2"/><path d="M70 135H103M89 104L98 109M86 113L99 117" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M63 70H116M70 82H106M66 164H114" stroke="#b9afc2" stroke-width="2" stroke-linecap="round"/>`,
    'gallery-print': `<rect x="40" y="51" width="100" height="133" rx="5" fill="#ffd76f" stroke="#4a2d5a" stroke-width="3"/><rect x="48" y="59" width="84" height="117" fill="#fff7fb"/><path d="M90 82C78 66 58 69 64 84C70 96 82 89 90 87C98 89 110 96 116 84C122 69 102 66 90 82Z" fill="#ed77b2" stroke="#4a2d5a" stroke-width="1.8"/><circle cx="90" cy="83" r="6" fill="#ffd76f" stroke="#4a2d5a"/><text x="90" y="124" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-weight="700" fill="#6e2c59">LOVELY</text><path d="M63 139H117M72 148H108" stroke="#e79ac0" stroke-width="2" stroke-linecap="round"/>`,
    'botanical-print': `<rect x="42" y="47" width="96" height="138" rx="4" fill="#eaa6c7" stroke="#4a2d5a" stroke-width="3"/><rect x="50" y="55" width="80" height="122" fill="#fff8ed"/><path d="M90 158V77M90 112L66 94M90 132L116 105" stroke="#5b987c" stroke-width="3"/><ellipse cx="66" cy="91" rx="11" ry="19" transform="rotate(-45 66 91)" fill="#9bd2b4" stroke="#4a2d5a" stroke-width="1.4"/><ellipse cx="116" cy="103" rx="11" ry="19" transform="rotate(42 116 103)" fill="#79bea2" stroke="#4a2d5a" stroke-width="1.4"/><circle cx="90" cy="76" r="13" fill="#f08dbd" stroke="#4a2d5a" stroke-width="1.5"/><circle cx="90" cy="76" r="5" fill="#ffd76f"/>`,
    'ribbon-sign': `<path d="M35 69Q35 55 49 55H131Q145 55 145 69V118Q145 132 131 132H49Q35 132 35 118Z" fill="#fff7fb" stroke="#4a2d5a" stroke-width="3"/><path d="M42 75Q42 63 53 63H127Q138 63 138 75V112Q138 124 127 124H53Q42 124 42 112Z" fill="#f7b4d5"/><text x="90" y="102" text-anchor="middle" font-family="Georgia,serif" font-size="15" font-weight="700" fill="#692653">WELCOME</text><path d="M90 58C78 40 55 43 62 58C70 69 82 62 90 60C98 62 110 69 118 58C125 43 102 40 90 58Z" fill="#f05ca8" stroke="#4a2d5a" stroke-width="2"/>`,
    'neon-sign': `<rect x="40" y="70" width="100" height="45" rx="10" fill="#18181b" stroke="#3f3f46" stroke-width="2"/><text x="90" y="98" text-anchor="middle" font-family="'Nunito',sans-serif" font-weight="900" font-size="16" fill="#f43f5e">FASHION</text><path d="M50 106 H130" stroke="#38bdf8" stroke-width="2"/>`,
    'lightbox-sign': `<rect x="29" y="61" width="122" height="70" rx="12" fill="#33204d" stroke="#4a2d5a" stroke-width="3"/><rect x="36" y="68" width="108" height="56" rx="8" fill="#8e6de6" stroke="#f5d0fe" stroke-width="2"/><text x="90" y="91" text-anchor="middle" font-family="'Nunito',sans-serif" font-size="12" font-weight="900" fill="#fff">FASHION</text><text x="90" y="110" text-anchor="middle" font-family="'Nunito',sans-serif" font-size="10" font-weight="800" fill="#ffd9ef">CLUB</text><path d="M44 116H136" stroke="#7dd3fc" stroke-width="2"/>`,
    'perfume-table': `<ellipse cx="90" cy="205" rx="30" ry="11" fill="#475569" opacity=".2"/><path d="M90 170 V205" stroke="#ffd566" stroke-width="6"/><ellipse cx="90" cy="165" rx="42" ry="18" fill="#f8fafc" stroke="#4a2d5a" stroke-width="2"/><path d="M60 162 Q75 168 95 160 M80 166 Q100 170 120 164" stroke="#cbd5e1" stroke-width="1.2" fill="none"/><rect x="72" y="145" width="10" height="14" rx="2" fill="#f472b6" stroke="#4a2d5a" stroke-width="1"/><rect x="75" y="141" width="4" height="4" fill="#fbbf24"/><rect x="88" y="142" width="12" height="18" rx="2" fill="#38bdf8" stroke="#4a2d5a" stroke-width="1"/><circle cx="94" cy="139" r="2.5" fill="#ffd566"/><rect x="105" y="148" width="8" height="12" rx="1.5" fill="#fef08a" stroke="#4a2d5a" stroke-width="1"/><path d="M109 148 V144 Q109 141 110 143" stroke="#f97316" stroke-width="1.5"/>`,
    'coffee-corner': `<path d="M35 150 L85 125 L145 155 L95 180 Z" fill="#d97706" stroke="#4a2d5a" stroke-width="2"/><path d="M35 150 V185 L95 210 V180 Z" fill="#b45309" stroke="#4a2d5a" stroke-width="2"/><path d="M95 180 V210 L145 185 V155 Z" fill="#92400e" stroke="#4a2d5a" stroke-width="2"/><rect x="55" y="125" width="22" height="25" rx="3" fill="#64748b" stroke="#4a2d5a" stroke-width="1.5"/><rect x="60" y="130" width="12" height="8" rx="1" fill="#1e293b"/><circle cx="66" cy="144" r="2.5" fill="#f43f5e"/><rect x="105" y="144" width="7" height="11" rx="1" fill="#ffffff" stroke="#4a2d5a" stroke-width="1"/><rect x="105" y="147" width="7" height="4" fill="#b45309"/><rect x="116" y="146" width="7" height="10" rx="1" fill="#fbcfe8" stroke="#4a2d5a" stroke-width="1"/>`,
    'glass-showcase': `<path d="M60 185 L90 170 L120 185 L90 200 Z" fill="#ffd566" stroke="#4a2d5a" stroke-width="2"/><path d="M60 185 V75 L90 60 L120 75 V185 L90 200 Z" fill="#e0f2fe" opacity=".45" stroke="#38bdf8" stroke-width="1.8"/><path d="M63 155 L90 142 L117 155 L90 167 Z" fill="#bae6fd" opacity=".6"/><path d="M63 115 L90 102 L117 115 L90 127 Z" fill="#bae6fd" opacity=".6"/><path d="M60 75 V185 M120 75 V185 M90 60 V170" stroke="#ffd566" stroke-width="2"/>${demoBag(90, 92, '#ff9fc5')}${demoBag(90, 132, '#a9d9f6')}`,
    'crystal-chandelier': `<ellipse cx="90" cy="25" rx="10" ry="4" fill="#ffd566"/><path d="M90 25 V45" stroke="#ffd566" stroke-width="3"/><ellipse cx="90" cy="50" rx="35" ry="12" fill="none" stroke="#ffd566" stroke-width="2.5"/><ellipse cx="90" cy="65" rx="24" ry="8" fill="none" stroke="#ffd566" stroke-width="2"/>${[58, 68, 79, 90, 101, 112, 122].map(x => `<circle cx="${x}" cy="54" r="2.5" fill="#fef08a"/><path d="M${x} 56 V68" stroke="#ffffff" stroke-width="1.2"/><polygon points="${x-2},68 ${x+2},68 ${x},74" fill="#e0f2fe"/>`).join('')}<circle cx="90" cy="80" r="5" fill="#ffffff" stroke="#ffd566" stroke-width="1"/>`,
  };
  const detail = art === 'mirror' ? '<g transform="translate(86 26) scale(.7)">' + heartShape() + '</g>' : art === 'counter' ? '<g transform="translate(51 164) scale(.65)">' + heartShape() + '</g>' : '';
  const rawShape = shapes[art] ?? shapes.plant;
  const resolvedShape = rawShape;
  // Chiếu lên mặt tường isometric: trục X đi theo cạnh tường, trục Y giữ thẳng đứng
  // để chiều cao chữ luôn song song với trục Oz của căn phòng.
  const wallTransform = wallSide === 'left'
    ? 'matrix(.9,-.45,0,1,9,46)'
    : 'matrix(.9,.45,0,1,9,-35)';
  const wallShape = art === 'shop-sign' ? `<g transform="translate(-12 0)">${resolvedShape}</g>` : resolvedShape;
  const painted = isWallArtAsset(art) ? `<g transform="${wallTransform}">${wallShape}</g>` : resolvedShape;
  const hasFloorShadow = !['atelier-rug', 'heart-rug', 'checkered-rug'].includes(art) && !isWallArtAsset(art);
  return wrap((hasFloorShadow ? shadow : '') + cel(decorPaint(painted), 1.8) + detail, 180, 230);
}

const ROOM_FLOOR_EDGE_MARGIN = 0.35;

export function roomSvgBounds(floorSize = 7) {
  const size = Math.max(7, Math.min(14, Math.floor(floorSize)));
  const span = 56 * (size + ROOM_FLOOR_EDGE_MARGIN);
  const bottomY = 225 + 56 * (size + ROOM_FLOOR_EDGE_MARGIN);
  const minX = Math.min(0, 500 - span - 55);
  const maxX = Math.max(1000, 500 + span + 55);
  return { size, x: minX, width: maxX - minX, height: Math.max(760, bottomY + 85) };
}

export function roomSvg(floorSize = 7, showDefaultCeilingLamp = true) {
  const bounds = roomSvgBounds(floorSize);
  const size = bounds.size;
  const gridSpan = 56 * size;
  const gridHalfSpan = 28 * size;
  const span = 56 * (size + ROOM_FLOOR_EDGE_MARGIN);
  const halfSpan = 28 * (size + ROOM_FLOOR_EDGE_MARGIN);
  const leftX = 500 - span;
  const rightX = 500 + span;
  const sideY = 225 + halfSpan;
  const bottomY = 225 + halfSpan * 2;
  const gridLeftX = 500 - gridSpan;
  const gridRightX = 500 + gridSpan;
  const gridSideY = 225 + gridHalfSpan;
  const expansion = size - 7;
  const leftPlantX = leftX - 30;
  const rightPlantX = rightX + 35;
  const leftPlantY = sideY + 4;
  const rightPlantY = sideY + 3;
  let lines = '';
  for (let i = 0; i <= size * 2; i++) {
    const t = i / (size * 2);
    lines += `<path d="M${500 + gridSpan * t} ${225 + gridHalfSpan * t}L${gridLeftX + gridSpan * t} ${gridSideY + gridHalfSpan * t}M${500 - gridSpan * t} ${225 + gridHalfSpan * t}L${gridRightX - gridSpan * t} ${gridSideY + gridHalfSpan * t}"/>`;
  }
  const room = `<defs>
    <linearGradient id="wall" x2="0" y2="1"><stop stop-color="#f7e9dc"/><stop offset="1" stop-color="#efdfcd"/></linearGradient>
    <linearGradient id="window" x2="0" y2="1"><stop stop-color="#c9dcd6"/><stop offset="1" stop-color="#e8ecda"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#fff8dc" stop-opacity=".8"/><stop offset="1" stop-color="#fff8dc" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="502" cy="${bottomY - 97}" rx="${span + 18}" ry="119" fill="#899881" opacity=".10"/>
  <path d="M${leftX} ${sideY}L500 225L${rightX} ${sideY}V${sideY + 21}L500 ${bottomY + 23}L${leftX} ${sideY + 21}Z" fill="#c9b39a"/>
  <path d="M${leftX} ${sideY}L500 225L${rightX} ${sideY}L500 ${bottomY}Z" fill="#f2e6d2" stroke="#d7c2a7" stroke-width="2"/>
  <g stroke="#dbc9ad" stroke-width="1" opacity=".5">${lines}</g>
  <path d="M${leftX} ${sideY}V${sideY - 190}L500 35V225Z" fill="#eddbd3" stroke="#e0c9bc" stroke-width="2"/>
  <path d="M500 35L${rightX} ${sideY - 190}V${sideY}L500 225Z" fill="url(#wall)" stroke="#e2d0ba" stroke-width="2"/>
  <path d="M${leftX} ${sideY - 6}L500 219L${rightX - 1} ${sideY - 6}" fill="none" stroke="#d9c2a8" stroke-width="9"/>
  <path d="M${leftX} ${sideY - 187}L500 38L${rightX} ${sideY - 187}" fill="none" stroke="#f9f0e3" stroke-width="9"/>
  <g display="none" transform="matrix(.9,.45,0,1,576,126)">
    <!-- Golden wall brackets & suspension chains -->
    <g id="sign-hangers">
      <circle cx="48" cy="-23" r="5" fill="#eab308" stroke="#fef08a" stroke-width="1.5"/>
      <circle cx="48" cy="-23" r="2.5" fill="#b45309"/>
      <circle cx="162" cy="-23" r="5" fill="#eab308" stroke="#fef08a" stroke-width="1.5"/>
      <circle cx="162" cy="-23" r="2.5" fill="#b45309"/>
      <path d="M48 -18 C49 -11, 52 -7, 56 -4" fill="none" stroke="#b45309" stroke-width="2.5" stroke-dasharray="2,2"/>
      <path d="M48 -18 C49 -11, 52 -7, 56 -4" fill="none" stroke="#fde047" stroke-width="1.2" stroke-dasharray="2,2"/>
      <path d="M162 -18 C161 -11, 158 -7, 154 -4" fill="none" stroke="#b45309" stroke-width="2.5" stroke-dasharray="2,2"/>
      <path d="M162 -18 C161 -11, 158 -7, 154 -4" fill="none" stroke="#fde047" stroke-width="1.2" stroke-dasharray="2,2"/>
      <circle cx="56" cy="-4" r="3.5" fill="none" stroke="#b45309" stroke-width="2"/>
      <circle cx="154" cy="-4" r="3.5" fill="none" stroke="#b45309" stroke-width="2"/>
    </g>
    <!-- Soft wall drop shadow -->
    <rect x="11" y="-1" width="188" height="58" rx="14" fill="#6d284f" opacity="0.14"/>
    <!-- Outer ornate plaque frame -->
    <rect x="8" y="-4" width="194" height="58" rx="14" fill="#fff5fa" stroke="#e0a0cb" stroke-width="3"/>
    <!-- Gilded filigree border & corner rivets -->
    <rect x="11" y="-1" width="188" height="52" rx="11" fill="none" stroke="#fbbf24" stroke-width="1.8"/>
    <circle cx="18" cy="6" r="2.2" fill="#d97706"/><circle cx="18" cy="6" r="1.2" fill="#fffbeb"/>
    <circle cx="192" cy="6" r="2.2" fill="#d97706"/><circle cx="192" cy="6" r="1.2" fill="#fffbeb"/>
    <circle cx="18" cy="44" r="2.2" fill="#d97706"/><circle cx="18" cy="44" r="1.2" fill="#fffbeb"/>
    <circle cx="192" cy="44" r="2.2" fill="#d97706"/><circle cx="192" cy="44" r="1.2" fill="#fffbeb"/>
    <!-- Inner pure porcelain plaque -->
    <rect x="15" y="3" width="180" height="44" rx="8" fill="#ffffff" stroke="#fce7f3" stroke-width="1.2"/>
    <rect x="18" y="6" width="174" height="38" rx="6" fill="none" stroke="#f472b6" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.6"/>
    <!-- Decorative side rosettes -->
    <circle cx="27" cy="25" r="3.5" fill="#f472b6"/><circle cx="27" cy="25" r="1.8" fill="#fef08a"/>
    <circle cx="183" cy="25" r="3.5" fill="#f472b6"/><circle cx="183" cy="25" r="1.8" fill="#fef08a"/>
    <!-- Top Coquette Ribbon Bow with Jeweled Heart -->
    <g id="sign-ribbon">
      <!-- Left bow loop -->
      <path d="M105 -5 C95 -18, 70 -19, 74 -6 C77 3, 98 -2, 105 -3 Z" fill="#ff6b9d" stroke="#be185d" stroke-width="1.8"/>
      <path d="M102 -5 C94 -14, 77 -15, 79 -6 C81 0, 96 -3, 102 -4 Z" fill="#fecdd3"/>
      <!-- Right bow loop -->
      <path d="M105 -5 C115 -18, 140 -19, 136 -6 C133 3, 112 -2, 105 -3 Z" fill="#ff6b9d" stroke="#be185d" stroke-width="1.8"/>
      <path d="M108 -5 C116 -14, 133 -15, 131 -6 C129 0, 114 -3, 108 -4 Z" fill="#fecdd3"/>
      <!-- Flowing ribbon tails -->
      <path d="M101 -2 C95 8, 86 14, 80 18 C84 15, 90 14, 95 15 C97 10, 100 4, 102 -2 Z" fill="#ff6b9d" stroke="#be185d" stroke-width="1.2"/>
      <path d="M109 -2 C115 8, 124 14, 130 18 C126 15, 120 14, 115 15 C113 10, 110 4, 108 -2 Z" fill="#ff6b9d" stroke="#be185d" stroke-width="1.2"/>
      <!-- Center Knot -->
      <circle cx="105" cy="-3.5" r="5" fill="#f43f5e" stroke="#9f1239" stroke-width="1.5"/>
      <!-- Gold Jewel Heart Brooch -->
      <path d="M105 -5 C103 -7.2, 101 -6.8, 101 -5 C101 -3.8, 103.5 -2, 105 -0.5 C106.5 -2, 109 -3.8, 109 -5 C109 -6.8, 107 -7.2, 105 -5 Z" fill="#fde047" stroke="#b45309" stroke-width="0.8"/>
      <circle cx="103.8" cy="-5" r="0.7" fill="#ffffff"/>
    </g>
    <!-- Bottom Gilded Pearl Pendants -->
    <g id="sign-pendants">
      <path d="M105 54 V58" stroke="#d97706" stroke-width="1.5"/>
      <ellipse cx="105" cy="62" rx="3.5" ry="4.5" fill="#fef08a" stroke="#d97706" stroke-width="1.2"/>
      <circle cx="104" cy="60.5" r="1.2" fill="#ffffff"/>
      <path d="M72 54 V57" stroke="#d97706" stroke-width="1.2"/>
      <ellipse cx="72" cy="60" rx="2.5" ry="3.5" fill="#fef08a" stroke="#d97706" stroke-width="1"/>
      <circle cx="71.2" cy="59" r="0.8" fill="#ffffff"/>
      <path d="M138 54 V57" stroke="#d97706" stroke-width="1.2"/>
      <ellipse cx="138" cy="60" rx="2.5" ry="3.5" fill="#fef08a" stroke="#d97706" stroke-width="1"/>
      <circle cx="137.2" cy="59" r="0.8" fill="#ffffff"/>
    </g>
    <rect x="13" y="70" width="48" height="59" rx="2" fill="#fff4e2" stroke="#bb9772" stroke-width="4"/>
    <path d="M24 115Q30 83 50 85Q33 100 50 117Z" fill="#b0b497"/><path d="M31 114L44 91" stroke="#71866f" stroke-width="2"/>
    <rect x="82" y="75" width="60" height="50" rx="2" fill="#e6bcb1" stroke="#fff6e3" stroke-width="4"/>
    <text x="112" y="95" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#7e5b51">you look</text><text x="112" y="112" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="15" fill="#7e5b51">lovely.</text>
    <rect x="162" y="70" width="42" height="58" fill="#ede0c2" stroke="#bb9772" stroke-width="4"/><circle cx="183" cy="97" r="12" fill="#d5a075"/>
  </g>
  ${showDefaultCeilingLamp ? `<path d="M500 37V54" stroke="#b29b77" stroke-width="2"/>
  <path d="M470 72Q500 40 530 72Q500 84 470 72Z" fill="#d5ba89"/>
  <ellipse cx="500" cy="73" rx="27" ry="8" fill="#fff0c4"/>` : ''}
  <g id="welcome-mat" transform="translate(0 ${expansion * 56})">
    <path d="M422 553L482 583L506 567L446 537Z" fill="#8850a8" opacity=".12"/>
    <path d="M421 551L445 535L505 565L481 581Z" fill="#fff5fa" stroke="#c890b0" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M426 552L447 538L499 564L478 578Z" fill="#fca5c6" stroke="#f088b2" stroke-width="1.2"/>
    <path d="M428 553L448 540L497 564L477 577Z" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="3,2" opacity=".85"/>
    <text transform="matrix(.85,.425,-.7,.35,462,560)" text-anchor="middle" x="0" y="0" font-family="'Nunito',Arial,sans-serif" font-weight="900" font-size="11" letter-spacing="3" fill="#6d3060" stroke="none">HELLO</text>
  </g>
  <g fill="#a2b093" opacity=".4"><ellipse cx="${leftPlantX - 4}" cy="${leftPlantY + 47}" rx="26" ry="8"/><ellipse cx="${rightPlantX - 10}" cy="${rightPlantY + 35}" rx="25" ry="8"/></g>
  <path d="M${leftPlantX + 21} ${leftPlantY + 15}L${leftPlantX} ${leftPlantY}L${leftPlantX + 10} ${leftPlantY + 34}M${rightPlantX - 24} ${rightPlantY + 11}L${rightPlantX} ${rightPlantY - 8}L${rightPlantX - 11} ${rightPlantY + 33}" fill="none" stroke="#acb69e" stroke-width="3"/>
  <g fill="#adba9d"><ellipse cx="${leftPlantX}" cy="${leftPlantY}" rx="7" ry="16" transform="rotate(-35 ${leftPlantX} ${leftPlantY})"/><ellipse cx="${leftPlantX + 10}" cy="${leftPlantY + 17}" rx="7" ry="16" transform="rotate(35 ${leftPlantX + 10} ${leftPlantY + 17})"/><ellipse cx="${rightPlantX}" cy="${rightPlantY}" rx="7" ry="17" transform="rotate(35 ${rightPlantX} ${rightPlantY})"/></g>
  `;
    // Candy anime boutique colour remapping
  const colors: Record<string, string> = {
    '#eddbd3': '#ffd8ec', '#f2e6d2': '#fff4f6', '#c9b39a': '#e8b4d0',
    '#e0c9bc': '#c8a0c0', '#e2d0ba': '#dbaece', '#d9c2a8': '#f0b8d8',
    '#f9f0e3': '#fff8fd', '#d8d9bf': '#f8c8e4', '#81685b': '#a0448a',
    '#d1b498': '#f8b4d8', '#ba9a7c': '#d090c0', '#b29b77': '#c884b4',
    '#d5ba89': '#ffd898', '#c2a888': '#e0b0cc', '#a2b093': '#b8d8e8',
    '#d7c2a7': '#d4a8cc', '#dbc9ad': '#ecc0d8', '#b0b497': '#b4d8e0',
    '#e6bcb1': '#d8b8f0',
  };
  const flat = room.replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/url\(#wall\)/g, '#ffe9ed').replace(/url\(#window\)/g, '#c8e6f5').replace(/url\(#glow\)/g, '#fff0c8').replace(/#[0-9a-f]{6}/gi, hex => colors[hex] ?? hex);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} 0 ${bounds.width} ${bounds.height}">${cel(flat, 1.4)}</svg>`;
}
