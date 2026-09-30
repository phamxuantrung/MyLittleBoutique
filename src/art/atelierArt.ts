const ink = '#795267';
const gold = '#f5bf4f';
const svg = (body: string) => `<svg class="atelier-material-art" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

/** Illustrated material swatches used throughout the personal atelier UI. */
export function atelierMaterialIllustration(id: string) {
  const art: Record<string, string> = {
    cotton: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="M22 55c-9-2-11-14-3-19-5-10 7-19 16-13 5-12 22-10 24 2 12-2 18 12 10 20 5 9-5 18-14 14Z" fill="#FFF9F2" stroke="${ink}" stroke-width="2"/><path d="M31 59c4-13 8-22 15-31M41 59c1-10 6-20 15-27" stroke="#D8C7BC" stroke-width="2"/><path d="M25 34c7-7 16-8 22-3" stroke="#FFF" stroke-width="4" opacity=".9"/>`,
    linen: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="M17 26 54 17l10 38-37 9Z" fill="#E5D0A9" stroke="${ink}" stroke-width="2"/><path d="m21 30 37-9M24 38l37-9M26 46l37-9M29 54l34-8M29 23l10 37M38 21l10 37M47 19l10 37" stroke="#B89E73" stroke-width="1" opacity=".72"/><path d="M19 25c12 2 24-2 34-7" stroke="#FFF5D8" stroke-width="3"/><path d="m61 17 6 8-6 2Z" fill="#F3A6C9" stroke="${ink}" stroke-width="1.2"/>`,
    denim: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="M18 20h43v43H18Z" fill="#7396CE" stroke="${ink}" stroke-width="2"/><path d="M18 33h43M31 20v43" stroke="#D2E3FF" stroke-width="2"/><path d="M35 38h20v18H35Z" fill="#88A9DC" stroke="#405D91" stroke-width="1.5"/><path d="m35 38 10 9 10-9M22 25h5M22 29h5" stroke="#EAF3FF" stroke-width="1.4"/><path d="M19 21h41" stroke="#BBD2F5" stroke-width="3"/>`,
    lace: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><circle cx="40" cy="39" r="24" fill="#F8DCEB" stroke="${ink}" stroke-width="2"/><path d="M40 18c4 8 8 8 16 4-4 8-2 12 6 16-9 2-10 6-6 15-8-5-12-3-16 5-4-8-8-10-16-5 4-9 3-13-6-15 8-4 10-8 6-16 8 4 12 4 16-4Z" fill="#FFF8FC" stroke="#C873A2" stroke-width="1.4"/><circle cx="40" cy="38" r="7" fill="#F1BAD5" stroke="#A85383" stroke-width="1.4"/><circle cx="40" cy="38" r="2" fill="#FFF"/>`,
    ribbon: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="M39 37C20 17 10 29 18 43c5 8 14 4 22-1 8 5 17 9 22 1 8-14-2-26-21-6Z" fill="#F19BC4" stroke="${ink}" stroke-width="2"/><path d="m35 43-10 22 14-8 3 9 5-23Z" fill="#DF75AB" stroke="${ink}" stroke-width="1.6"/><circle cx="40" cy="40" r="7" fill="#FFD98B" stroke="${ink}" stroke-width="1.6"/><path d="M20 34c6-5 12-3 17 3" stroke="#FFD9EA" stroke-width="3"/>`,
    wool: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><circle cx="36" cy="39" r="25" fill="#B69A8B" stroke="${ink}" stroke-width="2"/><path d="M18 37c8-15 25-22 39-10M17 47c12-15 29-20 44-7M23 57c12-12 25-15 37-7M25 22c18 7 29 20 31 37M16 33c18 5 32 17 39 32" stroke="#E7D5C9" stroke-width="3" stroke-linecap="round"/><path d="M56 55c9 1 13 5 13 10" stroke="#8E6D64" stroke-width="2"/>`,
    silk: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="M15 55c12-4 10-33 28-38 18-5 17 13 22 39-17 10-33 9-50-1Z" fill="#CFB6E4" stroke="${ink}" stroke-width="2"/><path d="M16 54c17-14 22-25 29-36M31 63c12-14 20-28 22-42" stroke="#F8EEFF" stroke-width="3" opacity=".9"/><path d="M49 20c6 8 9 20 12 35" stroke="#A98BC4" stroke-width="2"/><path d="m19 20 .9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3Z" fill="#FFD866"/>`,
    leather: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="M19 20c12 4 28-6 42 2l-4 41c-13-5-24 4-38-1Z" fill="#986C62" stroke="${ink}" stroke-width="2"/><path d="M25 27c9 2 19-3 29-1M24 55c10-2 18 1 27-1" stroke="#C99A8E" stroke-width="2"/><path d="M49 28c-5 8-5 17 1 24" stroke="#70483F" stroke-width="1.4"/><path d="M21 21c12 4 25-5 38 1" stroke="#E0B6A9" stroke-width="3"/><circle cx="28" cy="34" r="1.5" fill="#E6C0AE"/>`,
    crystal: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="m40 12 20 14 8 22-28 19-28-19 8-22Z" fill="#BDEBFA" stroke="${ink}" stroke-width="2"/><path d="m20 26 20 41 20-41M12 48h56M27 26l13-14 13 14-13 22Z" fill="#E9FAFF" fill-opacity=".36" stroke="#72BFD6" stroke-width="1.4"/><path d="m27 27 13 21 13-21" stroke="#FFF" stroke-width="2"/><path d="m67 14 .8 1.7 1.9.3-1.4 1.3.4 1.9-1.7-.9-1.7.9.3-1.9-1.4-1.3 2-.3Z" fill="#FFD65E"/>`,
    cashmere: `<ellipse cx="40" cy="68" rx="27" ry="5" fill="#75537B" opacity=".12"/><path d="M16 27c17-13 33-13 48 0v29c-16 10-32 10-48 0Z" fill="#F1E4D0" stroke="${ink}" stroke-width="2"/><path d="M16 27c16 9 32 9 48 0M17 38c15 9 31 9 46 0M17 49c15 9 31 9 46 0" stroke="#CDBDA8" stroke-width="1.5"/><path d="M23 23c12-7 24-7 35 0" stroke="#FFF9EE" stroke-width="4"/><path d="M23 58v7M29 60v7M51 60v7M57 58v7" stroke="#BBA892" stroke-width="1.4"/>`,
  };
  return svg(art[id] ?? art.cotton);
}


