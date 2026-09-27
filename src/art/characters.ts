import type { Customer, Product } from '../types';
import { artSvg, bowShape, cel, fabricColor, paint, tint } from './direction';
import { productSvg } from './svg';
import { fashionShapes } from './fashionShapes';

type Model = Pick<Customer, 'skin' | 'hair' | 'outfit' | 'hairStyle'> & Partial<Pick<Customer, 'id' | 'styles'>>;
// [hair, outfit-base, iris] for each character — candy anime palette
const palettes: Record<string, [string, string, string]> = {
  mia:   ['#ffdd88', '#f895c8', '#7fcee8'],  // golden blonde, hot pink, sky blue
  kai:   ['#3a3060', '#a8def0', '#a4d4f8'],  // dark indigo, soft blue, periwinkle
  linh:  ['#f0aacc', '#b8d8ff', '#9e82e0'],  // pink hair, baby blue, lavender iris
  an:    ['#9c6858', '#ffceb5', '#8ec8d4'],  // warm brown, peach, aqua
  bao:   ['#5a4e80', '#ccd4ff', '#a8c0e8'],  // violet, powder blue, soft blue
  chloe: ['#cc8060', '#ffcce0', '#a898d8'],  // auburn, blush pink, mauve iris
  nari:  ['#c0a0f0', '#e0b8ff', '#88ccee'],  // lilac, pastel purple, sky iris
  jade:  ['#302850', '#f0d8b8', '#b090e0'],  // dark navy, cream, purple iris
  nhi:   ['#f4c8a0', '#ffc8e8', '#98c8e8'],  // peachy brown, pink, blue
  vy:    ['#704888', '#e8f0ff', '#88c0d8'],  // deep purple, ice blue, teal iris
  rina:  ['#f0cc80', '#b8e8d8', '#c0a8ee'],  // honey blonde, mint, lavender iris
  may:   ['#c07060', '#ffeab0', '#a4d8c4'],  // rose-brown, gold, mint iris
  thu:   ['#705080', '#c4b8f0', '#cc94cc'],  // mauve, lavender, pink-mauve iris
  zoe:   ['#483870', '#9ab8e0', '#b090d8'],  // deep purple, blue-grey, violet iris
  elle:  ['#f0dc98', '#c0c8ff', '#88c0dc'],  // platinum blonde, periwinkle, teal iris
  owner: ['#ffd890', '#f8a0cc', '#86ccec'],  // warm blonde, candy pink, sky iris
};

/**
 * Anime large doe eyes: multi-layer iris, double catchlights, thick lashes.
 * Happy = kawaii curved-shut eyes with lash tips.
 */
function eyes(color: string, happy: boolean): string[] {
  return [41, 69].map(x => happy
    ? `<path d="M${x-8} 41Q${x} 33 ${x+7} 41" fill="none" stroke="${paint.ink}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M${x-7} 42Q${x} 46 ${x+6} 42" fill="none" stroke="#e8a8c4" stroke-width="1.2"/>` +
      `<path d="M${x-8} 41L${x-11} 38M${x+7} 41L${x+10} 38" fill="none" stroke="${paint.ink}" stroke-width="1.8" stroke-linecap="round"/>`
    : `<path d="M${x-9} 37Q${x} 30 ${x+8} 38Q${x+7} 51 ${x-4} 50Z" fill="#fff8f4"/>` +
      `<ellipse cx="${x}" cy="42" rx="5.8" ry="7.5" fill="${color}"/>` +
      `<path d="M${x-5} 46Q${x} 52 ${x+5} 46" fill="none" stroke="${tint(color,'#c8f0ff',.45)}" stroke-width="2.5"/>` +
      `<ellipse cx="${x}" cy="41.5" rx="2.8" ry="4.5" fill="#352050" stroke="none"/>` +
      `<ellipse cx="${x+2}" cy="37.5" rx="2.5" ry="3.2" fill="#ffffff" stroke="none"/>` +
      `<circle cx="${x-2}" cy="45" r="1.3" fill="#ffffff" stroke="none"/>` +
      `<circle cx="${x+4}" cy="43" r="0.9" fill="rgba(255,255,255,0.65)" stroke="none"/>` +
      `<path d="M${x-9} 37Q${x} 30 ${x+8} 38M${x-9} 37L${x-12} 34" fill="none" stroke="${paint.ink}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M${x+8} 38L${x+11} 35" fill="none" stroke="${paint.ink}" stroke-width="1.8" stroke-linecap="round"/>`
  );
}

/**
 * Anime-style clothing generator.
 * Three base silhouette types: sporty (jeans/track), preppy (blazer/coord), cute (default dress/skirt).
 * All styles feature the candy palette and anime-rounded shapes.
 */
function clothing(style: string, color: string, skin: string, working: boolean) {
  const sporty = ['Streetwear', 'Blokecore', 'Gorpcore', 'Grunge', 'Casual'].includes(style);
  const suit = ['Preppy', 'Dark Academia', 'Poetcore', 'Minimal', 'Clean Girl'].includes(style);
  const ballet = style === 'Balletcore';
  // Legs — jeans for sporty (candy blue), bare skin + cute socks for others
  const legs = sporty
    ? `<path d="M39 97H72L76 141L61 143L55 113L49 143L34 141Z" fill="#94c0f0"/><path d="M43 105L40 133M66 105L69 132" stroke="#dce8ff" fill="none" stroke-width="2.2"/><path d="M36 140Q32 144 35 148Q43 152 52 147L51 140Z" fill="#fff8f4"/><path d="M62 140L62 147Q73 153 79 147Q82 143 77 139Z" fill="#fff8f4"/>`
    : `<path d="M40 100L40 139H49L53 102M59 102L62 139H71L70 100" fill="${skin}"/>`;
  // Cute shoes — rounded sneakers for sporty, mary-janes/heels for others
  const shoeColor = sporty ? '#ffe8f0' : paint.pink;
  const shoes = sporty
    ? `<path d="M36 140Q29 143 30 149Q40 154 52 148L51 139Z" fill="${shoeColor}"/><path d="M62 139L62 148Q75 154 80 148Q81 143 73 138Z" fill="${shoeColor}"/><path d="M32 148H50M63 148H78" stroke="#fff0f5" stroke-width="1.8"/>`
    : `<path d="M38 135Q31 139 32 145Q42 150 51 144L50 135Z" fill="${shoeColor}"/><path d="M62 135L62 144Q74 150 80 144Q80 139 72 135Z" fill="${shoeColor}"/><path d="M38 139L48 139M64 139L72 139" stroke="${tint(shoeColor,'#ffffff',.5)}" stroke-width="2"/><path d="M34 144H48M64 144H78" stroke="#fff0f5" stroke-width="1.5"/>`;
  // Socks — cute short socks peeking above shoes
  const socks = `<path d="M38 132H51L52 138H37ZM62 132H75L76 138H61Z" fill="#fffbff"/><path d="M38 133H50M62 133H74" stroke="${paint.blush}" stroke-width="1.5"/>`;  
  const arms = working
    ? `<path d="M34 71L31 85L49 87M76 71L80 85L61 87" stroke="${skin}" stroke-width="7" fill="none"/><ellipse cx="50" cy="87" rx="4" ry="2.8" fill="${skin}"/><ellipse cx="60" cy="87" rx="4" ry="2.8" fill="${skin}"/>`
    : `<path d="M34 71L27 96Q28 103 31 101L39 76M73 74L79 101Q82 104 83 98L77 71" fill="${skin}"/><ellipse cx="27" cy="100" rx="4" ry="3" fill="${skin}"/><ellipse cx="83" cy="100" rx="4" ry="3" fill="${skin}"/>`;  
  let outfit: string;
  if (sporty) {
    // Streetwear: cute crop top + track pants, sporty but feminine
    outfit = `<path d="M41 59L30 65L27 80L38 83L39 97Q55 101 72 96V82L82 80L78 65L66 59Z" fill="${color}"/><path d="M43 60L54 69L65 60" stroke="${tint(color,'#ffffff',.55)}" stroke-width="2.5" fill="none"/><path d="M47 74H63V85H47Z" fill="${tint(color,'#ffffff',.4)}"/><path d="M51 78H59M55 78V83" fill="none" stroke="${paint.ink}" stroke-width="1.2"/>`;
  } else if (suit) {
    // Preppy/academic: cute blazer with bow tie detail
    outfit = `<path d="M41 59L30 65L26 82L38 85L40 72L37 103H74L71 73L76 84L85 81L78 65L66 59Z" fill="${color}"/><path d="M44 60L55 77L65 60L70 77L60 83L55 95L44 76Z" fill="${tint(color,'#ffffff',.45)}"/><path d="M37 97L29 114Q55 122 80 112L75 97Z" fill="${tint(color,'#4a2d5a',.28)}"/><path d="M41 101L38 112M51 101L51 114M63 101L65 114M72 101L75 112" stroke="${tint(color,'#ffffff',.3)}" fill="none"/>${bowShape(paint.pink, 60, 84, 0.35)}`;
  } else {
    // Default cute dress — flowy silhouette, bow at waist, puff detail
    outfit = `<path d="M40 60L30 66Q25 76 32 81L40 78L43 87L28 110Q55 122 82 110L67 87L70 78Q83 81 79 69L67 60L55 67Z" fill="${color}"/><path d="M42 87Q55 91 68 87M30 109Q55 119 80 109" stroke="${tint(color,'#ffffff',.45)}" stroke-width="2.5" fill="none"/><path d="M45 64Q54 72 65 63" stroke="${tint(color,'#ffffff',.55)}" stroke-width="2.5" fill="none"/><path d="M54 71Q40 62 44 74L54 76Q69 64 65 75L56 77L62 85L54 82L48 86Z" fill="${tint(color,'#ffffff',.65)}"/>${ballet ? `${bowShape(paint.blush, 55, 77, 0.4)}<path d="M43 65L66 84M66 66L44 84" stroke="${tint(color,'#ffffff',.4)}" fill="none" stroke-width="1.8"/>` : bowShape(paint.pink, 55, 84, 0.35)}`;
  }
  return legs + socks + shoes + arms + outfit;
}

/**
 * NHÂN VẬT CHÍNH (PLAYER / OWNER)
 * Designed 100% to match the approved concept sheet:
 * - Voluminous fluffy golden blonde anime hair with signature giant candy pink bow on right
 * - Expressive sparkling sky-blue anime eyes with thick lashes and double catchlights
 * - Cute blue crystal drop earrings & choker with golden heart pendant
 * - Candy pink cropped bomber jacket with white cuffs, worn open over white sweetheart crop top
 * - High-waisted candy pink pleated tennis skirt with waistband buckle
 * - Structured pink tote bag with gold heart emblem (standing)
 * - White crew socks with folded cuffs
 * - Chunky platform sneakers in white & pink with pink laces and thick soles
 */
