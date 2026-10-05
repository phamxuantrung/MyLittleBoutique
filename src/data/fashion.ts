import type { Category, Occasion, Product, Style, Look } from '../types';

export const categories: Record<Category, string> = {
  tops: 'Áo', bottoms: 'Quần & chân váy', dresses: 'Đầm', sets: 'Set phối sẵn',
  outerwear: 'Áo khoác', shoes: 'Giày nữ', bags: 'Túi nữ', accessories: 'Phụ kiện',
};
export const occasions: Record<Occasion, string> = {
  cafe: 'Đi café', campus: 'Đi học', concert: 'Đi concert', city: 'Dạo phố',
  date: 'Hẹn hò', active: 'Vận động', travel: 'Du lịch', party: 'Dự tiệc',
};
export const subcategories: Record<string, { label: string; category: Category }> = {
  tee: { label: 'Baby tee & áo thun', category: 'tops' }, hoodie: { label: 'Hoodie', category: 'tops' },
  shirt: { label: 'Sơ mi', category: 'tops' }, blouse: { label: 'Áo blouse', category: 'tops' },
  knitTop: { label: 'Áo dệt kim & cardigan', category: 'tops' }, corset: { label: 'Corset & crop top', category: 'tops' },
  offshoulder: { label: 'Áo trễ vai', category: 'tops' }, jersey: { label: 'Áo jersey', category: 'tops' },
  jeans: { label: 'Jeans', category: 'bottoms' }, cargo: { label: 'Cargo & parachute', category: 'bottoms' },
  flare: { label: 'Quần ống loe', category: 'bottoms' }, trousers: { label: 'Quần dài', category: 'bottoms' },
  shorts: { label: 'Quần shorts', category: 'bottoms' }, skort: { label: 'Chân váy quần', category: 'bottoms' },
  mini: { label: 'Chân váy mini', category: 'bottoms' }, midi: { label: 'Chân váy midi', category: 'bottoms' }, pleated: { label: 'Váy xếp ly', category: 'bottoms' },
  bubble: { label: 'Váy bí', category: 'bottoms' }, miniDress: { label: 'Đầm ngắn', category: 'dresses' },
  slip: { label: 'Đầm slip', category: 'dresses' }, maxi: { label: 'Đầm maxi', category: 'dresses' },
  skirtSet: { label: 'Set áo & chân váy', category: 'sets' }, pantsSet: { label: 'Set áo & quần', category: 'sets' },
  shortsSet: { label: 'Set áo & shorts', category: 'sets' }, cardigan: { label: 'Cardigan', category: 'outerwear' },
  blazer: { label: 'Blazer', category: 'outerwear' }, jacket: { label: 'Jacket da', category: 'outerwear' },
  trench: { label: 'Trench coat', category: 'outerwear' }, sneaker: { label: 'Sneaker', category: 'shoes' },
  balletSneaker: { label: 'Ballet sneaker', category: 'shoes' }, ballet: { label: 'Búp bê & Mary Jane', category: 'shoes' },
  loafer: { label: 'Loafer', category: 'shoes' }, heel: { label: 'Cao gót & slingback', category: 'shoes' },
  sandal: { label: 'Sandal', category: 'shoes' }, boot: { label: 'Boots', category: 'shoes' },
  trail: { label: 'Giày outdoor', category: 'shoes' }, shoulder: { label: 'Túi vai & baguette', category: 'bags' },
  tote: { label: 'Túi tote', category: 'bags' }, crescent: { label: 'Túi bán nguyệt', category: 'bags' },
  eastWest: { label: 'Túi East–West', category: 'bags' }, bowling: { label: 'Túi bowling', category: 'bags' },
  bucket: { label: 'Túi bucket', category: 'bags' }, hobo: { label: 'Túi hobo', category: 'bags' },
  crossbody: { label: 'Túi đeo chéo', category: 'bags' }, satchel: { label: 'Túi satchel', category: 'bags' },
  clutch: { label: 'Clutch & túi tiệc', category: 'bags' }, topHandle: { label: 'Túi quai xách', category: 'bags' },
  hair: { label: 'Nơ & phụ kiện tóc', category: 'accessories' }, jewelry: { label: 'Trang sức', category: 'accessories' },
  glasses: { label: 'Kính mắt', category: 'accessories' }, hat: { label: 'Mũ', category: 'accessories' },
  socks: { label: 'Tất & leg warmer', category: 'accessories' },
};
export const fashionStyles: Record<Style, { description: string; color: string }> = {
  Coquette: { description: 'Nơ nhỏ, đường ren và sắc hồng dịu dàng.', color: '#e7bcc7' },
  Y2K: { description: 'Denim, túi baguette và tinh thần những năm 2000.', color: '#c6b7de' },
  Streetwear: { description: 'Phom rộng, cargo và phụ kiện đường phố.', color: '#a8b9a5' },
  Minimal: { description: 'Phom gọn và bảng màu trung tính dễ phối.', color: '#c9c0ac' },
  Casual: { description: 'Thoải mái mỗi ngày với denim và sneaker.', color: '#b7c9d4' },
  Preppy: { description: 'Xếp ly, loafer và cảm hứng đồng phục học đường.', color: '#b6bfa8' },
  Vintage: { description: 'Sắc nâu ấm, thiết kế hoài niệm, chi tiết cổ điển.', color: '#d5b88b' },
  'K-pop': { description: 'Outfit đi concert với ánh bạc và điểm nhấn nổi bật.', color: '#bcb1d7' },
  'Soft Girl': { description: 'Pastel, chất liệu mềm và phom thật nhẹ nhàng.', color: '#e2c2ce' },
  Luxury: { description: 'Lụa, túi tiệc và đường nét trang nhã.', color: '#c6b698' },
  Balletcore: { description: 'Áo wrap, giày múa, dây ruy băng và leg warmer.', color: '#eac6ca' },
  'Clean Girl': { description: 'Set dệt kim, đầm slip và phụ kiện tối giản.', color: '#d5d7c4' },
  'Sporty Chic': { description: 'Set tennis, mũ lưỡi trai và giày năng động.', color: '#bad5ca' },
  Blokecore: { description: 'Jersey, shorts và sneaker dáng thấp.', color: '#adc1d3' },
  Gorpcore: { description: 'Đồ outdoor, chất liệu tiện dụng và túi nhiều ngăn.', color: '#b5c0a5' },
  'Dark Academia': { description: 'Kẻ ô, boots và túi satchel tông trầm.', color: '#b2a197' },
  Cottagecore: { description: 'Hoa nhỏ, đầm dài và túi móc len đi picnic.', color: '#ced4b3' },
  Boho: { description: 'Ren, da lộn, tua rua và tinh thần tự do.', color: '#d2b28f' },
  Grunge: { description: 'Jacket da, boots đế dày và phối lớp cá tính.', color: '#b8acb7' },
  Poetcore: { description: 'Trench, dệt kim và túi đựng những cuốn sách.', color: '#c3b8a0' },
};
const palette: Record<string, [string, string]> = {
  pink: ['#e6a6b8', 'Hồng'], cream: ['#e9dfc7', 'Kem'], black: ['#54525a', 'Đen'],
  blue: ['#93b7cf', 'Xanh'], green: ['#a2b697', 'Xanh lá'], brown: ['#ae836b', 'Nâu'],
  purple: ['#b8a4d2', 'Tím'], silver: ['#bfc7d2', 'Bạc'], red: ['#ab6874', 'Đỏ'], yellow: ['#dfcd91', 'Vàng'],
};
function item(id: string, name: string, category: Category, subcategory: string, style: Style,
  colorKey: string, buy: number, sell: number, level: number, art: string, uses: Occasion[], secondaryStyles?: Style[]): Product {
  const [color, colorName] = palette[colorKey];
  return { id, name, category, subcategory, style, color, colorName, buyPrice: buy * 1000, sellPrice: sell * 1000,
    level, art, quality: Math.min(98, 80 + level * 3), occasions: uses, secondaryStyles };
}