/** Legacy illustrations retained only so old saves can still be inspected while migrating. */
function legacyAtelierProductBody(art: string): string | undefined {
  const pieces: Record<string, string> = {
    'atelier-cloud-tee': `<path d="M39 30 25 37 14 59l15 8 8-14-1 44h48l-1-44 8 14 15-8-11-22-14-7c-12 10-30 10-42 0Z" fill="#F4A8CB" stroke="${ink}" stroke-width="2"/><path d="M43 30c8 8 26 8 34 0-5 16-29 16-34 0Z" fill="#FFF" stroke="${ink}" stroke-width="1.4"/><path d="M43 63c8-13 26-13 34 0-7 12-27 12-34 0Z" fill="#F9F7FF" stroke="#8B76B5" stroke-width="1.2"/><path d="M48 62c4-8 9-9 12-3 4-6 9-5 12 3-5 7-19 8-24 0Z" fill="#BCE8F4"/><path d="M36 88h48" stroke="#D65C9B" stroke-width="3"/>`,
    'atelier-linen-poet': `<path d="M40 25 22 36 12 73l16 6 10-28-2 49h48l-2-49 10 28 16-6-10-37-18-11c-11 9-29 9-40 0Z" fill="#E7D7BD" stroke="${ink}" stroke-width="2"/><path d="M39 25c1 14 14 19 21 9 7 10 20 5 21-9-13 8-29 8-42 0Z" fill="#FFF8ED" stroke="${ink}" stroke-width="1.4"/><path d="M25 38c-10 5-10 20 1 24M95 38c10 5 10 20-1 24" fill="#F4E6D1" stroke="#B99F7D" stroke-width="1.4"/><path d="M60 37v59M48 43l12 10 12-10" stroke="#B99077" stroke-width="1.2"/><circle cx="60" cy="62" r="2" fill="${gold}"/>`,
    'atelier-indigo-street': `<path d="M35 25h50l-4 38 10 61H66l-6-48-6 48H29l10-61Z" fill="#6F91C9" stroke="${ink}" stroke-width="2"/><path d="M38 25h44v12H38Z" fill="#AFC8EB" stroke="${ink}" stroke-width="1.4"/><path d="M60 37v39M39 51l17 8M81 51l-17 8" stroke="#D7E5FA" stroke-width="1.5"/><path d="M29 109c9 4 17 4 25 1M66 110c9 3 17 3 25-1" stroke="#395B93" stroke-width="3"/><path d="M44 29h10v5H44Z" fill="#F2B2D2" stroke="${ink}" stroke-width="1"/>`,
    'atelier-ribbon-dream': `<path d="M44 22 36 28l7 34-27 63c28 11 60 11 88 0L77 62l7-34-8-6-9 19H53Z" fill="#EFA4C9" stroke="${ink}" stroke-width="2"/><path d="M43 61c12 7 22 7 34 0l8 19c-17 8-33 8-50 0Z" fill="#FFF2F8" stroke="#B95689" stroke-width="1.2"/><path d="M23 109c24 10 50 10 74 0M30 92c20 9 40 9 60 0" stroke="#FFF" stroke-width="3"/><path d="M60 47c-13-14-23-4-13 6 5 5 10 2 13-1 3 3 8 6 13 1 10-10 0-20-13-6Z" fill="#F76FAA" stroke="${ink}" stroke-width="1.3"/><path d="m57 53-8 19 11-7 11 7-8-19Z" fill="#D95796"/>`,
    'atelier-denim-y2k': `<path d="M39 25h42l4 38H35Z" fill="#7F9ED4" stroke="${ink}" stroke-width="2"/><path d="M34 66h52l7 56H67l-7-39-7 39H27Z" fill="#6E8EC7" stroke="${ink}" stroke-width="2"/><path d="M46 25 60 44l14-19M35 54h50M60 66v17" stroke="#D7E7FF" stroke-width="1.5"/><path d="M43 73h12l-2 13H41ZM65 73h12l2 13H67Z" fill="#8EACE0" stroke="#456397" stroke-width="1"/><path d="M36 45c8-7 16-5 24 2 8-7 16-9 24-2" stroke="#F2A5CA" stroke-width="4"/>`,
    'atelier-merino-prep': `<path d="M42 21 21 36 11 84l17 5 11-34-4 68h50l-4-68 11 34 17-5-10-48-21-15-18 15Z" fill="#8C6F67" stroke="${ink}" stroke-width="2"/><path d="m42 21 18 15 18-15-7 30-11-9-11 9Z" fill="#F3E5D5" stroke="${ink}" stroke-width="1.4"/><path d="M60 42v78M41 68h14M65 68h14" stroke="#5F4546" stroke-width="1.5"/><circle cx="60" cy="59" r="2" fill="${gold}"/><circle cx="60" cy="73" r="2" fill="${gold}"/><circle cx="60" cy="87" r="2" fill="${gold}"/><path d="M37 108h46" stroke="#BCA094" stroke-width="3"/>`,
    'atelier-silk-minimal': `<path d="M45 19 42 40c10 9 26 9 36 0l-3-21M42 40 27 127c22 8 44 8 66 0L78 40" fill="#CBB7D8" stroke="${ink}" stroke-width="2"/><path d="M45 20c4 14 9 20 15 20s11-6 15-20" stroke="#8C719D" stroke-width="1.5"/><path d="M38 89c15 5 30 4 44-4M31 116c21 6 40 5 58-3" stroke="#F7F0FC" stroke-width="3" opacity=".8"/><path d="M66 88v39" stroke="#7F658F" stroke-width="1.2"/><path d="M42 40c10 4 24 4 36 0" stroke="#FFF" stroke-width="2"/>`,
    'atelier-nappa-bag': `<path d="M25 48h70l-6 65H31Z" fill="#9C7065" stroke="${ink}" stroke-width="2"/><path d="M41 49V37c0-20 38-20 38 0v12" stroke="#65443F" stroke-width="5"/><path d="M44 49V38c0-15 32-15 32 0v11" stroke="#D1A99C" stroke-width="2"/><path d="M30 62h60M60 63v48" stroke="#D4A79A" stroke-width="1.6"/><path d="M49 73h22v18H49Z" fill="#B88779" stroke="${ink}" stroke-width="1.2"/><circle cx="60" cy="80" r="3" fill="${gold}"/><path d="M29 52c18 6 39 6 58 0" stroke="#E2B8AA" stroke-width="3"/>`,
    'atelier-wool-grunge': `<path d="M40 23 20 35 8 78l17 7 12-31-3 67h52l-3-67 12 31 17-7-12-43-20-12-20 14Z" fill="#665B68" stroke="${ink}" stroke-width="2"/><path d="m40 23 20 14 20-14-8 31-12-9-12 9Z" fill="#A190A3" stroke="${ink}" stroke-width="1.4"/><path d="M60 44v74M37 69h17M66 69h17" stroke="#332C38" stroke-width="2"/><path d="m34 90 15-7M70 101l16-8M22 64l12-6M87 57l11 5" stroke="#D0BECF" stroke-width="2"/><path d="M39 112h42" stroke="#2E2830" stroke-width="4"/>`,
    'atelier-aurora-couture': `<path d="M43 19 35 27l9 35-34 66c33 10 67 10 100 0L76 62l9-35-8-8-11 24H54Z" fill="#A9DDEA" stroke="${ink}" stroke-width="2"/><path d="M44 61c11 7 21 7 32 0l12 24c-19 9-37 9-56 0Z" fill="#DDF8FF" stroke="#5F9DB6" stroke-width="1.2"/><path d="m60 43 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z" fill="#FFF" stroke="#68BCD4" stroke-width="1"/><path d="M22 110c24 9 52 9 76 0" stroke="#FFF" stroke-width="3"/><circle cx="35" cy="94" r="3" fill="#EAFBFF"/><circle cx="84" cy="99" r="3" fill="#EAFBFF"/>`,
    'atelier-cashmere-clean': `<path d="M42 20 22 35 12 83l17 5 10-33-3 68h48l-3-68 10 33 17-5-10-48-20-15-18 16Z" fill="#EEE2CF" stroke="${ink}" stroke-width="2"/><path d="m42 20 18 16 18-16-9 39-9-14-9 14Z" fill="#FFF8EC" stroke="#9F8D78" stroke-width="1.3"/><path d="M60 45v76" stroke="#B7A48D" stroke-width="1.4"/><path d="M39 67h14v13H39ZM67 67h14v13H67Z" fill="#F7EDDE" stroke="#B39D85" stroke-width="1"/><circle cx="60" cy="63" r="2" fill="${gold}"/><circle cx="60" cy="78" r="2" fill="${gold}"/><path d="M36 113h48" stroke="#D5C2AA" stroke-width="3"/>`,
    'atelier-crystal-ballet': `<path d="M42 23h36l6 39H36Z" fill="#E6B9D5" stroke="${ink}" stroke-width="2"/><path d="M35 66h50l18 43c-29 12-57 12-86 0Z" fill="#F0CBE1" stroke="${ink}" stroke-width="2"/><path d="M42 23 60 45l18-22M36 57h48" stroke="#FFF" stroke-width="2"/><path d="M27 93c22 9 44 9 66 0M22 104c25 10 51 10 76 0" stroke="#FFF5FB" stroke-width="3"/><path d="M60 52c-12-12-21-3-12 6 5 4 9 2 12-1 3 3 7 5 12 1 9-9 0-18-12-6Z" fill="#E36FA9" stroke="${ink}" stroke-width="1.2"/><path d="m78 71 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#E8FAFF" stroke="#71B8D0" stroke-width="1"/>`,
  };
  return pieces[art];
}