export function ownerIllustration(working = false, mood = 'normal'): string {
  const ink = paint.ink;
  const skin = '#fff0e6';
  const skinShadow = '#fed7c3';
  const blush = '#ff8db8';

  const blonde = '#fed766';
  const blondeDeep = '#f59e0b';
  const blondeShade = '#d97706';
  const blondeLight = '#fffde7';
  const hairLine = '#78350f';

  const pink = '#ff7da7';
  const pinkShade = '#d94376';
  const pinkLight = '#ffa8c8';
  const white = '#ffffff';
  const whiteShade = '#f0e6ed';
  const gold = '#ffd566';
  const blue = '#38bdf8';
  const blueDark = '#1e1b4b';
  const blueLight = '#7dd3fc';

  // 1. Back hair (lush, voluminous wavy blonde cloud with silky layered curls & warm amber shading)
  const backHair = `
    <!-- Ambient Shadow Underlayer -->
    <path d="M22 26 C8 35 7 65 11 82 C8 96 16 108 26 112 C38 116 48 98 55 106 C62 98 72 116 84 112 C94 108 102 96 99 82 C103 65 102 35 88 26 C75 14 35 14 22 26 Z" fill="#f59e0b" opacity="0.32"/>

    <!-- Main Voluminous Back Waves -->
    <path d="M26 24 C11 32 10 58 13 74 C9 84 14 96 22 104 C31 112 43 96 55 105 C67 96 79 112 88 104 C96 96 101 84 97 74 C100 58 99 32 84 24 C71 12 39 12 26 24 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.5" stroke-linejoin="round"/>

    <!-- Outer Curling Wave Tufts -->
    <!-- Left outer flip -->
    <path d="M14 66 C7 75 8 85 16 91 C13 97 19 104 27 106 C21 98 19 86 23 76" fill="${blonde}" stroke="${hairLine}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M12 78 C9 86 14 93 19 95" fill="none" stroke="${blondeDeep}" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Right outer flip -->
    <path d="M96 66 C103 75 102 85 94 91 C97 97 91 104 83 106 C89 98 91 86 87 76" fill="${blonde}" stroke="${hairLine}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M98 78 C101 86 96 93 91 95" fill="none" stroke="${blondeDeep}" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Inner Hair Flow Lines & Silky Highlights -->
    <path d="M19 44 C12 60 18 78 28 88" fill="none" stroke="${blondeDeep}" stroke-width="2" stroke-linecap="round"/>
    <path d="M91 44 C98 60 92 78 82 88" fill="none" stroke="${blondeDeep}" stroke-width="2" stroke-linecap="round"/>
    <path d="M23 48 C18 62 25 76 34 84" fill="none" stroke="${blondeLight}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M87 48 C92 62 85 76 76 84" fill="none" stroke="${blondeLight}" stroke-width="1.6" stroke-linecap="round"/>
  `;

  // 2. Legs & Shoes (standing)
  const legsAndShoes = working ? '' : `
    ${customerLegs(skin, blush)}
    <!-- White crew socks with pink trim extending seamlessly to shoes (y=142) -->
    <path d="M39.5 128 H50.5 V142 H39.5 Z" fill="${white}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M60.5 128 H71.5 V142 H60.5 Z" fill="${white}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M39.5 131 H50.5" stroke="${pink}" stroke-width="1.6"/>
    <path d="M60.5 131 H71.5" stroke="${pink}" stroke-width="1.6"/>
    <g>
      <path d="M33 148 Q32 142 38 141 L49 141 Q52 143 51 148 Z" fill="${white}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M37 141 Q42 138 47 141 L46 146 L38 146 Z" fill="${pink}"/>
      <path d="M39 143 H45 M38 145 H46" stroke="${pinkShade}" stroke-width="1.2"/>
      <path d="M31 148 H53 Q53 154 50 154 L33 154 Q31 154 31 148 Z" fill="${white}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M34 153 H50" stroke="${pink}" stroke-width="1.8"/>
    </g>
    <g>
      <path d="M59 148 Q58 142 64 141 L75 141 Q78 143 77 148 Z" fill="${white}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M63 141 Q68 138 73 141 L72 146 L64 146 Z" fill="${pink}"/>
      <path d="M65 143 H71 M64 145 H72" stroke="${pinkShade}" stroke-width="1.2"/>
      <path d="M57 148 H79 Q79 154 76 154 L59 154 Q57 154 57 148 Z" fill="${white}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M60 153 H76" stroke="${pink}" stroke-width="1.8"/>
    </g>
  `;

  // 3. Handbag (standing)
  const handbag = working ? '' : `
    <g>
      <path d="M29 93 Q24 93 23 99 L23 103" fill="none" stroke="${pinkShade}" stroke-width="1.5"/>
      <path d="M29 93 Q27 94 27 99 L27 103" fill="none" stroke="${pinkShade}" stroke-width="1.5"/>
      <rect x="18" y="101" width="16" height="18" rx="3" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M21 101 V119 M31 101 V119" stroke="${pinkShade}" stroke-width="1"/>
      <path d="M26 109 Q24 106 22 108 Q21 110 26 114 Q31 110 30 108 Q28 106 26 109 Z" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
    </g>
  `;

  // 4. Skirt (High-waisted candy pink pleated tennis skirt)
  const skirt = working ? '' : `
    <g>
      <path d="M37 86 L32 105 Q55 111 78 105 L73 86 Z" fill="${pink}" stroke="${ink}" stroke-width="1.5"/>
      <path d="M39 86 L35 105 M45 86 L43 106 M51 86 L51 107 M59 86 L59 107 M65 86 L67 106 M71 86 L75 105" stroke="${pinkShade}" stroke-width="1.4"/>
      <path d="M42 86 L39 105 M48 86 L47 106 M55 86 L55 107 M62 86 L63 106 M68 86 L71 105" stroke="${pinkLight}" stroke-width="1.2"/>
      <path d="M39 82 H71 V87 H39 Z" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M40 83 H70" stroke="${white}" stroke-width="1"/>
      <circle cx="55" cy="85" r="2.2" fill="${gold}" stroke="${ink}" stroke-width="0.8"/>
    </g>
  `;

  // 5. Torso & Upper Outfit (White Sweetheart Top + Open Pink Cropped Jacket)
  const upperBody = `
    <path d="M45 62 H65 L67 85 H43 Z" fill="${skin}"/>
    <path d="M46 68 Q51 72 55 69 Q59 72 64 68 L66 82 H44 Z" fill="${white}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M50 72 Q55 75 60 72" stroke="${whiteShade}" stroke-width="1.5" fill="none"/>
    <path d="M49 61 H61" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M55 62 L55 64" stroke="${ink}" stroke-width="1"/>
    <path d="M55 64 Q53 62 51 63.5 Q50 65 55 68 Q60 65 59 63.5 Q57 62 55 64 Z" fill="${gold}" stroke="${ink}" stroke-width="0.7"/>

    <path d="M39 63 L45 66 L43 83 L36 81 Z" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M40 64 L45 74 L42 83" stroke="${pinkShade}" stroke-width="1.4" fill="none"/>
    <path d="M71 63 L65 66 L67 83 L74 81 Z" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M70 64 L65 74 L68 83" stroke="${pinkShade}" stroke-width="1.4" fill="none"/>

    ${working ? `
      <path d="M38 64 Q28 68 28 78 Q28 84 37 84 L41 74 Z" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M72 64 Q82 68 82 78 Q82 84 73 84 L69 74 Z" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M31 73 Q36 78 40 76 M79 73 Q74 78 70 76" stroke="${pinkShade}" stroke-width="1.4" fill="none"/>
      <path d="M36 82 L44 82 L43 86 L35 86 Z" fill="${white}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M74 82 L66 82 L67 86 L75 86 Z" fill="${white}" stroke="${ink}" stroke-width="1.2"/>
      <ellipse cx="46" cy="88" rx="4" ry="2.8" fill="${skin}" stroke="${ink}" stroke-width="1"/>
      <ellipse cx="64" cy="88" rx="4" ry="2.8" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    ` : `
      <path d="M38 64 Q26 68 26 78 Q26 86 33 87 L38 72 Z" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M28 74 Q33 79 36 76" stroke="${pinkShade}" stroke-width="1.4" fill="none"/>
      <path d="M31 85 L37 85 L36 89 L30 89 Z" fill="${white}" stroke="${ink}" stroke-width="1.2"/>
      <ellipse cx="29" cy="93" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>

      <path d="M72 64 Q84 68 84 78 Q84 86 77 87 L72 72 Z" fill="${pink}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M82 74 Q77 79 74 76" stroke="${pinkShade}" stroke-width="1.4" fill="none"/>
      <path d="M69 85 L75 85 L76 89 L70 89 Z" fill="${white}" stroke="${ink}" stroke-width="1.2"/>
      <ellipse cx="76" cy="94" rx="3.5" ry="4.5" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    `}
  `;

  // 6. Head, Face & Ears (Sweet, Kawaii Anime Girl)
  const headAndFace = `
    <!-- Neck & soft chin shadow -->
    <path d="M49 53 V64 Q55 68 61 64 V53 Z" fill="${skin}"/>
    <path d="M49 53 Q55 58 61 53 L61 57 Q55 62 49 57 Z" fill="${skinShadow}"/>

    <!-- Tai & Hoa tai (Cute Ears & Heart Crystal Drop Earrings) -->
    <g id="owner-ears-earrings">
      <!-- Left Ear -->
      <ellipse cx="28" cy="44" rx="4.5" ry="6.5" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M26 42 Q28 40 29 44 Q28 47 26 46" fill="none" stroke="#fbcfe8" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Left Earring: Blue Bow + Pink Heart Crystal -->
      <path d="M25 49 Q22 47 23 51 Q25 53 28 50 Q31 53 33 51 Q34 47 31 49 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>
      <circle cx="28" cy="50" r="1.1" fill="${white}" stroke="${ink}" stroke-width="0.6"/>
      <path d="M28 53 C26 51 23 52 23 55 C23 58 28 61 28 62 C28 61 33 58 33 55 C33 52 30 51 28 53 Z" fill="#ff69b4" stroke="${ink}" stroke-width="0.9"/>
      <circle cx="29" cy="55" r="0.7" fill="${white}"/>

      <!-- Right Ear -->
      <ellipse cx="82" cy="44" rx="4.5" ry="6.5" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M84 42 Q82 40 81 44 Q82 47 84 46" fill="none" stroke="#fbcfe8" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Right Earring: Blue Bow + Pink Heart Crystal -->
      <path d="M79 49 Q76 47 77 51 Q79 53 82 50 Q85 53 87 51 Q88 47 85 49 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>
      <circle cx="82" cy="50" r="1.1" fill="${white}" stroke="${ink}" stroke-width="0.6"/>
      <path d="M82 53 C80 51 77 52 77 55 C77 58 82 61 82 62 C82 61 87 58 87 55 C87 52 84 51 82 53 Z" fill="#ff69b4" stroke="${ink}" stroke-width="0.9"/>
      <circle cx="83" cy="55" r="0.7" fill="${white}"/>
    </g>

    <!-- Khuôn mặt V-line bầu bĩnh đáng yêu (Sweet Anime Oval Chin) -->
    <path d="M30 28 Q31 11 55 11 Q79 11 80 28 L79 43 Q75 56 55 59.5 Q35 56 31 43 Z" fill="${skin}"/>

    <!-- Chân mày thanh tú hiền lành (Sweet Gentle Eyebrows) -->
    <path d="M36 26.5 Q42 23.5 48 25.5" fill="none" stroke="#a66838" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M62 25.5 Q68 23.5 74 26.5" fill="none" stroke="#a66838" stroke-width="1.4" stroke-linecap="round"/>

    <!-- Đôi mắt Anime Doe Eyes to tròn, long lanh, hiền dịu -->
    <g id="owner-doe-eyes">
      <!-- Mí mắt đôi thanh thoát -->
      <path d="M37 31.5 Q42 29 47 31.5" fill="none" stroke="#e08898" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M63 31.5 Q68 29 73 31.5" fill="none" stroke="#e08898" stroke-width="1.1" stroke-linecap="round"/>

      <!-- Mắt trái (Left Eye) -->
      <path d="M34 38.5 Q42 32 50 37" fill="#ffffff"/>
      <ellipse cx="42.5" cy="41" rx="5.5" ry="7" fill="#1e40af"/>
      <path d="M38 41.5 Q42.5 37 47 41.5 Q47 47.5 42.5 47.5 Q38 47.5 38 41.5 Z" fill="#38bdf8"/>
      <path d="M38.5 44 Q42.5 48 46.5 44" fill="none" stroke="#bae6fd" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="42.5" cy="40.5" rx="2.5" ry="3.8" fill="#0f172a"/>
      <!-- Điểm bắt sáng to tròn và lung linh -->
      <circle cx="40.5" cy="37.5" r="2.2" fill="#ffffff"/>
      <circle cx="45" cy="43.5" r="1.2" fill="#ffffff"/>
      <circle cx="40" cy="45" r="0.7" fill="#ffffff" opacity="0.8"/>
      <!-- Viền mi cong nữ tính mềm mại -->
      <path d="M33 38.5 Q41.5 31.5 50 37" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M49 37 L52.5 34.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M37 47 Q42 49.5 47 47" fill="none" stroke="${ink}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>

      <!-- Mắt phải (Right Eye) -->
      <path d="M60 37 Q68 32 76 38.5" fill="#ffffff"/>
      <ellipse cx="67.5" cy="41" rx="5.5" ry="7" fill="#1e40af"/>
      <path d="M63 41.5 Q67.5 37 72 41.5 Q72 47.5 67.5 47.5 Q63 47.5 63 41.5 Z" fill="#38bdf8"/>
      <path d="M63.5 44 Q67.5 48 71.5 44" fill="none" stroke="#bae6fd" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="67.5" cy="40.5" rx="2.5" ry="3.8" fill="#0f172a"/>
      <!-- Điểm bắt sáng -->
      <circle cx="65.5" cy="37.5" r="2.2" fill="#ffffff"/>
      <circle cx="70" cy="43.5" r="1.2" fill="#ffffff"/>
      <circle cx="65" cy="45" r="0.7" fill="#ffffff" opacity="0.8"/>
      <!-- Viền mi cong nữ tính mềm mại -->
      <path d="M60 37 Q68.5 31.5 77 38.5" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M75 37 L78.5 34.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M63 47 Q68 49.5 73 47" fill="none" stroke="${ink}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
    </g>

    <!-- Má hồng mịn màng tự nhiên (Soft Rosy Blush) -->
    <ellipse cx="34" cy="45" rx="6" ry="3.2" fill="#ff7aa8" opacity="0.32"/>
    <ellipse cx="76" cy="45" rx="6" ry="3.2" fill="#ff7aa8" opacity="0.32"/>
    <!-- Mũi nhỏ nhắn thanh tú -->
    <circle cx="55" cy="43" r="0.9" fill="#e8b4a0"/>

    <!-- Nụ cười ngọt ngào duyên dáng (Sweet Kawaii Smile) -->
    <g id="owner-sweet-smile">
      <path d="M50.5 49.5 Q55 53.5 59.5 49.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M52 50.8 Q55 53.5 58 50.8" fill="none" stroke="#ff7da7" stroke-width="1.3" stroke-linecap="round"/>
    </g>
  `;

  // 7. Front Bangs, Side Locks & Signature Big Pink Bow
  const bangsAndBow = `
    <!-- 1. White Ruffled Frill behind bow (from master reference) -->
    <g id="owner-lace-frill">
      <path d="M39 12 Q43 5 48 7 Q51 3 55 3 Q59 3 62 7 Q67 5 71 12 Q55 9 39 12 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.1"/>
      <circle cx="45" cy="8" r="1.3" fill="#f8fafc"/>
      <circle cx="51" cy="5.5" r="1.3" fill="#f8fafc"/>
      <circle cx="59" cy="5.5" r="1.3" fill="#f8fafc"/>
      <circle cx="65" cy="8" r="1.3" fill="#f8fafc"/>
    </g>

    <!-- 2. Ribbon Tails (falling behind hair) -->
    <g id="owner-bow-tails">
      <path d="M46 16 C39 23 35 30 33 38 L39 36 L43 40 C44 32 46 24 49 18 Z" fill="${pink}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M37 25 C35 31 36 34 38 35" fill="none" stroke="${pinkShade}" stroke-width="1.3" stroke-linecap="round"/>

      <path d="M64 16 C71 23 75 30 77 38 L71 36 L67 40 C66 32 64 24 61 18 Z" fill="${pink}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M73 25 C75 31 74 34 72 35" fill="none" stroke="${pinkShade}" stroke-width="1.3" stroke-linecap="round"/>
    </g>

    <!-- 3. Front Bangs & Flowing Side Locks (Tóc mái bồng bềnh & Mái mai uốn lượn) -->
    <g id="owner-front-hair">
      <!-- Playful Ahoge on top right -->
      <path d="M60 10 Q66 4 72 6 Q67 9 62 12" fill="${blonde}" stroke="${hairLine}" stroke-width="1.3" stroke-linecap="round"/>

      <!-- Crown hairline base -->
      <path d="M30 22 C31 12 55 10 79 12 C80 22 80 24 80 26 C75 22 68 20 62 21 C56 22 53 25 50 25 C47 25 43 21 38 21 C33 21 30 24 30 22 Z" fill="${blonde}"/>

      <!-- Left swept bangs -->
      <path d="M30 22 C33 13 44 9 53 10 C50 17 48 24 53 30 C47 28 41 24 37 28 C34 29 32 26 30 22 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M38 13 C43 18 45 23 48 27" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>

      <!-- Right swept bangs -->
      <path d="M54 10 C65 9 76 13 80 22 C77 26 73 27 68 27 C64 24 62 20 58 29 C56 22 55 16 54 10 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M67 13 C65 18 63 23 60 27" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>

      <!-- Center gentle accent lock (delicate curved tuft between brows) -->
      <path d="M50 11 C52 18 51 25 55 31 C56 25 55 18 52 11 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.2"/>

      <!-- Angel Ring / Hair Sheen on bangs -->
      <path d="M35 18 Q45 22 51 18 M57 18 Q66 22 74 18" fill="none" stroke="${blondeLight}" stroke-width="2.6" stroke-linecap="round" opacity="0.95"/>
      <path d="M37 17.5 Q45 21.5 50 17.5 M58 17.5 Q66 21.5 72 17.5" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>

      <!-- Mái mai ôm má trái (Left Side Lock) with double-layered soft inward curl -->
      <!-- Under-shadow -->
      <path d="M26 26 C19 38 18 50 26 58 C21 54 20 42 27 30 Z" fill="${blondeDeep}" opacity="0.35"/>
      <!-- Main volume -->
      <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 C28 32 30 28 32 25 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- Outer feather curl -->
      <path d="M22 43 C18 49 19 54 25 56 C22 52 21 47 24 43 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.2"/>
      <path d="M24 35 C22 42 23 48 26 53" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M25 32 C23 38 24 44 27 48" fill="none" stroke="${blondeLight}" stroke-width="1.2" stroke-linecap="round"/>

      <!-- Mái mai ôm má phải (Right Side Lock) with double-layered soft inward curl -->
      <!-- Under-shadow -->
      <path d="M84 26 C91 38 92 50 84 58 C89 54 90 42 83 30 Z" fill="${blondeDeep}" opacity="0.35"/>
      <!-- Main volume -->
      <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 C82 32 80 28 78 25 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <!-- Outer feather curl -->
      <path d="M88 43 C92 49 91 54 85 56 C88 52 89 47 86 43 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.2"/>
      <path d="M86 35 C88 42 87 48 84 53" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M85 32 C87 38 86 44 83 48" fill="none" stroke="${blondeLight}" stroke-width="1.2" stroke-linecap="round"/>
    </g>

    <!-- 4. Signature Big Pink Bow with Gold Heart Brooch -->
    <g id="owner-signature-bow">
      <!-- Cánh nơ trái to tròn bồng bềnh -->
      <path d="M51 14 C32 2 24 9 27 19 C30 25 43 21 49 16 Z" fill="${pink}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M30 11 C38 6 45 8 47 13" fill="none" stroke="${pinkLight}" stroke-width="2" stroke-linecap="round"/>
      <path d="M33 18 C39 19 44 17 48 15" fill="none" stroke="${pinkShade}" stroke-width="1.3"/>

      <!-- Cánh nơ phải to tròn bồng bềnh -->
      <path d="M59 14 C78 2 86 9 83 19 C80 25 67 21 61 16 Z" fill="${pink}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M80 11 C72 6 65 8 63 13" fill="none" stroke="${pinkLight}" stroke-width="2" stroke-linecap="round"/>
      <path d="M77 18 C71 19 66 17 62 15" fill="none" stroke="${pinkShade}" stroke-width="1.3"/>

      <!-- Huy hiệu Trái tim Vàng đính Ngọc Hồng lấp lánh ở tâm nơ -->
      <path d="M55 9.5 C52 5.5 46.5 6.5 46.5 11.5 C46.5 16.2 55 20 55 21 C55 20 63.5 16.2 63.5 11.5 C63.5 6.5 58 5.5 55 9.5 Z" fill="#fbbf24" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M55 11.2 C53 8.2 48.5 9 48.5 12.2 C48.5 15.2 55 18.2 55 19 C55 18.2 61.5 15.2 61.5 12.2 C61.5 9 57 8.2 55 11.2 Z" fill="#ec4899"/>
      <circle cx="52.8" cy="11.5" r="1.1" fill="#ffffff"/>
      <circle cx="56.8" cy="14" r="0.6" fill="#ffffff" opacity="0.8"/>
    </g>
  `;

  const dropShadow = `<ellipse cx="55" cy="154" rx="27" ry="5.5" fill="${paint.shadow}" opacity="0.25"/>`;

  return artSvg(
    `${dropShadow}${backHair}${legsAndShoes}${skirt}${upperBody}${handbag}${headAndFace}${bangsAndBow}`,
    110,
    160
  );
}

/**
 * Circular Headshot Avatar for Player / Owner (HUD / Settings button)
 * Rendered with 100% same sweet, kawaii anime face
 */
