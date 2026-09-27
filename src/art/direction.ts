/**
 * ART DIRECTION — Cute Retro Anime × Premium Fashion
 * Master palette, cel-shading engine and shape helpers.
 * Every visual asset in the boutique inherits from this file.
 */

/** Master ink + candy paint palette (pink, lavender, cream, peach, sky-blue) */
export const paint = {
  ink:    '#4a2d5a',   // Deep plum outline — bold, rounded, feminine
  pink:   '#f490c0',   // Candy pink main accent
  blush:  '#ffd4ea',   // Soft blush highlight
  lilac:  '#c4a8f0',   // Lavender secondary
  blue:   '#9fcff5',   // Soft sky-blue accent
  mint:   '#a8e0cc',   // Pastel mint
  gold:   '#ffda8a',   // Warm gold
  cream:  '#fff7ea',   // Warm cream base
  paper:  '#fff4f9',   // Pinkish paper background
  shadow: '#c278b8',   // Cel shadow — plum-rose
  peach:  '#ffcba8',   // Peach skin and warm accent
};

export function tint(hex: string, target: string, amount: number) {
  const rgb = (v: string) => v.replace('#', '').match(/../g)!.map(n => parseInt(n, 16));
  return '#' + rgb(hex).map((n, i) => Math.round(n + (rgb(target)[i] - n) * amount).toString(16).padStart(2, '0')).join('');
}

/**
 * Cel-shading engine — clean anime look.
 * Bold rounded outline + warm cel shadow + bright highlight chip.
 * Use weight=1.4 for small accessories, 1.8 for large furniture.
 */
export function cel(body: string, weight = 1.7) {
  const shapes = body.replace(/<(path|rect|ellipse|circle|polygon)\b([^>]*?)\/>/g, (tag, kind, attrs: string) => {
    const fill = attrs.match(/\bfill="(#[\da-f]{6})"/i)?.[1];
    if (!fill || /\bopacity=/.test(attrs)) return tag;
    const geometry = attrs.replace(/\s(?:fill|stroke|stroke-width|stroke-opacity)="[^"]*"/g, '');
    const base  = `<${kind}${geometry} fill="${fill}" stroke="${paint.ink}" stroke-width="${weight}"/>`;
    const shade = `<${kind}${geometry} fill="${tint(fill, paint.shadow, .24)}" stroke="none" clip-path="url(#cel-shade)"/>`;
    const light = `<${kind}${geometry} fill="${tint(fill, '#ffffff', .52)}" stroke="none" clip-path="url(#cel-light)"/>`;
    return base + shade + light + `<${kind}${geometry} fill="none" stroke="${paint.ink}" stroke-width="${weight}"/>`;
  });
  return `<defs><clipPath id="cel-shade" clipPathUnits="objectBoundingBox"><path d="M.79 0Q.93 .54 .58 .77Q.3 .93 0 .8V1H1V0Z"/></clipPath><clipPath id="cel-light" clipPathUnits="objectBoundingBox"><path d="M.13 .14Q.37 .02 .69 .12L.65 .18Q.35 .11 .16 .22Z"/></clipPath></defs><g stroke="${paint.ink}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`;
}

export const artSvg = (body: string, width: number, height: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;

/** Heart shape — candy pink, anime-rounded */
export const heartShape = (fill = paint.pink) =>
  `<path d="M12 20C9 17 2 12 3 7C4 2 10 2 12 6C15 1 21 3 21 8C21 13 15 18 12 20Z" fill="${fill}" stroke="${paint.ink}" stroke-width="1.5" stroke-linejoin="round"/>`;

/**
 * Bow/ribbon shape for hair accessories and clothing trim.
 * Canonical retro-anime fashion motif.
 */
export function bowShape(fill = paint.pink, cx = 12, cy = 12, size = 1) {
  return `<g transform="translate(${cx - 10 * size} ${cy - 7 * size}) scale(${size})">
    <path d="M10 7Q0 0 0 5Q0 11 10 7Q20 2 20 6Q20 11 10 7L13 15L10 13L7 15Z" fill="${fill}" stroke="${paint.ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="10" cy="7" r="2.4" fill="${tint(fill, '#ffffff', .45)}" stroke="${paint.ink}" stroke-width="1"/>
  </g>`;
}

/**
 * Map raw product hex → candy anime palette.
 * Preserves semantic colour identity while upgrading to
 * brighter, more saturated retro-anime tones.
 */
export function fabricColor(hex: string) {
  const colors: Record<string, string> = {
    // Pinks & roses
    '#e6a6b8': '#f790c6', '#e6a4b2': '#f790c6', '#d889a0': '#ea6aab', '#ebc4b9': '#ffc1e0',
    // Creams & whites
    '#e9dfc7': '#fff5e0', '#ddd6bf': '#faeedd', '#f0e5cb': '#fff5e0', '#e7d9c4': '#fff0dc',
    // Plums & darks
    '#54525a': '#4d3a62', '#6c7279': '#5a4570',
    // Blues & lavenders
    '#93b7cf': '#97c8f5', '#8aa9bf': '#96c0f0', '#bfc7d2': '#c0d4f8',
    '#b8a4d2': '#c4a8f5', '#c2b4d6': '#caaef8', '#aba0c6': '#b89ef0',
    // Greens → mints
    '#a2b697': '#a0dcbc', '#8b9f8d': '#92cdb5',
    // Terracottas → peach
    '#ae836b': '#c89080', '#d7a286': '#e2a090',
    // Mauve & dusty rose
    '#ab6874': '#cf5c85', '#c69a9b': '#d97aab',
    // Golds & yellows
    '#dfcd91': '#ffe08e', '#d3b179': '#ecbf88',
    // Neutrals → warm lavender
    '#b4ab9d': '#c9b8d8',
  };
  return colors[hex.toLowerCase()] ?? hex;
}