export interface AtelierShapePoint { x: number; y: number; }

/** Clean editable silhouettes. Decoration is deliberately left to the design studio. */
const editableAtelierShapes: Record<string, AtelierShapePoint[]> = {
  'atelier-cloud-tee': [{ x: 42, y: 27 }, { x: 27, y: 34 }, { x: 14, y: 56 }, { x: 29, y: 65 }, { x: 37, y: 52 }, { x: 35, y: 105 }, { x: 85, y: 105 }, { x: 83, y: 52 }, { x: 91, y: 65 }, { x: 106, y: 56 }, { x: 93, y: 34 }, { x: 78, y: 27 }, { x: 70, y: 36 }, { x: 50, y: 36 }],
  'atelier-linen-poet': [{ x: 43, y: 24 }, { x: 25, y: 34 }, { x: 12, y: 72 }, { x: 29, y: 80 }, { x: 38, y: 54 }, { x: 35, y: 108 }, { x: 85, y: 108 }, { x: 82, y: 54 }, { x: 91, y: 80 }, { x: 108, y: 72 }, { x: 95, y: 34 }, { x: 77, y: 24 }, { x: 70, y: 39 }, { x: 50, y: 39 }],
  'atelier-indigo-street': [{ x: 38, y: 25 }, { x: 82, y: 25 }, { x: 80, y: 61 }, { x: 91, y: 126 }, { x: 66, y: 126 }, { x: 60, y: 78 }, { x: 54, y: 126 }, { x: 29, y: 126 }, { x: 40, y: 61 }],
  'atelier-ribbon-dream': [{ x: 45, y: 22 }, { x: 37, y: 29 }, { x: 43, y: 61 }, { x: 15, y: 127 }, { x: 36, y: 134 }, { x: 60, y: 137 }, { x: 84, y: 134 }, { x: 105, y: 127 }, { x: 77, y: 61 }, { x: 83, y: 29 }, { x: 75, y: 22 }, { x: 68, y: 43 }, { x: 52, y: 43 }],
  'atelier-denim-y2k': [{ x: 40, y: 23 }, { x: 80, y: 23 }, { x: 84, y: 61 }, { x: 87, y: 66 }, { x: 94, y: 125 }, { x: 68, y: 125 }, { x: 60, y: 82 }, { x: 52, y: 125 }, { x: 26, y: 125 }, { x: 33, y: 66 }, { x: 36, y: 61 }],
  'atelier-merino-prep': [{ x: 43, y: 20 }, { x: 22, y: 34 }, { x: 10, y: 84 }, { x: 28, y: 91 }, { x: 38, y: 56 }, { x: 34, y: 128 }, { x: 86, y: 128 }, { x: 82, y: 56 }, { x: 92, y: 91 }, { x: 110, y: 84 }, { x: 98, y: 34 }, { x: 77, y: 20 }, { x: 60, y: 36 }],
  'atelier-silk-minimal': [{ x: 46, y: 18 }, { x: 43, y: 40 }, { x: 28, y: 131 }, { x: 46, y: 136 }, { x: 74, y: 136 }, { x: 92, y: 131 }, { x: 77, y: 40 }, { x: 74, y: 18 }, { x: 67, y: 38 }, { x: 53, y: 38 }],
  'atelier-nappa-bag': [{ x: 30, y: 48 }, { x: 39, y: 36 }, { x: 43, y: 25 }, { x: 52, y: 19 }, { x: 68, y: 19 }, { x: 77, y: 25 }, { x: 81, y: 36 }, { x: 90, y: 48 }, { x: 96, y: 116 }, { x: 24, y: 116 }],
  'atelier-wool-grunge': [{ x: 41, y: 22 }, { x: 20, y: 34 }, { x: 8, y: 78 }, { x: 25, y: 87 }, { x: 37, y: 54 }, { x: 33, y: 126 }, { x: 87, y: 126 }, { x: 83, y: 54 }, { x: 95, y: 87 }, { x: 112, y: 78 }, { x: 100, y: 34 }, { x: 79, y: 22 }, { x: 60, y: 39 }],
  'atelier-aurora-couture': [{ x: 44, y: 18 }, { x: 36, y: 27 }, { x: 43, y: 61 }, { x: 9, y: 132 }, { x: 34, y: 138 }, { x: 60, y: 140 }, { x: 86, y: 138 }, { x: 111, y: 132 }, { x: 77, y: 61 }, { x: 84, y: 27 }, { x: 76, y: 18 }, { x: 67, y: 44 }, { x: 53, y: 44 }],
  'atelier-cashmere-clean': [{ x: 42, y: 19 }, { x: 22, y: 34 }, { x: 11, y: 83 }, { x: 29, y: 90 }, { x: 39, y: 55 }, { x: 35, y: 128 }, { x: 85, y: 128 }, { x: 81, y: 55 }, { x: 91, y: 90 }, { x: 109, y: 83 }, { x: 98, y: 34 }, { x: 78, y: 19 }, { x: 60, y: 38 }],
  'atelier-crystal-ballet': [{ x: 42, y: 22 }, { x: 78, y: 22 }, { x: 84, y: 61 }, { x: 85, y: 66 }, { x: 104, y: 112 }, { x: 83, y: 121 }, { x: 60, y: 125 }, { x: 37, y: 121 }, { x: 16, y: 112 }, { x: 35, y: 66 }, { x: 36, y: 61 }],
};