export function ownerPortraitSvg(size = 38): string {
  const ink = paint.ink;
  const skin = '#fff0e6';
  const skinShadow = '#fed7c3';
  const blonde = '#fed766';
  const blondeDeep = '#f59e0b';
  const blondeShade = '#d97706';
  const blondeLight = '#fffde7';
  const hairLine = '#78350f';
  const pink = '#ff7da7';
  const pinkShade = '#d94376';
  const pinkLight = '#ffa8c8';
  const white = '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="16 2 78 78">
    <circle cx="55" cy="41" r="39" fill="#fff0f7"/>
    <!-- Back Hair Waves -->
    <path d="M22 26 C8 35 7 65 11 82 C8 96 16 108 26 112 C38 116 48 98 55 106 C62 98 72 116 84 112 C94 108 102 96 99 82 C103 65 102 35 88 26 C75 14 35 14 22 26 Z" fill="#f59e0b" opacity="0.32"/>
    <path d="M26 24 C11 32 10 58 13 74 C9 84 14 96 22 104 C31 112 43 96 55 105 C67 96 79 112 88 104 C96 96 101 84 97 74 C100 58 99 32 84 24 C71 12 39 12 26 24 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14 66 C7 75 8 85 16 91 C13 97 19 104 27 106 C21 98 19 86 23 76" fill="${blonde}" stroke="${hairLine}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M96 66 C103 75 102 85 94 91 C97 97 91 104 83 106 C89 98 91 86 87 76" fill="${blonde}" stroke="${hairLine}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M19 44 C12 60 18 78 28 88 M91 44 C98 60 92 78 82 88" fill="none" stroke="${blondeDeep}" stroke-width="2" stroke-linecap="round"/>
    <path d="M23 48 C18 62 25 76 34 84 M87 48 C92 62 85 76 76 84" fill="none" stroke="${blondeLight}" stroke-width="1.6" stroke-linecap="round"/>

    <!-- Neck & Sweetheart / Ruffled Collar -->
    <path d="M49 53 V66 Q55 70 61 66 V53 Z" fill="${skin}"/>
    <path d="M49 53 Q55 58 61 53 L61 57 Q55 62 49 57 Z" fill="${skinShadow}"/>
    <path d="M43 62 Q49 67 55 64 Q61 67 67 62 Q68 69 66 71 L44 71 Q42 69 43 62 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M55 64 C53.5 62 50 62 50 65 C50 68 55 70.5 55 71 C55 70.5 60 68 60 65 C60 62 56.5 62 55 64 Z" fill="#ffd566" stroke="${ink}" stroke-width="0.9"/>
    <path d="M55 65 C54 63.5 51.5 63.5 51.5 65.5 C51.5 67.5 55 69 55 69.5 C55 69 58.5 67.5 58.5 65.5 C58.5 63.5 56 63.5 55 65 Z" fill="#ec4899"/>

    <!-- Ears & Blue Bow Earrings -->
    <ellipse cx="28" cy="44" rx="4.5" ry="6.5" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M25 49 Q22 47 23 51 Q25 53 28 50 Q31 53 33 51 Q34 47 31 49 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>
    <circle cx="28" cy="50" r="1.1" fill="${white}" stroke="${ink}" stroke-width="0.6"/>
    <path d="M28 53 C26 51 23 52 23 55 C23 58 28 61 28 62 C28 61 33 58 33 55 C33 52 30 51 28 53 Z" fill="#ff69b4" stroke="${ink}" stroke-width="0.9"/>

    <ellipse cx="82" cy="44" rx="4.5" ry="6.5" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M79 49 Q76 47 77 51 Q79 53 82 50 Q85 53 87 51 Q88 47 85 49 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>
    <circle cx="82" cy="50" r="1.1" fill="${white}" stroke="${ink}" stroke-width="0.6"/>
    <path d="M82 53 C80 51 77 52 77 55 C77 58 82 61 82 62 C82 61 87 58 87 55 C87 52 84 51 82 53 Z" fill="#ff69b4" stroke="${ink}" stroke-width="0.9"/>

    <!-- Face Silhouette -->
    <path d="M30 28 Q31 11 55 11 Q79 11 80 28 L79 43 Q75 56 55 59.5 Q35 56 31 43 Z" fill="${skin}"/>

    <!-- Eyebrows (Gentle & Cheerful) -->
    <path d="M36 26.5 Q42 23.5 48 25.5 M62 25.5 Q68 23.5 74 26.5" fill="none" stroke="#a66838" stroke-width="1.4" stroke-linecap="round"/>

    <!-- Eyelid Creases -->
    <path d="M37 31.5 Q42 29 47 31.5 M63 31.5 Q68 29 73 31.5" fill="none" stroke="#e08898" stroke-width="1.1" stroke-linecap="round"/>

    <!-- Doe Eyes -->
    <path d="M34 38.5 Q42 32 50 37" fill="#ffffff"/>
    <ellipse cx="42.5" cy="41" rx="5.5" ry="7" fill="#1e40af"/>
    <path d="M38 41.5 Q42.5 37 47 41.5 Q47 47.5 42.5 47.5 Q38 47.5 38 41.5 Z" fill="#38bdf8"/>
    <path d="M38.5 44 Q42.5 48 46.5 44" fill="none" stroke="#bae6fd" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="42.5" cy="40.5" rx="2.5" ry="3.8" fill="#0f172a"/>
    <circle cx="40.5" cy="37.5" r="2.2" fill="#ffffff"/>
    <circle cx="45" cy="43.5" r="1.2" fill="#ffffff"/>
    <path d="M33 38.5 Q41.5 31.5 50 37" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M49 37 L52.5 34.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>

    <path d="M60 37 Q68 32 76 38.5" fill="#ffffff"/>
    <ellipse cx="67.5" cy="41" rx="5.5" ry="7" fill="#1e40af"/>
    <path d="M63 41.5 Q67.5 37 72 41.5 Q72 47.5 67.5 47.5 Q63 47.5 63 41.5 Z" fill="#38bdf8"/>
    <path d="M63.5 44 Q67.5 48 71.5 44" fill="none" stroke="#bae6fd" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="67.5" cy="40.5" rx="2.5" ry="3.8" fill="#0f172a"/>
    <circle cx="65.5" cy="37.5" r="2.2" fill="#ffffff"/>
    <circle cx="70" cy="43.5" r="1.2" fill="#ffffff"/>
    <path d="M60 37 Q68.5 31.5 77 38.5" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M76 37 L78.5 34.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Blush & Nose -->
    <ellipse cx="34" cy="45" rx="6" ry="3.2" fill="#ff7aa8" opacity="0.32"/>
    <ellipse cx="76" cy="45" rx="6" ry="3.2" fill="#ff7aa8" opacity="0.32"/>
    <circle cx="55" cy="43" r="0.9" fill="#e8b4a0"/>

    <!-- Sweet Smile -->
    <path d="M50.5 49.5 Q55 53.5 59.5 49.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M52 50.8 Q55 53.5 58 50.8" fill="none" stroke="#ff7da7" stroke-width="1.3" stroke-linecap="round"/>

    <!-- 1. White Ruffled Frill behind bow -->
    <g id="portrait-lace-frill">
      <path d="M39 12 Q43 5 48 7 Q51 3 55 3 Q59 3 62 7 Q67 5 71 12 Q55 9 39 12 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.1"/>
      <circle cx="45" cy="8" r="1.3" fill="#f8fafc"/>
      <circle cx="51" cy="5.5" r="1.3" fill="#f8fafc"/>
      <circle cx="59" cy="5.5" r="1.3" fill="#f8fafc"/>
      <circle cx="65" cy="8" r="1.3" fill="#f8fafc"/>
    </g>

    <!-- 2. Ribbon Tails -->
    <path d="M46 16 C39 23 35 30 33 38 L39 36 L43 40 C44 32 46 24 49 18 Z" fill="${pink}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M64 16 C71 23 75 30 77 38 L71 36 L67 40 C66 32 64 24 61 18 Z" fill="${pink}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>

    <!-- 3. Front Bangs & Flowing Side Locks -->
    <g id="portrait-front-hair">
      <path d="M60 10 Q66 4 72 6 Q67 9 62 12" fill="${blonde}" stroke="${hairLine}" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M30 22 C31 12 55 10 79 12 C80 22 80 24 80 26 C75 22 68 20 62 21 C56 22 53 25 50 25 C47 25 43 21 38 21 C33 21 30 24 30 22 Z" fill="${blonde}"/>
      <path d="M30 22 C33 13 44 9 53 10 C50 17 48 24 53 30 C47 28 41 24 37 28 C34 29 32 26 30 22 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M38 13 C43 18 45 23 48 27" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M54 10 C65 9 76 13 80 22 C77 26 73 27 68 27 C64 24 62 20 58 29 C56 22 55 16 54 10 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M67 13 C65 18 63 23 60 27" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M50 11 C52 18 51 25 55 31 C56 25 55 18 52 11 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.2"/>
      <path d="M35 18 Q45 22 51 18 M57 18 Q66 22 74 18" fill="none" stroke="${blondeLight}" stroke-width="2.6" stroke-linecap="round" opacity="0.95"/>
      <path d="M37 17.5 Q45 21.5 50 17.5 M58 17.5 Q66 21.5 72 17.5" fill="none" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>

      <!-- Mái mai ôm 2 bên má -->
      <path d="M26 26 C19 38 18 50 26 58 C21 54 20 42 27 30 Z" fill="${blondeDeep}" opacity="0.35"/>
      <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 C28 32 30 28 32 25 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M22 43 C18 49 19 54 25 56 C22 52 21 47 24 43 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.2"/>
      <path d="M24 35 C22 42 23 48 26 53" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>

      <path d="M84 26 C91 38 92 50 84 58 C89 54 90 42 83 30 Z" fill="${blondeDeep}" opacity="0.35"/>
      <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 C82 32 80 28 78 25 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M88 43 C92 49 91 54 85 56 C88 52 89 47 86 43 Z" fill="${blonde}" stroke="${hairLine}" stroke-width="1.2"/>
      <path d="M86 35 C88 42 87 48 84 53" fill="none" stroke="${blondeDeep}" stroke-width="1.4" stroke-linecap="round"/>
    </g>

    <!-- 4. Signature Big Pink Bow with Gold Heart Brooch -->
    <g id="portrait-signature-bow">
      <path d="M51 14 C32 2 24 9 27 19 C30 25 43 21 49 16 Z" fill="${pink}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M30 11 C38 6 45 8 47 13" fill="none" stroke="${pinkLight}" stroke-width="2" stroke-linecap="round"/>
      <path d="M33 18 C39 19 44 17 48 15" fill="none" stroke="${pinkShade}" stroke-width="1.3"/>

      <path d="M59 14 C78 2 86 9 83 19 C80 25 67 21 61 16 Z" fill="${pink}" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M80 11 C72 6 65 8 63 13" fill="none" stroke="${pinkLight}" stroke-width="2" stroke-linecap="round"/>
      <path d="M77 18 C71 19 66 17 62 15" fill="none" stroke="${pinkShade}" stroke-width="1.3"/>

      <path d="M55 9.5 C52 5.5 46.5 6.5 46.5 11.5 C46.5 16.2 55 20 55 21 C55 20 63.5 16.2 63.5 11.5 C63.5 6.5 58 5.5 55 9.5 Z" fill="#fbbf24" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M55 11.2 C53 8.2 48.5 9 48.5 12.2 C48.5 15.2 55 18.2 55 19 C55 18.2 61.5 15.2 61.5 12.2 C61.5 9 57 8.2 55 11.2 Z" fill="#ec4899"/>
      <circle cx="52.8" cy="11.5" r="1.1" fill="#ffffff"/>
      <circle cx="56.8" cy="14" r="0.6" fill="#ffffff" opacity="0.8"/>
    </g>
  </svg>`;
}

/** Shared sweet anime head, eyes, blush and smile matching ART_BIBLE */
function customerHeadAndFace(opts: {
  skin: string;
  hairLine: string;
  irisDark: string;
  irisColor: string;
  irisLight: string;
  mood?: string;
  earrings?: string;
}): string {
  const ink = '#2c1810';
  const skinShadow = '#fed7c3';
  const blush = '#ff7aa8';
  const { skin, hairLine, irisDark, irisColor, irisLight, mood, earrings = '' } = opts;
  const isHappy = mood === 'happy';

  return `
    <!-- Neck & chin shadow -->
    <path d="M49 53 V64 Q55 68 61 64 V53 Z" fill="${skin}"/>
    <path d="M49 53 Q55 58 61 53 L61 57 Q55 62 49 57 Z" fill="${skinShadow}"/>

    <!-- Ears & optional earrings -->
    <ellipse cx="28" cy="44" rx="4.5" ry="6.5" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
    <ellipse cx="82" cy="44" rx="4.5" ry="6.5" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>
    ${earrings}

    <!-- Anime V-line chin -->
    <path d="M30 28 Q31 11 55 11 Q79 11 80 28 L79 43 Q75 56 55 59.5 Q35 56 31 43 Z" fill="${skin}"/>

    <!-- Gentle Eyebrows -->
    <path d="M36 26.5 Q42 23.5 48 25.5 M62 25.5 Q68 23.5 74 26.5" fill="none" stroke="${hairLine}" stroke-width="1.4" stroke-linecap="round"/>

    <!-- Eyelid Creases -->
    <path d="M37 31.5 Q42 29 47 31.5 M63 31.5 Q68 29 73 31.5" fill="none" stroke="#e08898" stroke-width="1.1" stroke-linecap="round"/>

    <!-- Sweet Eyes -->
    ${isHappy ? `
      <!-- Joyful Smiling Eyes -->
      <path d="M34 40 Q42 33 50 40 M33 40 L30 36 M50 40 L53 36" fill="none" stroke="${ink}" stroke-width="2.3" stroke-linecap="round"/>
      <path d="M60 40 Q68 33 76 40 M60 40 L57 36 M76 40 L79 36" fill="none" stroke="${ink}" stroke-width="2.3" stroke-linecap="round"/>
    ` : `
      <!-- Left Eye -->
      <path d="M34 38.5 Q42 32 50 37" fill="#ffffff"/>
      <ellipse cx="42.5" cy="41" rx="5.5" ry="7" fill="${irisDark}"/>
      <path d="M38 41.5 Q42.5 37 47 41.5 Q47 47.5 42.5 47.5 Q38 47.5 38 41.5 Z" fill="${irisColor}"/>
      <path d="M38.5 44 Q42.5 48 46.5 44" fill="none" stroke="${irisLight}" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="42.5" cy="40.5" rx="2.5" ry="3.8" fill="#0f172a"/>
      <circle cx="40.5" cy="37.5" r="2.2" fill="#ffffff"/>
      <circle cx="45" cy="43.5" r="1.2" fill="#ffffff"/>
      <path d="M33 38.5 Q41.5 31.5 50 37" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M49 37 L52.5 34.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>

      <!-- Right Eye -->
      <path d="M60 37 Q68 32 76 38.5" fill="#ffffff"/>
      <ellipse cx="67.5" cy="41" rx="5.5" ry="7" fill="${irisDark}"/>
      <path d="M63 41.5 Q67.5 37 72 41.5 Q72 47.5 67.5 47.5 Q63 47.5 63 41.5 Z" fill="${irisColor}"/>
      <path d="M63.5 44 Q67.5 48 71.5 44" fill="none" stroke="${irisLight}" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="67.5" cy="40.5" rx="2.5" ry="3.8" fill="#0f172a"/>
      <circle cx="65.5" cy="37.5" r="2.2" fill="#ffffff"/>
      <circle cx="70" cy="43.5" r="1.2" fill="#ffffff"/>
      <path d="M60 37 Q68.5 31.5 77 38.5" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M76 37 L78.5 34.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
    `}

    <!-- Soft Rosy Blush & Nose Dot -->
    <ellipse cx="34" cy="45" rx="6" ry="3.2" fill="${blush}" opacity="0.32"/>
    <ellipse cx="76" cy="45" rx="6" ry="3.2" fill="${blush}" opacity="0.32"/>
    <circle cx="55" cy="43" r="0.9" fill="#e8b4a0"/>

    <!-- Sweet Cute Smile -->
    <path d="M50.5 49.5 Q55 53.5 59.5 49.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M52 50.8 Q55 53.5 58 50.8" fill="none" stroke="#ff7da7" stroke-width="1.3" stroke-linecap="round"/>
  `;
}

/** Base anime body torso & navel to prevent transparent gap when wearing crop tops */
function customerTorso(skin: string): string {
  return `
    <!-- Torso with delicate feminine waist curve (thắt eo con kiến mềm mại fit quần áo) -->
    <path d="M44 62 C44 67 46 72 46 76 C46 80 43 84 42.5 88 H67.5 C67 84 64 80 64 76 C64 72 66 67 66 62 Z" fill="${skin}" stroke="#805766" stroke-width="1.2" stroke-linejoin="round"/>
    <!-- Soft waist contour shading -->
    <path d="M46 76 Q55 79 64 76" fill="none" stroke="#fed7c3" stroke-width="1.2" opacity="0.6"/>
    <!-- Cute anime navel -->
    <ellipse cx="55" cy="78" rx="0.9" ry="1.3" fill="#e8b4a0"/>
    <path d="M54 77.5 Q55 79 56 77.5" fill="none" stroke="#d48a70" stroke-width="0.7" stroke-linecap="round"/>
  `;
}

/** Contoured legs extending gracefully from hips to ankles (seamless at y=142) */
function customerLegs(skin: string, blush = '#ff7aa8'): string {
  return `
    <!-- Thighs, soft contoured calves, and ankles extending seamlessly to shoes (y=142) -->
    <!-- Left Leg -->
    <path d="M42 85 C42 98 40.5 114 41 122 C41.5 128 40.5 134 41.5 142 H48.5 C49.5 134 48.5 128 49 122 C49.5 114 48 98 48 85 Z" fill="${skin}" stroke="#805766" stroke-width="1.2" stroke-linejoin="round"/>
    <!-- Right Leg -->
    <path d="M62 85 C62 98 60.5 114 61 122 C61.5 128 60.5 134 61.5 142 H68.5 C69.5 134 68.5 128 69 122 C69.5 114 68 98 68 85 Z" fill="${skin}" stroke="#805766" stroke-width="1.2" stroke-linejoin="round"/>
    
    <!-- Soft cel shadows keep pale legs readable without changing skin tone. -->
    <path d="M43.4 89 Q42.5 111 42.7 122 L43 138 M63.4 89 Q62.5 111 62.7 122 L63 138" fill="none" stroke="#cf9ea2" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>
    <!-- Gentle Ankle Definition -->
    <ellipse cx="40.8" cy="138" rx="0.9" ry="1.8" fill="#fed7c3"/>
    <ellipse cx="69.2" cy="138" rx="0.9" ry="1.8" fill="#fed7c3"/>

    <!-- Soft Rosy Blush on Knees -->
    <circle cx="45" cy="116" r="3.5" fill="${blush}" opacity="0.32"/>
    <circle cx="65" cy="116" r="3.5" fill="${blush}" opacity="0.32"/>
  `;
}

/** Graceful anime arms with dainty hands (rendered seamlessly at shoulders x=42,68 y=63) */
export function customerArms(skin: string, ink = '#2c1810'): string {
  return `
    <!-- Left Arm & Hand -->
    <path d="M41 66 L34 77 L32 94" fill="none" stroke="#805766" stroke-width="7.5" stroke-linecap="round"/><path d="M41 66 L34 77 L32 94" fill="none" stroke="${skin}" stroke-width="5.5" stroke-linecap="round"/>
    <ellipse cx="32" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <!-- Right Arm & Hand -->
    <path d="M69 66 L76 77 L77 94" fill="none" stroke="#805766" stroke-width="7.5" stroke-linecap="round"/><path d="M69 66 L76 77 L77 94" fill="none" stroke="${skin}" stroke-width="5.5" stroke-linecap="round"/>
    <ellipse cx="77" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
  `;
}

/** 1. LILY — Pink twin buns, white crop camisole, lavender shorts, purple handbag */
export function lilyIllustration(mood = 'normal', worn: Product[] = []): string {
  const ink = '#2c1810';
  const skin = '#fff0e6';
  const hair = '#ff7aa8';
  const hairDeep = '#f43f5e';
  const hairLight = '#ffcce0';
  const hairLine = '#831843';

  // Back Hair (High twin buns & wavy cascading tails)
  const backHair = `
    <!-- Left pigtail waves -->
    <path d="M22 22 C11 36 12 58 17 76 C23 83 27 77 25 70 C21 60 18 42 24 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.3"/>
    <path d="M15 48 C13 60 17 72 22 75" fill="none" stroke="${hairDeep}" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Right pigtail waves -->
    <path d="M88 22 C99 36 98 58 93 76 C87 83 83 77 85 70 C89 60 92 42 86 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.3"/>
    <path d="M95 48 C97 60 93 72 88 75" fill="none" stroke="${hairDeep}" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Back hair mass -->
    <path d="M26 24 C14 32 15 54 22 66 C35 74 75 74 88 66 C95 54 96 32 84 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.3"/>
  `;

  // Torso / Midriff
  const torso = customerTorso(skin);

  // Legs & Shoes (Clean legs if wearing custom shoes or pants)
  const hasShoes = worn.some(p => p.category === 'shoes');
  const hasPants = worn.some(p => p.category === 'bottoms' && (p.art.includes('pants') || p.art === 'cargoPants' || p.art === 'parachutePants' || p.art === 'flareJeans' || p.art === 'baggyJeans' || p.subcategory === 'cargo' || p.subcategory === 'jeans'));
  const hasSocks = worn.some(p => p.category === 'accessories' && (p.subcategory === 'socks' || p.art === 'legWarmers' || p.art === 'socks'));
  const legsAndShoes = `
    ${customerLegs(skin)}
    ${(!hasShoes && !hasPants && !hasSocks) ? `
      <!-- White crew socks with pink trim extending seamlessly to shoes (y=142) -->
      <path d="M39.5 127 H50.5 V142 H39.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M60.5 127 H71.5 V142 H60.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M39.5 129.5 H50.5" stroke="#f472b6" stroke-width="1.6"/>
      <path d="M60.5 129.5 H71.5" stroke="#f472b6" stroke-width="1.6"/>
    ` : ''}
    ${!hasShoes ? `
      <!-- Chunky platform sneakers (white & pink) -->
      <path d="M33 148 Q32 142 38 141 L49 141 Q52 143 51 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M37 141 Q42 138 47 141 L46 146 L38 146 Z" fill="#f472b6"/>
      <path d="M31 148 H53 Q53 154 50 154 L33 154 Q31 154 31 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M59 148 Q58 142 64 141 L75 141 Q78 143 77 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M63 141 Q68 138 73 141 L72 146 L64 146 Z" fill="#f472b6"/>
      <path d="M57 148 H79 Q79 154 77 154 L59 154 Q57 154 57 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
    ` : ''}
  `;

  // Default Outfit (White ruffled crop camisole, high-waist lavender shorts, purple tote - fit eo thon gọn)
  const defaultOutfit = `
    <!-- High-waist lavender denim shorts fitting waist -->
    <path d="M45 80 H65 C67 85 68.5 90 69.5 95 L58 96 L55 89 L52 96 L40.5 95 C41.5 90 43 85 45 80 Z" fill="#d8b4fe" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M45 80 H65 V83.5 H45 Z" fill="#c084fc"/>
    <circle cx="55" cy="81.8" r="1" fill="#ffffff"/>
    <path d="M45 86 H49 M61 86 H65" stroke="#c084fc" stroke-width="1.1"/>
    <!-- White sweetheart crop top fitting waist -->
    <path d="M44 63 C46 60 50 63 55 61 C60 63 64 60 66 63 C66 67 65 71 64.5 75 C60 76.5 50 76.5 45.5 75 C45 71 44 67 44 63 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M44 63 Q43 56 46 54 Q48 57 45.5 64 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1"/>
    <path d="M66 63 Q67 56 64 54 Q62 57 64.5 64 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1"/>
    <!-- Blue choker -->
    <path d="M49 60 H61" stroke="#38bdf8" stroke-width="1.8"/>
    <circle cx="55" cy="62" r="1.2" fill="#38bdf8"/>
    <!-- Arms & Lavender handbag in hand -->
    <path d="M42 63 L34 76 L32 94" fill="none" stroke="#805766" stroke-width="7.5" stroke-linecap="round"/><path d="M42 63 L34 76 L32 94" fill="none" stroke="${skin}" stroke-width="5.5" stroke-linecap="round"/>
    <ellipse cx="32" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <path d="M68 63 L76 76 L77 94" fill="none" stroke="#805766" stroke-width="7.5" stroke-linecap="round"/><path d="M68 63 L76 76 L77 94" fill="none" stroke="${skin}" stroke-width="5.5" stroke-linecap="round"/>
    <ellipse cx="77" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <!-- Lavender Structured Handbag with Gold Heart -->
    <path d="M29 93 C27 88 34 88 32 93" fill="none" stroke="#a855f7" stroke-width="1.3"/>
    <rect x="22" y="93" width="16" height="15" rx="3" fill="#c084fc" stroke="${ink}" stroke-width="1.2"/>
    <path d="M22 98 H38" stroke="#a855f7" stroke-width="1.2"/>
    <path d="M30 102 C29 100 27 100 27 102 C27 104 30 106 30 106.5 C30 106.5 33 104 33 102 C33 100 31 100 30 102 Z" fill="#fbbf24"/>
  `;

  // Head and Face (Aqua Doe eyes, soft blush)
  const head = customerHeadAndFace({
    skin,
    hairLine,
    irisDark: '#0e7490',
    irisColor: '#06b6d4',
    irisLight: '#67e8f9',
    mood,
    earrings: `<path d="M25 49 Q22 47 23 51 Q25 53 28 50 Q31 53 33 51 Q34 47 31 49 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>
               <path d="M79 49 Q76 47 77 51 Q79 53 82 50 Q85 53 87 51 Q88 47 85 49 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>`
  });

  // Front Bangs & High Twin Buns with Blue Hairpins
  const frontHair = `
    <!-- High Twin Buns -->
    <!-- Left Bun -->
    <ellipse cx="20" cy="18" rx="10" ry="9" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M15 15 C17 11 23 11 25 15" fill="none" stroke="${hairLight}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 20 C18 24 23 23 25 19" fill="none" stroke="${hairDeep}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Blue butterfly clip on left bun -->
    <path d="M22 13 Q25 10 28 14 Q25 18 22 13 Z M22 13 Q19 10 16 14 Q19 18 22 13 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>
    <!-- Right Bun -->
    <ellipse cx="90" cy="18" rx="10" ry="9" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M85 15 C87 11 93 11 95 15" fill="none" stroke="${hairLight}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M85 19 C87 23 92 24 94 20" fill="none" stroke="${hairDeep}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Blue butterfly clip on right bun -->
    <path d="M88 13 Q85 10 82 14 Q85 18 88 13 Z M88 13 Q91 10 94 14 Q91 18 88 13 Z" fill="#38bdf8" stroke="${ink}" stroke-width="0.8"/>
    <!-- Front bangs -->
    <path d="M28 24 C31 13 44 9 53 10 C50 17 48 24 53 30 C47 28 41 24 37 28 C34 29 32 26 28 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M54 10 C65 9 76 13 82 24 C79 26 75 27 70 27 C66 24 64 20 60 29 C57 22 55 16 54 10 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4" stroke-linejoin="round"/>
    <!-- Angel Ring -->
    <path d="M35 18 Q45 22 51 18 M57 18 Q66 22 74 18" fill="none" stroke="${hairLight}" stroke-width="2.6" stroke-linecap="round" opacity="0.95"/>
    <!-- Side locks hugging cheeks -->
    <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
  `;

  const shadow = `<ellipse cx="55" cy="154" rx="27" ry="5.5" fill="#2c1810" opacity="0.22"/>`;
  if (worn.length) {
    const d = renderDressedCustomerLayers(worn, skin, ink);
    return artSvg(
      `${shadow}${backHair}${d.body}${!hasShoes ? `<svg data-footwear="default" x="0" y="141" width="110" height="15" viewBox="0 141 110 15" overflow="hidden">${legsAndShoes}</svg>` : ""}${d.arms}${d.undergarments}${d.socks}${d.bottoms}${d.sets}${d.dresses}${d.tops}${d.outerwear}${d.shoes}${d.bags}${d.hands}${d.jewelry}${head}${frontHair}${d.glasses}${d.headwear}`,
      110,
      160
    );
  }
  return artSvg(`${shadow}${backHair}${torso}${legsAndShoes}${defaultOutfit}${head}${frontHair}`, 110, 160);
}

