// Fashion silhouettes — 100% matched to the approved Master Product Illustration Sheet
// Art direction: Cute Retro Anime Cartoon x Premium Fashion Illustration
// Artboard: 120 x 140

export function fashionShapes(c: string): Record<string, string> {
  const ink = '#4a2d5a';
  const gold = '#fbbf24';
  const silver = '#cbd5e1';
  const white = '#ffffff';

  // Helper ribbon bow
  const ribbon = (x: number, y: number, color = '#ff7da7', scale = 1) => `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M0 0 C-12 -10 -15 2 0 4 C15 2 12 -10 0 0 Z" fill="${color}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M0 2 L-6 14 L-2 12 L0 15 L2 12 L6 14 Z" fill="${color}" stroke="${ink}" stroke-width="1"/>
      <circle cx="0" cy="2" r="2.2" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
    </g>
  `;

  // === 1. ÁO (TOPS) ===

  // Baby Tee: Fitted crop tee with contrast pink collar/cuffs and white heart
  const babyTee = `
    <path d="M43 28 L28 35 L16 57 L30 65 L38 52 L37 78 H83 L82 52 L90 65 L104 57 L92 35 L77 28 Q60 38 43 28 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M43 28 Q60 40 77 28 Q60 34 43 28 Z" fill="#ff7da7" stroke="${ink}" stroke-width="1.2"/>
    <path d="M16 57 L30 65 L27 67 L14 60 Z" fill="#ff7da7" stroke="${ink}" stroke-width="1.2"/>
    <path d="M104 57 L90 65 L93 67 L106 60 Z" fill="#ff7da7" stroke="${ink}" stroke-width="1.2"/>
    <path d="M60 44 C56 39 49 41 49 47 C49 53 60 59 60 60 C60 59 71 53 71 47 C71 41 64 39 60 44 Z" fill="#ffffff" stroke="${ink}" stroke-width="1"/>
    <path d="M43 65 Q50 68 55 64 M65 64 Q70 68 77 65" fill="none" stroke="${ink}" stroke-width="1" opacity="0.3"/>
  `;

  // T-shirt: Classic tee in fabric color with cute graphic
  const tshirt = `
    <path d="M43 28 L28 35 L16 57 L30 65 L38 52 L37 82 H83 L82 52 L90 65 L104 57 L92 35 L77 28 Q60 38 43 28 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M43 28 Q60 40 77 28 Q60 34 43 28 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.6"/>
    <circle cx="60" cy="52" r="8" fill="#ffffff" opacity="0.8" stroke="${ink}" stroke-width="1"/>
    <path d="M60 47 C58 44 54 45 54 48 C54 52 60 55 60 56 C60 55 66 52 66 48 C66 45 62 44 60 47 Z" fill="#ff7da7"/>
  `;

  // Oversized Tee / Sweatshirt: Drop shoulders, ribbed collar and hem
  const oversizedTee = `
    <path d="M38 28 L18 36 L8 72 L26 77 L34 54 L34 94 H86 L86 54 L94 77 L112 72 L102 36 L82 28 Q60 40 38 28 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 28 Q60 42 82 28 Q60 36 38 28 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <path d="M8 72 L26 77 L24 81 L6 76 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <path d="M112 72 L94 77 L96 81 L114 76 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <rect x="34" y="90" width="52" height="6" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <path d="M60 52 L62 57 L67 57 L63 60 L65 65 L60 62 L55 65 L57 60 L53 57 L58 57 Z" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // Jersey: Blokecore sporty soccer jersey with striped shoulders and '07' print
  const jersey = `
    <path d="M42 26 L26 34 L14 62 L28 68 L36 52 L35 84 H85 L84 52 L92 68 L106 62 L94 34 L78 26 Q60 36 42 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 26 Q60 38 78 26 L74 34 Q60 44 46 34 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2"/>
    <path d="M26 34 L14 62 M30 35 L18 63" stroke="#ffffff" stroke-width="2" fill="none"/>
    <path d="M94 34 L106 62 M90 35 L102 63" stroke="#ffffff" stroke-width="2" fill="none"/>
    <text x="60" y="64" font-family="'Arial Black', sans-serif" font-size="20" font-weight="900" fill="#ffffff" stroke="${ink}" stroke-width="1.2" text-anchor="middle" dominant-baseline="central">07</text>
  `;

  // Off-Shoulder Top: Ruffled neckline, puffed sleeves and ribbon bow
  const offShoulder = `
    <ellipse cx="22" cy="52" rx="12" ry="16" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <ellipse cx="98" cy="52" rx="12" ry="16" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M28 42 Q60 52 92 42 L84 82 Q60 88 36 82 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M16 42 Q60 56 104 42 L104 48 Q60 62 16 48 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.7"/>
    ${ribbon(60, 52, '#ffffff', 0.8)}
  `;

  // Shirt: Button-down with collar and flap chest pockets
  const shirt = `
    <path d="M42 24 L24 34 L12 76 L28 80 L38 52 L36 88 H84 L82 52 L92 80 L108 76 L96 34 L78 24 L68 34 L60 28 L52 34 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 24 L52 38 L60 30 L68 38 L78 24 Q60 32 42 24 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M57 30 V88 H63 V30 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1" opacity="0.6"/>
    <circle cx="60" cy="42" r="1.3" fill="${gold}"/>
    <circle cx="60" cy="54" r="1.3" fill="${gold}"/>
    <circle cx="60" cy="66" r="1.3" fill="${gold}"/>
    <circle cx="60" cy="78" r="1.3" fill="${gold}"/>
    <rect x="42" y="48" width="12" height="12" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
    <rect x="66" y="48" width="12" height="12" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
  `;

  // Corset: Sweetheart bodice with dark boning and lace-up front
  const corset = `
    <ellipse cx="28" cy="46" rx="9" ry="11" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.6"/>
    <ellipse cx="92" cy="46" rx="9" ry="11" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.6"/>
    <path d="M38 38 C46 30 52 38 60 35 C68 38 74 30 82 38 L76 86 L60 93 L44 86 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M48 42 L48 88 M72 42 L72 88" stroke="${ink}" stroke-width="1.3" opacity="0.6"/>
    <path d="M52 40 L52 90 M68 40 L68 90" stroke="${ink}" stroke-width="1.3" opacity="0.6"/>
    <path d="M54 48 L66 54 M66 54 L54 60 M54 60 L66 66 M66 66 L54 72 M54 72 L66 78" stroke="#18181b" stroke-width="1.6" stroke-linecap="round"/>
    ${ribbon(60, 46, '#18181b', 0.7)}
  `;

  // Halter Top: Triangle crop halter with neck ties
  const halterTop = `
    <path d="M52 18 L48 38 M68 18 L72 38" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
    <path d="M46 38 L32 72 Q60 84 88 72 L74 38 Q60 44 46 38 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M48 42 Q60 48 72 42" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
  `;

  // Ribbon Top: Sleeveless top with giant statement bow at neckline
  const ribbonTop = `
    <path d="M44 26 L36 40 L38 82 H82 L84 40 L76 26 Q60 34 44 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M46 26 L54 36 L60 30 L66 36 L74 26 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="60" cy="46" r="1.3" fill="${gold}"/>
    <circle cx="60" cy="58" r="1.3" fill="${gold}"/>
    <circle cx="60" cy="70" r="1.3" fill="${gold}"/>
    ${ribbon(60, 36, '#ffffff', 1.3)}
  `;

  // Graphic Tee: Dark charcoal vintage tee with anime badge print
  const graphicTee = `
    <path d="M43 28 L28 35 L16 57 L30 65 L38 52 L37 82 H83 L82 52 L90 65 L104 57 L92 35 L77 28 Q60 38 43 28 Z" fill="#27272a" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="44" y="44" width="32" height="24" rx="2" fill="${c}" stroke="#ffffff" stroke-width="1"/>
    <circle cx="60" cy="53" r="5" fill="${gold}"/>
    <path d="M48 64 H72" stroke="#ffffff" stroke-width="1.5"/>
  `;

  // Crop Top: Scoop-neck racerback crop top with contrast band
  const cropTop = `
    <path d="M46 26 L36 34 L38 72 H82 L84 34 L74 26 L66 40 Q60 42 54 40 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 68 H82" stroke="#ffffff" stroke-width="2.5" opacity="0.8"/>
  `;

  // Tube Top: Sweetheart strapless tube top with ruffle trim
  const tubeTop = `
    <path d="M48 26 L46 44 M72 26 L74 44" stroke="${ink}" stroke-width="1.5" opacity="0.5"/>
    <path d="M36 44 C44 38 52 44 60 42 C68 44 76 38 84 44 L80 76 Q60 82 40 76 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M36 44 Q60 52 84 44" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
    ${ribbon(60, 48, '#ffffff', 0.7)}
  `;

  // Camisole: Sweetheart slip camisole with spaghetti straps
  const camisole = `
    <path d="M48 26 L46 44 M72 26 L74 44" stroke="${ink}" stroke-width="1.5"/>
    <path d="M36 44 C44 38 52 44 60 42 C68 44 76 38 84 44 L80 78 Q60 84 40 78 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="60" cy="52" r="1.3" fill="#ffffff"/>
    <circle cx="60" cy="60" r="1.3" fill="#ffffff"/>
    <circle cx="60" cy="68" r="1.3" fill="#ffffff"/>
  `;

  // Long Sleeve: Striped long-sleeve crop top
  const longSleeve = `
    <path d="M43 28 L24 34 L8 82 L22 86 L36 54 L36 78 H84 L84 54 L98 86 L112 82 L96 34 L77 28 Q60 38 43 28 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 70 L26 74 M16 58 L30 62 M20 46 L34 50 M108 70 L94 74 M104 58 L90 62 M100 46 L86 50 M36 64 H84" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.6"/>
    <circle cx="60" cy="52" r="4" fill="#f43f5e"/>
  `;

  // Lace-Up Top: Ruffled milkmaid top with front cords
  const laceUpTop = `
    <ellipse cx="28" cy="46" rx="9" ry="11" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.7"/>
    <ellipse cx="92" cy="46" rx="9" ry="11" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.7"/>
    <path d="M38 40 Q60 48 82 40 L78 84 Q60 90 42 84 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M54 50 L66 56 M66 56 L54 62 M54 62 L66 68 M66 68 L54 74" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
  `;

  // Blouse: Peter Pan collared blouse with ribbon tie
  const blouse = `
    <path d="M42 26 L22 36 L12 76 L26 80 L38 52 L36 86 H84 L82 52 L94 80 L108 76 L98 36 L78 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 26 C40 38 54 42 60 34 C66 42 80 38 78 26 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    ${ribbon(60, 36, '#18181b', 0.9)}
  `;

  // Cardigan: V-neck knit cardigan with cute heart buttons
  const cardigan = `
    <path d="M42 26 L22 36 L10 78 L26 82 L38 52 L36 88 H84 L82 52 L94 82 L110 78 L98 36 L78 26 Q60 36 42 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M44 26 L56 50 V88 H64 V50 L76 26 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.7"/>
    <circle cx="60" cy="56" r="1.8" fill="${gold}"/>
    <circle cx="60" cy="68" r="1.8" fill="${gold}"/>
    <circle cx="60" cy="80" r="1.8" fill="${gold}"/>
  `;

  // === 2. VÁY & ĐẦM (DRESSES & SKIRTS) ===

  // Dress: Sweet babydoll Sunday date dress with ribbon
  const dress = `
    <path d="M44 22 L36 26 L42 54 L18 122 Q60 134 102 122 L78 54 L84 26 L76 22 L68 40 H52 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M26 102 Q60 114 94 102" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.8"/>
    <path d="M19 121 Q60 133 101 121" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.6"/>
    ${ribbon(60, 44, '#ffffff', 0.8)}
  `;

  // Lolita Dress: Princess frilly lolita dress with tiered lace apron
  const lolitaDress = `
    <path d="M44 22 L36 26 L42 54 L16 124 Q60 136 104 124 L78 54 L84 26 L76 22 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M48 26 H72 L76 56 L84 122 Q60 130 36 122 L44 56 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M30 112 Q60 124 90 112" fill="none" stroke="${ink}" stroke-width="1.5" opacity="0.4"/>
    ${ribbon(60, 42, '#ffffff', 0.9)}
  `;

  // Mini Dress: Chic A-line party mini dress with white collar and gold buttons
  const miniDress = `
    <path d="M44 22 L36 26 L42 54 L24 108 Q60 120 96 108 L78 54 L84 26 L76 22 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M44 22 L54 36 L60 30 L66 36 L76 22 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <circle cx="60" cy="46" r="1.5" fill="${gold}"/>
    <circle cx="60" cy="58" r="1.5" fill="${gold}"/>
    <circle cx="60" cy="70" r="1.5" fill="${gold}"/>
  `;

  // Slip Dress: Sleek satin spaghetti-strap slip dress with side slit
  const slipDress = `
    <path d="M46 22 L44 38 M74 22 L76 38" stroke="${ink}" stroke-width="1.5"/>
    <path d="M44 38 C52 34 56 40 60 38 C64 40 68 34 76 38 L84 126 L66 128 L64 96 L44 128 L36 126 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M44 38 Q60 46 76 38" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.7"/>
    <path d="M64 96 V128" stroke="${ink}" stroke-width="1.2"/>
  `;

  // Maxi Dress: Flowing cottagecore maxi dress with tiered ruffles
  const maxiDress = `
    <path d="M44 22 L38 26 L42 52 L14 132 Q60 142 106 132 L78 52 L82 26 L76 22 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 52 H78" stroke="#ffffff" stroke-width="2" opacity="0.7"/>
    <path d="M26 92 Q60 102 94 92 M18 116 Q60 126 102 116" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.5"/>
  `;

  // Floral Maxi: Tiered floral prairie maxi dress with flutter sleeves and small flowers
  const floralMaxi = `
    <ellipse cx="32" cy="34" rx="10" ry="12" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <ellipse cx="88" cy="34" rx="10" ry="12" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M42 24 L38 52 L14 132 Q60 142 106 132 L82 52 L78 24 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="36" cy="94" r="2.5" fill="#ffffff"/><circle cx="64" cy="112" r="2.5" fill="#ffffff"/><circle cx="82" cy="88" r="2.5" fill="#ffffff"/><circle cx="50" cy="126" r="2.5" fill="#ffffff"/>
    <circle cx="52" cy="74" r="2.5" fill="#ffffff"/><circle cx="72" cy="128" r="2.5" fill="#ffffff"/>
  `;

  // Lace Maxi: Luxury sheer lace evening gown with scallop hem
  const laceMaxi = `
    <path d="M42 22 L26 34 L18 78 L30 80 L38 54 L14 132 Q60 142 106 132 L82 54 L90 80 L102 78 L94 34 L78 22 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M46 22 L60 48 L74 22 Z" fill="#ffffff" opacity="0.3"/>
    <path d="M22 104 Q60 114 98 104 M16 122 Q60 132 104 122" fill="none" stroke="${gold}" stroke-width="1.5" opacity="0.8"/>
    ${ribbon(60, 48, '#ffffff', 0.8)}
  `;

  // Pleated Skirt: Tennis pleated skirt with waistband and knife pleats
  const pleatedSkirt = `
    <path d="M38 52 H82 L98 108 Q60 120 22 108 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 52 H82 V58 H38 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.6"/>
    <rect x="42" y="53" width="7" height="4" fill="${silver}" stroke="${ink}" stroke-width="0.8"/>
    <path d="M44 58 L36 109 M52 58 L48 111 M60 58 V112 M68 58 L72 111 M76 58 L84 109" stroke="${ink}" stroke-width="1.3" fill="none" opacity="0.5"/>
  `;

  // Bubble Skirt: Puffy voluminous coquette balloon skirt
  const bubble = `
    <path d="M40 52 H80 V58 H40 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.7"/>
    <path d="M40 58 C16 66 12 104 28 114 C44 122 76 122 92 114 C108 104 104 66 80 58 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M34 108 Q60 118 86 108" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
    ${ribbon(60, 58, '#ffffff', 0.7)}
  `;

  // Denim Skirt: Blue mini denim skirt with pockets and metal buttons
  const denimSkirt = `
    <path d="M38 54 H82 L94 104 Q60 114 26 104 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 54 H82 V60 H38 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.3"/>
    <circle cx="60" cy="57" r="1.3" fill="${gold}"/>
    <path d="M60 60 V106" stroke="${ink}" stroke-width="1.3" opacity="0.4"/>
    <path d="M40 60 Q50 63 46 74 M80 60 Q70 63 74 74" fill="none" stroke="${gold}" stroke-width="1.3"/>
  `;

  // Ruffle Skirt: Layered tiered cake skirt
  const ruffleSkirt = `
    <path d="M38 54 H82 L86 72 Q60 80 34 72 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M32 70 Q60 80 88 70 L92 90 Q60 98 28 90 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M26 88 Q60 98 94 88 L100 112 Q60 122 20 112 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M32 72 Q60 82 88 72 M26 90 Q60 100 94 90 M20 112 Q60 122 100 112" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.8"/>
  `;

  // A-line Skirt: Clean minimalist A-line skirt with belt
  const alineSkirt = `
    <path d="M38 54 H82 L96 112 Q60 122 24 112 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M48 54 L44 114 M60 54 V116 M72 54 L76 114" stroke="${ink}" stroke-width="1.5" fill="none" opacity="0.3"/>
  `;

  // === 3. ÁO KHOÁC (OUTERWEAR) ===

  // Blazer: Tailored blazer with lapels and gold buttons
  const blazer = `
    <path d="M40 24 L24 34 L12 82 L26 86 L38 58 L36 94 H84 L82 58 L94 86 L108 82 L96 34 L80 24 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 24 L56 64 L60 58 L46 24 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.7"/>
    <path d="M78 24 L64 64 L60 58 L74 24 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.7"/>
    <circle cx="64" cy="70" r="1.5" fill="${gold}"/>
    <circle cx="64" cy="80" r="1.5" fill="${gold}"/>
    <rect x="68" y="74" width="14" height="2" fill="${ink}" opacity="0.4"/>
    <rect x="38" y="74" width="14" height="2" fill="${ink}" opacity="0.4"/>
  `;

  // Denim Jacket: Cropped jean jacket with metal rivets and chest flap pockets
  const denimJacket = `
    <path d="M42 24 L22 34 L10 82 L26 86 L38 56 L36 90 H84 L82 56 L94 86 L110 82 L98 34 L78 24 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 24 L52 34 L60 28 L68 34 L78 24 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <rect x="40" y="44" width="14" height="12" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
    <circle cx="47" cy="46" r="1" fill="${gold}"/>
    <rect x="66" y="44" width="14" height="12" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
    <circle cx="73" cy="46" r="1" fill="${gold}"/>
  `;

  // Leather Jacket: Moto biker jacket with asymmetrical silver zippers and snaps
  const leatherJacket = `
    <path d="M42 24 L22 34 L10 82 L26 86 L38 56 L36 90 H84 L82 56 L94 86 L110 82 L98 34 L78 24 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 24 L54 52 L66 32 L78 24 L60 62 Z" fill="#18181b" stroke="${ink}" stroke-width="1.3"/>
    <path d="M54 52 L68 90" stroke="${silver}" stroke-width="2.5"/>
    <circle cx="48" cy="36" r="1.3" fill="${silver}"/>
    <circle cx="72" cy="36" r="1.3" fill="${silver}"/>
  `;

  // Hoodie: Baggy hooded sweatshirt with kangaroo pocket
  const hoodie = `
    <path d="M42 24 C32 10 60 10 78 24 L94 36 L112 82 L94 86 L84 56 L84 94 H36 L36 56 L26 86 L8 82 L26 36 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M44 72 H76 L72 90 H48 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <path d="M52 38 L50 56 M68 38 L70 56" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  `;

  // Trench: Classic double-breasted trench coat with waist belt
  const trench = `
    <path d="M40 22 L22 34 L10 88 L26 92 L36 60 L32 126 H88 L84 60 L94 92 L110 88 L98 34 L80 22 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 22 L58 56 L68 40 L78 22 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.6"/>
    <rect x="34" y="68" width="52" height="7" fill="${ink}" opacity="0.3" stroke="${ink}" stroke-width="1"/>
    <rect x="55" y="67" width="10" height="9" fill="none" stroke="${gold}" stroke-width="1.5"/>
    <circle cx="48" cy="52" r="1.3" fill="${gold}"/>
    <circle cx="62" cy="52" r="1.3" fill="${gold}"/>
    <circle cx="48" cy="84" r="1.3" fill="${gold}"/>
    <circle cx="62" cy="84" r="1.3" fill="${gold}"/>
  `;

  // Puffer Jacket: Quilted puffer with horizontal baffle lines
  const pufferJacket = `
    <path d="M40 24 L20 34 L8 82 L26 86 L36 58 L34 94 H86 L84 58 L94 86 L112 82 L100 34 L80 24 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M35 48 H85 M34 64 H86 M34 80 H86" stroke="${ink}" stroke-width="1.8" fill="none" opacity="0.4"/>
    <path d="M40 22 Q60 34 80 22 Q86 32 78 36 Q60 42 42 36 Q34 32 40 22 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
  `;

  // === 4. QUẦN (PANTS) ===

  // Wide Leg: Flowing high-waist wide-leg trousers
  const wideLeg = `
    <path d="M38 42 H82 L94 130 H64 L59 74 L54 130 H26 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 42 H82 V48 H38 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <path d="M46 48 L42 128 M74 48 L78 128" stroke="${ink}" stroke-width="1.3" fill="none" opacity="0.3"/>
  `;

  // Straight / Pants / Jeans: Straight-leg pants
  const straight = `
    <path d="M36 44 H84 L90 130 H66 L59 78 L52 130 H28 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M36 44 H84 V50 H36 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <circle cx="59" cy="47" r="1.3" fill="${gold}"/>
    <rect x="74" y="72" width="14" height="18" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
  `;

  // Cargo / Cargo Pants: Multi-pocket baggy utility parachute cargo
  const cargo = `
    <path d="M34 42 H86 L94 130 H66 L59 78 L52 130 H26 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M34 42 H86 V48 H34 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.3"/>
    <rect x="23" y="66" width="16" height="18" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <rect x="24" y="92" width="14" height="16" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <rect x="81" y="66" width="16" height="18" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <rect x="82" y="92" width="14" height="16" rx="2" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
  `;

  // Shorts: Denim shorts
  const shorts = `
    <path d="M38 52 H82 L88 92 L64 92 L59 76 L54 92 L32 92 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 52 H82 V58 H38 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <circle cx="60" cy="55" r="1.3" fill="${gold}"/>
  `;

  // Cycling Shorts: High-waist bike shorts
  const cyclingShorts = `
    <path d="M38 48 H82 L86 96 L62 96 L59 76 L56 96 L34 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 48 H82 V54 H38 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.3"/>
  `;

  // Jogger: Street cuffed joggers with drawstring
  const jogger = `
    <path d="M36 44 H84 L92 124 H72 L60 78 L48 124 H28 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M36 44 H84 V50 H36 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <path d="M58 50 L56 60 M62 50 L64 60" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <rect x="28" y="122" width="20" height="7" rx="2" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <rect x="72" y="122" width="20" height="7" rx="2" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
  `;

  // === 5. CÁC SET PHỐI SẴN (SETS - 12 SETS HOÀN TOÀN ĐỘC ĐÁO) ===

  // 1. bowSet: Baby tee nơ + chân váy xòe nơ (Coquette)
  const bowSet = `
    <path d="M44 26 L30 32 L20 48 L32 54 L38 46 L37 66 H83 L82 46 L88 54 L100 48 L90 32 L76 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M44 26 Q60 34 76 26" fill="none" stroke="#ffffff" stroke-width="1.5"/>
    ${ribbon(60, 42, '#ffffff', 0.8)}
    <path d="M40 70 H80 L94 116 Q60 126 26 116 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M30 114 Q60 124 90 114" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
    ${ribbon(60, 72, '#ffffff', 0.7)}
  `;

  // 2. sportSet: Áo jersey sọc thể thao + quần shorts sporty (Blokecore)
  const sportSet = `
    <path d="M42 26 L28 32 L18 52 L30 56 L36 46 L35 70 H85 L84 46 L90 56 L102 52 L92 32 L78 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <text x="60" y="52" font-family="'Arial Black', sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">07</text>
    <path d="M28 32 L18 52 M92 32 L102 52" stroke="#ffffff" stroke-width="2" fill="none"/>
    <path d="M38 74 H82 L86 108 L62 108 L59 92 L56 108 L34 108 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M36 74 L34 108 M84 74 L86 108" stroke="#ffffff" stroke-width="2" fill="none"/>
  `;

  // 3. tennisSet: Áo polo cộc tay + váy xếp ly tennis (Sporty Chic)
  const tennisSet = `
    <path d="M44 26 L30 32 L20 48 L32 54 L38 46 L37 68 H83 L82 46 L88 54 L100 48 L90 32 L76 26 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M44 26 L52 38 L60 30 L68 38 L76 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M40 72 H80 L96 118 Q60 126 24 118 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M48 72 L44 118 M60 72 V120 M72 72 L76 118" stroke="${ink}" stroke-width="1.1" fill="none" opacity="0.4"/>
    <path d="M28 114 Q60 122 92 114" fill="none" stroke="${c}" stroke-width="3"/>
  `;

  // 4. knitSet: Áo dệt kim cổ lọ cộc tay + quần suông dài ấm áp (Clean Girl)
  const knitSet = `
    <path d="M50 20 H70 V28 H50 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M50 28 L36 36 L38 72 H82 L84 36 L70 28 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M44 34 V72 M52 34 V72 M60 34 V72 M68 34 V72 M76 34 V72" stroke="#ffffff" stroke-width="1" opacity="0.4"/>
    <path d="M38 76 H82 L90 130 H68 L60 90 L52 130 H30 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M44 76 L40 128 M76 76 L80 128" stroke="#ffffff" stroke-width="1" opacity="0.4"/>
  `;

  // 5. cargoSet: Croptop ôm sát + quần túi hộp parachute (Streetwear)
  const cargoSet = `
    <path d="M46 26 L36 34 L38 62 H82 L84 34 L74 26 L66 38 Q60 40 54 38 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M36 68 H84 L94 130 H66 L59 88 L52 130 H26 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="23" y="88" width="15" height="16" rx="2" fill="#ffffff" stroke="${ink}" stroke-width="1.1" opacity="0.6"/>
    <rect x="82" y="88" width="15" height="16" rx="2" fill="#ffffff" stroke="${ink}" stroke-width="1.1" opacity="0.6"/>
  `;

  // 6. denimSet: Áo gile bò Y2K cúc bạc + chân váy mini bò (Y2K)
  const denimSet = `
    <path d="M46 26 L34 36 L36 66 H84 L86 36 L74 26 L60 44 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="60" cy="48" r="1.3" fill="${silver}"/><circle cx="60" cy="56" r="1.3" fill="${silver}"/><circle cx="60" cy="64" r="1.3" fill="${silver}"/>
    <path d="M38 70 H82 L92 108 Q60 116 28 108 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M60 70 V110" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
    <path d="M30 106 L90 106" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2 2"/>
  `;

  // 7. academiaSet: Áo sơ mi caravat + áo gile len + váy xếp ly caro (Dark Academia)
  const academiaSet = `
    <path d="M46 24 L54 36 L60 30 L66 36 L74 24 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1"/>
    <path d="M58 32 L56 58 L60 64 L64 58 L62 32 Z" fill="#7f1d1d" stroke="${ink}" stroke-width="1.1"/>
    <path d="M44 26 L32 36 L34 68 H86 L88 36 L76 26 L66 40 L60 46 L54 40 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M38 72 H82 L96 116 Q60 124 24 116 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M44 72 L38 116 M52 72 L48 117 M68 72 L72 117 M76 72 L82 116" stroke="#18181b" stroke-width="1.2" fill="none" opacity="0.5"/>
  `;

  // 8. picnicSet: Áo tay bồng cổ vuông + chân váy hoa xòe bèo (Cottagecore)
  const picnicSet = `
    <ellipse cx="28" cy="38" rx="10" ry="12" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <ellipse cx="92" cy="38" rx="10" ry="12" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M38 32 Q60 42 82 32 L78 66 H42 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M38 32 Q60 42 82 32" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path d="M40 70 H80 L96 118 Q60 128 24 118 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="44" cy="96" r="2" fill="#ffffff"/><circle cx="76" cy="96" r="2" fill="#ffffff"/><circle cx="60" cy="108" r="2" fill="#ffffff"/>
    <path d="M26 116 Q60 126 94 116" fill="none" stroke="#ffffff" stroke-width="2"/>
  `;

  // 9. balletSet: Áo wrap chéo thắt nơ hông + váy tutu múa xòe voan (Balletcore)
  const balletSet = `
    <path d="M44 26 L28 34 L18 64 L30 68 L36 50 L36 68 H84 L84 50 L90 68 L102 64 L92 34 L76 26 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M44 26 L68 68 M76 26 L48 68" stroke="#ffffff" stroke-width="2" fill="none"/>
    ${ribbon(46, 68, '#ffffff', 0.8)}
    <path d="M38 72 H82 L96 98 Q60 106 24 98 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.7"/>
    <path d="M32 94 Q60 104 88 94 L102 120 Q60 130 18 120 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
  `;

  // 10. bohoSet: Áo yếm tua rua + chân váy maxi dài xẻ tà (Boho)
  const bohoSet = `
    <path d="M54 20 L48 34 M66 20 L72 34" stroke="${ink}" stroke-width="1.5"/>
    <path d="M46 34 L36 64 H84 L74 34 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M38 64 L36 74 M46 64 L45 76 M54 64 L54 77 M60 64 L60 78 M66 64 L66 77 M74 64 L75 76 M82 64 L84 74" stroke="${gold}" stroke-width="1.8"/>
    <path d="M38 78 H82 L94 132 H66 L64 96 L46 132 H26 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
  `;

  // 11. grungeSet: Áo thun rách cá tính + chân váy da đính xích (Grunge)
  const grungeSet = `
    <path d="M44 26 L30 32 L20 48 L32 54 L38 46 L37 66 H83 L82 46 L88 54 L100 48 L90 32 L76 26 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="60" cy="46" r="6" fill="${c}"/>
    <path d="M38 70 H82 L92 108 Q60 116 28 108 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M42 76 Q60 92 78 80" fill="none" stroke="${silver}" stroke-width="2.2" stroke-dasharray="3 2"/>
  `;

  // 12. poetSet: Áo blouse cổ bèo lá sen + quần âu cạp cao thắt đai (Poetcore)
  const poetSet = `
    <path d="M44 24 L28 32 L16 66 L28 70 L38 48 L36 74 H84 L82 48 L92 70 L104 66 L92 32 L76 24 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M44 24 C40 36 54 40 60 32 C66 40 80 36 76 24 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M36 74 H84 L92 132 H66 L59 90 L52 132 H28 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="36" y="74" width="48" height="6" fill="#ffffff" stroke="${ink}" stroke-width="1" opacity="0.4"/>
    ${ribbon(60, 76, '#ffffff', 0.6)}
  `;

  // === 6. GIÀY (SHOES - ĐẦY ĐỦ CÁC KIỂU DÁNG RIÊNG BIỆT) ===

  // Sneakers: Classic chunky white/pink platform sneakers
  const sneakers = `
    <path d="M22 66 L44 58 L64 82 L98 84 Q114 90 108 106 H16 Q10 94 18 78 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 68 L50 86 L74 86 Q86 86 96 92 L94 98 H24 Q18 88 38 68 Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M44 64 L56 78 M52 64 L64 78 M60 64 L72 78" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    <path d="M14 106 H110 V118 Q60 124 14 118 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
    <path d="M20 114 H104" stroke="${c}" stroke-width="1.8"/>
  `;

  // Retro Sneaker: Low-profile 70s runner with retro side wave stripe
  const retroSneaker = `
    <path d="M24 74 L42 66 L62 84 L96 86 Q112 90 108 106 H18 Q12 96 20 84 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M26 84 Q50 78 68 96 Q88 94 104 96" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
    <path d="M16 106 H110 V114 H16 Z" fill="#d4a373" stroke="${ink}" stroke-width="1.3"/>
  `;

  // Ballet Sneaker: Sporty sneaker with delicate criss-cross satin ribbon laces
  const balletSneaker = `
    <path d="M22 72 L44 64 L66 84 L98 86 Q112 90 108 106 H18 Q12 94 20 80 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M36 72 Q60 90 94 94" fill="none" stroke="${c}" stroke-width="3"/>
    <path d="M16 106 H110 V116 H16 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    ${ribbon(44, 60, c, 0.9)}
  `;

  // Platform: High chunky platform sneaker boot
  const platform = `
    <path d="M32 38 H64 L62 82 L104 90 Q114 96 108 108 H24 L22 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M20 108 H110 V126 H70 L64 116 L40 116 L36 126 H20 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
    <path d="M38 48 L56 52 M38 60 L56 64 M38 72 L56 76" stroke="#ffffff" stroke-width="2"/>
  `;

  // Trail: Gorpcore outdoor trail running shoe with lugged grip sole and cord lock
  const trail = `
    <path d="M20 68 L44 60 L68 82 L100 84 Q116 90 108 106 H16 Q10 94 18 78 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M40 68 L54 82 L64 68 L78 82" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M14 106 H110 V116 H14 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
    <path d="M22 116 V122 M34 116 V122 M48 116 V122 M62 116 V122 M76 116 V122 M90 116 V122 M102 116 V122" stroke="#18181b" stroke-width="4"/>
  `;

  // Combat Boots: Tall lace-up grunge boots with chunky tread
  const boots = `
    <path d="M34 32 H66 L64 82 L102 92 Q112 98 106 112 H26 L24 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 112 H108 V124 H24 Z" fill="#09090b" stroke="${ink}" stroke-width="1.4"/>
    <path d="M30 124 V128 M44 124 V128 M58 124 V128 M72 124 V128 M86 124 V128 M100 124 V128" stroke="#09090b" stroke-width="4"/>
    <path d="M40 44 L58 48 M40 56 L58 60 M40 68 L58 72 M40 80 L58 84" stroke="${gold}" stroke-width="1.8" stroke-linecap="round"/>
  `;

  // Chelsea Boots: Sleek ankle boots with elastic U-side gore and pull tab
  const chelsea = `
    <path d="M34 38 H66 L64 84 L102 92 Q112 98 106 112 H26 L24 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="46" y="32" width="8" height="8" rx="2" fill="#18181b" stroke="${ink}" stroke-width="1"/>
    <path d="M44 42 H56 V72 Q50 78 44 72 Z" fill="#18181b" stroke="${ink}" stroke-width="1.2"/>
    <path d="M24 112 H108 V120 H64 L60 114 L36 114 L34 120 H24 Z" fill="#09090b" stroke="${ink}" stroke-width="1.4"/>
  `;

  // Western Boots: Cowboy boots with pointed toe, curved scallop shaft, and pull straps
  const western = `
    <path d="M34 38 Q50 50 66 38 L64 84 L104 94 Q114 98 104 112 H28 L24 94 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="30" y="36" width="5" height="12" rx="1.5" fill="${ink}" opacity="0.4"/>
    <rect x="65" y="36" width="5" height="12" rx="1.5" fill="${ink}" opacity="0.4"/>
    <path d="M40 54 Q50 66 60 54 M42 64 Q50 74 58 64" fill="none" stroke="${gold}" stroke-width="1.4"/>
    <path d="M26 112 H106 V120 H54 L44 114 L38 122 H24 Z" fill="#6f4e37" stroke="${ink}" stroke-width="1.3"/>
  `;

  // Ankle Boots: Heeled clean ankle booties
  const ankleBoots = `
    <path d="M34 34 H64 L62 82 L102 92 Q112 98 104 110 H26 L24 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 46 L58 50 M38 58 L58 62 M38 70 L58 74" stroke="${silver}" stroke-width="1.8"/>
    <path d="M24 110 H106 V120 H64 L60 114 L36 114 L34 120 H24 Z" fill="#d4a373" stroke="${ink}" stroke-width="1.3"/>
  `;

  // Heels: Pointed-toe stiletto pump
  const heels = `
    <path d="M24 72 L42 62 L66 90 L104 100 Q112 108 92 110 L64 110 L42 90 L34 112 H26 L28 84 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M32 82 L34 114 H28 L27 82 Z" fill="#18181b" stroke="${ink}" stroke-width="1.2"/>
    <path d="M36 74 Q24 58 26 84" fill="none" stroke="${c}" stroke-width="3"/>
  `;

  // Slingback: Pointed toe slingback with kitten heel and open back strap
  const slingback = `
    <path d="M34 76 L48 68 L68 92 L106 102 Q114 108 94 110 L64 110 L48 92 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M48 68 Q30 68 28 84 Q30 92 48 92" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M42 92 L40 112 H36 L39 92 Z" fill="${ink}" stroke="${ink}" stroke-width="1.2"/>
  `;

  // Crystal Heel: Evening pump with sparkling crystal brooch on toe
  const crystalHeel = `
    <path d="M24 72 L42 62 L66 90 L104 100 Q112 108 92 110 L64 110 L42 90 L34 112 H26 L28 84 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M32 82 L34 114 H28 L27 82 Z" fill="#18181b" stroke="${ink}" stroke-width="1.2"/>
    <polygon points="94,92 98,96 94,100 90,96" fill="${silver}" stroke="${ink}" stroke-width="1"/>
    <polygon points="98,92 102,96 98,100 94,96" fill="#ffffff" stroke="${ink}" stroke-width="1"/>
    <polygon points="94,88 98,92 94,96 90,92" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // Mule: Heeled open-back slide mule with wide strap
  const mule = `
    <path d="M40 70 L64 88 L104 98 Q112 106 94 108 L58 108 L44 92 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M24 88 H58 V94 H24 Z" fill="#d4a373" stroke="${ink}" stroke-width="1.2"/>
    <path d="M28 94 H38 V114 H28 Z" fill="${ink}" stroke="${ink}" stroke-width="1.2"/>
  `;

  // Mary Jane: Retro platform double-strap Mary Janes with silver buckles
  const maryJane = `
    <path d="M20 74 Q30 64 44 70 L68 90 L96 88 Q112 88 110 102 Q75 120 22 106 Q12 98 20 74 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 74 L52 92 M50 72 L60 90" stroke="${ink}" stroke-width="3.5"/>
    <rect x="42" y="78" width="6" height="5" fill="${silver}" stroke="${ink}" stroke-width="0.8"/>
    <rect x="50" y="76" width="6" height="5" fill="${silver}" stroke="${ink}" stroke-width="0.8"/>
    <path d="M18 106 H110 V118 H60 L54 112 L46 118 H20 Z" fill="#09090b" stroke="${ink}" stroke-width="1.4"/>
  `;

  // Ballet Flats: Flat round-toe ballet slippers with criss-cross ribbons
  const ballet = `
    <path d="M38 52 L56 74 M56 52 L38 74 M40 68 L58 90 M58 68 L40 90" stroke="${c}" stroke-width="2.5" fill="none"/>
    <path d="M20 84 Q30 76 46 80 L72 94 L98 94 Q110 96 108 104 Q75 116 22 106 Q14 100 20 84 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="48" cy="82" r="2.5" fill="#ffffff"/>
    <path d="M18 106 H108 V110 H18 Z" fill="#d4a373" stroke="${ink}" stroke-width="1.2"/>
  `;

  // Mesh Flat: Sheer mesh pointed toe flats with delicate piping
  const meshFlat = `
    <path d="M20 82 Q30 74 46 78 L72 92 L102 92 Q114 96 110 104 Q75 116 22 106 Q14 100 20 82 Z" fill="${c}" opacity="0.5" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M46 78 L52 92 M56 78 L62 92 M66 80 L72 94 M76 82 L82 96 M86 86 L92 98" stroke="${ink}" stroke-width="1" opacity="0.3"/>
    <path d="M18 106 H110 V111 H18 Z" fill="#18181b" stroke="${ink}" stroke-width="1.2"/>
  `;

  // Sandals: Platform chunky-strap summer sandals
  const sandals = `
    <path d="M20 98 L40 68 L106 98 Q116 104 104 114 L24 114 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.4"/>
    <path d="M34 76 L58 102 M64 80 L84 106 M36 70 V42 L52 34 L62 64 L46 78" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
    <path d="M20 114 H106 V124 H20 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
  `;

  // Fisherman: Caged leather fisherman sandals with ankle buckle
  const fisherman = `
    <path d="M34 68 H54 V74 H34 Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <rect x="36" y="69" width="5" height="4" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
    <path d="M24 100 L44 76 L70 94 L102 96 Q112 100 106 108 H22 Z" fill="#ffffff" opacity="0.2" stroke="${ink}" stroke-width="1.2"/>
    <path d="M58 84 V108 M70 88 V108 M82 92 V108 M94 94 V108" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M20 108 H108 V118 H20 Z" fill="#5c4033" stroke="${ink}" stroke-width="1.3"/>
  `;

  // Loafers: Polished penny loafers with gold horsebit hardware
  const loafers = `
    <path d="M20 74 Q30 64 44 70 L68 90 L96 88 Q112 88 110 102 Q75 120 22 106 Q12 98 20 74 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M50 82 H76" stroke="${gold}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="50" cy="82" r="2.5" fill="${gold}"/>
    <circle cx="76" cy="82" r="2.5" fill="${gold}"/>
    <path d="M18 106 H110 V116 H54 L48 110 L40 116 H20 Z" fill="#09090b" stroke="${ink}" stroke-width="1.3"/>
  `;

  // === 7. TÚI XÁCH (BAGS - TỪNG LOẠI CÓ DÁNG RIÊNG) ===

  // Handbag / topHandle: Classic structured satchel with top handle and padlock
  const handbag = `
    <path d="M44 56 V36 Q60 14 76 36 V56" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>
    <rect x="24" y="54" width="72" height="58" rx="10" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M24 74 H96" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
    <rect x="55" y="72" width="10" height="12" rx="2" fill="${gold}" stroke="${ink}" stroke-width="1"/>
    <path d="M57 72 V68 Q60 65 63 68 V72" fill="none" stroke="${gold}" stroke-width="1.8"/>
  `;

  // Ribbon Bag: Baguette shoulder bag with large draped ribbon bows on the strap
  const ribbonBag = `
    <path d="M32 64 V30 Q60 4 88 30 V64" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M18 64 Q60 92 102 64 L100 96 Q60 128 20 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    ${ribbon(30, 48, '#ffffff', 1.1)}
    ${ribbon(90, 48, '#ffffff', 1.1)}
  `;

  // Shoulder Bag: Standard 90s baguette bag
  const shoulderBag = `
    <path d="M32 64 V30 Q60 4 88 30 V64" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M18 64 Q60 92 102 64 L100 96 Q60 128 20 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="54" y="74" width="12" height="10" rx="2" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // Crescent: Curved moon crescent hobo shoulder bag with top zipper
  const crescent = `
    <path d="M28 54 Q60 10 92 54" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
    <path d="M16 64 C22 108 98 108 104 64 C86 86 34 86 16 64 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M26 68 Q60 84 94 68" fill="none" stroke="${gold}" stroke-width="2"/>
  `;

  // East-West: Elongated horizontal slim East-West baguette
  const eastWest = `
    <path d="M36 68 V32 Q60 12 84 32 V68" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="12" y="68" width="96" height="38" rx="8" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M12 82 H108" stroke="#ffffff" stroke-width="1.8" opacity="0.7"/>
    <circle cx="60" cy="82" r="3" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // Bowling: Structured round barrel bowling bag with dual top handles and sporty stripes
  const bowling = `
    <path d="M42 54 V28 Q60 16 78 28 V54" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="20" y="52" width="80" height="56" rx="24" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M42 52 V108 M78 52 V108" stroke="#ffffff" stroke-width="4"/>
    <circle cx="60" cy="80" r="6" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // Bucket: Round base drawstring bucket bag with cord and beads
  const bucket = `
    <path d="M36 48 V22 Q60 6 84 22 V48" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M30 48 Q60 54 90 48 L96 112 Q60 122 24 112 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M28 52 Q60 60 92 52" fill="none" stroke="#ffffff" stroke-width="2.5"/>
    <circle cx="55" cy="64" r="3" fill="${gold}"/><circle cx="65" cy="64" r="3" fill="${gold}"/>
    <path d="M55 67 L53 82 M65 67 L67 82" stroke="#ffffff" stroke-width="1.8"/>
  `;

  // Hobo: Slouchy relaxed oversized hobo bag with slouch crease
  const hobo = `
    <path d="M26 60 Q60 14 94 60" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
    <path d="M16 66 C10 114 110 114 104 66 C78 84 42 84 16 66 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M34 82 Q60 96 86 82" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.4"/>
  `;

  // Chain Bag: Quilted flap handbag with gold metal chain strap
  const chainBag = `
    <path d="M34 60 V26 Q60 10 86 26 V60" fill="none" stroke="${gold}" stroke-width="3" stroke-dasharray="4 2" stroke-linecap="round"/>
    <rect x="22" y="58" width="76" height="54" rx="6" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M22 58 L60 88 L98 58" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.3"/>
    <path d="M36 60 L84 110 M60 60 L98 100 M24 74 L60 110" stroke="#ffffff" stroke-width="1" opacity="0.5" fill="none"/>
    <circle cx="60" cy="88" r="3.5" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // Heart Bag: Structured 3D sweet candy heart bag with top handle and zip
  const heartBag = `
    <path d="M48 48 V34 Q60 22 72 34 V48" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M60 116 C30 96 16 78 16 58 C16 42 30 38 44 46 C52 50 60 58 60 58 C60 58 68 50 76 46 C90 38 104 42 104 58 C104 78 90 96 60 116 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="60" cy="74" r="4" fill="#ffffff" opacity="0.8"/>
    ${ribbon(60, 56, '#ffffff', 0.8)}
  `;

  // Satchel: Structured vintage school satchel with double straps and brass buckles
  const satchel = `
    <path d="M46 54 V38 Q60 24 74 38 V54" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <rect x="20" y="54" width="80" height="56" rx="6" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M20 54 H100 V82 H20 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" opacity="0.3"/>
    <rect x="34" y="54" width="6" height="36" fill="#4a2c17"/>
    <rect x="80" y="54" width="6" height="36" fill="#4a2c17"/>
    <rect x="33" y="78" width="8" height="6" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
    <rect x="79" y="78" width="8" height="6" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
  `;

  // Utility Bag: Crossbody utility bag with front zip pouch and clips
  const utilityBag = `
    <path d="M26 66 L50 20 L94 66" fill="none" stroke="#18181b" stroke-width="4" stroke-linecap="round"/>
    <rect x="20" y="62" width="80" height="52" rx="10" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <rect x="32" y="78" width="56" height="30" rx="4" fill="#18181b" stroke="${ink}" stroke-width="1.2"/>
    <path d="M36 84 H84" stroke="${silver}" stroke-width="2"/>
  `;

  // Pouch: Metallic evening pouch clutch with gathered top ruffle
  const pouch = `
    <path d="M36 58 Q60 48 84 58 L92 108 Q60 120 28 108 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M36 58 Q60 66 84 58" fill="none" stroke="${gold}" stroke-width="2.5"/>
    <circle cx="60" cy="62" r="3" fill="${gold}"/>
    <path d="M84 58 Q100 40 96 26 Q86 26 84 48" fill="none" stroke="${gold}" stroke-width="2"/>
  `;

  // Charm Bag: Baguette shoulder bag decorated with cute dangling charms
  const charmBag = `
    <path d="M32 64 V30 Q60 4 88 30 V64" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M18 64 Q60 92 102 64 L100 96 Q60 128 20 96 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M36 82 L34 98 M34 98 L36 102 M48 86 L48 104" stroke="${silver}" stroke-width="1.5"/>
    <polygon points="34,102 36,106 40,106 37,109 38,113 34,110 30,113 31,109 28,106 32,106" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
    <circle cx="48" cy="106" r="3.5" fill="#ff7da7" stroke="${ink}" stroke-width="0.8"/>
  `;

  // Fringe Bag: Suede crossbody bag with swaying western fringes
  const fringeBag = `
    <path d="M26 66 L50 20 L94 66" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 64 H96 V94 Q60 110 24 94 Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M28 94 L26 126 M36 98 L34 130 M44 102 L42 132 M52 104 L52 134 M60 105 L60 135 M68 104 L68 134 M76 102 L78 132 M84 98 L86 130 M92 94 L94 126" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="60" cy="80" r="3.5" fill="${gold}"/>
  `;

  // Backpack: Mini pastel leather backpack with ears & ribbon
  const backpack = `
    <path d="M34 50 C34 26 86 26 86 50 L90 108 Q60 114 30 108 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 74 C38 64 82 64 82 74 L84 104 Q60 110 36 104 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.7"/>
    <path d="M38 74 Q60 70 82 74" fill="none" stroke="${gold}" stroke-width="2"/>
    ${ribbon(60, 52, '#ffffff', 0.9)}
  `;

  // Tote Bag / Tote: Canvas tote with dual shoulder straps
  const toteBag = `
    <path d="M42 54 V26 M78 54 V26" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M22 52 H98 L92 118 Q60 124 28 118 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M42 52 V82 M78 52 V82" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
    <path d="M60 82 C57 78 52 79 52 83 C52 88 60 92 60 93 C60 92 68 88 68 83 C68 79 63 78 60 82 Z" fill="#ffffff"/>
  `;

  // Book Tote: Structured rectangular tote bag with book graphic
  const bookTote = `
    <path d="M42 52 V24 M78 52 V24" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="22" y="50" width="76" height="68" rx="4" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <rect x="38" y="68" width="44" height="32" rx="2" fill="#ffffff" stroke="${ink}" stroke-width="1" opacity="0.8"/>
    <path d="M60 68 V100" stroke="${ink}" stroke-width="1.2"/>
    <path d="M42 76 H56 M42 84 H56 M64 76 H78 M64 84 H78" stroke="${ink}" stroke-width="1" opacity="0.5"/>
  `;

  // Crochet Bag: Cottagecore crochet openwork knit tote with flower motif
  const crochetBag = `
    <path d="M38 52 Q60 16 82 52" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M24 52 H96 L90 116 Q60 126 30 116 Z" fill="${c}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="60" cy="84" r="6" fill="${gold}" stroke="${ink}" stroke-width="1"/>
    <circle cx="60" cy="72" r="5" fill="#ffffff" stroke="${ink}" stroke-width="0.8"/>
    <circle cx="60" cy="96" r="5" fill="#ffffff" stroke="${ink}" stroke-width="0.8"/>
    <circle cx="48" cy="84" r="5" fill="#ffffff" stroke="${ink}" stroke-width="0.8"/>
    <circle cx="72" cy="84" r="5" fill="#ffffff" stroke="${ink}" stroke-width="0.8"/>
  `;

  // Crossbody: Rounded flap messenger crossbody
  const crossbody = `
    <path d="M28 66 L50 20 L92 66" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    <rect x="22" y="64" width="76" height="52" rx="8" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M22 64 H98 V86 L60 100 L22 86 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.6"/>
    <circle cx="60" cy="88" r="3" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // Clutch: Sleek envelope evening clutch with gold lock
  const clutch = `
    <rect x="20" y="66" width="80" height="48" rx="5" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M20 66 L60 94 L100 66" fill="#ffffff" stroke="${ink}" stroke-width="1.3" opacity="0.4"/>
    <rect x="56" y="88" width="8" height="10" rx="1.5" fill="${gold}" stroke="${ink}" stroke-width="1"/>
  `;

  // === 8. PHỤ KIỆN (ACCESSORIES) ===

  // Sunglasses: Retro cat-eye sunglasses with tinted lenses
  const sunglasses = `
    <path d="M12 60 L6 50 M108 60 L114 50" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M48 64 Q60 58 72 64" fill="none" stroke="${ink}" stroke-width="3.5"/>
    <path d="M12 56 Q30 52 48 64 Q44 86 28 84 Q12 80 12 56 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M108 56 Q90 52 72 64 Q76 86 92 84 Q108 80 108 56 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <ellipse cx="30" cy="70" rx="14" ry="10" fill="#18181b" opacity="0.6"/>
    <ellipse cx="90" cy="70" rx="14" ry="10" fill="#18181b" opacity="0.6"/>
  `;

  // Hat: Streetwear bucket hat with embroidered badge
  const hat = `
    <path d="M32 74 C28 36 92 36 88 74 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M18 74 Q60 84 102 74 L108 92 Q60 104 12 92 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <circle cx="60" cy="56" r="4" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
  `;

  // Cap: Sporty baseball cap with curved visor and letter badge
  const cap = `
    <path d="M30 76 C26 38 88 38 90 76 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <circle cx="60" cy="40" r="2.5" fill="#ffffff"/>
    <path d="M30 76 Q60 82 90 76 L112 88 Q60 102 24 88 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
    <text x="60" y="62" font-family="'Arial Black', sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">B</text>
  `;

  // Hair Accessories: Pastel hair clips
  const hair = `
    <rect x="22" y="58" width="34" height="10" rx="5" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="39" cy="63" r="3" fill="#ffffff"/>
    <rect x="64" y="58" width="34" height="10" rx="5" fill="#ffffff" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="81" cy="63" r="3" fill="${c}"/>
  `;

  // Jewelry / Necklace: Pearl strand necklace with heart pendant
  const jewelry = `
    <path d="M30 42 Q60 88 90 42" fill="none" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="36" cy="52" r="2.5" fill="#ffffff" stroke="${ink}" stroke-width="0.6"/>
    <circle cx="44" cy="64" r="2.5" fill="#ffffff" stroke="${ink}" stroke-width="0.6"/>
    <circle cx="52" cy="74" r="2.5" fill="#ffffff" stroke="${ink}" stroke-width="0.6"/>
    <circle cx="68" cy="74" r="2.5" fill="#ffffff" stroke="${ink}" stroke-width="0.6"/>
    <circle cx="76" cy="64" r="2.5" fill="#ffffff" stroke="${ink}" stroke-width="0.6"/>
    <circle cx="84" cy="52" r="2.5" fill="#ffffff" stroke="${ink}" stroke-width="0.6"/>
    <path d="M60 76 C56 70 48 72 48 78 C48 86 60 92 60 93 C60 92 72 86 72 78 C72 72 64 70 60 76 Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="58" cy="76" r="1.5" fill="#ffffff"/>
  `;

  // Accessory capsule: ten distinct boutique pieces.
  const daisyClips = `
    <g transform="translate(34 62)"><circle r="5" fill="${gold}" stroke="${ink}" stroke-width="1"/><g fill="#fff" stroke="${ink}" stroke-width=".8"><ellipse cy="-9" rx="5" ry="7"/><ellipse cx="9" rx="7" ry="5"/><ellipse cy="9" rx="5" ry="7"/><ellipse cx="-9" rx="7" ry="5"/></g><circle r="3.5" fill="${gold}"/></g>
    <path d="M48 61 H88" stroke="${c}" stroke-width="8" stroke-linecap="round"/><path d="M50 58 H86" stroke="#fff" stroke-width="1.5" opacity=".7"/>`;
  const pearlHeadband = `
    <path d="M25 84 Q28 25 60 24 Q92 25 95 84" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
    <path d="M25 84 Q28 25 60 24 Q92 25 95 84" fill="none" stroke="${c}" stroke-width="5"/>
    ${[34,44,54,64,74,84].map(x => `<circle cx="${x}" cy="${37 - Math.abs(59-x)*.42}" r="3.2" fill="#fff" stroke="${ink}" stroke-width=".8"/>`).join('')}`;
  const satinBow = `
    <g transform="translate(60 70) scale(.72) translate(-60 -70)">
      <path d="M57 52 C42 28 15 28 17 48 C18 63 39 67 58 57Z" fill="${c}" stroke="${ink}" stroke-width="1.6"/>
      <path d="M63 52 C78 28 105 28 103 48 C102 63 81 67 62 57Z" fill="${c}" stroke="${ink}" stroke-width="1.6"/>
      <path d="M53 58 C47 78 42 101 45 124 L59 109 L65 124 C67 96 65 76 63 58Z" fill="${c}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M67 58 C76 76 82 96 84 116 L72 106 L65 124 C65 91 62 73 59 58Z" fill="${c}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round" opacity=".9"/>
      <ellipse cx="60" cy="55" rx="9" ry="8" fill="#ff7da7" stroke="${ink}" stroke-width="1.4"/>
      <circle cx="60" cy="54" r="3" fill="${gold}" stroke="${ink}" stroke-width=".8"/>
      <path d="M26 45 Q39 38 53 50 M94 45 Q81 38 67 50 M50 68 Q52 91 49 111 M71 67 Q76 87 79 103" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".72"/>
    </g>`;
  const heartChoker = `
    <path d="M24 54 Q60 72 96 54" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
    <path d="M24 54 Q60 72 96 54" fill="none" stroke="${ink}" stroke-width="1.4"/>
    <path d="M60 69 C54 60 43 65 47 74 C50 81 60 87 60 87 C60 87 70 81 73 74 C77 65 66 60 60 69Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/><path d="M55 69 Q59 65 63 68" fill="none" stroke="#fff" stroke-width="1.5"/>`;
  const pearlEarrings = `
    <g stroke="${ink}" stroke-width="1"><circle cx="34" cy="44" r="3" fill="${gold}"/><path d="M34 47 V63"/><circle cx="34" cy="69" r="7" fill="#fff"/><circle cx="32" cy="67" r="2" fill="#fff" opacity=".8"/></g>
    <g stroke="${ink}" stroke-width="1"><circle cx="86" cy="44" r="3" fill="${gold}"/><path d="M86 47 V63"/><circle cx="86" cy="69" r="7" fill="#fff"/><circle cx="84" cy="67" r="2" fill="#fff" opacity=".8"/></g>`;
  const charmBracelet = `
    <ellipse cx="60" cy="70" rx="32" ry="24" fill="none" stroke="${c}" stroke-width="6"/>
    <ellipse cx="60" cy="70" rx="32" ry="24" fill="none" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="31" cy="78" r="4" fill="${gold}" stroke="${ink}" stroke-width="1"/><path d="M88 76 C84 70 78 74 81 80 C83 84 88 87 88 87 C88 87 93 84 95 80 C98 74 92 70 88 76Z" fill="#ff7da7" stroke="${ink}" stroke-width="1"/>`;
  const heartGlasses = `
    <path d="M11 57 L5 50 M109 57 L115 50 M48 62 Q60 56 72 62" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 59 C21 47 8 56 13 69 C17 79 30 87 30 87 C30 87 43 79 47 69 C52 56 39 47 30 59Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M90 59 C81 47 68 56 73 69 C77 79 90 87 90 87 C90 87 103 79 107 69 C112 56 99 47 90 59Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/><path d="M19 61 Q25 56 31 60 M79 61 Q85 56 91 60" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`;
  const wireGlasses = `
    <path d="M10 62 L4 55 M110 62 L116 55 M48 63 Q60 58 72 63" fill="none" stroke="${gold}" stroke-width="2.6"/>
    <ellipse cx="31" cy="68" rx="18" ry="15" fill="#fff" fill-opacity=".18" stroke="${gold}" stroke-width="2.5"/><ellipse cx="89" cy="68" rx="18" ry="15" fill="#fff" fill-opacity=".18" stroke="${gold}" stroke-width="2.5"/><path d="M19 62 Q29 55 39 61 M77 62 Q87 55 97 61" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`;
  const ribbonBeret = `
    <path d="M24 67 C24 29 94 27 98 65 C87 82 37 86 24 67Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/><path d="M38 43 Q59 31 82 43" fill="none" stroke="#fff" stroke-width="2" opacity=".65"/><path d="M61 29 V23" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>${ribbon(83, 61, '#ff7da7', .62)}`;
  const bucketHat = `
    <path d="M32 68 C28 32 92 32 88 68Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/><path d="M18 68 Q60 82 102 68 L108 88 Q60 103 12 88Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/><path d="M24 76 Q60 87 96 76 M30 51 Q60 60 90 51" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/><circle cx="60" cy="52" r="5" fill="#fff" stroke="${ink}" stroke-width="1"/><path d="M60 48 L61 51 L65 51 L62 53 L63 57 L60 55 L57 57 L58 53 L55 51 L59 51Z" fill="${gold}"/>`;

  // Choker / Belt: Belt with buckle
  const belt = `
    <path d="M22 66 H98 V78 H22 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <rect x="52" y="63" width="16" height="18" rx="2" fill="${silver}" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="36" cy="72" r="1.8" fill="${silver}"/>
    <circle cx="84" cy="72" r="1.8" fill="${silver}"/>
  `;

  // Leg Warmers: Fluffy knit leg warmers with bows
  const legWarmers = `
    <path d="M24 38 Q38 34 52 38 L48 116 Q36 124 20 114 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M24 46 Q38 42 52 46 M22 68 Q36 64 50 68 M20 90 Q34 86 48 90" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
    ${ribbon(36, 42, '#ffffff', 0.6)}
    <path d="M68 38 Q82 34 96 38 L100 114 Q84 124 72 116 Z" fill="${c}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M68 46 Q82 42 96 46 M70 68 Q84 64 98 68 M72 90 Q86 86 100 90" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
    ${ribbon(84, 42, '#ffffff', 0.6)}
  `;

  // Socks: Ankle frill socks
  const socks = socksSilhouette(c);

  // Bow: Big statement coquette ribbon hair bow
  const bow = ribbon(60, 60, c, 1.8);

  // Boutique capsule variants: richer stitching, fabric highlights and signature details.
  // These keep the established silhouettes while giving the new collection its own finish.
  const atelierOversizedTee = `${oversizedTee}
    <path d="M35 84 Q60 89 85 84" fill="none" stroke="${ink}" stroke-width="1" opacity=".32" stroke-dasharray="3 2"/>
    <rect x="47" y="43" width="26" height="27" rx="7" fill="#fff" opacity=".2"/>
    <path d="M53 55 Q60 47 67 55 Q60 66 53 55Z" fill="#ff7da7" stroke="#fff" stroke-width="1.2"/>`;
  const atelierCropTop = `${cropTop}
    <path d="M43 35 Q60 49 77 35" fill="none" stroke="#fff" stroke-width="2" opacity=".72"/>
    <path d="M43 64 Q60 69 77 64" fill="none" stroke="${gold}" stroke-width="1.4"/>
    ${ribbon(60, 62, '#ff7da7', .55)}`;
  const atelierCamisole = `${camisole}
    <path d="M42 48 Q60 56 78 48" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>
    <path d="M45 75 Q60 80 75 75" fill="none" stroke="${gold}" stroke-width="1" stroke-dasharray="2 2"/>
    ${ribbon(60, 48, '#fff', .45)}`;
  const atelierOffShoulder = `${offShoulder}
    <path d="M34 67 Q60 74 86 67" fill="none" stroke="${gold}" stroke-width="1.2" opacity=".9"/>
    <circle cx="29" cy="51" r="2" fill="#fff"/><circle cx="91" cy="51" r="2" fill="#fff"/>`;
  const atelierShirt = `${shirt}
    <path d="M40 83 Q60 88 80 83" fill="none" stroke="${ink}" stroke-width="1" opacity=".28" stroke-dasharray="3 2"/>
    <path d="M45 51 H51 M69 51 H75" stroke="#fff" stroke-width="1.4" opacity=".75"/>`;
  const atelierCardigan = `${cardigan}
    <path d="M42 40 Q47 46 42 52 M78 40 Q73 46 78 52" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55"/>
    <path d="M39 84 Q60 89 81 84" fill="none" stroke="${gold}" stroke-width="1.1"/>`;
  const atelierCorset = `${corset}
    <path d="M44 82 Q60 90 76 82" fill="none" stroke="${gold}" stroke-width="1.5"/>
    <circle cx="47" cy="46" r="1.5" fill="${gold}"/><circle cx="73" cy="46" r="1.5" fill="${gold}"/>`;
  const atelierBlazer = `${blazer}
    <path d="M42 88 H53 M67 88 H78" stroke="${gold}" stroke-width="1.3"/>
    <path d="M30 40 L23 77 M90 40 L97 77" stroke="#fff" stroke-width="1.2" opacity=".5"/>`;
  const atelierWideJeans = `${wideLeg}
    <path d="M40 51 Q49 57 55 50 M80 51 Q71 57 65 50" fill="none" stroke="${gold}" stroke-width="1.2"/>
    <path d="M31 123 H53 M67 123 H89" stroke="#fff" stroke-width="2" opacity=".48"/>`;
  const atelierStraightJeans = `${straight}
    <path d="M39 52 Q47 59 54 51 M81 52 Q73 59 66 51" fill="none" stroke="${gold}" stroke-width="1.2"/>
    <path d="M33 124 H51 M69 124 H87" stroke="#fff" stroke-width="1.6" opacity=".5"/>`;
  const atelierCargo = `${cargo}
    <path d="M27 72 H35 M85 72 H93 M28 98 H35 M85 98 H92" stroke="${gold}" stroke-width="1.1"/>
    <path d="M29 124 H50 M70 124 H91" stroke="#fff" stroke-width="1.7" opacity=".42"/>`;
  const atelierDenimShorts = `${shorts}
    <path d="M41 60 Q48 67 55 60 M79 60 Q72 67 65 60" fill="none" stroke="${gold}" stroke-width="1.2"/>
    <path d="M35 87 L43 90 M77 90 L85 87" stroke="#fff" stroke-width="1.5" opacity=".65"/>`;
  const atelierPleatedSkirt = `${pleatedSkirt}
    <path d="M29 104 Q60 114 91 104" fill="none" stroke="#fff" stroke-width="2" opacity=".62"/>
    ${ribbon(75, 56, '#ff7da7', .45)}`;
  const atelierAlineSkirt = `${alineSkirt}
    <path d="M38 54 H82 V61 H38Z" fill="${ink}" opacity=".18"/>
    <rect x="55" y="53" width="10" height="9" rx="2" fill="none" stroke="${gold}" stroke-width="1.4"/>
    <path d="M29 107 Q60 116 91 107" fill="none" stroke="#fff" stroke-width="1.6" opacity=".55"/>`;
  const atelierMiniDress = `${miniDress}
    <path d="M32 100 Q60 111 88 100" fill="none" stroke="${gold}" stroke-width="1.5"/>
    ${ribbon(60, 82, '#ff7da7', .6)}`;
  const atelierMaxiDress = `${maxiDress}
    <path d="M35 64 Q60 72 85 64" fill="none" stroke="${gold}" stroke-width="1.5"/>
    <path d="M21 126 Q60 136 99 126" fill="none" stroke="#fff" stroke-width="2" opacity=".72"/>
    ${ribbon(60, 55, '#fff', .58)}`;
  const atelierSneakers = `${sneakers}
    <path d="M20 85 L45 91 M75 91 L100 85" stroke="${gold}" stroke-width="1.5"/>
    <path d="M25 77 L37 84 M83 84 L95 77" stroke="#fff" stroke-width="2" opacity=".85"/>
    <circle cx="48" cy="91" r="2" fill="#ff7da7"/><circle cx="72" cy="91" r="2" fill="#ff7da7"/>`;

  return {
    // Tops
    babyTee,
    tee: babyTee,
    tshirt,
    oversizedTee,
    jersey,
    offShoulder,
    shirt,
    corset,
    halterTop,
    ribbonTop,
    graphicTee,
    cropTop,
    tubeTop,
    camisole,
    longSleeve,
    laceUpTop,
    blouse,
    cardigan,
    atelierOversizedTee,
    atelierCropTop,
    atelierCamisole,
    atelierOffShoulder,
    atelierShirt,
    atelierCardigan,
    atelierCorset,

    // Sets (12 individual distinct sets)
    bowSet,
    sportSet,
    tennisSet,
    knitSet,
    cargoSet,
    denimSet,
    academiaSet,
    picnicSet,
    balletSet,
    bohoSet,
    grungeSet,
    poetSet,

    // Dresses & Skirts
    dress,
    lolitaDress,
    miniDress,
    slipDress,
    maxiDress,
    floralMaxi,
    laceMaxi,
    skirt: pleatedSkirt,
    pleated: pleatedSkirt,
    pleatedSkirt,
    bubble,
    denimSkirt,
    ruffleSkirt,
    alineSkirt,
    atelierPleatedSkirt,
    atelierAlineSkirt,
    atelierMiniDress,
    atelierMaxiDress,

    // Outerwear
    blazer,
    atelierBlazer,
    denimJacket,
    leatherJacket,
    hoodie,
    trench,
    pufferJacket,

    // Pants
    wideLeg,
    straight,
    pants: straight,
    cargo,
    cargoPants: cargo,
    shorts,
    atelierWideJeans,
    atelierStraightJeans,
    atelierCargo,
    atelierDenimShorts,
    cyclingShorts,
    jogger,

    // Shoes (Distinct models)
    sneakers,
    atelierSneakers,
    shoes: sneakers,
    retroSneaker,
    balletSneaker,
    platform,
    trail,
    boots,
    combatBoot: boots,
    chelsea,
    western,
    ankleBoots,
    heels,
    heel: heels,
    slingback,
    crystalHeel,
    mule,
    maryJane,
    ballet,
    meshFlat,
    sandals,
    sandal: sandals,
    fisherman,
    loafers,
    loafer: loafers,

    // Bags (Distinct models)
    handbag,
    topHandle: handbag,
    bag: handbag,
    ribbonBag,
    shoulderBag,
    shoulder: shoulderBag,
    crescent,
    eastWest,
    bowling,
    bucket,
    hobo,
    chainBag,
    heartBag,
    satchel,
    utilityBag,
    pouch,
    charmBag,
    fringeBag,
    backpack,
    toteBag,
    tote: toteBag,
    bookTote,
    crochetBag,
    crossbody,
    clutch,

    // Accessories
    sunglasses,
    glasses: sunglasses,
    hat,
    cap,
    hair,
    bow,
    necklace: jewelry,
    jewelry,
    daisyClips,
    pearlHeadband,
    satinBow,
    heartChoker,
    pearlEarrings,
    charmBracelet,
    heartGlasses,
    wireGlasses,
    ribbonBeret,
    bucketHat,
    belt,
    legWarmers,
    socks,
  };
}

function socksSilhouette(c: string) {
  const ink = '#4a2d5a';
  return `
    <path d="M26 40 H52 L48 116 Q35 128 18 115 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M70 40 H96 L102 116 Q85 128 68 115 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M26 40 Q39 34 52 40 M70 40 Q83 34 96 40" fill="none" stroke="#ffffff" stroke-width="2.5"/>
  `;
}