export function atelierProductPoints(art: string): AtelierShapePoint[] | undefined {
  return editableAtelierShapes[art]?.map(point => ({ ...point }));
}

const cleanColor = (color: string, fallback: string) => /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;

export function atelierProductBody(art: string, color = '#f4a8cb', customPoints?: AtelierShapePoint[], smooth = true, strokeColor = ink, strokeWidth = 2): string | undefined {
  const fallback = editableAtelierShapes[art];
  if (!fallback) return legacyAtelierProductBody(art);
  const points = (customPoints?.length && customPoints.length >= 6 ? customPoints : fallback).slice(0, 48).map(point => ({
    x: Math.max(4, Math.min(116, Number(point.x) || 60)),
    y: Math.max(5, Math.min(138, Number(point.y) || 70)),
  }));
  const path = smooth
    ? (() => {
      const midpoint = (a: AtelierShapePoint, b: AtelierShapePoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const start = midpoint(points.at(-1)!, points[0]);
      return `M${start.x} ${start.y}${points.map((point, index) => {
        const end = midpoint(point, points[(index + 1) % points.length]);
        return `Q${point.x} ${point.y} ${end.x} ${end.y}`;
      }).join('')}Z`;
    })()
    : `M${points.map(point => `${point.x} ${point.y}`).join('L')}Z`;
  return `<path class="atelier-editable-shape" d="${path}" fill="${cleanColor(color, '#f4a8cb')}" stroke="${cleanColor(strokeColor, ink)}" stroke-width="${Math.max(.6, Math.min(4, Number(strokeWidth) || 2))}" stroke-linejoin="round"/>`;
}