/** 2. EMMA — Dark wavy hair, tilted blue cap, white crop with tie, baggy light-wash jeans */
export function emmaIllustration(mood = 'normal', worn: Product[] = []): string {
  const ink = '#2c1810';
  const skin = '#fff0e6';
  const hair = '#222034';
  const hairDeep = '#13121f';
  const hairLight = '#433f63';
  const hairLine = '#0f0f18';

  // Back Hair (Voluminous dark waves tumbling over shoulders)
  const backHair = `
    <path d="M26 24 C10 34 11 65 14 82 C18 92 28 92 34 84 C26 76 22 58 28 42 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M84 24 C100 34 99 65 96 82 C92 92 82 92 76 84 C84 76 88 58 82 42 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M20 48 C16 64 21 78 28 86" fill="none" stroke="${hairLight}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M90 48 C94 64 89 78 82 86" fill="none" stroke="${hairLight}" stroke-width="1.8" stroke-linecap="round"/>
  `;

  // Torso / Midriff
  const torso = customerTorso(skin);

  // Legs & Shoes (Clean legs if wearing custom shoes or custom bottoms)
  const hasShoes = worn.some(p => p.category === 'shoes');
  const hasSocks = worn.some(p => p.category === 'accessories' && (p.subcategory === 'socks' || p.art === 'legWarmers' || p.art === 'socks'));
  const legsAndShoes = `
    ${customerLegs(skin)}
    ${(!hasShoes && !hasSocks) ? `
      <!-- Chunky platform sneakers -->
      <path d="M31 148 H51 Q51 154 48 154 L32 154 Q30 154 31 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M33 144 H49" stroke="#f472b6" stroke-width="1.6"/>
      <path d="M59 148 H79 Q79 154 76 154 L60 154 Q58 154 59 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M61 144 H77" stroke="#f472b6" stroke-width="1.6"/>
    ` : ''}
  `;

  // Default Outfit (Baggy distressed jeans, white crop top, dark windbreaker bolero, mini necktie, blue cylinder bag)
  const defaultOutfit = `
    <!-- High-waist Baggy Streetwear Jeans (fit eo thon gọn, nở nhẹ hông rồi buông ống thụng) -->
    <path d="M45 80 H65 C67 84 68 88 68 92 L73 141 L59 143 L55 96 L51 143 L37 141 L42 92 C42 88 43 84 45 80 Z" fill="#93c5fd" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>
    <!-- Distressed slits showing skin -->
    <path d="M41 108 H49 L48 112 H41 Z" fill="${skin}"/>
    <path d="M61 118 H69 L68 122 H61 Z" fill="${skin}"/>
    <path d="M40 107 H50 M41 113 H49 M61 117 H70 M62 123 H69" stroke="#dbeafe" stroke-width="1.2"/>
    <!-- Folded denim cuffs touching platform shoes -->
    <path d="M35 138 H51 V143 H35 Z" fill="#bfdbfe" stroke="${ink}" stroke-width="1.2"/>
    <path d="M59 138 H75 V143 H59 Z" fill="#bfdbfe" stroke="${ink}" stroke-width="1.2"/>
    <!-- High-waist slim belt fitting waist -->
    <path d="M45 80 H65 V84 H45 Z" fill="#60a5fa" stroke="${ink}" stroke-width="1.2"/>
    <rect x="53" y="80" width="4" height="4" fill="#fbbf24"/>
    <!-- White collared crop top fitting waist -->
    <path d="M44 63 C44 67 46 71 46 75 H64 C64 71 66 67 66 63 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2"/>
    <!-- White collar & black slim tie -->
    <path d="M48 63 L55 68 L62 63" stroke="#e2e8f0" stroke-width="1.2" fill="none"/>
    <path d="M53.5 63 H56.5 L57.5 71 L55 74 L52.5 71 Z" fill="#0f172a"/>
    <!-- Dark cropped windbreaker / bolero fitting shoulders & waist -->
    <path d="M44 63 L35 68 L29 88 L34 89 L38 76 L45 75 Z" fill="#18181b" stroke="${ink}" stroke-width="1.3"/>
    <path d="M66 63 L75 68 L81 88 L76 89 L72 76 L65 75 Z" fill="#18181b" stroke="${ink}" stroke-width="1.3"/>
    <!-- Hands & Mini cylindrical blue bag -->
    <ellipse cx="28" cy="90" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <ellipse cx="82" cy="90" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <path d="M82 88 C84 83 89 83 87 88" fill="none" stroke="#2563eb" stroke-width="1.2"/>
    <rect x="80" y="88" width="10" height="14" rx="3" fill="#3b82f6" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="85" cy="95" r="1.5" fill="#ffffff"/>
  `;

  // Head and Face (Navy sapphire Doe eyes)
  const head = customerHeadAndFace({
    skin,
    hairLine,
    irisDark: '#172554',
    irisColor: '#1d4ed8',
    irisLight: '#60a5fa',
    mood
  });

  // Front Hair (tóc mái & tóc bên má khi thử đồ)
  const frontHairClean = `
    <!-- Dark wavy bangs -->
    <path d="M30 25 C34 16 44 14 52 16 C48 23 45 28 50 32 C45 30 38 27 34 30 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M55 16 C66 14 76 16 80 25 C77 28 72 29 67 29 C63 24 61 21 57 28 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
  `;
  const frontHair = `
    ${frontHairClean}
    <!-- Tilted Streetwear Baseball Cap -->
    <path d="M30 18 C30 6 78 4 80 18 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
    <path d="M30 18 C30 8 50 7 50 18 Z" fill="#3b82f6"/>
    <!-- Round emblem on cap -->
    <circle cx="55" cy="12" r="3.2" fill="#fbbf24" stroke="${ink}" stroke-width="0.8"/>
    <circle cx="55" cy="12" r="1.5" fill="#ffffff"/>
    <!-- Visor curving to side -->
    <path d="M26 18 C28 13 82 13 84 18 C80 22 30 22 26 18 Z" fill="#2563eb" stroke="${ink}" stroke-width="1.3"/>
  `;

  const shadow = `<ellipse cx="55" cy="154" rx="27" ry="5.5" fill="#2c1810" opacity="0.22"/>`;
  if (worn.length) {
    const d = renderDressedCustomerLayers(worn, skin, ink);
    return artSvg(
      `${shadow}${backHair}${d.body}${!hasShoes ? `<svg data-footwear="default" x="0" y="141" width="110" height="15" viewBox="0 141 110 15" overflow="hidden">${legsAndShoes}</svg>` : ""}${d.arms}${d.undergarments}${d.socks}${d.bottoms}${d.sets}${d.dresses}${d.tops}${d.outerwear}${d.shoes}${d.bags}${d.hands}${d.jewelry}${head}${frontHairClean}${d.glasses}${d.headwear}`,
      110,
      160
    );
  }
  return artSvg(`${shadow}${backHair}${torso}${legsAndShoes}${defaultOutfit}${head}${frontHair}`, 110, 160);
}

/** 3. SOPHIE — Pastel blonde, retro blue headphones, pastel blue cardigan, romper coord */
export function sophieIllustration(mood = 'normal', worn: Product[] = []): string {
  const ink = '#2c1810';
  const skin = '#fff0e6';
  const hair = '#fef08a';
  const hairDeep = '#f59e0b';
  const hairLight = '#fffbeb';
  const hairLine = '#78350f';

  // Back Hair (Soft wavy blonde locks spilling past shoulders)
  const backHair = `
    <path d="M26 24 C10 32 11 58 15 76 C20 86 32 86 36 78 C28 70 24 54 28 38 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M84 24 C100 32 99 58 95 76 C90 86 78 86 74 78 C82 70 86 54 82 38 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M19 46 C16 62 22 74 29 82 M91 46 C94 62 88 74 81 82" fill="none" stroke="${hairDeep}" stroke-width="1.8" stroke-linecap="round"/>
  `;

  // Torso / Midriff
  const torso = customerTorso(skin);

  // Legs & Over-knee white socks (hidden when wearing custom shoes, pants, or dresses)
  const hasShoes = worn.some(p => p.category === 'shoes');
  const hasPants = worn.some(p => p.category === 'bottoms' && (p.art.includes('pants') || p.art === 'cargoPants' || p.art === 'parachutePants' || p.art === 'flareJeans' || p.art === 'baggyJeans' || p.subcategory === 'cargo' || p.subcategory === 'jeans'));
  const hasDress = worn.some(p => p.category === 'dresses' || p.category === 'sets');
  const hasSocks = worn.some(p => p.category === 'accessories' && (p.subcategory === 'socks' || p.art === 'legWarmers' || p.art === 'socks'));
  const legsAndShoes = `
    ${customerLegs(skin)}
    ${(!hasShoes && !hasPants && !hasDress && !hasSocks) ? `
      <!-- Over-knee white socks extending down into sneakers (y=142) -->
      <path d="M39.5 106 H49.5 V142 H39.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M60.5 106 H70.5 V142 H60.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M39.5 109 H49.5 M39.5 113 H49.5" stroke="#60a5fa" stroke-width="1.3"/>
      <path d="M60.5 109 H70.5 M60.5 113 H70.5" stroke="#60a5fa" stroke-width="1.3"/>
    ` : ''}
    ${!hasShoes ? `
      <!-- Chunky white platform sneakers -->
      <path d="M32 148 Q31 142 37 141 L48 141 Q51 143 50 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M30 148 H52 Q52 154 49 154 L32 154 Q30 154 30 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M60 148 Q59 142 65 141 L76 141 Q79 143 78 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M58 148 H80 Q80 154 77 154 L60 154 Q58 154 58 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
    ` : ''}
  `;

  // Default Outfit (Baby-blue cardigan, white pleated romper coord, blue shoulder bag - fit eo)
  const defaultOutfit = `
    <!-- White pleated romper coord fitting waist -->
    <path d="M44 63 H66 C66 67 65 71 64.5 75 C66 82 68 88 69 94 L58 96 L55 90 L52 96 L41 94 C42 88 44 82 45.5 75 C45 71 44 67 44 63 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <!-- Baby blue waist belt & ribbon -->
    <path d="M45.5 76 H64.5" stroke="#60a5fa" stroke-width="2"/>
    <path d="M55 76 L52 74 L52 78 Z M55 76 L58 74 L58 78 Z" fill="#60a5fa"/>
    <!-- Baby blue pastel cardigan worn open -->
    <path d="M43 62 L33 67 L27 88 L34 90 L38 74 L44 74 Z" fill="#bfdbfe" stroke="${ink}" stroke-width="1.3"/>
    <path d="M67 62 L77 67 L83 88 L76 90 L72 74 L66 74 Z" fill="#bfdbfe" stroke="${ink}" stroke-width="1.3"/>
    <!-- Blue shoulder bag strap & bag -->
    <path d="M44 63 L74 92" stroke="#38bdf8" stroke-width="2.2"/>
    <rect x="70" y="86" width="14" height="16" rx="3" fill="#38bdf8" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="77" cy="94" r="1.5" fill="#fbbf24"/>
    <!-- Hands -->
    <ellipse cx="30" cy="91" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <ellipse cx="80" cy="91" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
  `;

  // Head and Face (Sky blue Doe eyes)
  const head = customerHeadAndFace({
    skin,
    hairLine,
    irisDark: '#0c4a6e',
    irisColor: '#0284c7',
    irisLight: '#7dd3fc',
    mood
  });

  // Front Hair (tóc mái & angel ring khi thử đồ)
  const frontHairClean = `
    <!-- Blonde parted bangs with Angel Ring -->
    <path d="M28 24 C31 13 44 9 53 10 C50 17 48 24 53 30 C47 28 41 24 37 28 C34 29 32 26 28 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M54 10 C65 9 76 13 82 24 C79 26 75 27 70 27 C66 24 64 20 60 29 C57 22 55 16 54 10 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M35 18 Q45 22 51 18 M57 18 Q66 22 74 18" fill="none" stroke="${hairLight}" stroke-width="2.6" stroke-linecap="round" opacity="0.95"/>
    <!-- Face framing locks -->
    <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
  `;
  const frontHair = `
    ${frontHairClean}
    <!-- Retro Over-Ear Headphones -->
    <path d="M28 36 C27 12 83 12 82 36" fill="none" stroke="#1e3a8a" stroke-width="3" stroke-linecap="round"/>
    <path d="M31 34 C30 15 80 15 79 34" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="26" cy="42" rx="4.5" ry="7" fill="#38bdf8" stroke="${ink}" stroke-width="1.2"/>
    <ellipse cx="26" cy="42" rx="2.5" ry="4.5" fill="#ffffff"/>
    <ellipse cx="84" cy="42" rx="4.5" ry="7" fill="#38bdf8" stroke="${ink}" stroke-width="1.2"/>
    <ellipse cx="84" cy="42" rx="2.5" ry="4.5" fill="#ffffff"/>
  `;

  const shadow = `<ellipse cx="55" cy="154" rx="27" ry="5.5" fill="#2c1810" opacity="0.22"/>`;
  if (worn.length) {
    const d = renderDressedCustomerLayers(worn, skin, ink);
    return artSvg(
      `${shadow}${backHair}${d.body}${!hasShoes ? `<svg data-footwear="default" x="0" y="141" width="110" height="15" viewBox="0 141 110 15" overflow="hidden">${legsAndShoes}</svg>` : ""}${d.arms}${d.undergarments}${d.socks}${d.bottoms}${d.sets}${d.dresses}${d.tops}${d.outerwear}${d.shoes}${d.bags}${d.hands}${d.jewelry}${head}${frontHairClean}${d.glasses}${d.headwear}`,
      110,
      160
    );
  }
  return artSvg(`${shadow}${backHair}${torso}${legsAndShoes}${defaultOutfit}${head}${frontHair}`, 110, 160);
}

/** 4. MIA — Chestnut waves, pink beret, white blouse with ruffled collar, denim dungarees */
export function miaIllustration(mood = 'normal', worn: Product[] = []): string {
  const ink = '#2c1810';
  const skin = '#fff0e6';
  const hair = '#854d0e';
  const hairDeep = '#713f12';
  const hairLight = '#fde68a';
  const hairLine = '#451a03';

  // Back Hair (Warm wavy chocolate locks)
  const backHair = `
    <path d="M26 24 C10 34 11 65 14 82 C18 92 28 92 34 84 C26 76 22 58 28 42 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M84 24 C100 34 99 65 96 82 C92 92 82 92 76 84 C84 76 88 58 82 42 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M19 46 C16 62 22 74 29 82 M91 46 C94 62 88 74 81 82" fill="none" stroke="${hairDeep}" stroke-width="1.8" stroke-linecap="round"/>
  `;

  // Torso / Midriff
  const torso = customerTorso(skin);

  // Legs & Coral Striped Socks & Sneakers (Clean legs if wearing custom shoes or custom bottoms)
  const hasShoes = worn.some(p => p.category === 'shoes');
  const hasPants = worn.some(p => p.category === 'bottoms' && (p.art.includes('pants') || p.art === 'cargoPants' || p.art === 'parachutePants' || p.art === 'flareJeans' || p.art === 'baggyJeans' || p.subcategory === 'cargo' || p.subcategory === 'jeans'));
  const hasSocks = worn.some(p => p.category === 'accessories' && (p.subcategory === 'socks' || p.art === 'legWarmers' || p.art === 'socks'));
  const legsAndShoes = `
    ${customerLegs(skin)}
    ${(!hasShoes && !hasPants && !hasSocks) ? `
      <!-- Coral striped crew socks extending down into sneakers (y=142) -->
      <path d="M39.5 127 H50.5 V142 H39.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M60.5 127 H71.5 V142 H60.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M39.5 130 H50.5 M39.5 133 H50.5" stroke="#f43f5e" stroke-width="1.2"/>
      <path d="M60.5 130 H71.5 M60.5 133 H71.5" stroke="#f43f5e" stroke-width="1.2"/>
    ` : ''}
    ${!hasShoes ? `
      <!-- Chunky retro dark & coral sneakers -->
      <path d="M33 148 Q32 142 38 141 L49 141 Q52 143 51 148 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
      <path d="M37 141 Q42 138 47 141 L46 146 L38 146 Z" fill="#f43f5e"/>
      <path d="M31 148 H53 Q53 154 50 154 L33 154 Q31 154 31 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M59 148 Q58 142 64 141 L75 141 Q78 143 77 148 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
      <path d="M63 141 Q68 138 73 141 L72 146 L64 146 Z" fill="#f43f5e"/>
      <path d="M57 148 H79 Q79 154 77 154 L59 154 Q57 154 57 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
    ` : ''}
  `;

  // Default Outfit (White blouse with ruffled Peter Pan collar, navy dungaree shorts, tote - fit eo)
  const defaultOutfit = `
    <!-- Navy denim dungaree shorts fitting waist (ôm eo, nở chữ A tôn dáng) -->
    <path d="M46 76 C46 82 43.5 88 41 95 L53 96 L55 89 L57 96 L69 95 C66.5 88 64 82 64 76 Z" fill="#2563eb" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <!-- Dungaree waistband fitting waist -->
    <path d="M46 76 H64 V79 H46 Z" fill="#1d4ed8"/>
    <!-- Dungaree bib & straps with brass buttons -->
    <path d="M46 67 H64 V76 H46 Z" fill="#2563eb" stroke="${ink}" stroke-width="1.2"/>
    <path d="M44 62 L46 67 M66 62 L64 67" stroke="#1d4ed8" stroke-width="2.5"/>
    <circle cx="47.5" cy="68.5" r="1.1" fill="#fbbf24"/>
    <circle cx="62.5" cy="68.5" r="1.1" fill="#fbbf24"/>
    <rect x="50" y="69.5" width="10" height="4.5" rx="1.5" fill="#1d4ed8"/>
    <!-- White blouse with wide Peter Pan ruffled collar -->
    <path d="M44 60 C42 66 52 68 55 64 C58 68 68 66 66 60 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2"/>
    <path d="M44 62 C44 67 46 71 46 76 H64 C64 71 66 67 66 62 Z" fill="#ffffff"/>
    <!-- Arms & Tote bag -->
    <path d="M44 63 L35 76 L33 94" fill="none" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="33" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <path d="M66 63 L75 76 L77 94" fill="none" stroke="${skin}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="77" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <!-- Cute print tote bag -->
    <path d="M29 93 C27 88 34 88 32 93" fill="none" stroke="#e11d48" stroke-width="1.2"/>
    <rect x="22" y="93" width="15" height="17" rx="2" fill="#fef08a" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="30" cy="101" r="2.5" fill="#fb7185"/>
  `;

  // Head and Face (Warm amber hazel Doe eyes)
  const head = customerHeadAndFace({
    skin,
    hairLine,
    irisDark: '#78350f',
    irisColor: '#b45309',
    irisLight: '#f59e0b',
    mood
  });

  // Front Hair (tóc mái & tóc bên má khi thử đồ)
  const frontHairClean = `
    <!-- Chestnut wavy bangs -->
    <path d="M28 24 C31 13 44 9 53 10 C50 17 48 24 53 30 C47 28 41 24 37 28 C34 29 32 26 28 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M54 10 C65 9 76 13 82 24 C79 26 75 27 70 27 C66 24 64 20 60 29 C57 22 55 16 54 10 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M35 18 Q45 22 51 18 M57 18 Q66 22 74 18" fill="none" stroke="${hairLight}" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>
    <!-- Cheek framing locks -->
    <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
  `;
  const frontHair = `
    ${frontHairClean}
    <!-- Chic Terracotta Pink French Beret tilted on right -->
    <path d="M42 16 C42 4 82 4 84 16 C84 24 44 24 42 16 Z" fill="#fb7185" stroke="${ink}" stroke-width="1.4"/>
    <path d="M48 10 C52 7 74 7 78 12" fill="none" stroke="#fecdd3" stroke-width="1.8" stroke-linecap="round"/>
    <!-- Tiny center stem -->
    <path d="M64 4 L64 7" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>
  `;

  const shadow = `<ellipse cx="55" cy="154" rx="27" ry="5.5" fill="#2c1810" opacity="0.22"/>`;
  if (worn.length) {
    const d = renderDressedCustomerLayers(worn, skin, ink);
    return artSvg(
      `${shadow}${backHair}${d.body}${!hasShoes ? `<svg data-footwear="default" x="0" y="141" width="110" height="15" viewBox="0 141 110 15" overflow="hidden">${legsAndShoes}</svg>` : ""}${d.arms}${d.undergarments}${d.socks}${d.bottoms}${d.sets}${d.dresses}${d.tops}${d.outerwear}${d.shoes}${d.bags}${d.hands}${d.jewelry}${head}${frontHairClean}${d.glasses}${d.headwear}`,
      110,
      160
    );
  }
  return artSvg(`${shadow}${backHair}${torso}${legsAndShoes}${defaultOutfit}${head}${frontHair}`, 110, 160);
}