// Prices are in thousands of đồng in these authoring rows. IDs are permanent save keys.
export const expandedProducts: Product[] = [
  // New Tops collection. Levels follow silhouette complexity, finish and rarity.
  item('pearl-kiss-camisole', 'Áo Hai Dây Pearl Kiss', 'tops', 'corset', 'Coquette', 'cream', 90, 199, 2, 'atelierCamisole', ['cafe', 'date'], ['Soft Girl']),
  item('rose-whisper-offshoulder', 'Áo Trễ Vai Rose Whisper', 'tops', 'offshoulder', 'Luxury', 'pink', 230, 499, 5, 'atelierOffShoulder', ['date', 'party'], ['Coquette']),
  item('lavender-haze-offshoulder', 'Áo Trễ Vai Lavender Haze', 'tops', 'offshoulder', 'Balletcore', 'purple', 170, 369, 4, 'offShoulder', ['cafe', 'date'], ['Coquette']),
  item('city-girls-jersey', 'Jersey City Girls', 'tops', 'jersey', 'Blokecore', 'blue', 85, 189, 2, 'jersey', ['city', 'concert'], ['Sporty Chic']),
  item('vintage-maison-rose-corset', 'Corset Maison Rosé', 'tops', 'corset', 'Vintage', 'cream', 180, 389, 4, 'atelierCorset', ['cafe', 'date'], ['Coquette']),
  item('urban-pulse-hoodie', 'Hoodie Urban Pulse', 'tops', 'hoodie', 'Streetwear', 'black', 85, 189, 2, 'hoodie', ['city', 'concert'], ['Grunge']),
  item('pure-line-tee', 'Áo Thun Pure Line', 'tops', 'tee', 'Minimal', 'cream', 50, 109, 1, 'tee', ['campus', 'city'], ['Clean Girl']),
  item('daily-sky-shirt', 'Sơ Mi Daily Sky', 'tops', 'shirt', 'Casual', 'blue', 65, 149, 1, 'shirt', ['campus', 'cafe'], ['Clean Girl']),
  item('ivy-prep-knit', 'Áo Len Ivy Prep', 'tops', 'knitTop', 'Preppy', 'yellow', 95, 209, 3, 'atelierCardigan', ['campus', 'cafe'], ['Vintage']),
  item('retro-rose-blouse', 'Áo Blouse Retro Rose', 'tops', 'blouse', 'Vintage', 'red', 105, 229, 3, 'atelierOffShoulder', ['cafe', 'date'], ['Coquette']),
  item('stage-spark-top', 'Áo Stage Spark', 'tops', 'offshoulder', 'K-pop', 'purple', 195, 419, 5, 'offShoulder', ['concert', 'party'], ['Y2K']),
  item('mint-mellow-cardigan', 'Cardigan Mint Mellow', 'outerwear', 'cardigan', 'Soft Girl', 'green', 150, 329, 4, 'atelierCardigan', ['cafe', 'campus'], ['Coquette']),
  item('mocha-luxe-corset-blouse', 'Áo Corset Mocha Luxe', 'tops', 'corset', 'Luxury', 'brown', 260, 559, 6, 'atelierCorset', ['date', 'party'], ['Coquette']),

  // Bottoms collection supplied in October 2026. Levels follow construction and ornament.
  item('cloud-sky-jeans', 'Jeans Xanh Mây', 'bottoms', 'jeans', 'Casual', 'blue', 72, 159, 1, 'cloudJeans', ['campus', 'city'], ['Soft Girl']),
  item('cloud-nine-skirt', 'Chân Váy Cloud Nine', 'bottoms', 'mini', 'Soft Girl', 'cream', 88, 199, 2, 'skirt', ['cafe', 'date'], ['Coquette']),
  item('downtown-cargo', 'Cargo Downtown', 'bottoms', 'cargo', 'Streetwear', 'black', 98, 219, 2, 'cargoPants', ['city', 'concert'], ['Grunge']),
  item('blue-hour-wide-jeans', 'Quần Jeans Ống Rộng Blue Hour', 'bottoms', 'jeans', 'Y2K', 'blue', 125, 279, 3, 'flareJeans', ['city', 'concert'], ['K-pop']),
  item('daily-muse-straight-jeans', 'Quần Jeans Ống Suông Daily Muse', 'bottoms', 'jeans', 'Minimal', 'cream', 92, 209, 1, 'pants', ['campus', 'city'], ['Clean Girl']),
  item('matcha-utility-cargo', 'Quần Cargo Matcha Utility', 'bottoms', 'cargo', 'Gorpcore', 'green', 135, 299, 3, 'cargoPants', ['travel', 'city'], ['Streetwear']),
  item('picnic-day-shorts', 'Quần Short Jeans Picnic Day', 'bottoms', 'shorts', 'Coquette', 'pink', 82, 189, 2, 'shorts', ['cafe', 'travel'], ['Soft Girl']),
  item('ribbon-campus-skirt', 'Chân Váy Xếp Ly Ribbon Campus', 'bottoms', 'pleated', 'Preppy', 'pink', 92, 209, 2, 'pleatedSkirt', ['campus', 'cafe'], ['Coquette']),
  item('cocoa-edit-skirt', 'Chân Váy Chữ A Cocoa Edit', 'bottoms', 'mini', 'Dark Academia', 'brown', 118, 259, 3, 'skirt', ['campus', 'cafe'], ['Preppy']),
  item('campus-crush-skirt', 'Váy Xếp Ly Campus Crush', 'bottoms', 'pleated', 'K-pop', 'purple', 165, 359, 4, 'pleatedSkirt', ['concert', 'party'], ['Y2K']),

  // Sunday Atelier capsule — familiar wardrobe staples with exclusive illustrated finishes.
  item('atelier-cardigan', 'Áo Cardigan Strawberry Cream', 'outerwear', 'cardigan', 'Soft Girl', 'pink', 88, 199, 2, 'atelierCardigan', ['cafe', 'campus'], ['Coquette']),
  item('atelier-blazer', 'Áo Blazer Vanilla Office', 'outerwear', 'blazer', 'Preppy', 'yellow', 155, 339, 3, 'atelierBlazer', ['campus', 'city'], ['Clean Girl']),
  item('atelier-mini-dress', 'Váy Mini Pink Spotlight', 'dresses', 'miniDress', 'Y2K', 'pink', 128, 289, 3, 'atelierMiniDress', ['concert', 'party'], ['K-pop']),
  item('atelier-maxi-dress', 'Đầm Maxi Garden Waltz', 'dresses', 'maxi', 'Cottagecore', 'green', 178, 389, 4, 'atelierMaxiDress', ['travel', 'date'], ['Vintage']),
  item('atelier-sneakers', 'Giày Sneaker Candy Runner', 'shoes', 'sneaker', 'Y2K', 'pink', 108, 239, 2, 'atelierSneakers', ['active', 'city'], ['K-pop']),

  item('ballet-flats', 'Búp bê Ribbon Rehearsal', 'shoes', 'ballet', 'Coquette', 'purple', 32, 79, 2, 'ballet', ['cafe', 'date'], ['Balletcore']),
  item('mary-janes', 'Mary Jane After school', 'shoes', 'ballet', 'Preppy', 'black', 48, 109, 1, 'maryJane', ['campus', 'cafe'], ['Dark Academia']),
  item('retro-sneakers', 'Sneaker Retro Cloud', 'shoes', 'sneaker', 'Vintage', 'blue', 55, 119, 1, 'retroSneaker', ['city', 'campus'], ['Casual']),
  item('ballet-sneakers', 'Ballet Sneaker Pirouette', 'shoes', 'balletSneaker', 'Balletcore', 'silver', 90, 189, 3, 'balletSneaker', ['city', 'active'], ['Coquette']),
  item('slim-sneakers', 'Sneaker Low Profile', 'shoes', 'sneaker', 'Minimal', 'green', 80, 169, 2, 'retroSneaker', ['city', 'concert'], ['Clean Girl']),
  item('platform-sneakers', 'Sneaker Platform Crush', 'shoes', 'sneaker', 'K-pop', 'red', 95, 209, 4, 'platform', ['concert', 'city'], ['Y2K']),
  item('loafer-mules', 'Loafer Mule Sunday Edit', 'shoes', 'loafer', 'Luxury', 'yellow', 110, 229, 4, 'mule', ['cafe', 'city'], ['Minimal']),
  item('kitten-heels', 'Kitten Heel Little Soirée', 'shoes', 'heel', 'Coquette', 'pink', 105, 219, 3, 'heel', ['date', 'party'], ['Soft Girl']),
  item('slingbacks', 'Slingback The Muse', 'shoes', 'heel', 'Luxury', 'cream', 145, 299, 5, 'slingback', ['date', 'party'], ['Minimal']),
  item('ribbon-sandals', 'Sandal Daisy Ribbon', 'shoes', 'sandal', 'Cottagecore', 'green', 58, 129, 3, 'sandal', ['date', 'travel'], ['Soft Girl']),
  item('fisherman-sandals', 'Sandal Fisherman Diary', 'shoes', 'sandal', 'Casual', 'blue', 65, 149, 2, 'fisherman', ['cafe', 'travel'], ['Vintage']),
  item('chunky-boots', 'Boots Midnight Rebel', 'shoes', 'boot', 'Grunge', 'black', 145, 299, 4, 'combatBoot', ['concert', 'city'], ['Streetwear']),
  item('chelsea-boots', 'Boots Library Walk', 'shoes', 'boot', 'Dark Academia', 'brown', 135, 279, 4, 'chelsea', ['campus', 'city'], ['Poetcore']),
  item('western-boots', 'Boots Desert Bloom', 'shoes', 'boot', 'Boho', 'yellow', 170, 359, 4, 'western', ['concert', 'travel'], ['Vintage']),
  item('trail-shoes', 'Giày Trail Day', 'shoes', 'trail', 'Gorpcore', 'silver', 125, 269, 3, 'trail', ['active', 'travel'], ['Sporty Chic']),
  item('mesh-flats', 'Búp bê Mesh Whisper', 'shoes', 'ballet', 'Balletcore', 'purple', 115, 249, 4, 'meshFlat', ['cafe', 'date'], ['Coquette']),
  item('patent-mary-janes', 'Mary Jane Cherry gloss', 'shoes', 'ballet', 'Preppy', 'red', 185, 389, 5, 'maryJane', ['campus', 'party'], ['Coquette']),

  item('canvas-tote', 'Tote Everyday Poetry', 'bags', 'tote', 'Poetcore', 'green', 25, 69, 2, 'tote', ['campus', 'cafe'], ['Cottagecore']),
  item('nylon-crescent', 'Túi bán nguyệt City Stroll', 'bags', 'crescent', 'Minimal', 'black', 38, 89, 1, 'crescent', ['city', 'travel'], ['Clean Girl']),
  item('ribbon-bag', 'Túi vai Little Bow', 'bags', 'shoulder', 'Soft Girl', 'purple', 35, 89, 3, 'ribbonBag', ['date', 'cafe'], ['Coquette']),
  item('east-west-bag', 'Túi East–West Blue Hour', 'bags', 'eastWest', 'Clean Girl', 'blue', 78, 169, 2, 'eastWest', ['city', 'date'], ['Minimal']),
  item('bowling-bag', 'Túi Bowling Club', 'bags', 'bowling', 'Preppy', 'red', 85, 179, 3, 'bowling', ['campus', 'city'], ['Sporty Chic']),
  item('bucket-bag', 'Túi Bucket Oat Milk', 'bags', 'bucket', 'Cottagecore', 'cream', 72, 159, 3, 'bucket', ['cafe', 'city'], ['Vintage']),
  item('suede-hobo', 'Túi hobo Suede stories', 'bags', 'hobo', 'Boho', 'brown', 125, 269, 3, 'hobo', ['city', 'travel'], ['Vintage']),
  item('chain-bag', 'Túi Chain After Dark', 'bags', 'shoulder', 'Y2K', 'yellow', 155, 329, 4, 'chainBag', ['party', 'date'], ['Luxury']),
  item('mini-handle', 'Túi Mini Tea Time', 'bags', 'topHandle', 'Coquette', 'pink', 110, 239, 3, 'topHandle', ['cafe', 'date'], ['Soft Girl']),
  item('utility-bag', 'Túi Crossbody Trail Pocket', 'bags', 'crossbody', 'Gorpcore', 'green', 70, 149, 3, 'utilityBag', ['travel', 'active'], ['Streetwear']),
  item('book-tote', 'Tote Chapter One', 'bags', 'tote', 'Preppy', 'cream', 98, 209, 3, 'bookTote', ['campus', 'cafe'], ['Dark Academia']),
  item('satchel-bag', 'Túi Satchel Library Date', 'bags', 'satchel', 'Dark Academia', 'brown', 115, 249, 4, 'satchel', ['campus', 'cafe'], ['Preppy']),
  item('crochet-bag', 'Túi Crochet Wildflower', 'bags', 'tote', 'Cottagecore', 'blue', 60, 139, 4, 'crochetBag', ['travel', 'cafe'], ['Soft Girl']),
  item('metallic-pouch', 'Túi Pouch Silver Encore', 'bags', 'clutch', 'Minimal', 'silver', 130, 279, 4, 'pouch', ['concert', 'party'], ['Luxury']),
  item('charm-bag', 'Túi vai Charm Diary', 'bags', 'shoulder', 'Y2K', 'purple', 145, 309, 4, 'charmBag', ['city', 'concert'], ['K-pop']),
  item('fringe-bag', 'Túi tua rua Golden Dunes', 'bags', 'crossbody', 'Boho', 'yellow', 135, 289, 5, 'fringeBag', ['concert', 'travel'], ['Vintage']),
  item('heart-bag', 'Túi Heart to Heart', 'bags', 'topHandle', 'Soft Girl', 'red', 175, 379, 5, 'heartBag', ['date', 'party'], ['Coquette']),
  item('sculpture-clutch', 'Clutch Sculpted Moon', 'bags', 'clutch', 'Luxury', 'black', 260, 549, 6, 'clutch', ['party'], ['Minimal']),

  item('cloud-cardigan', 'Cardigan Strawberry Cloud', 'outerwear', 'cardigan', 'Coquette', 'purple', 60, 139, 3, 'cardigan', ['campus', 'cafe'], ['Soft Girl']),
  item('blue-slip', 'Đầm Slip Cool Blue', 'dresses', 'slip', 'Clean Girl', 'blue', 115, 249, 2, 'slipDress', ['date', 'party'], ['Minimal']),
  item('meadow-maxi', 'Đầm Maxi Meadow Muse', 'dresses', 'maxi', 'Boho', 'cream', 160, 349, 4, 'floralMaxi', ['travel', 'date'], ['Cottagecore']),
  item('lace-maxi', 'Đầm ren Golden Lace', 'dresses', 'maxi', 'Vintage', 'yellow', 210, 459, 5, 'laceMaxi', ['concert', 'party'], ['Luxury']),
  item('rebel-jacket', 'Jacket da Rebel Heart', 'outerwear', 'jacket', 'Grunge', 'black', 195, 419, 4, 'leatherJacket', ['concert', 'city'], ['Streetwear']),
  item('poet-trench', 'Trench Autumn Letters', 'outerwear', 'trench', 'Dark Academia', 'brown', 250, 539, 5, 'trench', ['campus', 'city'], ['Poetcore']),

  item('pearl-necklace', 'Vòng ngọc Tiny Pearls', 'accessories', 'jewelry', 'Luxury', 'cream', 28, 69, 2, 'necklace', ['date', 'party'], ['Coquette']),
  item('oval-sunnies', 'Kính Oval Edit', 'accessories', 'glasses', 'Y2K', 'black', 35, 89, 2, 'sunglasses', ['city', 'travel'], ['Clean Girl']),
  item('club-cap', 'Mũ Little Sport Club', 'accessories', 'hat', 'Sporty Chic', 'blue', 22, 59, 1, 'cap', ['active', 'city'], ['Blokecore']),
  item('leg-warmers', 'Leg Warmer Cloud Steps', 'accessories', 'socks', 'Soft Girl', 'cream', 30, 79, 2, 'legWarmers', ['active', 'cafe'], ['Balletcore']),
  item('daisy-clips', 'Kẹp tóc Daisy Picnic', 'accessories', 'hair', 'Cottagecore', 'green', 24, 65, 2, 'daisyClips', ['cafe', 'travel'], ['Soft Girl']),
  item('pearl-headband', 'Băng đô Pearl Halo', 'accessories', 'hair', 'Coquette', 'silver', 62, 139, 3, 'pearlHeadband', ['date', 'party'], ['Luxury']),
  item('satin-bow', 'Nơ tóc Satin Ballet', 'accessories', 'hair', 'Poetcore', 'purple', 38, 89, 2, 'satinBow', ['date', 'cafe'], ['Balletcore']),
  item('heart-choker', 'Choker Heart Signal', 'accessories', 'jewelry', 'K-pop', 'red', 58, 139, 3, 'heartChoker', ['concert', 'party'], ['Y2K']),
  item('pearl-earrings', 'Hoa tai Pearl Drop', 'accessories', 'jewelry', 'Clean Girl', 'silver', 55, 139, 3, 'pearlEarrings', ['date', 'party'], ['Luxury']),
  item('charm-bracelet', 'Vòng tay Lucky Charms', 'accessories', 'jewelry', 'Coquette', 'pink', 46, 115, 2, 'charmBracelet', ['cafe', 'date'], ['Y2K']),
  item('heart-glasses', 'Kính trái tim Pop Candy', 'accessories', 'glasses', 'Y2K', 'pink', 42, 105, 2, 'heartGlasses', ['concert', 'city'], ['K-pop']),
  item('wire-glasses', 'Kính gọng mảnh Study Date', 'accessories', 'glasses', 'Preppy', 'brown', 52, 125, 3, 'wireGlasses', ['campus', 'cafe'], ['Dark Academia']),
  item('ribbon-beret', 'Mũ Beret Ribbon Muse', 'accessories', 'hat', 'Vintage', 'cream', 58, 139, 3, 'ribbonBeret', ['cafe', 'date'], ['Preppy']),
  item('star-bucket-hat', 'Mũ Bucket Star Club', 'accessories', 'hat', 'Streetwear', 'black', 49, 119, 2, 'bucketHat', ['city', 'travel'], ['Y2K']),

  // Endgame capsule I — Maison Rosé (level 5)
  item('maison-pearl-choker', 'Choker Pearl Signature', 'accessories', 'jewelry', 'Luxury', 'silver', 115, 269, 5, 'necklace', ['date', 'party'], ['Coquette']),

  // Endgame capsule II — Nocturne Atelier (level 6)
  item('nocturne-velvet-dress', 'Đầm nhung Midnight Column', 'dresses', 'maxi', 'Dark Academia', 'black', 360, 769, 6, 'maxiDress', ['date', 'party'], ['Luxury']),
  item('nocturne-trench', 'Trench Eclipse Atelier', 'outerwear', 'trench', 'Minimal', 'silver', 330, 709, 6, 'trench', ['campus', 'city'], ['Luxury']),

  // Endgame capsule III — Global Runway (level 7)
  item('global-runway-gown', 'Đầm Runway Aurora', 'dresses', 'maxi', 'K-pop', 'purple', 480, 999, 7, 'maxiDress', ['party'], ['Luxury']),
  item('global-halo-glasses', 'Kính Halo Backstage', 'accessories', 'glasses', 'K-pop', 'purple', 175, 399, 7, 'wireGlasses', ['concert', 'city'], ['Luxury']),
];

