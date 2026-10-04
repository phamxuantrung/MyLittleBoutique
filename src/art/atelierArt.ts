const ink = '#795267';
const gold = '#f5bf4f';
const svg = (body: string) => `<svg class="atelier-material-art" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

const materialArtwork: Record<string, string> = {
  cotton: '/assets/atelier/materials/cotton.png',
  linen: '/assets/atelier/materials/linen.png',
  denim: '/assets/atelier/materials/denim.png',
  lace: '/assets/atelier/materials/lace.png',
  ribbon: '/assets/atelier/materials/ribbon.png',
  wool: '/assets/atelier/materials/wool.png',
  silk: '/assets/atelier/materials/silk.png',
  leather: '/assets/atelier/materials/leather.png',
  crystal: '/assets/atelier/materials/crystal.png',
  cashmere: '/assets/atelier/materials/cashmere.png',
};

export const allAtelierMaterialArtwork = Object.freeze(Object.values(materialArtwork));

/** Illustrated material swatches used throughout the personal atelier UI. */
export function atelierMaterialIllustration(id: string) {
  const artwork = materialArtwork[id];
  if (artwork) return `<img class="atelier-material-art" src="${artwork}" alt="" aria-hidden="true" draggable="false" />`;
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

/** Twelve deliberately different base blocks. Each recipe must remain valuable before customization. */
const editableAtelierShapes: Record<string, AtelierShapePoint[]> = {
  'atelier-cloud-tee': [{ x: 43, y: 28 }, { x: 28, y: 33 }, { x: 13, y: 49 }, { x: 20, y: 65 }, { x: 35, y: 57 }, { x: 34, y: 97 }, { x: 43, y: 105 }, { x: 53, y: 99 }, { x: 62, y: 106 }, { x: 72, y: 99 }, { x: 85, y: 104 }, { x: 86, y: 57 }, { x: 100, y: 65 }, { x: 107, y: 49 }, { x: 92, y: 33 }, { x: 77, y: 28 }, { x: 69, y: 38 }, { x: 51, y: 38 }],
  'atelier-linen-poet': [{ x: 46, y: 22 }, { x: 31, y: 30 }, { x: 16, y: 43 }, { x: 9, y: 67 }, { x: 19, y: 84 }, { x: 31, y: 78 }, { x: 35, y: 58 }, { x: 40, y: 112 }, { x: 80, y: 112 }, { x: 85, y: 58 }, { x: 89, y: 78 }, { x: 101, y: 84 }, { x: 111, y: 67 }, { x: 104, y: 43 }, { x: 89, y: 30 }, { x: 74, y: 22 }, { x: 68, y: 37 }, { x: 52, y: 37 }],
  'atelier-indigo-street': [{ x: 34, y: 24 }, { x: 85, y: 28 }, { x: 79, y: 62 }, { x: 98, y: 126 }, { x: 70, y: 130 }, { x: 59, y: 78 }, { x: 51, y: 126 }, { x: 23, y: 121 }, { x: 39, y: 61 }],
  'atelier-ribbon-dream': [{ x: 47, y: 21 }, { x: 37, y: 27 }, { x: 28, y: 36 }, { x: 33, y: 52 }, { x: 44, y: 51 }, { x: 39, y: 70 }, { x: 20, y: 118 }, { x: 36, y: 130 }, { x: 60, y: 135 }, { x: 84, y: 130 }, { x: 100, y: 118 }, { x: 81, y: 70 }, { x: 76, y: 51 }, { x: 87, y: 52 }, { x: 92, y: 36 }, { x: 83, y: 27 }, { x: 73, y: 21 }, { x: 66, y: 42 }, { x: 60, y: 35 }, { x: 54, y: 42 }],
  'atelier-denim-y2k': [{ x: 44, y: 18 }, { x: 35, y: 35 }, { x: 38, y: 54 }, { x: 29, y: 66 }, { x: 22, y: 124 }, { x: 49, y: 128 }, { x: 60, y: 83 }, { x: 71, y: 128 }, { x: 98, y: 124 }, { x: 91, y: 66 }, { x: 82, y: 54 }, { x: 85, y: 35 }, { x: 76, y: 18 }, { x: 66, y: 42 }, { x: 54, y: 42 }],
  'atelier-merino-prep': [{ x: 43, y: 18 }, { x: 19, y: 30 }, { x: 8, y: 82 }, { x: 28, y: 87 }, { x: 38, y: 54 }, { x: 34, y: 130 }, { x: 86, y: 130 }, { x: 82, y: 54 }, { x: 92, y: 87 }, { x: 112, y: 82 }, { x: 101, y: 30 }, { x: 77, y: 18 }, { x: 60, y: 39 }],
  'atelier-silk-minimal': [{ x: 47, y: 16 }, { x: 43, y: 42 }, { x: 34, y: 82 }, { x: 23, y: 132 }, { x: 49, y: 137 }, { x: 78, y: 128 }, { x: 91, y: 117 }, { x: 77, y: 42 }, { x: 73, y: 16 }, { x: 66, y: 36 }, { x: 54, y: 36 }],
  'atelier-nappa-bag': [{ x: 25, y: 50 }, { x: 38, y: 45 }, { x: 42, y: 27 }, { x: 50, y: 17 }, { x: 70, y: 17 }, { x: 78, y: 27 }, { x: 82, y: 45 }, { x: 95, y: 50 }, { x: 102, y: 111 }, { x: 89, y: 121 }, { x: 31, y: 121 }, { x: 18, y: 111 }],
  'atelier-wool-grunge': [{ x: 39, y: 21 }, { x: 18, y: 31 }, { x: 7, y: 72 }, { x: 24, y: 82 }, { x: 37, y: 56 }, { x: 31, y: 111 }, { x: 44, y: 119 }, { x: 55, y: 113 }, { x: 67, y: 123 }, { x: 88, y: 114 }, { x: 83, y: 54 }, { x: 98, y: 84 }, { x: 113, y: 73 }, { x: 100, y: 30 }, { x: 80, y: 22 }, { x: 60, y: 41 }],
  'atelier-aurora-couture': [{ x: 50, y: 17 }, { x: 39, y: 25 }, { x: 41, y: 58 }, { x: 34, y: 85 }, { x: 18, y: 129 }, { x: 43, y: 137 }, { x: 65, y: 130 }, { x: 82, y: 115 }, { x: 111, y: 133 }, { x: 91, y: 91 }, { x: 79, y: 58 }, { x: 80, y: 25 }, { x: 72, y: 17 }, { x: 65, y: 42 }, { x: 56, y: 38 }],
  'atelier-cashmere-clean': [{ x: 46, y: 18 }, { x: 27, y: 28 }, { x: 16, y: 48 }, { x: 13, y: 83 }, { x: 30, y: 91 }, { x: 39, y: 66 }, { x: 34, y: 119 }, { x: 47, y: 130 }, { x: 73, y: 130 }, { x: 86, y: 119 }, { x: 81, y: 66 }, { x: 90, y: 91 }, { x: 107, y: 83 }, { x: 104, y: 48 }, { x: 93, y: 28 }, { x: 74, y: 18 }, { x: 68, y: 43 }, { x: 55, y: 52 }],
  'atelier-crystal-ballet': [{ x: 43, y: 20 }, { x: 77, y: 20 }, { x: 82, y: 57 }, { x: 91, y: 72 }, { x: 111, y: 91 }, { x: 91, y: 101 }, { x: 106, y: 114 }, { x: 78, y: 119 }, { x: 60, y: 127 }, { x: 42, y: 119 }, { x: 14, y: 114 }, { x: 29, y: 101 }, { x: 9, y: 91 }, { x: 29, y: 72 }, { x: 38, y: 57 }],
};

export function atelierProductPoints(art: string): AtelierShapePoint[] | undefined {
  return editableAtelierShapes[art]?.map(point => ({ ...point }));
}

const cleanColor = (color: string, fallback: string) => /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;

const atelierSurfaceDetails: Record<string, string> = {
  'atelier-cloud-tee': `<path d="M35 86Q43 96 52 88T69 89T86 86" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/><path d="M41 48Q60 60 79 48" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="2 3"/><g fill="#fff" opacity=".28"><circle cx="31" cy="45" r="5"/><circle cx="89" cy="45" r="5"/></g>`,
  'atelier-linen-poet': `<g fill="none" stroke="#8f735c" opacity=".55"><path d="M48 37V104M55 39V108M65 39V108M72 37V104"/><path d="M20 59H32M88 59H100" stroke-width="3"/></g><path d="M43 25Q60 47 77 25" fill="#fff8e9" fill-opacity=".7" stroke="#a48469"/><circle cx="60" cy="57" r="2" fill="#f5bf4f"/><circle cx="60" cy="70" r="2" fill="#f5bf4f"/>`,
  'atelier-indigo-street': `<g fill="none" stroke="#dceaff" stroke-width="1.6" stroke-dasharray="3 2"><path d="M37 34H81M59 35V120"/><path d="M38 51 53 61 42 72M81 52 66 61 78 73"/></g><path d="M25 83H48V105H29M72 79H92V102H76" fill="#4e72ad" fill-opacity=".35" stroke="#365988"/><path d="M34 25 85 29" stroke="#f6accd" stroke-width="3"/>`,
  'atelier-ribbon-dream': `<path d="M42 66Q60 77 78 66" fill="none" stroke="#fff" stroke-width="5" opacity=".65"/><path d="M25 111Q60 128 95 111M31 96Q60 109 89 96" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/><path d="M60 50c-13-13-22-3-12 7 5 4 9 1 12-2 3 3 7 6 12 2 10-10 1-20-12-7Z" fill="#dd4e91"/><path d="m57 57-8 16 11-6 11 6-8-16Z" fill="#c13c7c"/>`,
  'atelier-denim-y2k': `<g fill="none" stroke="#d9e8ff" stroke-width="1.7" stroke-dasharray="3 2"><path d="M44 20 60 44 76 20M38 54H82M60 55V121"/><path d="M33 76H52V94H31M68 76H89L91 94H70"/></g><path d="M37 51Q48 44 60 52Q72 44 83 51" fill="none" stroke="#f49aca" stroke-width="4"/>`,
  'atelier-merino-prep': `<path d="m42 20 18 20 18-20-8 34-10-10-10 10Z" fill="#f6e7d5" fill-opacity=".75" stroke="#5f4546"/><g fill="none" stroke="#5f4546" stroke-width="1.5"><path d="M60 43V125M38 68H53M67 68H82"/></g><g fill="#f5bf4f" stroke="#5f4546" stroke-width=".7"><circle cx="54" cy="59" r="2"/><circle cx="66" cy="59" r="2"/><circle cx="54" cy="75" r="2"/><circle cx="66" cy="75" r="2"/></g><path d="M35 108H85" stroke="#dbc2ac" stroke-width="3"/>`,
  'atelier-silk-minimal': `<path d="M46 18Q60 55 74 18M43 42Q60 51 77 42" fill="none" stroke="#fff" stroke-width="2" opacity=".85"/><path d="M37 73Q58 84 81 68M30 108Q58 124 86 105" fill="none" stroke="#fff" stroke-width="4" opacity=".45"/><path d="M69 42Q55 84 73 129" fill="none" stroke="#80649a" stroke-width="1.3" opacity=".6"/>`,
  'atelier-nappa-bag': `<path d="M24 56Q60 69 96 56M29 79H91" fill="none" stroke="#e0b2a5" stroke-width="3"/><path d="M44 48V36Q44 22 60 22T76 36V48" fill="none" stroke="#5f403c" stroke-width="5"/><path d="M48 71H72V94H48Z" fill="#ba887a" stroke="#68483f"/><circle cx="60" cy="79" r="3" fill="#f5bf4f"/><g fill="#fff" opacity=".18"><circle cx="36" cy="91" r="1"/><circle cx="79" cy="101" r="1.2"/><circle cx="47" cy="108" r=".9"/></g>`,
  'atelier-wool-grunge': `<path d="m40 23 20 19 20-19-9 33-11-10-12 11Z" fill="#99889e" stroke="#332c38"/><path d="M59 44 68 116M37 68H53M70 70H87" fill="none" stroke="#29242c" stroke-width="2"/><g stroke="#e2cfdf" stroke-width="2"><path d="m22 61 13-7M35 91l15-8M70 99l17-9M89 54l12 6"/></g><path d="M34 111 46 116 55 111 67 120 86 113" fill="none" stroke="#211d23" stroke-width="4"/>`,
  'atelier-aurora-couture': `<path d="M51 18 60 43 72 18M40 58Q58 70 79 58" fill="none" stroke="#f6ffff" stroke-width="2"/><g fill="#e9fbff" stroke="#63b8d1" stroke-width=".7" opacity=".9"><path d="m60 48 5 9-5 10-5-10Z"/><path d="m43 80 6 9-8 7-4-9Z"/><path d="m78 91 8 8-6 9-7-10Z"/><path d="m58 112 6 10-7 7-5-9Z"/></g><path d="M26 124Q62 137 96 121" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>`,
  'atelier-cashmere-clean': `<path d="M47 20 67 47 55 55 74 20" fill="#fff7eb" fill-opacity=".7" stroke="#a78f79"/><path d="M39 62 81 101M81 61 40 103" stroke="#cfbba5" stroke-width="1.5" opacity=".65"/><path d="M34 86Q60 96 86 86" fill="none" stroke="#9f8873" stroke-width="5"/><rect x="54" y="82" width="13" height="9" rx="2" fill="#f8e8cf" stroke="#8e7662"/><path d="M43 119Q60 126 77 119" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/>`,
  'atelier-crystal-ballet': `<path d="M43 21 60 50 77 21M38 57H82" fill="none" stroke="#fff" stroke-width="2"/><path d="M31 74Q60 88 89 74M19 94Q60 113 101 94M22 108Q60 124 98 108" fill="none" stroke="#fff" stroke-width="4" opacity=".65"/><g fill="#dff8ff" stroke="#70b9cf" stroke-width=".7"><path d="m60 52 5 7-5 7-5-7Z"/><path d="m43 85 4 6-5 5-4-7Z"/><path d="m78 86 5 6-5 6-4-7Z"/></g><path d="M48 24V57M55 24V57M65 24V57M72 24V57" stroke="#a95f88" opacity=".55"/>`,
};

const shortHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36);
};

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
  const clipId = `atelier-shape-${shortHash(`${art}:${path}`)}`;
  const details = atelierSurfaceDetails[art] ?? '';
  return `<defs><clipPath id="${clipId}"><path class="atelier-live-shape-path" d="${path}"/></clipPath></defs><path class="atelier-editable-shape atelier-live-shape-path" d="${path}" fill="${cleanColor(color, '#f4a8cb')}" stroke="${cleanColor(strokeColor, ink)}" stroke-width="${Math.max(.6, Math.min(4, Number(strokeWidth) || 2))}" stroke-linejoin="round"/><g class="atelier-recipe-surface" clip-path="url(#${clipId})" pointer-events="none">${details}</g>`;
}