/** 5. ZOE — Pastel lavender hair, white & lilac oversized hoodie, lilac shorts */
export function zoeIllustration(mood = 'normal', worn: Product[] = []): string {
  const ink = '#2c1810';
  const skin = '#fff0e6';
  const hair = '#c084fc';
  const hairDeep = '#9333ea';
  const hairLight = '#f3e8ff';
  const hairLine = '#581c87';

  // Back Hair (Pastel lilac wavy hair flowing past shoulders)
  const backHair = `
    <path d="M26 24 C10 32 11 58 15 76 C20 86 32 86 36 78 C28 70 24 54 28 38 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M84 24 C100 32 99 58 95 76 C90 86 78 86 74 78 C82 70 86 54 82 38 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M19 46 C16 62 22 74 29 82 M91 46 C94 62 88 74 81 82" fill="none" stroke="${hairDeep}" stroke-width="1.8" stroke-linecap="round"/>
  `;

  // Torso / Midriff
  const torso = customerTorso(skin);

  // Legs & Crew Socks & Platform Sneakers (Clean legs if wearing custom shoes or custom bottoms)
  const hasShoes = worn.some(p => p.category === 'shoes');
  const hasPants = worn.some(p => p.category === 'bottoms' && (p.art.includes('pants') || p.art === 'cargoPants' || p.art === 'parachutePants' || p.art === 'flareJeans' || p.art === 'baggyJeans' || p.subcategory === 'cargo' || p.subcategory === 'jeans'));
  const hasSocks = worn.some(p => p.category === 'accessories' && (p.subcategory === 'socks' || p.art === 'legWarmers' || p.art === 'socks'));
  const legsAndShoes = `
    ${customerLegs(skin)}
    ${(!hasShoes && !hasPants && !hasSocks) ? `
      <!-- White crew socks extending down into sneakers (y=142) -->
      <path d="M39.5 127 H50.5 V142 H39.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M60.5 127 H71.5 V142 H60.5 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M39.5 130 H50.5" stroke="#c084fc" stroke-width="1.5"/>
      <path d="M60.5 130 H71.5" stroke="#c084fc" stroke-width="1.5"/>
    ` : ''}
    ${!hasShoes ? `
      <!-- Chunky platform sneakers (lilac & white) -->
      <path d="M33 148 Q32 142 38 141 L49 141 Q52 143 51 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M37 141 Q42 138 47 141 L46 146 L38 146 Z" fill="#c084fc"/>
      <path d="M31 148 H53 Q53 154 50 154 L33 154 Q31 154 31 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M59 148 Q58 142 64 141 L75 141 Q78 143 77 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
      <path d="M63 141 Q68 138 73 141 L72 146 L64 146 Z" fill="#c084fc"/>
      <path d="M57 148 H79 Q79 154 77 154 L59 154 Q57 154 57 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.4"/>
    ` : ''}
  `;

  // Default Outfit (White & lilac sporty crop hoodie jacket, lilac shorts - fit eo)
  const defaultOutfit = `
    <!-- Lilac shorts fitting waist beneath -->
    <path d="M45 82 H65 C67 87 68.5 92 69.5 96 L58 97 L55 91 L52 97 L40.5 96 C41.5 92 43 87 45 82 Z" fill="#c084fc" stroke="${ink}" stroke-width="1.2"/>
    <!-- White & Lilac Sporty Crop Hoodie Jacket (fit eo gọn gàng) -->
    <path d="M40 63 L31 68 L26 89 L34 91 L38 78 L45 78 L45 83 H65 L65 78 L72 78 L76 91 L84 89 L79 68 L70 63 Z" fill="#f5f3ff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M45 63 L55 72 L65 63" stroke="#ddd6fe" stroke-width="2.5" fill="none"/>
    <!-- Kangaroo pocket & waist ribbed hem -->
    <path d="M46 76 H64 V83 H46 Z" fill="#ddd6fe" stroke="${ink}" stroke-width="1.1"/>
    <path d="M51 68 L50 76 M59 68 L60 76" stroke="#a855f7" stroke-width="1.3"/>
    <!-- Cuffs & Hands -->
    <ellipse cx="27" cy="91" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <ellipse cx="83" cy="91" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
  `;

  // Head and Face (Amethyst violet Doe eyes)
  const head = customerHeadAndFace({
    skin,
    hairLine,
    irisDark: '#4c1d95',
    irisColor: '#7c3aed',
    irisLight: '#c084fc',
    mood
  });

  // Front Hair (tóc mái & angel ring khi thử đồ)
  const frontHairClean = `
    <path d="M28 24 C31 13 44 9 53 10 C50 17 48 24 53 30 C47 28 41 24 37 28 C34 29 32 26 28 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M54 10 C65 9 76 13 82 24 C79 26 75 27 70 27 C66 24 64 20 60 29 C57 22 55 16 54 10 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M35 18 Q45 22 51 18 M57 18 Q66 22 74 18" fill="none" stroke="${hairLight}" stroke-width="2.6" stroke-linecap="round" opacity="0.95"/>
    <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
  `;
  const frontHair = `
    ${frontHairClean}
    <!-- Cute hairclip on side -->
    <rect x="74" y="20" width="7" height="2.5" rx="1.2" fill="#f43f5e" stroke="${ink}" stroke-width="0.8"/>
  `;

  const shadow = `<ellipse cx="55" cy="154" rx="27" ry="5.5" fill="#2c1810" opacity="0.22"/>`;
  if (worn.length) {
    const d = renderDressedCustomerLayers(worn, skin, ink);
    return artSvg(
      `${shadow}${backHair}${d.body}${!hasShoes ? `<svg data-footwear="default" x="0" y="141" width="110" height="15" viewBox="0 141 110 15" overflow="hidden">${legsAndShoes}</svg>` : ""}${d.arms}${d.undergarments}${d.socks}${d.bottoms}${d.sets}${d.dresses}${d.tops}${d.outerwear}${d.shoes}${d.bags}${d.hands}${d.jewelry}${head}${frontHairClean}${d.glasses}${d.headwear}`,
      110,
      160
    );
  }
  return artSvg(`${shadow}${backHair}${torso}${legsAndShoes}${defaultOutfit}${head}${frontHair}`, 110, 160);
}

/** 6. RUBY — Vibrant red wavy hair, black ribbon bow, black crop vest, cargo shorts */
export function rubyIllustration(mood = 'normal', worn: Product[] = []): string {
  const ink = '#2c1810';
  const skin = '#fff0e6';
  const hair = '#f43f5e';
  const hairDeep = '#be123c';
  const hairLight = '#fecdd3';
  const hairLine = '#881337';

  // Back Hair (Bouncy wavy red locks with flared tufts)
  const backHair = `
    <path d="M26 24 C8 32 10 60 14 78 C20 88 32 86 36 78 C28 70 24 52 28 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M84 24 C102 32 100 60 96 78 C90 88 78 86 74 78 C82 70 86 52 82 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M19 46 C15 64 21 76 29 84 M91 46 C95 64 89 76 81 84" fill="none" stroke="${hairDeep}" stroke-width="1.8" stroke-linecap="round"/>
  `;

  // Torso / Midriff
  const torso = customerTorso(skin);

  // Legs & Pink Crew Socks & Black Platform Sneakers (Clean legs if wearing custom shoes or custom bottoms)
  const hasShoes = worn.some(p => p.category === 'shoes');
  const hasPants = worn.some(p => p.category === 'bottoms' && (p.art.includes('pants') || p.art === 'cargoPants' || p.art === 'parachutePants' || p.art === 'flareJeans' || p.art === 'baggyJeans' || p.subcategory === 'cargo' || p.subcategory === 'jeans'));
  const hasSocks = worn.some(p => p.category === 'accessories' && (p.subcategory === 'socks' || p.art === 'legWarmers' || p.art === 'socks'));
  const legsAndShoes = `
    ${customerLegs(skin)}
    ${(!hasShoes && !hasPants && !hasSocks) ? `
      <!-- Pink crew socks extending down into sneakers (y=142) -->
      <path d="M39.5 127 H50.5 V142 H39.5 Z" fill="#f472b6" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M60.5 127 H71.5 V142 H60.5 Z" fill="#f472b6" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
    ` : ''}
    ${!hasShoes ? `
      <!-- Chunky black platform sneakers with cross laces -->
      <path d="M33 148 Q32 142 38 141 L49 141 Q52 143 51 148 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
      <path d="M38 143 L44 146 M44 143 L38 146" stroke="#ffffff" stroke-width="1"/>
      <path d="M31 148 H53 Q53 154 50 154 L33 154 Q31 154 31 148 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
      <path d="M59 148 Q58 142 64 141 L75 141 Q78 143 77 148 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
      <path d="M64 143 L70 146 M70 143 L64 146" stroke="#ffffff" stroke-width="1"/>
      <path d="M57 148 H79 Q79 154 77 154 L59 154 Q57 154 57 148 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
    ` : ''}
  `;

  // Default Outfit (Dark crop vest, black cargo shorts with pink straps, black arm warmers - fit eo)
  const defaultOutfit = `
    <!-- High-waist Black cargo shorts fitting waist -->
    <path d="M45 80 H65 C67 85 69 90 70 96 L58 97 L55 90 L52 97 L40 96 C41 90 43 85 45 80 Z" fill="#27272a" stroke="${ink}" stroke-width="1.3"/>
    <path d="M43 88 H48 L47 94 H42 Z" fill="#18181b"/>
    <path d="M62 88 H67 L68 94 H63 Z" fill="#18181b"/>
    <!-- Pink contrast utility straps -->
    <path d="M44 86 H49 M61 86 H66 M45 94 L47 97 M65 94 L63 97" stroke="#f43f5e" stroke-width="1.3"/>
    <!-- Black crop vest fitting waist with v-cut hem -->
    <path d="M44 63 H66 C66 67 65 71 64.5 75 L55 77 L45.5 75 C45 71 44 67 44 63 Z" fill="#18181b" stroke="${ink}" stroke-width="1.3"/>
    <circle cx="55" cy="67" r="1.1" fill="#ffffff"/>
    <circle cx="55" cy="72" r="1.1" fill="#ffffff"/>
    <!-- Choker -->
    <path d="M49 61 H61" stroke="#18181b" stroke-width="1.8"/>
    <!-- Black arm warmers with pink cuffs -->
    <path d="M42 63 L34 76 L32 94" fill="none" stroke="#805766" stroke-width="7.5" stroke-linecap="round"/><path d="M42 63 L34 76 L32 94" fill="none" stroke="${skin}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M36 78 L33 93" fill="none" stroke="#18181b" stroke-width="6" stroke-linecap="round"/>
    <path d="M31 93 H35" stroke="#f43f5e" stroke-width="2"/>
    <ellipse cx="32" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
    <path d="M68 63 L76 76 L78 94" fill="none" stroke="#805766" stroke-width="7.5" stroke-linecap="round"/><path d="M68 63 L76 76 L78 94" fill="none" stroke="${skin}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M74 78 L77 93" fill="none" stroke="#18181b" stroke-width="6" stroke-linecap="round"/>
    <path d="M75 93 H79" stroke="#f43f5e" stroke-width="2"/>
    <ellipse cx="78" cy="95" rx="3.5" ry="3" fill="${skin}" stroke="${ink}" stroke-width="1"/>
  `;

  // Head and Face (Ruby crimson Doe eyes)
  const head = customerHeadAndFace({
    skin,
    hairLine,
    irisDark: '#881337',
    irisColor: '#e11d48',
    irisLight: '#fb7185',
    mood
  });

  // Front Hair (tóc mái & angel ring khi thử đồ)
  const frontHairClean = `
    <!-- Red wavy bangs with highlights -->
    <path d="M28 24 C31 13 44 9 53 10 C50 17 48 24 53 30 C47 28 41 24 37 28 C34 29 32 26 28 24 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M54 10 C65 9 76 13 82 24 C79 26 75 27 70 27 C66 24 64 20 60 29 C57 22 55 16 54 10 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M35 18 Q45 22 51 18 M57 18 Q66 22 74 18" fill="none" stroke="${hairLight}" stroke-width="2.6" stroke-linecap="round" opacity="0.95"/>
    <path d="M28 24 C20 36 21 48 28 56 C24 53 23 44 26 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
    <path d="M82 24 C90 36 89 48 82 56 C86 53 87 44 84 36 Z" fill="${hair}" stroke="${hairLine}" stroke-width="1.4"/>
  `;
  const frontHair = `
    ${frontHairClean}
    <!-- Black Ribbon Bow on top -->
    <path d="M47 15 Q41 23 39 29 L44 27 L48 18 Z M63 15 Q69 23 71 29 L66 27 L62 18 Z" fill="#18181b" stroke="${ink}" stroke-width="1.2"/>
    <path d="M52 14 C36 4 30 11 34 19 C38 23 48 19 51 16 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
    <path d="M58 14 C74 4 80 11 76 19 C72 23 62 19 59 16 Z" fill="#18181b" stroke="${ink}" stroke-width="1.4"/>
    <ellipse cx="55" cy="14" rx="3.5" ry="3" fill="#18181b" stroke="${ink}" stroke-width="1.2"/>
  `;

  const shadow = `<ellipse cx="55" cy="154" rx="27" ry="5.5" fill="#2c1810" opacity="0.22"/>`;
  if (worn.length) {
    const d = renderDressedCustomerLayers(worn, skin, ink);
    return artSvg(
      `${shadow}${backHair}${d.body}${!hasShoes ? `<svg data-footwear="default" x="0" y="141" width="110" height="15" viewBox="0 141 110 15" overflow="hidden">${legsAndShoes}</svg>` : ""}${d.arms}${d.undergarments}${d.socks}${d.bottoms}${d.sets}${d.dresses}${d.tops}${d.outerwear}${d.shoes}${d.bags}${d.hands}${d.jewelry}${head}${frontHairClean}${d.glasses}${d.headwear}`,
      110,
      160
    );
  }
  return artSvg(`${shadow}${backHair}${torso}${legsAndShoes}${defaultOutfit}${head}${frontHair}`, 110, 160);
}

export type CustomerArchetype = 'lily' | 'emma' | 'sophie' | 'mia' | 'zoe' | 'ruby';

/**
 * Phân tích và ánh xạ khách hàng (cả static và procedural) về 1 trong 6 canonical visual archetype
 * đảm bảo tuân thủ tuyệt đối MASTER ART BIBLE (Cute Retro Anime Cartoon x Premium Fashion).
 */
export function getCustomerArchetype(model: Partial<Pick<Customer, 'id' | 'styles' | 'personality'>>): CustomerArchetype {
  const id = (model.id ?? '').toLowerCase();
  if (id === 'lily' || id === 'linh' || id === 'nhi') return 'lily';
  if (id === 'emma' || id === 'kai' || id === 'bao') return 'emma';
  if (id === 'sophie' || id === 'elle' || id === 'rina') return 'sophie';
  if (id === 'mia' || id === 'an' || id === 'may') return 'mia';
  if (id === 'zoe' || id === 'nari' || id === 'vy') return 'zoe';
  if (id === 'ruby' || id === 'chloe' || id === 'jade' || id === 'thu') return 'ruby';

  // Với khách sinh theo thuật toán procedural (id bắt đầu bằng gen_...)
  const styles = model.styles ?? [];
  if (styles.some(s => ['Streetwear', 'Blokecore', 'Gorpcore', 'Casual'].includes(s))) return 'emma';
  if (styles.some(s => ['Clean Girl', 'Sporty Chic', 'Minimal'].includes(s))) return 'sophie';
  if (styles.some(s => ['Vintage', 'Cottagecore', 'Preppy', 'Poetcore'].includes(s))) return 'mia';
  if (styles.some(s => ['Y2K', 'K-pop'].includes(s))) return 'zoe';
  if (styles.some(s => ['Dark Academia', 'Grunge', 'Luxury'].includes(s))) return 'ruby';
  if (styles.some(s => ['Coquette', 'Soft Girl', 'Balletcore'].includes(s))) return 'lily';

  const p = (model.personality ?? '').toLowerCase();
  if (p.includes('street') || p.includes('năng động')) return 'emma';
  if (p.includes('clean') || p.includes('chill') || p.includes('nhạc')) return 'sophie';
  if (p.includes('vintage') || p.includes('thơ') || p.includes('picnic')) return 'mia';
  if (p.includes('trend') || p.includes('y2k') || p.includes('k-pop')) return 'zoe';
  if (p.includes('gothic') || p.includes('ngầu') || p.includes('vip') || p.includes('tính')) return 'ruby';

  return 'lily';
}

function addCustomerVariant(svg: string, model: Model): string {
  const id = (model.id ?? '').toLowerCase();
  if (['lily', 'emma', 'sophie', 'mia', 'zoe', 'ruby'].includes(id)) return svg;
  const hash = Array.from(id).reduce((value, char) => Math.imul(value ^ (char.codePointAt(0) ?? 0), 16777619) >>> 0, 2166136261);
  const accent = model.outfit || '#f59ac4';
  const hair = model.hair || '#70485f';
  const ink = paint.ink;
  const variants = [
    `<g stroke="${ink}" stroke-width="1.35"><ellipse cx="42" cy="40" rx="9" ry="6.5" fill="#dff5ff" fill-opacity=".34"/><ellipse cx="68" cy="40" rx="9" ry="6.5" fill="#dff5ff" fill-opacity=".34"/><path d="M51 40H59M33 39L28 36M77 39L82 36" fill="none"/></g>`,
    `<path d="M29 25Q55 5 81 25" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M29 25Q55 5 81 25" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="18" r="3" fill="#ffd36e" stroke="${ink}"/>`,
    `<path d="M31 20Q38 3 60 5Q78 6 82 21Q58 16 31 20Z" fill="${accent}" stroke="${ink}" stroke-width="1.5"/><path d="M48 5Q55 0 62 6" fill="none" stroke="${ink}" stroke-width="1.4"/>`,
    `<g fill="${accent}" stroke="#fff" stroke-width="1.5"><path d="M29 28l4-6 4 6-4 3Z"/><path d="M75 25l4-6 4 6-4 3Z"/></g><circle cx="33" cy="27" r="1.5" fill="#ffd86b"/><circle cx="79" cy="24" r="1.5" fill="#ffd86b"/>`,
    `<path d="M45 60Q55 66 65 60L68 69Q55 75 42 69Z" fill="${accent}" stroke="${ink}" stroke-width="1.3"/><circle cx="55" cy="67" r="3" fill="#ffe58d" stroke="#fff" stroke-width="1"/>`,
    `<g fill="${accent}" stroke="#fff" stroke-width="1.6"><path d="M27 29Q31 22 36 28Q32 34 27 29Z"/><path d="M74 27Q79 20 84 27Q79 33 74 27Z"/></g>`,
    `<path d="M25 36Q23 18 38 13M85 36Q87 18 72 13" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/><rect x="21" y="34" width="8" height="17" rx="4" fill="${accent}" stroke="${ink}" stroke-width="1.3"/><rect x="81" y="34" width="8" height="17" rx="4" fill="${accent}" stroke="${ink}" stroke-width="1.3"/>`,
    `<path d="M30 22Q46 7 68 11Q79 13 84 22Q57 18 30 22Z" fill="${accent}" stroke="${ink}" stroke-width="1.5"/><path d="M30 22Q24 23 21 27Q34 28 45 21" fill="${accent}" stroke="${ink}" stroke-width="1.4"/>`,
  ];
  return svg.replace('</svg>', `<g data-customer-variant="${hash % variants.length}">${variants[hash % variants.length]}</g></svg>`);
}

/**
 * Universal character illustration router:
 * Renders the exact 6 canonical characters (Lily, Emma, Sophie, Mia, Zoe, Ruby)
 * and seamlessly handles dress try-on overlays.
 */
export function characterIllustration(model: Model, mood = 'normal', working = false, worn: Product[] = []) {
  const id = (model.id ?? 'owner').toLowerCase();
  if ((id === 'owner' || (model.hair === '#ffd890' && model.hairStyle === 2)) && !worn.length) {
    return ownerIllustration(working, mood);
  }

  const archetype = getCustomerArchetype(model);
  const illustration = archetype === 'emma' ? emmaIllustration(mood, worn)
    : archetype === 'sophie' ? sophieIllustration(mood, worn)
      : archetype === 'mia' ? miaIllustration(mood, worn)
        : archetype === 'zoe' ? zoeIllustration(mood, worn)
          : archetype === 'ruby' ? rubyIllustration(mood, worn)
            : lilyIllustration(mood, worn);
  return addCustomerVariant(illustration, model);
}

// ============================================================================
// HAUTE COUTURE FITTED TAILORING SYSTEM
// Renders every wardrobe piece seamlessly contoured to the exact 110x160
// anime customer rig (neck y=62, chest y=63..75, waist y=75..76, hips y=78..88,
// legs y=88..141, feet y=141..154, arms x=32..77 y=63..95)
// ============================================================================