export const legacyDetails: Record<string, [string, Occasion[]]> = {
  'ribbon-kiss-tee': ['tee', ['cafe', 'date']],
  'ribbon-dress': ['miniDress', ['date', 'party']],
  ribbon: ['hair', ['date', 'concert']], sneakers: ['sneaker', ['city', 'active']],
  bag: ['shoulder', ['city', 'concert']],
  blazer: ['blazer', ['campus', 'party']], vintage: ['maxi', ['date', 'party']],
  silk: ['maxi', ['party', 'date']],
  loafers: ['loafer', ['campus', 'cafe']], 'pearl-bag': ['topHandle', ['party', 'date']],
};

export const looks: Look[] = [
  { id: 'cafe-ribbon', name: 'A little café date', description: 'Áo nơ, chân váy hồng, búp bê và túi vai cho một buổi hẹn nhẹ nhàng.', style: 'Coquette', occasion: 'cafe', items: ['ribbon-kiss-tee', 'ribbon-campus-skirt', 'ballet-flats', 'ribbon-bag'] },
  { id: 'campus-diary', name: 'Campus diary', description: 'Áo thun tối giản và quần kem, thêm Mary Jane cùng tote đựng cả một ngày đi học.', style: 'Casual', occasion: 'campus', items: ['pure-line-tee', 'daily-muse-straight-jeans', 'mary-janes', 'canvas-tote'] },
  { id: 'clean-edit', name: 'The clean edit', description: 'Áo tối giản, quần kem, sneaker retro và túi East–West sắc xanh.', style: 'Clean Girl', occasion: 'city', items: ['pure-line-tee', 'daily-muse-straight-jeans', 'retro-sneakers', 'east-west-bag'] },
  { id: 'ballet-diary', name: 'Off-duty ballerina', description: 'Áo trễ vai tím, chân váy mây và phụ kiện lấy cảm hứng phòng tập múa.', style: 'Balletcore', occasion: 'date', items: ['lavender-haze-offshoulder', 'cloud-nine-skirt', 'ballet-sneakers', 'ribbon-bag'] },
  { id: 'match-point', name: 'Match point, matcha later', description: 'Jersey, shorts hồng, ballet sneaker và túi bowling cho lịch hẹn năng động.', style: 'Sporty Chic', occasion: 'active', items: ['city-girls-jersey', 'picnic-day-shorts', 'ballet-sneakers', 'bowling-bag'] },
  { id: 'city-jersey', name: 'Girls on the go', description: 'Jersey phối jeans ống rộng, sneaker dáng thấp và túi bán nguyệt.', style: 'Blokecore', occasion: 'city', items: ['city-girls-jersey', 'blue-hour-wide-jeans', 'slim-sneakers', 'nylon-crescent'] },
  { id: 'library-date', name: 'Meet me at the library', description: 'Áo len học đường cùng chân váy nâu, boots và satchel cổ điển.', style: 'Dark Academia', occasion: 'campus', items: ['ivy-prep-knit', 'cocoa-edit-skirt', 'chelsea-boots', 'satchel-bag'] },
  { id: 'picnic-poem', name: 'A picnic, a poem', description: 'Đầm hoa, sandal fisherman và tote móc len cho chuyến đi xanh.', style: 'Cottagecore', occasion: 'travel', items: ['meadow-maxi', 'fisherman-sandals', 'crochet-bag'] },
  { id: 'encore-fit', name: 'Encore, one more song', description: 'Áo sân khấu, denim ống rộng, đế platform và túi ánh bạc.', style: 'Y2K', occasion: 'concert', items: ['stage-spark-top', 'blue-hour-wide-jeans', 'platform-sneakers', 'metallic-pouch'] },
  { id: 'golden-hour', name: 'Golden hour girl', description: 'Áo blouse cổ điển, chân váy kem, western boots và tua rua.', style: 'Boho', occasion: 'concert', items: ['retro-rose-blouse', 'cloud-nine-skirt', 'western-boots', 'fringe-bag'] },
  { id: 'midnight-gala', name: 'Midnight, in silver', description: 'Lụa, slingback thanh lịch và clutch điêu khắc cho một đêm đặc biệt.', style: 'Luxury', occasion: 'party', items: ['silk', 'slingbacks', 'sculpture-clutch'] },
  { id: 'autumn-letter', name: 'Letters from a bookshop', description: 'Áo len và chân váy tông trầm, boots cùng tote mang theo trang sách.', style: 'Poetcore', occasion: 'cafe', items: ['ivy-prep-knit', 'cocoa-edit-skirt', 'chelsea-boots', 'book-tote'] },
  { id: 'maison-rose', name: 'Maison Rosé Première', description: 'Corset couture, chân váy tím, slingback và ngọc trai cho khách mời hàng ghế đầu.', style: 'Luxury', occasion: 'party', items: ['mocha-luxe-corset-blouse', 'campus-crush-skirt', 'slingbacks', 'maison-pearl-choker'] },
  { id: 'nocturne-atelier', name: 'Nocturne private showing', description: 'Áo corset và cargo tông đen, boots cá tính cùng túi satchel.', style: 'Dark Academia', occasion: 'party', items: ['mocha-luxe-corset-blouse', 'downtown-cargo', 'chunky-boots', 'satchel-bag'] },
  { id: 'global-runway', name: 'Around the world finale', description: 'Áo sân khấu, váy tím, sneaker platform và túi ánh bạc cho đêm diễn cuối.', style: 'K-pop', occasion: 'concert', items: ['stage-spark-top', 'campus-crush-skirt', 'platform-sneakers', 'metallic-pouch'] },
];