function renderFittedBottom(p: Product, skin: string, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.35);
  const sub = p.subcategory || '';
  const art = p.art || '';

  // 1. Quần dài: Jeans, Cargo, Parachute, Baggy, Flare
  if (sub === 'jeans' || sub === 'cargo' || art.includes('pants') || art.includes('jeans') || art === 'cargoPants' || art === 'parachutePants') {
    const isCargo = sub === 'cargo' || art === 'cargoPants' || art === 'parachutePants';
    return `
      <!-- High-Waist Fitted Trousers / Jeans (ôm eo x=45..65 tại y=78, nở nhẹ hông rồi buông ống thời trang) -->
      <path d="M45 78 H65 C67 83 68.5 88 68.5 92 L74 142 L58 142 L55 95 L52 142 L36 142 L41.5 92 C41.5 88 43 83 45 78 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Waistband with stitch and button -->
      <path d="M45 78 H65 V82 H45 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <circle cx="55" cy="80" r="1.1" fill="#fbbf24" stroke="${ink}" stroke-width="0.6"/>
      <!-- Fly stitch -->
      <path d="M55 82 V90" stroke="${ink}" stroke-width="1.1"/>
      <!-- Front side curved pockets -->
      <path d="M47 82 Q49 88 43 90 M63 82 Q61 88 67 90" stroke="${darkC}" stroke-width="1.1" fill="none"/>
      <!-- Center leg crease / wash highlight -->
      <path d="M44 94 L42 138 M66 94 L68 138" stroke="${lightC}" stroke-width="1.2" stroke-linecap="round" opacity="0.65"/>
      ${isCargo ? `
        <!-- 3D Cargo Flap Pockets on outer thighs -->
        <rect x="33" y="102" width="7" height="14" rx="1.8" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
        <path d="M33 105 H40" stroke="${ink}" stroke-width="1.1"/>
        <rect x="70" y="102" width="7" height="14" rx="1.8" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
        <path d="M70 105 H77" stroke="${ink}" stroke-width="1.1"/>
      ` : ''}
    `;
  }

  // Denim shorts: fitted waistband with two separate legs and visible pocket stitching.
  if (sub === 'shorts' || art === 'shorts') {
    return `
      <path d="M45 77 H65 L68 98 H57 L55 86 L53 98 H42 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M45 77 H65 V81 H45 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <circle cx="55" cy="79" r="1.1" fill="#fbbf24"/>
      <path d="M47 81 Q49 86 44 88 M63 81 Q61 86 66 88 M55 81 V91" fill="none" stroke="${lightC}" stroke-width="1"/>
      <path d="M43 95 L48 98 M67 95 L62 98" stroke="${lightC}" stroke-width="1.2"/>
    `;
  }

  // 2. Chân váy xếp ly (Pleated / Tennis Skirt)
  if (sub === 'pleated' || art === 'pleatedSkirt' || art === 'skirt') {
    return `
      <!-- High-Waist Pleated Tennis Skirt (siết eo y=76, xòe chữ A đến đùi y=102) -->
      <path d="M46 76 H64 L70 102 H40 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M46 76 H64 V80 H46 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <!-- Crisp knife pleats with cel-shadowing -->
      <path d="M46 80 L40 102 M50 80 L46 102 M54 80 L52 102 M56 80 L58 102 M60 80 L64 102 M64 80 L70 102" stroke="${darkC}" stroke-width="1.2"/>
      <path d="M42 99 H68" stroke="${lightC}" stroke-width="1" opacity="0.8"/>
    `;
  }

  // 3. Váy bí (Bubble Skirt)
  if (sub === 'bubble' || art === 'bubbleSkirt') {
    return `
      <!-- Bubble Skirt: Fitted waistband, bouncy gathered hem -->
      <path d="M46 76 H64 C73 84 74 98 68 101 C60 104 50 104 42 101 C36 98 37 84 46 76 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M46 76 H64 V80 H46 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <!-- Soft bubble volume gathers -->
      <path d="M43 97 Q48 102 55 101 Q62 102 67 97" fill="none" stroke="${darkC}" stroke-width="1.2"/>
      <circle cx="55" cy="80" r="1.1" fill="#ffffff"/>
    `;
  }

  // 4. Chân váy Mini hoặc Shorts (Mặc định cho các loại bottom ngắn)
  return `
    <!-- Chic A-line Mini Skirt / Shorts (ôm eo thon gọn, tôn dáng đùi) -->
    <path d="M45 77 H65 L69 98 H41 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M45 77 H65 V81 H45 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
    <!-- Subtle front slit or pocket -->
    <path d="M48 81 V98 M62 81 V98" stroke="${darkC}" stroke-width="0.8" opacity="0.5"/>
    <path d="M45 94 L42 98" stroke="${ink}" stroke-width="1.2"/>
  `;
}

function renderFittedTop(p: Product, skin: string, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.45);
  const sub = p.subcategory || '';
  const art = p.art || '';

  // 1. Corset / Bustier
  if (sub === 'corset' || art === 'corset') {
    return `
      <!-- Sweetheart Bustier / Corset (siết chặt eo y=76, cúp tim quyến rũ) -->
      <path d="M44 65 C44 61 49 61 55 64 C61 61 66 61 66 65 C66 69 65 73 64 76 H46 C45 73 44 69 44 65 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Boning structure lines -->
      <path d="M49 63 L49 76 M55 64 L55 76 M61 63 L61 76" stroke="${darkC}" stroke-width="1.1"/>
      <!-- Dainty ribbon bow in center -->
      <circle cx="55" cy="64.5" r="1.5" fill="#f43f5e"/>
      <path d="M53 64.5 Q51 63 52 66 Q54 65 55 64.5 M57 64.5 Q59 63 58 66 Q56 65 55 64.5" fill="#f43f5e"/>
    `;
  }

  // 2. Hoodie / Sweater Oversized
  if (sub === 'hoodie' || sub === 'oversized' || art === 'hoodie' || art === 'oversizedTee' || art === 'atelierOversizedTee') {
    return `
      <!-- Oversized Streetwear Hoodie (phom boxy ấm áp, vai trễ, kangaroo pocket) -->
      <path d="M48 60 Q55 64 62 60 Q70 60 74 66 L80 88 Q78 91 73 91 L68 77 L68 85 Q55 88 42 85 L42 77 L37 91 Q32 91 30 88 L35 67 Q39 61 48 60 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Hoodie collar / drape -->
      <path d="M45 63 Q55 72 65 63" stroke="${darkC}" stroke-width="2.5" fill="none"/>
      <!-- Ribbed cuffs and hem -->
      <path d="M43 82 Q55 84 67 82 L67 85 Q55 87 43 85 Z" fill="${darkC}" stroke="${ink}" stroke-width="1"/>
      <!-- Kangaroo pocket -->
      <path d="M48 74 H62 L60 80 H50 Z" fill="${darkC}" stroke="${ink}" stroke-width="1" opacity="0.6"/>
      <!-- Drawstrings -->
      <path d="M52 69 V75 M58 69 V75" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    `;
  }

  // Croptop and camisole: clean sleeveless construction that follows the torso.
  if (sub === 'crop' || sub === 'camisole') {
    const straps = sub === 'camisole'
      ? `<path d="M48 61 L47 66 M62 61 L63 66" stroke="${ink}" stroke-width="1.1"/>`
      : `<path d="M47 62 Q55 69 63 62" fill="none" stroke="${lightC}" stroke-width="1.5"/>`;
    return `
      ${straps}
      <path d="M46 65 Q50 63 55 66 Q60 63 64 65 L63 77 Q55 79 47 77 Z" fill="${c}" stroke="${ink}" stroke-width="1.25" stroke-linejoin="round"/>
      <path d="M48 74 Q55 77 62 74" fill="none" stroke="${lightC}" stroke-width="1.25" opacity=".8"/>
      ${sub === 'camisole' ? `<circle cx="55" cy="68" r="1" fill="#fff"/><circle cx="55" cy="72" r="1" fill="#fff"/>` : ''}
    `;
  }

  // 3. Sơ mi (Shirt)
  if (sub === 'shirt' || art === 'shirt') {
    return `
      <!-- Preppy Crisp Button-Down Shirt (cổ bẻ, cúc áo, fit eo) -->
      <path d="M48 61 Q55 64 62 61 L67 62 L72 67 L76 74 L70 77 L66 71 L65 80 Q55 82 45 80 L44 71 L40 77 L34 74 L38 67 L43 62 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
      <!-- Short Sleeves -->
          <!-- Folded collar -->
      <path d="M48 62 L43 68 L53 66 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1"/>
      <path d="M62 62 L67 68 L57 66 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1"/>
      <!-- Pearl button placket -->
      <path d="M55 64 V76" stroke="${darkC}" stroke-width="1"/>
      <circle cx="55" cy="67" r="0.9" fill="#ffffff"/>
      <circle cx="55" cy="71" r="0.9" fill="#ffffff"/>
      <circle cx="55" cy="75" r="0.9" fill="#ffffff"/>
    `;
  }

  // 4. Áo trễ vai (Off-shoulder)
  if (sub === 'offshoulder' || art === 'offshoulder') {
    return `
      <!-- Romantic Ruffled Off-shoulder Top (khoe xương quai xanh, tay bồng) -->
      <ellipse cx="34" cy="69" rx="5" ry="5.5" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
      <ellipse cx="76" cy="69" rx="5" ry="5.5" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M44 68 C44 71 46 73 46 76 H64 C64 73 66 71 66 68 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
      <!-- Ruffled elastic neckline -->
      <path d="M30 67 Q55 72 80 67 Q55 69 30 67 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1"/>
    `;
  }

  // 5. Jersey (Sporty Blokecore)
  if (sub === 'jersey' || art === 'jersey') {
    return `
      <!-- Sporty Blokecore Jersey (sọc vai, số in thể thao '07') -->
      <path d="M48 61 L55 64 L62 61 L67 62 L74 69 L78 77 L70 80 L66 73 L66 82 Q55 84 44 82 L44 73 L40 80 L32 77 L36 69 L43 62 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
          <!-- White shoulder stripes -->
      <path d="M42 64 L36 68 M44 66 L38 70" stroke="#ffffff" stroke-width="1.4"/>
      <path d="M68 64 L74 68 M66 66 L72 70" stroke="#ffffff" stroke-width="1.4"/>
      <!-- V-neck collar -->
      <path d="M48 63 L55 67 L62 63" stroke="#ffffff" stroke-width="1.6" fill="none"/>
      <!-- Number 07 -->
      <text x="55" y="73" font-family="'Arial Black', sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" stroke="${ink}" stroke-width="0.6" text-anchor="middle">07</text>
    `;
  }

  // One continuous silhouette follows the shoulders, underarms and waist.
  return `<g data-tailoring="fitted-tee">
    <path d="M48 61 Q55 65 62 61 L67 62 Q70 63 72 67 L76 73 L70 77 L66 71 Q64 73 64.5 78 Q55 80 45.5 78 Q46 73 44 71 L40 77 L34 73 L38 66 Q40 63 43 62 Z" fill="${c}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M44 70 Q47 74 46 77 M66 70 Q63 74 64 77" fill="none" stroke="${darkC}" stroke-width="1.4" opacity=".65"/>
    <path d="M47 62 Q55 67 63 62" fill="none" stroke="${lightC}" stroke-width="1.8"/>
    <path d="M47 77 Q55 79 63 77 M36 72 L40 75 M70 75 L74 72" fill="none" stroke="${darkC}" stroke-width=".8"/>
    <path d="M55 72 C49 68 51 66 55 69 C59 66 61 68 55 72Z" fill="#fff1f7" stroke="${darkC}" stroke-width=".6"/>
  </g>`;
}

function renderFittedDress(p: Product, skin: string, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.45);
  const sub = p.subcategory || '';
  const art = p.art || '';

  // 1. Slip Dress: Lụa satin hai dây mảnh, ôm đường cong đến quá gối
  if (sub === 'slip' || art === 'slipDress') {
    return `
      <!-- Spaghetti straps -->
      <path d="M47 62 V66 M63 62 V66" stroke="${ink}" stroke-width="1.2"/>
      <!-- Satin Slip Dress (thân lụa ôm sát ngực, thắt eo, buông mềm xuống y=122) -->
      <path d="M44 66 C44 70 46 74 46 76 C45 84 41 98 42 122 H68 C69 98 65 84 64 76 C64 74 66 70 66 66 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Thigh slit on left leg -->
      <path d="M46 108 L42 122" stroke="${ink}" stroke-width="1.2"/>
      <!-- Silk luster highlights -->
      <path d="M48 78 Q47 95 49 118" stroke="${lightC}" stroke-width="1.4" opacity="0.6" stroke-linecap="round"/>
      <path d="M62 78 Q63 95 61 118" stroke="${lightC}" stroke-width="1.4" opacity="0.6" stroke-linecap="round"/>
    `;
  }

  // 2. Maxi Dress: Dài thướt tha chạm mắt cá chân y=139
  if (sub === 'maxi' || art === 'maxiDress') {
    return `
      <!-- Maxi Dress: Fitted bodice, tiered flowing ruffled skirt reaching ankles -->
      <path d="M44 63 C44 67 46 71 46 76 C46 82 41 105 38 139 H72 C69 105 64 82 64 76 C64 71 66 67 66 63 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Cute ruffled cap sleeves -->
      <path d="M46 62 Q39 60 36 65 L35 69 L41 72 L45 68 Z" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
      <path d="M64 62 Q71 60 74 65 L75 69 L69 72 L65 68 Z" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
      <!-- Tiered flounce lines -->
      <path d="M43 98 Q55 102 67 98 M40 120 Q55 124 70 120" stroke="${darkC}" stroke-width="1.2" fill="none"/>
      <!-- Waist sash -->
      <path d="M46 76 H64 V78.5 H46 Z" fill="${darkC}"/>
      <circle cx="55" cy="77" r="1.5" fill="#fbbf24"/>
    `;
  }

  // 3. Mini Dress / Babydoll Date Dress (Mặc định cho dress)
  return `
    <!-- Sunday Date Mini Dress (thân trên ôm ngực, eo thắt nơ, chân váy xòe bồng bềnh đến y=104) -->
    <path d="M44 63 C44 67 46 71 46 76 C46 80 43 85 39 104 H71 C67 85 64 80 64 76 C64 71 66 68 66 63 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <!-- Puffed sweetheart sleeves -->
    <path d="M46 62 Q39 59 35 65 Q32 69 38 73 L44 71 Z" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
    <path d="M64 62 Q71 59 75 65 Q78 69 72 73 L66 71 Z" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
    <!-- Sweetheart neckline & Coquette bow -->
    <path d="M48 63 Q55 67 62 63" stroke="${darkC}" stroke-width="1.2" fill="none"/>
    <circle cx="55" cy="76" r="1.5" fill="#f43f5e"/>
    <path d="M53 76 Q50 74 51 78 Q53 77 55 76 M57 76 Q60 74 59 78 Q57 77 55 76" fill="#f43f5e"/>
    <!-- Ruffled hemline -->
    <path d="M39 104 Q47 101 55 104 Q63 101 71 104" stroke="${darkC}" stroke-width="1.2" fill="none"/>
  `;
}

function renderFittedOuterwear(p: Product, skin: string, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.35);
  const sub = p.subcategory || '';
  const art = p.art || '';

  // 1. Trench Coat: Dài qua gối y=125, ve to bản
  if (sub === 'trench' || art === 'trench') {
    return `
      <!-- Trench Coat: Open front draping gracefully to mid-calf -->
      <!-- Left flap & sleeve -->
      <path d="M43 62 L31 67 L25 89 L32 91 L37 75 L42 75 L38 125 L47 125 L49 76 L44 62 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Right flap & sleeve -->
      <path d="M67 62 L79 67 L85 89 L78 91 L73 75 L68 75 L72 125 L63 125 L61 76 L66 62 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Wide notched lapels -->
      <path d="M44 62 L39 70 L48 72 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <path d="M66 62 L71 70 L62 72 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <!-- Waist belt straps hanging -->
      <path d="M43 78 L38 88 M67 78 L72 88" stroke="${darkC}" stroke-width="1.6"/>
    `;
  }

  // 2. Blazer Atelier: Phom đứng, ve K-lapel thanh lịch
  if (sub === 'blazer' || art === 'blazer') {
    return `
      <!-- Chic Tailored Blazer: Structured shoulders, open front showing top -->
      <!-- Left side -->
      <path d="M43 62 L32 67 L26 89 L33 91 L37 75 L43 75 L41 88 L48 88 L49 75 L44 62 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Right side -->
      <path d="M67 62 L78 67 L84 89 L77 91 L73 75 L67 75 L69 88 L62 88 L61 75 L66 62 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <!-- Blazer lapels -->
      <path d="M44 62 L39 68 L47 70 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <path d="M66 62 L71 68 L63 70 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <!-- Flap pockets -->
      <rect x="42" y="82" width="6" height="2" rx="0.5" fill="${darkC}"/>
      <rect x="62" y="82" width="6" height="2" rx="0.5" fill="${darkC}"/>
    `;
  }

  // 3. Cardigan / Jacket (Mặc định cho outerwear): Len mềm buông mở hai bên vai
  return `
    <!-- Cozy Pastel Knit Cardigan (áo khoác dệt kim buông tà tự nhiên) -->
    <!-- Left sleeve & drape -->
    <path d="M43 62 L33 67 L27 88 L34 90 L38 74 L44 74 L42 86 L47 86 L48 74 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <!-- Right sleeve & drape -->
    <path d="M67 62 L77 67 L83 88 L76 90 L72 74 L66 74 L68 86 L63 86 L62 74 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <!-- Knit ribbing along open edges -->
    <path d="M44 62 L42 86 M66 62 L68 86" stroke="${darkC}" stroke-width="1.4"/>
  `;
}

function renderFittedSet(p: Product, skin: string, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.35);
  const sub = p.subcategory || '';

  if (sub === 'pantsSet') {
    // Top cropped vest + high-waist pants
    return `
      <!-- Set Áo Quần Đồng Bộ: Vest cộc + Quần ống suông -->
      <!-- Pants part -->
      <path d="M45 78 H65 C67 83 68.5 88 68.5 92 L74 142 L58 142 L55 95 L52 142 L36 142 L41.5 92 C41.5 88 43 83 45 78 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M45 78 H65 V82 H45 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.1"/>
      <path d="M44 94 L42 138 M66 94 L68 138" stroke="${lightC}" stroke-width="1.2" opacity="0.6"/>
      <!-- Top cropped vest -->
      <path d="M44 63 C44 67 46 71 46 75 L55 77 L64 75 C64 71 66 67 66 63 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
      <circle cx="55" cy="67" r="1" fill="#fbbf24"/>
      <circle cx="55" cy="71" r="1" fill="#fbbf24"/>
    `;
  }

  // Skirt Set / Shorts Set (Mặc định cho sets)
  return `
    <!-- Set Áo Váy Đồng Bộ: Baby tee/vest + Váy xếp ly ton-sur-ton -->
    <!-- Pleated Skirt -->
    <path d="M46 76 H64 L70 101 H40 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M46 80 L40 101 M50 80 L46 101 M54 80 L52 101 M56 80 L58 101 M60 80 L64 101 M64 80 L70 101" stroke="${darkC}" stroke-width="1.2"/>
    <!-- Top Part -->
    <path d="M44 63 C44 67 46 71 46 75 H64 C64 71 66 67 66 63 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M44 63 L35 68 L37 73 L44 70 Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M66 63 L75 68 L73 73 L66 70 Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <circle cx="55" cy="69" r="1.5" fill="#ffffff"/>
  `;
}

function renderFittedShoes(p: Product, skin: string, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.45);
  const sub = p.subcategory || '';
  const art = p.art || '';

  // 1. Mary Jane / Ballet Flats / Ballet Sneaker
  if (sub === 'ballet' || sub === 'balletSneaker' || art === 'ballet' || art === 'balletSneaker') {
    return `
      <!-- Mary Jane / Balletcore Shoes (quai ngang, mũi tròn bóng, nơ ruy băng) -->
      <!-- Left Shoe -->
      <path d="M33 148 Q32 143 38 143 L48 143 Q51 145 50 148 L49 153 L32 153 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M36 146 H47" stroke="${ink}" stroke-width="1.2"/>
      <circle cx="47" cy="146" r="0.8" fill="#fbbf24"/>
      <!-- Right Shoe -->
      <path d="M60 148 Q59 143 65 143 L75 143 Q78 145 77 148 L76 153 L59 153 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M63 146 H74" stroke="${ink}" stroke-width="1.2"/>
      <circle cx="63" cy="146" r="0.8" fill="#fbbf24"/>
      <!-- Glossy highlight on toes -->
      <ellipse cx="36" cy="150" rx="2" ry="1.2" fill="#ffffff" opacity="0.6"/>
      <ellipse cx="73" cy="150" rx="2" ry="1.2" fill="#ffffff" opacity="0.6"/>
    `;
  }

  // 2. Loafer Preppy
  if (sub === 'loafer' || art === 'loafer') {
    return `
      <!-- Preppy Loafers: Penny slot & gold horsebit chain buckle -->
      <!-- Left Loafer -->
      <path d="M33 147 Q32 141 38 141 L48 141 Q51 143 50 147 L49 153 L32 153 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <rect x="37" y="144" width="9" height="2.5" rx="0.5" fill="${darkC}" stroke="${ink}" stroke-width="0.8"/>
      <rect x="40" y="144.5" width="3" height="1.5" fill="#fbbf24"/>
      <rect x="31" y="152" width="19" height="2" fill="#18181b"/>
      <!-- Right Loafer -->
      <path d="M60 147 Q59 141 65 141 L75 141 Q78 143 77 147 L76 153 L59 153 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <rect x="64" y="144" width="9" height="2.5" rx="0.5" fill="${darkC}" stroke="${ink}" stroke-width="0.8"/>
      <rect x="67" y="144.5" width="3" height="1.5" fill="#fbbf24"/>
      <rect x="58" y="152" width="19" height="2" fill="#18181b"/>
    `;
  }

  // 3. Boots (Grunge / Dark Academia)
  if (sub === 'boot' || art === 'boot') {
    return `
      <!-- Chunky Platform Boots (cổ cao ôm mắt cá y=128..153) -->
      <!-- Left Boot -->
      <path d="M38 128 H49 V146 L51 148 L49 154 L31 154 L32 148 L37 144 V128 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M40 132 H47 M40 137 H47 M40 142 H47" stroke="${darkC}" stroke-width="1.2"/>
      <rect x="30" y="152" width="21" height="2.5" fill="#18181b" stroke="${ink}" stroke-width="0.8"/>
      <!-- Right Boot -->
      <path d="M61 128 H72 V144 L77 148 L78 154 L60 154 L59 148 L61 146 V128 Z" fill="${c}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M63 132 H70 M63 137 H70 M63 142 H70" stroke="${darkC}" stroke-width="1.2"/>
      <rect x="59" y="152" width="21" height="2.5" fill="#18181b" stroke="${ink}" stroke-width="0.8"/>
    `;
  }

  // 4. Cao gót (Heel / Slingback)
  if (sub === 'heel' || art === 'heel') {
    return `
      <!-- Elegant Pointed Kitten Heels -->
      <!-- Left Heel -->
      <path d="M34 148 Q32 144 38 143 L48 143 Q50 146 49 148 L48 153 L33 153 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
      <path d="M47 148 V154" stroke="${ink}" stroke-width="1.8"/>
      <!-- Right Heel -->
      <path d="M61 148 Q59 144 65 143 L75 143 Q77 146 76 148 L75 153 L60 153 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
      <path d="M63 148 V154" stroke="${ink}" stroke-width="1.8"/>
    `;
  }

  // 5. Sneakers / Platform Shoes (Mặc định cho shoes)
  return `
    <!-- Chunky Anime Platform Sneakers (ôm vừa khít bàn chân y=141..154) -->
    <!-- Left Sneaker -->
    <path d="M33 148 Q32 142 38 141 L49 141 Q52 143 51 148 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M37 142 Q42 139 47 142 L46 146 L38 146 Z" fill="${lightC}"/>
    <path d="M31 148 H53 Q53 154 50 154 L33 154 Q31 154 31 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M38 144 L44 147 M44 144 L38 147" stroke="#ffffff" stroke-width="1"/>
    <!-- Right Sneaker -->
    <path d="M59 148 Q58 142 64 141 L75 141 Q78 143 77 148 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M63 142 Q68 139 73 142 L72 146 L64 146 Z" fill="${lightC}"/>
    <path d="M57 148 H79 Q79 154 77 154 L59 154 Q57 154 57 148 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.3"/>
    <path d="M64 144 L70 147 M70 144 L64 147" stroke="#ffffff" stroke-width="1"/>
  `;
}

function renderFittedBag(p: Product, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const sub = p.subcategory || '';
  const art = p.art || '';

  // 1. Túi kẹp nách (Baguette / Shoulder bag / East-West)
  if (sub === 'shoulder' || sub === 'eastWest' || art === 'bag' || art === 'shoulder') {
    return `
      <!-- Chic Baguette Shoulder Bag tucked under right arm -->
      <path d="M68 63 C75 72 78 82 78 88" fill="none" stroke="${darkC}" stroke-width="2"/>
      <rect x="73" y="86" width="16" height="12" rx="3" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M73 90 H89" stroke="${darkC}" stroke-width="1.2"/>
      <circle cx="81" cy="92" r="1.2" fill="#fbbf24"/>
    `;
  }

  // 2. Túi xách tay / Tote Bag (Cầm ở bàn tay trái nhân vật x=22..38, y=93..110)
  return `
    <!-- Structured Handbag / Tote in left hand -->
    <path d="M29 93 C27 88 34 88 32 93" fill="none" stroke="${darkC}" stroke-width="1.3"/>
    <rect x="22" y="93" width="16" height="16" rx="3" fill="${c}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M22 98 H38" stroke="${darkC}" stroke-width="1.2"/>
    <circle cx="30" cy="101" r="1.5" fill="#fbbf24"/>
  `;
}

function renderFittedSocks(p: Product, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.4);

  return `
    <!-- Balletcore Ribbed Leg Warmers / Socks (y=120..142) -->
    <!-- Left Leg Warmer -->
    <path d="M38.5 120 C38.5 120 40 120 45 120 C50 120 51.5 120 51.5 120 L52 142 H38 Z" fill="${c}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
    <!-- Right Leg Warmer -->
    <path d="M58.5 120 C58.5 120 60 120 65 120 C70 120 71.5 120 71.5 120 L72 142 H58 Z" fill="${c}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
    <!-- Ribbed Texture & Ruching Folds -->
    <path d="M38.5 124 H51.5 M38.5 129 H51.5 M38.5 134 H51.5 M38.5 139 H51.5" stroke="${darkC}" stroke-width="1.2"/>
    <path d="M58.5 124 H71.5 M58.5 129 H71.5 M58.5 134 H71.5 M58.5 139 H71.5" stroke="${darkC}" stroke-width="1.2"/>
    <!-- Top Ruffle Hem -->
    <path d="M38.5 120 Q45 118 51.5 120 M58.5 120 Q65 118 71.5 120" stroke="${lightC}" stroke-width="1.5" fill="none"/>
  `;
}

function renderFittedJewelry(p: Product, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  if (p.art === 'pearlEarrings') {
    return `
      <g stroke="${ink}" stroke-width=".7"><circle cx="34" cy="42" r="1.2" fill="#fbbf24"/><path d="M34 43 V47"/><circle cx="34" cy="49" r="2.2" fill="#fff"/><circle cx="76" cy="42" r="1.2" fill="#fbbf24"/><path d="M76 43 V47"/><circle cx="76" cy="49" r="2.2" fill="#fff"/></g>
    `;
  }
  if (p.art === 'charmBracelet') {
    return `
      <ellipse cx="32" cy="91" rx="3.4" ry="2.2" fill="none" stroke="${c}" stroke-width="1.5"/>
      <circle cx="34" cy="93" r="1.2" fill="#fbbf24" stroke="${ink}" stroke-width=".5"/>
      <path d="M29 91 C28 89 26 90 27 92 C28 94 29 95 29 95 C29 95 31 94 31 92 C32 90 30 89 29 91Z" fill="#ff7da7" stroke="${ink}" stroke-width=".45"/>
    `;
  }
  if (p.art === 'heartChoker') {
    return `
      <path d="M48 60 Q55 63 62 60" fill="none" stroke="${c}" stroke-width="2"/>
      <path d="M55 63 C53 60 50 62 51 65 C52 67 55 69 55 69 C55 69 58 67 59 65 C60 62 57 60 55 63Z" fill="#ff7da7" stroke="${ink}" stroke-width=".65"/>
    `;
  }
  const isPearls = p.art === 'necklace' || p.id === 'pearl-necklace';
  if (isPearls) {
    return `
      <!-- Delicate Tiny Pearls Necklace draping along collarbone (y=60..65) -->
      <path d="M48 60 Q55 64 62 60" fill="none" stroke="${ink}" stroke-width="0.8" opacity="0.6"/>
      <!-- Lustrous pearl beads -->
      <circle cx="48" cy="60" r="1.3" fill="#ffffff" stroke="#e2d4be" stroke-width="0.5"/>
      <circle cx="50.3" cy="61.2" r="1.3" fill="#ffffff" stroke="#e2d4be" stroke-width="0.5"/>
      <circle cx="52.6" cy="62.2" r="1.3" fill="#ffffff" stroke="#e2d4be" stroke-width="0.5"/>
      <circle cx="55" cy="62.6" r="1.5" fill="#ffffff" stroke="#e2d4be" stroke-width="0.5"/>
      <circle cx="57.4" cy="62.2" r="1.3" fill="#ffffff" stroke="#e2d4be" stroke-width="0.5"/>
      <circle cx="59.7" cy="61.2" r="1.3" fill="#ffffff" stroke="#e2d4be" stroke-width="0.5"/>
      <circle cx="62" cy="60" r="1.3" fill="#ffffff" stroke="#e2d4be" stroke-width="0.5"/>
      <!-- Tiny gold heart charm droplet -->
      <path d="M55 64 C54 63 53 63 53 64 C53 65 55 66.5 55 66.5 C55 66.5 57 65 57 64 C57 63 56 63 55 64 Z" fill="#fbbf24" stroke="${ink}" stroke-width="0.5"/>
    `;
  }
  // Delicate choker
  return `
    <!-- Delicate Satin Choker with Heart Pendant -->
    <path d="M49 61 H61" stroke="${ink}" stroke-width="1.6"/>
    <circle cx="55" cy="63" r="1.5" fill="#f43f5e" stroke="${ink}" stroke-width="0.7"/>
  `;
}

function renderFittedGlasses(p: Product, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  if (p.art === 'heartGlasses') {
    return `
      <path d="M43 34 C38 28 33 33 36 39 C38 43 43 46 43 46 C43 46 49 43 51 39 C54 33 48 28 43 34Z" fill="${c}" fill-opacity=".78" stroke="${ink}" stroke-width="1.1"/>
      <path d="M67 34 C62 28 57 33 60 39 C62 43 67 46 67 46 C67 46 73 43 75 39 C78 33 72 28 67 34Z" fill="${c}" fill-opacity=".78" stroke="${ink}" stroke-width="1.1"/>
      <path d="M51 36 Q55 34 59 36 M36 35 L31 33 M74 35 L79 33" fill="none" stroke="${ink}" stroke-width="1.2"/>
      <path d="M38 34 Q41 31 44 33 M62 34 Q65 31 68 33" fill="none" stroke="#fff" stroke-width="1.1" opacity=".75"/>
    `;
  }
  if (p.art === 'wireGlasses') {
    return `
      <ellipse cx="44" cy="36" rx="7" ry="5.8" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="1.25"/>
      <ellipse cx="66" cy="36" rx="7" ry="5.8" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="1.25"/>
      <path d="M51 35.5 Q55 34 59 35.5 M37 35 L32 33 M73 35 L78 33" fill="none" stroke="${c}" stroke-width="1.2"/>
      <path d="M41 34 Q44 32 47 34 M63 34 Q66 32 69 34" fill="none" stroke="#fff" stroke-width=".9" opacity=".72"/>
    `;
  }
  const isSunglasses = p.art === 'sunglasses' || p.id === 'oval-sunnies' || p.subcategory === 'glasses';

  if (isSunglasses) {
    return `
      <!-- Retro Oval Sunglasses (Fit sống mũi y=36, che mắt phong cách Clean Girl / Y2K) -->
      <!-- Left Oval Lens -->
      <ellipse cx="43.5" cy="36.5" rx="7.5" ry="5.8" fill="#1e1b2e" stroke="${ink}" stroke-width="1.3" opacity="0.88"/>
      <!-- Right Oval Lens -->
      <ellipse cx="66.5" cy="36.5" rx="7.5" ry="5.8" fill="#1e1b2e" stroke="${ink}" stroke-width="1.3" opacity="0.88"/>
      <!-- Bridge connecting nose -->
      <path d="M51 36 Q55 34.5 59 36" fill="none" stroke="${ink}" stroke-width="1.4"/>
      <!-- Frame temples extending to ears -->
      <path d="M36 36 L31 34 M74 36 L79 34" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>
      <!-- Glass glare / Chic highlights -->
      <ellipse cx="41.5" cy="34.5" rx="2.8" ry="1.4" fill="#ffffff" opacity="0.6"/>
      <ellipse cx="64.5" cy="34.5" rx="2.8" ry="1.4" fill="#ffffff" opacity="0.6"/>
    `;
  }

  // Wire glasses
  return `
    <!-- Retro Chic Wire Glasses -->
    <ellipse cx="44" cy="36" rx="6.5" ry="5.5" fill="none" stroke="${ink}" stroke-width="1.2"/>
    <ellipse cx="66" cy="36" rx="6.5" ry="5.5" fill="none" stroke="${ink}" stroke-width="1.2"/>
    <path d="M50.5 35 H59.5" stroke="${ink}" stroke-width="1.2"/>
    <path d="M37.5 35 L33 33 M72.5 35 L77 33" stroke="${ink}" stroke-width="1.2"/>
    <ellipse cx="42" cy="34" rx="2" ry="1.2" fill="#ffffff" opacity="0.6"/>
    <ellipse cx="64" cy="34" rx="2" ry="1.2" fill="#ffffff" opacity="0.6"/>
  `;
}

function renderFittedHeadwear(p: Product, ink = '#2c1810'): string {
  const c = fabricColor(p.color);
  const darkC = tint(c, '#000000', 0.22);
  const lightC = tint(c, '#ffffff', 0.35);
  const sub = p.subcategory || '';
  const art = p.art || '';

  if (art === 'daisyClips') {
    return `
      <g transform="translate(80 23) rotate(-18)"><circle r="2.3" fill="#fbbf24" stroke="${ink}" stroke-width=".6"/><g fill="#fff" stroke="${ink}" stroke-width=".45"><ellipse cy="-4" rx="2" ry="3"/><ellipse cx="4" rx="3" ry="2"/><ellipse cy="4" rx="2" ry="3"/><ellipse cx="-4" rx="3" ry="2"/></g><circle r="1.4" fill="#fbbf24"/></g>
      <path d="M72 27 L84 23" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>
    `;
  }
  if (art === 'pearlHeadband') {
    return `
      <path d="M35 25 Q38 4 55 3 Q72 4 75 25" fill="none" stroke="${c}" stroke-width="2.8"/>
      <g fill="#fff" stroke="${ink}" stroke-width=".45"><circle cx="40" cy="12" r="1.8"/><circle cx="47" cy="6" r="1.8"/><circle cx="55" cy="4" r="1.8"/><circle cx="63" cy="6" r="1.8"/><circle cx="70" cy="12" r="1.8"/></g>
    `;
  }
  if (art === 'satinBow') {
    return `
      <g transform="translate(80 18) rotate(-16)"><path d="M-2 2 C-12 -10 -23 -5 -19 5 C-16 12 -8 10 -1 6Z" fill="${c}" stroke="${ink}" stroke-width="1.1"/><path d="M2 2 C12 -10 23 -5 19 5 C16 12 8 10 1 6Z" fill="${c}" stroke="${ink}" stroke-width="1.1"/><path d="M-2 7 L-7 29 L0 22 L5 31 L4 8Z" fill="${c}" stroke="${ink}" stroke-width="1"/><path d="M3 7 L13 27 L6 23 L4 31 L0 8Z" fill="${c}" stroke="${ink}" stroke-width="1" opacity=".9"/><ellipse cy="5" rx="4" ry="3.5" fill="#ff7da7" stroke="${ink}" stroke-width=".8"/><circle cy="4.5" r="1.3" fill="#fbbf24"/><path d="M-16 2 Q-10 -3 -4 2 M4 2 Q10 -3 16 2 M-4 12 L-4 24 M5 12 L10 23" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/></g>
    `;
  }
  if (art === 'bucketHat') {
    return `
      <path d="M38 16 C38 3 72 3 72 16Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/><path d="M31 17 Q55 23 79 17 L82 24 Q55 30 28 24Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/><path d="M35 21 Q55 26 75 21" fill="none" stroke="${lightC}" stroke-width="1"/><circle cx="55" cy="14" r="2.2" fill="#fff" stroke="${ink}" stroke-width=".6"/>
    `;
  }
  if (art === 'ribbonBeret') {
    return `
      <path d="M39 16 C39 4 80 4 82 16 C82 23 41 23 39 16Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/><path d="M61 4 V7" stroke="${ink}" stroke-width="1.2"/><path d="M76 15 C69 9 66 16 74 18 C81 12 84 19 76 18Z" fill="#ff7da7" stroke="${ink}" stroke-width=".8"/><circle cx="76" cy="17" r="1.3" fill="#fbbf24"/>
    `;
  }

  // 1. Mũ lưỡi trai (Cap / Sport Club Cap)
  if (art === 'cap' || p.id === 'club-cap') {
    return `
      <!-- Sporty Chic Baseball / Club Cap (y=6..22) -->
      <!-- Cap Crown -->
      <path d="M30 18 C30 5 80 5 80 18 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
      <!-- Cap seam panels -->
      <path d="M55 5 V18 M42 10 Q55 18 68 10" stroke="${darkC}" stroke-width="1" fill="none"/>
      <!-- Embroidered Center Emblem -->
      <circle cx="55" cy="12" r="3.2" fill="#ffffff" stroke="${ink}" stroke-width="0.8"/>
      <circle cx="55" cy="12" r="1.6" fill="${darkC}"/>
      <!-- Curved Visor -->
      <path d="M26 18 C28 13 82 13 84 18 C80 23 30 23 26 18 Z" fill="${darkC}" stroke="${ink}" stroke-width="1.3"/>
      <path d="M30 19 Q55 16 80 19" stroke="${lightC}" stroke-width="1.2" fill="none" opacity="0.6"/>
      <!-- Top button -->
      <circle cx="55" cy="5" r="1.5" fill="${darkC}" stroke="${ink}" stroke-width="0.8"/>
    `;
  }

  // 2. Mũ nồi Pháp (Beret)
  if (sub === 'hat' || art === 'beret' || art === 'hat') {
    return `
      <!-- Chic French Beret tilted (y=4..24) -->
      <path d="M40 16 C40 4 82 4 84 16 C84 24 42 24 40 16 Z" fill="${c}" stroke="${ink}" stroke-width="1.4"/>
      <path d="M46 10 C50 7 74 7 78 12" fill="none" stroke="${lightC}" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
      <path d="M62 4 V7" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>
    `;
  }

  // 3. Nơ cài tóc Coquette (Bow / Ribbon)
  if (sub === 'hair' || art === 'bow' || art === 'ribbon' || p.id === 'ribbon') {
    return `
      <!-- Pin to the right side of the hair, clear of the forehead and eyes. -->
      <g data-hair-anchor="right" transform="translate(81 19) rotate(-22) scale(.78)">
        <!-- Left Wing -->
        <path d="M0 0 C-14 -11 -20 4 -2 5 C-1 5 0 2 0 0 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
        <path d="M-2 2 C-8 0 -13 4 -3 4" stroke="${lightC}" stroke-width="1" fill="none"/>
        <!-- Right Wing -->
        <path d="M0 0 C14 -11 20 4 2 5 C1 5 0 2 0 0 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/>
        <path d="M2 2 C8 0 13 4 3 4" stroke="${lightC}" stroke-width="1" fill="none"/>
        <!-- Hanging Ribbon Tails -->
        <path d="M-2 3 L-7 18 L-3 16 L0 20 L3 16 L7 18 L2 3 Z" fill="${c}" stroke="${ink}" stroke-width="1.1"/>
        <!-- Center Knot -->
        <ellipse cx="0" cy="2" rx="2.6" ry="2.2" fill="${darkC}" stroke="${ink}" stroke-width="0.9"/>
        <circle cx="-0.5" cy="1.5" r="0.7" fill="#ffffff"/>
      </g>
    `;
  }

  return '';
}

/** Basic Undergarment Foundation: Cute Pastel Lace Underwear & Camisole */
function renderUndergarments(items: Product[], skin: string, ink = '#2c1810'): string {
  const hasDress = items.some(p => p.category === 'dresses');
  const hasSet = items.some(p => p.category === 'sets');
  const hasTop = items.some(p => p.category === 'tops');

  let out = '';

  // Opaque underwear is a body layer, never a selected product.
  if (!hasDress && !hasSet && !items.some(p => p.category === 'bottoms')) out += `<g data-preview-basic="underwear">
    <path d="M44 80 Q55 82 66 80 L65 87 Q60 88 58 93 H52 Q50 88 45 87 Z" fill="#fff6fa" stroke="${ink}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M44.5 81 Q55 83 65.5 81" fill="none" stroke="#d99bb7" stroke-width="1.4"/>
  </g>`;

  // 2. Áo lót / Camisole ren (nếu chưa mặc đầm, set, hoặc áo ngoài)
  if (!hasDress && !hasSet && !hasTop) {
    out += `
      <!-- Cute Camisole / Bralette (y=62..75) -->
      <path d="M44 63 C44 67 46 71 46 75 H64 C64 71 66 67 66 63 C64 61 60 63 55 61 C50 63 46 61 44 63 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.2"/>
      <!-- Viền ren cúp ngực hồng pastel -->
      <path d="M44 63 Q55 66 66 63" fill="none" stroke="#f472b6" stroke-width="1.3"/>
      <!-- Nơ nhỏ ở giữa ngực -->
      <path d="M55 64.5 L53 63.5 L53 65.5 Z M55 64.5 L57 63.5 L57 65.5 Z" fill="#f43f5e"/>
      <circle cx="55" cy="64.5" r="0.7" fill="#ffffff"/>
      <!-- Quai áo mảnh xinh xắn -->
      <path d="M47 61 V63 M63 61 V63" stroke="#f472b6" stroke-width="1.3"/>
    `;
  }

  return out;
}

export interface DressedLayers {
  body: string;
  undergarments: string;
  socks: string;
  bottoms: string;
  sets: string;
  dresses: string;
  tops: string;
  outerwear: string;
  shoes: string;
  bags: string;
  arms: string;
  hands: string;
  jewelry: string;
  glasses: string;
  headwear: string;
}

/** Soft, relaxed hands for the fitting pose, aligned with every garment cuff. */
function fittingHands(skin: string, ink: string) {
  const shade = tint(skin, '#b66f79', .22);
  return `<g fill="${skin}" stroke="${ink}" stroke-width=".95" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 91.5 Q32 91 34 92 L35 95 Q35.2 97 33.5 97.8 L30.8 97.6 Q28.7 96.8 29 94.8 Z"/>
    <path d="M75 92 Q77 91 79 91.5 L80 94.8 Q80.3 96.8 78.2 97.6 L75.5 97.8 Q73.8 97 74 95 Z"/>
    <path d="M33.8 93.5 L32.8 95 M75.2 93.5 L76.2 95" fill="none" stroke="${shade}" stroke-width=".75"/>
  </g>`;
}

/** Rebuild only exposed regions. Original body and socks are excluded in fitting mode. */
function exposedBody(items: Product[], skin: string, ink: string) {
  const top = items.find(p => p.category === 'tops');
  const bottom = items.find(p => p.category === 'bottoms');
  const dress = items.find(p => p.category === 'dresses');
  const set = items.find(p => p.category === 'sets');
  const outer = items.find(p => p.category === 'outerwear');
  const crop = (svg: string, y: number, height: number, region: string) =>
    `<svg data-exposed="${region}" x="0" y="${y}" width="110" height="${height}" viewBox="0 ${y} 110 ${height}" overflow="hidden">${svg}</svg>`;
  const pants = bottom && (['jeans', 'cargo'].includes(bottom.subcategory) || /pants|jeans/i.test(bottom.art));
  const hem = pants || set?.subcategory === 'pantsSet' ? 142 : dress ?
    (dress.subcategory === 'maxi' || dress.art === 'maxiDress' ? 139 : dress.subcategory === 'slip' || dress.art === 'slipDress' ? 122 : 104) :
    set ? 101 : bottom ? (bottom.subcategory === 'pleated' || ['pleatedSkirt', 'skirt'].includes(bottom.art) ? 102 : bottom.subcategory === 'bubble' || bottom.art === 'bubbleSkirt' ? 104 : 98) : 80;
  const contour = tint(ink, skin, .28);
  const shade = tint(skin, '#b66f79', .24);
  const light = tint(skin, '#ffffff', .55);
  // Continuous hips, softly tapered thighs, rounded calves and narrow ankles.
  const lower = `<g stroke-linecap="round" stroke-linejoin="round">
    <path d="M44 79 Q55 81 66 79 C69 84 70 89 68.5 97 C67.5 105 65.5 112 65.8 118 C68 124 67.8 131 66 138 L67 143 H61.5 L61.8 137 C60.5 130 60.7 125 61.8 119 C62 113 59.5 105 58.5 99 Q57.5 93 55 92 Q52.5 93 51.5 99 C50.5 105 48 113 48.2 119 C49.3 125 49.5 130 48.2 137 L48.5 143 H43 L44 138 C42.2 131 42 124 44.2 118 C44.5 112 42.5 105 41.5 97 C40 89 41 84 44 79Z" fill="${skin}" stroke="${contour}" stroke-width="1"/>
    <path d="M52 93 Q50 104 47 113 Q45.5 116 46 120 M58 93 Q60 104 63 113 Q64.5 116 64 120" fill="none" stroke="${shade}" stroke-width="1.7" opacity=".55"/>
    <path d="M44 88 Q43 99 46 109 M66 88 Q67 99 64 109" fill="none" stroke="${light}" stroke-width="1.6" opacity=".8"/>
    <path d="M44.5 126 Q44.5 132 46 137 M65.5 126 Q65.5 132 64 137" fill="none" stroke="${light}" stroke-width="1.1"/>
    <ellipse cx="46" cy="118" rx="1.9" ry="2.6" fill="${shade}" opacity=".22"/>
    <ellipse cx="64" cy="118" rx="1.9" ry="2.6" fill="${shade}" opacity=".22"/>
    <path d="M45 119 Q46 119.8 47 119 M63 119 Q64 119.8 65 119" fill="none" stroke="${shade}" stroke-width=".65" opacity=".55"/>
  </g>`;
  let body = '<g data-body-layer="exposed-body">';
  body += crop(lower, hem, 144 - hem, 'legs');
  if (!dress && !set) {
    if (!top) body += crop(customerTorso(skin), 62, 20, 'torso');
    else if (!['hoodie', 'oversized', 'shirt', 'jersey'].includes(top.subcategory) && !['hoodie', 'oversizedTee', 'atelierOversizedTee', 'shirt', 'jersey'].includes(top.art)) {
      body += crop(customerTorso(skin), ['corset', 'offshoulder'].includes(top.subcategory) ? 76 : 78, 4, 'waist');
    }
  }
  body += '</g>';
  const longSleeves = !!outer || !!top && (['hoodie', 'oversized'].includes(top.subcategory) || ['hoodie', 'oversizedTee', 'atelierOversizedTee'].includes(top.art));
  const sleeveless = !top && !dress && !set || ['corset', 'crop', 'camisole'].includes(top?.subcategory ?? '') || dress?.subcategory === 'slip' || dress?.art === 'slipDress' || set?.subcategory === 'pantsSet';
  const cuff = longSleeves ? 90 : sleeveless ? 65 : 75;
  const armShape = `<g stroke-linecap="round" stroke-linejoin="round">
    <path d="M42 64 Q38 63 36.8 69 L33 79 Q30.5 86 30 92 L33.8 93 Q35.8 87 36.5 81 L44 69Z" fill="${skin}" stroke="${contour}" stroke-width="1"/>
    <path d="M68 64 Q72 63 73.2 69 L77 79 Q79.5 86 79 92 L75.2 93 Q73.2 87 73.5 81 L66 69Z" fill="${skin}" stroke="${contour}" stroke-width="1"/>
    <path d="M40 68 L35 80 L32.7 90 M70 68 L75 80 L76.3 90" fill="none" stroke="${shade}" stroke-width="1" opacity=".55"/>
    <path d="M37.8 72 L34.5 80 M72.2 72 L75.5 80" fill="none" stroke="${light}" stroke-width="1.1"/>
  </g>`;
  const arms = `<g data-body-layer="arms">${crop(armShape, cuff, 99 - cuff, 'arms')}</g>`;
  return { body, arms };
}

export function renderDressedCustomerLayers(items: Product[], skin: string, ink = '#2c1810'): DressedLayers {
  const has = (category: Product['category']) => items.some(p => p.category === category);
  const hasDress = has('dresses');
  const hasSet = has('sets');

  // 1. Undergarments
  const undergarments = renderUndergarments(items, skin, ink);

  // 2. Socks (render BEFORE shoes)
  let socks = '';
  for (const p of items.filter(i => i.category === 'accessories' && (i.subcategory === 'socks' || i.art === 'legWarmers' || i.art === 'socks'))) {
    socks += `<g data-worn="${p.id}">${renderFittedSocks(p, ink)}</g>`;
  }

  // 3. Bottoms
  let bottoms = '';
  if (!hasDress && !hasSet) {
    for (const p of items.filter(i => i.category === 'bottoms')) {
      bottoms += `<g data-worn="${p.id}">${renderFittedBottom(p, skin, ink)}</g>`;
    }
  }

  // 4. Sets
  let sets = '';
  for (const p of items.filter(i => i.category === 'sets')) {
    sets += `<g data-worn="${p.id}">${renderFittedSet(p, skin, ink)}</g>`;
  }

  // 5. Dresses
  let dresses = '';
  for (const p of items.filter(i => i.category === 'dresses')) {
    dresses += `<g data-worn="${p.id}">${renderFittedDress(p, skin, ink)}</g>`;
  }

  // 6. Tops
  let tops = '';
  if (!hasDress && !hasSet) {
    for (const p of items.filter(i => i.category === 'tops')) {
      tops += `<g data-worn="${p.id}">${renderFittedTop(p, skin, ink)}</g>`;
    }
  }

  // 7. Outerwear
  let outerwear = '';
  for (const p of items.filter(i => i.category === 'outerwear')) {
    outerwear += `<g data-worn="${p.id}">${renderFittedOuterwear(p, skin, ink)}</g>`;
  }

  // 8. Shoes
  let shoes = '';
  for (const p of items.filter(i => i.category === 'shoes')) {
    shoes += `<g data-worn="${p.id}">${renderFittedShoes(p, skin, ink)}</g>`;
  }

  // 9. Bags
  let bags = '';
  for (const p of items.filter(i => i.category === 'bags')) {
    bags += `<g data-worn="${p.id}">${renderFittedBag(p, ink)}</g>`;
  }

  // 10. Arms
  // Skin is behind sleeves; only hands sit above the clothing and bag layers.
  const { body, arms } = exposedBody(items, skin, ink);
  const hands = `<g data-body-layer="hands">${fittingHands(skin, ink)}</g>`;

  // 11. Jewelry
  let jewelry = '';
  for (const p of items.filter(i => i.category === 'accessories' && (i.subcategory === 'jewelry' || i.art === 'necklace' || i.art === 'choker'))) {
    jewelry += `<g data-worn="${p.id}">${renderFittedJewelry(p, ink)}</g>`;
  }

  // 12. Glasses (rendered OVER face)
  let glasses = '';
  for (const p of items.filter(i => i.category === 'accessories' && (i.subcategory === 'glasses' || i.art === 'sunglasses' || i.art === 'glasses'))) {
    glasses += `<g data-worn="${p.id}">${renderFittedGlasses(p, ink)}</g>`;
  }

  // 13. Headwear: Hats, Berets, Caps, Bows, Ribbons (rendered OVER front hair)
  let headwear = '';
  for (const p of items.filter(i => i.category === 'accessories' && (i.subcategory === 'hat' || i.art === 'cap' || i.art === 'beret' || i.art === 'hat' || i.subcategory === 'hair' || i.art === 'bow' || i.art === 'ribbon'))) {
    headwear += `<g data-worn="${p.id}">${renderFittedHeadwear(p, ink)}</g>`;
  }

  return {
    body,
    undergarments,
    socks,
    bottoms,
    sets,
    dresses,
    tops,
    outerwear,
    shoes,
    bags,
    arms,
    hands,
    jewelry,
    glasses,
    headwear,
  };
}

/**
 * Professional fitted customer dressing backward-compatible wrapper
 */
function dressCustomer(items: Product[], skin: string): string {
  const ink = '#2c1810';
  const d = renderDressedCustomerLayers(items, skin, ink);
  return `${d.body}${d.arms}${d.undergarments}${d.socks}${d.bottoms}${d.sets}${d.dresses}${d.tops}${d.outerwear}${d.shoes}${d.bags}${d.hands}${d.jewelry}${d.glasses}${d.headwear}`;
}

/** Staff-only full-body asset: boutique uniform, name badge and six distinct appearances. */
export function employeePortraitSvg(appearance = 0): string {
  const variants = [
    { skin: '#ffd7c2', hair: '#51364f', hairLight: '#8b557c', uniform: '#f490c0', accent: '#fff1a8', iris: '#8f68c8' },
    { skin: '#e9b995', hair: '#342b43', hairLight: '#75658b', uniform: '#9fcff5', accent: '#ffd4ea', iris: '#4f9bc2' },
    { skin: '#f2c8a8', hair: '#9b5f49', hairLight: '#df9774', uniform: '#c4a8f0', accent: '#fff7ea', iris: '#8c6ab2' },
    { skin: '#bc8066', hair: '#2e293d', hairLight: '#655779', uniform: '#a8e0cc', accent: '#ffda8a', iris: '#5d9c84' },
    { skin: '#f6d0b4', hair: '#d5a346', hairLight: '#ffe29a', uniform: '#f5a9c9', accent: '#c8edff', iris: '#639ac2' },
    { skin: '#d39a78', hair: '#6b3e67', hairLight: '#b66b9e', uniform: '#aebcf4', accent: '#ffe2a8', iris: '#8b69bd' },
  ];
  const v = variants[Math.abs(Math.floor(appearance)) % variants.length];
  const ink = paint.ink;
  const uniformDark = tint(v.uniform, '#6f3568', .32);
  const skinShadow = tint(v.skin, '#c36e82', .22);
  const hairStyle = Math.abs(Math.floor(appearance)) % 3;
  const hairBack = hairStyle === 0
    ? `<path d="M29 56Q25 18 60 13Q95 18 91 58L87 103Q78 115 68 105Q60 116 51 105Q40 115 33 102Z" fill="${v.hair}" stroke="${ink}" stroke-width="1.6"/><path d="M34 43Q29 72 42 96M86 43Q91 72 78 96" fill="none" stroke="${v.hairLight}" stroke-width="2.2" opacity=".7"/>`
    : hairStyle === 1
      ? `<path d="M31 55Q27 17 60 14Q93 17 89 57L86 82Q76 94 66 82H53Q43 94 34 82Z" fill="${v.hair}" stroke="${ink}" stroke-width="1.6"/><circle cx="29" cy="43" r="12" fill="${v.hair}" stroke="${ink}" stroke-width="1.4"/><circle cx="91" cy="43" r="12" fill="${v.hair}" stroke="${ink}" stroke-width="1.4"/>`
      : `<path d="M31 57Q25 18 60 13Q94 18 89 57L84 95Q75 106 66 96Q60 108 53 97Q43 107 35 96Z" fill="${v.hair}" stroke="${ink}" stroke-width="1.6"/><path d="M87 32Q108 38 99 61Q92 69 84 61Z" fill="${v.hair}" stroke="${ink}" stroke-width="1.5"/><path d="M91 38Q101 44 94 57" fill="none" stroke="${v.hairLight}" stroke-width="2"/>`;
  const lowerBody = appearance % 2 === 0 ? `
    <path d="M43 103L40 145H50L55 111L60 145H70L67 103Z" fill="${v.skin}" stroke="${ink}" stroke-width="1.4"/>
    <path d="M39 137H51V148H39ZM59 137H71V148H59Z" fill="#fff9fc" stroke="${ink}" stroke-width="1.2"/>
    <path d="M31 154Q31 147 39 146H50Q54 149 51 154Z" fill="${v.uniform}" stroke="${ink}" stroke-width="1.5"/><path d="M58 154Q57 148 64 146H72Q80 149 78 154Z" fill="${v.uniform}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M33 152H51M59 152H77" stroke="#fff" stroke-width="1.5"/>
    <path d="M39 99H69L76 115Q60 122 33 115Z" fill="${uniformDark}" stroke="${ink}" stroke-width="1.5"/><path d="M39 104L36 114M48 103L48 118M59 103L60 118M68 103L73 114" stroke="${tint(v.uniform,'#ffffff',.35)}" stroke-width="1.2"/>
  ` : `
    <path d="M40 99H70L72 145H60L55 113L51 145H38Z" fill="${uniformDark}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M44 106L42 139M66 106L68 139" stroke="${tint(v.uniform,'#ffffff',.35)}" stroke-width="1.5"/>
    <path d="M31 154Q31 147 40 145H51V154Z" fill="#fff9fc" stroke="${ink}" stroke-width="1.5"/><path d="M59 145H70Q79 147 79 154H59Z" fill="#fff9fc" stroke="${ink}" stroke-width="1.5"/><path d="M33 152H51M60 152H77" stroke="${v.uniform}" stroke-width="1.7"/>
  `;
  return artSvg(`
    <defs><filter id="staff-shadow" x="-30%" y="-25%" width="160%" height="165%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#8c4f83" flood-opacity=".2"/></filter></defs>
    <ellipse cx="55" cy="158" rx="33" ry="6" fill="#75466f" opacity=".15"/>
    <g filter="url(#staff-shadow)" stroke-linecap="round" stroke-linejoin="round">
      ${hairBack}
      ${lowerBody}
      <path d="M42 78Q33 82 30 103" fill="none" stroke="${ink}" stroke-width="9"/><path d="M42 78Q33 82 30 103" fill="none" stroke="${v.skin}" stroke-width="6"/><circle cx="30" cy="105" r="3.5" fill="${v.skin}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M68 78Q77 82 80 103" fill="none" stroke="${ink}" stroke-width="9"/><path d="M68 78Q77 82 80 103" fill="none" stroke="${v.skin}" stroke-width="6"/><circle cx="80" cy="105" r="3.5" fill="${v.skin}" stroke="${ink}" stroke-width="1.2"/>
      <path d="M48 68V76Q55 81 62 76V68Z" fill="${v.skin}" stroke="${ink}" stroke-width="1.2"/><path d="M48 69Q55 75 62 69V74Q55 79 48 74Z" fill="${skinShadow}" stroke="none"/>
      <path d="M42 74Q55 69 68 74L73 104Q55 110 37 104Z" fill="${v.uniform}" stroke="${ink}" stroke-width="1.6"/>
      <path d="M42 75L49 73L55 84L61 73L68 75L66 92H44Z" fill="#fff9fc" stroke="${ink}" stroke-width="1.2"/>
      <path d="M50 78L55 84L60 78L59 93H51Z" fill="${v.accent}" stroke="${ink}" stroke-width="1"/>
      <path d="M39 101Q55 106 71 101" fill="none" stroke="${uniformDark}" stroke-width="2"/>
      <rect x="60" y="88" width="14" height="9" rx="2.5" fill="#fff" stroke="${ink}" stroke-width="1"/><path d="M63 92.5H71" stroke="${v.uniform}" stroke-width="1.2"/><path d="M65 95H70" stroke="#d884ae" stroke-width=".8"/>
      <ellipse cx="55" cy="45" rx="27" ry="29" fill="${v.skin}" stroke="${ink}" stroke-width="1.5"/>
      <ellipse cx="29" cy="47" rx="4" ry="6" fill="${v.skin}" stroke="${ink}" stroke-width="1.1"/><ellipse cx="81" cy="47" rx="4" ry="6" fill="${v.skin}" stroke="${ink}" stroke-width="1.1"/>
      <path d="M34 35Q40 31 46 34M64 34Q70 31 76 35" fill="none" stroke="${tint(v.hair,'#8a503e',.3)}" stroke-width="1.4"/>
      <path d="M33 44Q41 37 49 44Q48 54 40 54Q33 53 33 44Z" fill="#fff" stroke="none"/><ellipse cx="41" cy="47" rx="5.2" ry="6.8" fill="${v.iris}"/><ellipse cx="41" cy="48" rx="2.5" ry="4" fill="#362544"/><circle cx="39.5" cy="44.5" r="2" fill="#fff"/><circle cx="43" cy="50" r="1" fill="#fff"/><path d="M32 44Q41 36 50 44M33 44L30 41" fill="none" stroke="${ink}" stroke-width="2"/>
      <path d="M61 44Q69 37 77 44Q77 53 70 54Q62 54 61 44Z" fill="#fff" stroke="none"/><ellipse cx="69" cy="47" rx="5.2" ry="6.8" fill="${v.iris}"/><ellipse cx="69" cy="48" rx="2.5" ry="4" fill="#362544"/><circle cx="67.5" cy="44.5" r="2" fill="#fff"/><circle cx="71" cy="50" r="1" fill="#fff"/><path d="M60 44Q69 36 78 44M77 44L80 41" fill="none" stroke="${ink}" stroke-width="2"/>
      <ellipse cx="35" cy="58" rx="5" ry="2.5" fill="#f28fad" opacity=".42"/><ellipse cx="75" cy="58" rx="5" ry="2.5" fill="#f28fad" opacity=".42"/>
      <path d="M52 53Q55 55 58 53" fill="none" stroke="${skinShadow}" stroke-width="1"/><path d="M49 62Q55 68 61 62" fill="#fff" stroke="#b64e74" stroke-width="1.3"/>
      <path d="M29 37Q28 16 54 13Q78 11 82 35Q72 29 65 23Q54 35 42 27Q37 34 29 37Z" fill="${v.hair}" stroke="${ink}" stroke-width="1.6"/>
      <path d="M38 22Q49 17 57 19M66 19Q72 22 77 28" fill="none" stroke="${v.hairLight}" stroke-width="2.2" opacity=".75"/>
      <path d="M72 18Q80 12 85 20Q81 27 73 23Q66 29 61 22Q64 15 72 18Z" fill="${v.accent}" stroke="${ink}" stroke-width="1.2"/><circle cx="72" cy="21" r="2.6" fill="#ffb75d" stroke="${ink}" stroke-width=".8"/>
      <path d="M46 74Q55 70 64 74" fill="none" stroke="#fff" stroke-width="1" opacity=".75"/>
    </g>`, 110, 165);
}
