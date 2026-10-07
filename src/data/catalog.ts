import type { Product, Customer, Furniture, Trend, Style } from '../types';
import { expandedProducts, legacyDetails } from './fashion';
import { fashionCustomers } from './fashionCustomers';
export { categories } from './fashion';

const originalProducts: Omit<Product, 'subcategory' | 'occasions'>[] = [
  { id: 'ribbon-kiss-tee', name: 'Áo Ribbon Kiss', category: 'tops', style: 'Coquette', color: '#e6a6b8', colorName: 'Hồng', buyPrice: 45000, sellPrice: 99000, quality: 83, level: 1, art: 'atelierOffShoulder', secondaryStyles: ['Soft Girl'] },
  { id: 'ribbon-dress', name: 'Đầm Sunday Date', category: 'dresses', style: 'Coquette', color: '#f3a3c4', colorName: 'Hồng', buyPrice: 110000, sellPrice: 229000, quality: 92, level: 1, art: 'dress', secondaryStyles: ['Soft Girl'] },
  { id: 'ribbon', name: 'Nơ Ballet Club', category: 'accessories', style: 'Balletcore', color: '#ee95bd', colorName: 'Hồng', buyPrice: 18000, sellPrice: 49000, quality: 82, level: 1, art: 'bow', secondaryStyles: ['Coquette'] },
  { id: 'sneakers', name: 'Sneaker sữa yến mạch', category: 'shoes', style: 'Casual', color: '#ead9bd', colorName: 'Kem', buyPrice: 90000, sellPrice: 189000, quality: 86, level: 1, art: 'shoes' },
  { id: 'bag', name: 'Túi Little Baguette', category: 'bags', style: 'Coquette', color: '#ee87b7', colorName: 'Hồng', buyPrice: 70000, sellPrice: 159000, quality: 89, level: 2, art: 'bag' },
  { id: 'blazer', name: 'Blazer Atelier', category: 'outerwear', style: 'Luxury', color: '#ead9bd', colorName: 'Kem', buyPrice: 150000, sellPrice: 319000, quality: 95, level: 5, art: 'blazer' },
  { id: 'vintage', name: 'Đầm Golden Hour', category: 'dresses', style: 'Luxury', color: '#f2c64f', colorName: 'Vàng', buyPrice: 290000, sellPrice: 619000, quality: 97, level: 5, art: 'dress', secondaryStyles: ['Coquette'] },
  { id: 'silk', name: 'Đầm lụa Moonlight', category: 'dresses', style: 'Minimal', color: '#d9d9e6', colorName: 'Bạc', buyPrice: 220000, sellPrice: 469000, quality: 96, level: 4, art: 'dress', secondaryStyles: ['Luxury'] },
  { id: 'loafers', name: 'Loafer The editor', category: 'shoes', style: 'Dark Academia', color: '#87533f', colorName: 'Nâu', buyPrice: 145000, sellPrice: 299000, quality: 95, level: 3, art: 'loafer' },
  { id: 'pearl-bag', name: 'Túi Pearl Muse', category: 'bags', style: 'Luxury', color: '#d9d9e6', colorName: 'Bạc', buyPrice: 180000, sellPrice: 389000, quality: 98, level: 4, art: 'topHandle' },
];
// Keep the normal retail margin meaningful without letting the first few days
// snowball too quickly. Bulk-buy discounts can still improve this margin.
const balancedRetailPrice = (buyPrice: number) => Math.round(buyPrice * 1.7 / 1000) * 1000;
export const products: Product[] = [
  ...originalProducts.map(p => ({ ...p, sellPrice: balancedRetailPrice(p.buyPrice), subcategory: legacyDetails[p.id][0], occasions: legacyDetails[p.id][1] })),
  ...expandedProducts.map(p => ({ ...p, sellPrice: balancedRetailPrice(p.buyPrice) })),
];
export const customers: Customer[] = [
  { id: 'lily', name: 'Lily', handle: '@lily.sweet', personality: 'Cô nàng ngọt ngào', styles: ['Coquette', 'Soft Girl', 'Balletcore'], colors: ['Hồng', 'Kem'], budget: 380000, patience: 130, goal: 'Mình tìm một set đồ thật dễ thương, có nơ và màu pastel để đi dạo phố!', skin: '#fff0e6', hair: '#ff7aa8', outfit: '#f2a8c1', hairStyle: 0 },
  { id: 'emma', name: 'Emma', handle: '@emma.street', personality: 'Tín đồ Streetwear', styles: ['Streetwear', 'Casual', 'Y2K'], colors: ['Nâu', 'Kem', 'Đen'], budget: 450000, patience: 120, goal: 'Có chiếc quần jeans ống rộng hay áo crop top năng động nào không bạn?', skin: '#fff0e6', hair: '#1e1b2e', outfit: '#8f6b5d', hairStyle: 1 },
  { id: 'sophie', name: 'Sophie', handle: '@sophie.beats', personality: 'Yêu âm nhạc & Chill', styles: ['Clean Girl', 'Sporty Chic', 'Casual'], colors: ['Xanh lá', 'Kem', 'Hồng'], budget: 520000, patience: 130, goal: 'Mình thích phong cách năng động kèm tai nghe, vừa ấm áp vừa thoải mái.', skin: '#fff0e6', hair: '#fef08a', outfit: '#b9dfc6', hairStyle: 2 },
  { id: 'mia', name: 'Mia', handle: '@mia.vintage', personality: 'Nàng thơ Vintage', styles: ['Vintage', 'Preppy', 'Cottagecore'], colors: ['Tím', 'Kem', 'Xanh lá'], budget: 480000, patience: 120, goal: 'Một chiếc mũ beret phối cùng yếm denim và sơ mi cổ bèo cho buổi café nha.', skin: '#fff0e6', hair: '#854d0e', outfit: '#c6b1e7', hairStyle: 0 },
  { id: 'zoe', name: 'Zoe', handle: '@zoe.lavender', personality: 'Gen Z Trendy', styles: ['Y2K', 'K-pop', 'Streetwear'], colors: ['Tím', 'Đen', 'Kem'], budget: 580000, patience: 125, goal: 'Tone tím pastel đang hot trend! Tìm cho mình outfit hoodie rộng cá tính nhé.', skin: '#fff0e6', hair: '#c084fc', outfit: '#c5b1e6', hairStyle: 2 },
  { id: 'ruby', name: 'Ruby', handle: '@ruby.rebel', personality: 'Gothic Chic & Cá tính', styles: ['Dark Academia', 'Grunge', 'Y2K'], colors: ['Bạc', 'Xanh lá', 'Kem'], budget: 650000, patience: 110, goal: 'Tone bạc mint sáng nhưng vẫn có phom cá tính, càng khác biệt càng tốt!', skin: '#fff0e6', hair: '#f43f5e', outfit: '#b9d9c7', hairStyle: 1 },
  { id: 'kai', name: 'Kỳ Anh', handle: '@kyanh.daily', personality: 'Tín đồ streetwear', styles: ['Streetwear', 'Casual', 'Y2K'], colors: ['Hồng', 'Tím', 'Xanh lá'], budget: 420000, patience: 110, goal: 'Có gì thoải mái, ngầu một chút để đi chơi không?', skin: '#c89370', hair: '#343c37', outfit: '#cab2e6', hairStyle: 1 },
  { id: 'linh', name: 'Linh', handle: '@linh.inbloom', personality: 'Influencer', styles: ['Coquette', 'Y2K', 'Soft Girl'], colors: ['Hồng', 'Xanh', 'Kem'], budget: 520000, patience: 130, goal: 'Mình tìm một món thật nổi bật để quay outfit of the day!', skin: '#f0c6a4', hair: '#5b4239', outfit: '#e9c8b1', hairStyle: 2 },
  { id: 'an', name: 'An', handle: '@an.slowdays', personality: 'Thợ săn giá tốt', styles: ['Casual', 'Minimal', 'Coquette'], colors: ['Xanh lá', 'Tím', 'Kem'], budget: 180000, patience: 120, goal: 'Một món dễ phối, giá dễ thương nha. Mình có 180k thôi.', skin: '#dba982', hair: '#513c34', outfit: '#bda2df', hairStyle: 0 },
  { id: 'bao', name: 'Bảo Ngọc', handle: '@baongoc.studio', personality: 'Khách kỹ tính', styles: ['Streetwear', 'Minimal', 'Preppy'], colors: ['Hồng', 'Xanh', 'Kem'], budget: 480000, patience: 100, goal: 'Mình thích đồ chất lượng, màu trung tính, càng tinh tế càng tốt.', skin: '#b88568', hair: '#3f3531', outfit: '#77aee0', hairStyle: 1 },
  { id: 'chloe', name: 'Chloe', handle: '@chloe.archive', personality: 'Nhà sưu tầm', styles: ['Vintage', 'Luxury', 'Coquette'], colors: ['Hồng', 'Vàng', 'Kem'], budget: 750000, patience: 120, goal: 'Một thiết kế đặc biệt cho buổi hẹn tối nay, bạn chọn giúp nhé.', skin: '#edc8ad', hair: '#98694e', outfit: '#e9a9bd', hairStyle: 2 },
  { id: 'nari', name: 'Nari', handle: '@nari.playlist', personality: 'Trend hunter', styles: ['K-pop', 'Y2K', 'Coquette'], colors: ['Vàng', 'Tím', 'Nâu'], budget: 550000, patience: 100, goal: 'Concert cuối tuần rồi! Cho mình món nào đang hot nhất đi.', skin: '#ebc0a0', hair: '#454043', outfit: '#f2d38c', hairStyle: 0 },
  { id: 'jade', name: 'Jade', handle: '@jade.edit', personality: 'VIP', styles: ['Luxury', 'Minimal', 'Preppy'], colors: ['Kem', 'Xanh lá', 'Nâu'], budget: 990000, patience: 140, goal: 'Mình muốn đầu tư một món thật đẹp, chất lượng là ưu tiên.', skin: '#9b6c51', hair: '#302d30', outfit: '#b4d4b9', hairStyle: 2 },
  ...fashionCustomers,
];
export const trends: Trend[] = [
  { name: 'Balletcore', subtitle: 'Một chút nơ, một chút mộng mơ.', styles: ['Coquette', 'Soft Girl', 'Balletcore'], colors: ['Hồng'], bonus: 35, tags: ['Nơ xinh', 'Ballet sneaker', 'Soft girl'] },
  { name: 'City off-duty', subtitle: 'Thoải mái xuống phố, vẫn rất có gu.', styles: ['Streetwear', 'Casual'], colors: ['Xanh lá', 'Xanh'], bonus: 30, tags: ['Oversized', 'Denim', 'Sneaker'] },
  { name: 'Café au lait', subtitle: 'Gam màu ấm cho một ngày chậm lại.', styles: ['Minimal', 'Preppy', 'Vintage'], colors: ['Kem', 'Nâu'], bonus: 30, tags: ['Màu trung tính', 'Sơ mi', 'Quiet style'] },
  { name: 'Main character', subtitle: 'Hôm nay, bạn là nhân vật chính.', styles: ['Y2K', 'K-pop', 'Coquette'], colors: ['Tím', 'Hồng'], bonus: 40, tags: ['Concert fit', 'Baby tee', 'Tỏa sáng'] },
  { name: 'Matcha court club', subtitle: 'Từ sân tennis đến chiếc bàn café quen.', styles: ['Sporty Chic', 'Blokecore', 'Streetwear'], colors: ['Xanh lá'], bonus: 30, tags: ['Jersey', 'Sneaker dáng thấp', 'Túi bowling'] },
  { name: 'Cool blue edit', subtitle: 'Sắc xanh dịu, phom gọn, một chiếc túi thật xinh.', styles: ['Clean Girl', 'Minimal'], colors: ['Xanh', 'Bạc'], bonus: 35, tags: ['East–West bag', 'Đầm slip', 'Kitten heel'] },
  { name: 'Letters & loafers', subtitle: 'Một trang sách mới, một gu thời trang rất riêng.', styles: ['Poetcore', 'Dark Academia', 'Preppy'], colors: ['Nâu'], bonus: 30, tags: ['Satchel', 'Loafer', 'Dệt kim'] },
  { name: 'Wildflower weekend', subtitle: 'Ren, hoa và những bước chân tự do.', styles: ['Boho', 'Cottagecore', 'Vintage'], colors: ['Vàng', 'Kem'], bonus: 35, tags: ['Túi crochet', 'Đầm maxi', 'Tua rua'] },
  { name: 'Off the beaten path', subtitle: 'Phối lớp cá tính, sẵn sàng cho chuyến đi mới.', styles: ['Gorpcore', 'Grunge', 'Streetwear'], colors: ['Xanh lá', 'Đen'], bonus: 30, tags: ['Boots', 'Utility bag', 'Parachute'] },
  { name: 'After-hours glow', subtitle: 'Ánh bạc và đường lụa cho đêm đáng nhớ.', styles: ['Luxury', 'K-pop', 'Y2K'], colors: ['Bạc', 'Đen'], bonus: 40, tags: ['Clutch', 'Cao gót', 'Satin'] },
];
export const furniture: Furniture[] = [
  // Cấp 1: Khởi đầu xinh xắn
  { id: 'rack', name: 'Sào đồ Sunday', price: 150000, appeal: 2, level: 1, art: 'rack', width: 2, height: 1, style: 'Casual', description: 'Sào treo 16 món, có thể nâng cấp thêm slot.', display: { kind: 'clothing', capacity: 16, categories: ['tops', 'bottoms', 'dresses', 'sets', 'outerwear'], upgrade: { maxLevel: 3, slotsPerLevel: 8, baseCost: 90000 } } },
  { id: 'mirror', name: 'Gương vòm Muse', price: 125000, appeal: 4, level: 1, art: 'mirror', width: 1, height: 1, style: 'Vintage', description: 'Gương vòm check-in tạo góc sống ảo' },
  { id: 'plant', name: 'Cây Olive nhỏ', price: 45000, appeal: 2, level: 1, art: 'plant', width: 1, height: 1, style: 'Minimal', description: 'Chậu cây olive mang lại sức sống xanh mát' },
  { id: 'flowers', name: 'Bình hoa Blush', price: 35000, appeal: 2, level: 1, art: 'flowers', width: 1, height: 1, style: 'Coquette', description: 'Hoa tulip và cúc pastel thơm dịu' },
  { id: 'table', name: 'Bàn phụ kiện', price: 85000, appeal: 3, level: 1, art: 'table', width: 1, height: 1, style: 'Clean Girl', description: 'Bàn gỗ 12 phụ kiện, có thể nâng cấp thêm slot.', display: { kind: 'accessories', capacity: 12, categories: ['accessories'], upgrade: { maxLevel: 3, slotsPerLevel: 6, baseCost: 75000 } } },
  { id: 'shoe-shelf', name: 'Kệ giày Candy', price: 105000, appeal: 3, level: 1, art: 'shoe-shelf', width: 2, height: 1, style: 'Y2K', description: 'Kệ ba tầng 18 đôi giày, có thể nâng cấp thêm slot.', display: { kind: 'shoes', capacity: 18, categories: ['shoes'], upgrade: { maxLevel: 3, slotsPerLevel: 9, baseCost: 100000 } } },
  { id: 'bag-stand', name: 'Kệ túi Ribbon', price: 115000, appeal: 4, level: 1, art: 'bag-stand', width: 2, height: 1, style: 'Coquette', description: 'Kệ nơ 15 túi xách, có thể nâng cấp thêm slot.', display: { kind: 'bags', capacity: 15, categories: ['bags'], upgrade: { maxLevel: 3, slotsPerLevel: 8, baseCost: 110000 } } },
  { id: 'counter', name: 'Quầy thanh toán', price: 150000, appeal: 3, level: 1, art: 'counter', width: 2, height: 1, style: 'Casual', description: 'Quầy thu ngân máy tính tiền chuyên nghiệp' },
  { id: 'atelier-rug', name: 'Thảm Atelier Pastel', price: 95000, appeal: 5, level: 1, art: 'atelier-rug', width: 2, height: 2, style: 'Soft Girl', description: 'Thảm lớn màu kem hồng tạo điểm nhấn giữa gian hàng' },
  { id: 'shop-sign', name: 'Biển hiệu Boutique', price: 135000, appeal: 5, level: 1, art: 'shop-sign', width: 3, height: 1, style: 'Coquette', description: 'Biển tên shop cỡ lớn ba ô, tự đổi nội dung theo tên cửa hàng' },
  { id: 'fashion-print', name: 'Bộ tranh Fashion Muse', price: 78000, appeal: 4, level: 1, art: 'fashion-print', width: 2, height: 1, style: 'Coquette', description: 'Cụm ba tranh thời trang nhỏ treo chung theo phong cách gallery' },
  { id: 'boutique-window', name: 'Cửa sổ vòm Boutique', price: 90000, appeal: 4, level: 1, art: 'boutique-window', width: 2, height: 1, style: 'Clean Girl', description: 'Cửa sổ vòm kính xanh có thể treo và di chuyển trên hai mặt tường' },
  { id: 'blush-blinds', name: 'Rèm sáo Blush', price: 72000, appeal: 3, level: 1, art: 'blush-blinds', width: 1, height: 1, style: 'Clean Girl', description: 'Rèm sáo hồng kem lọc ánh sáng dịu, treo được trên hai mặt tường' },
  { id: 'runway-print', name: 'Tranh Runway Dress', price: 92000, appeal: 5, level: 1, art: 'runway-print', width: 1, height: 1, style: 'Soft Girl', description: 'Minh họa váy runway trong khung tím pastel' },
  { id: 'heart-rug', name: 'Thảm lông Trái tim', price: 50000, appeal: 3, level: 1, art: 'heart-rug', width: 2, height: 2, style: 'Coquette', description: 'Thảm lông cừu hình trái tim êm ái' },
  { id: 'checkered-rug', name: 'Thảm caro Retro', price: 55000, appeal: 3, level: 1, art: 'checkered-rug', width: 2, height: 2, style: 'Y2K', description: 'Thảm bàn cờ đen trắng đậm chất Gen Z' },
  { id: 'tulip-lamp', name: 'Đèn cây hoa Tulip', price: 75000, appeal: 4, level: 1, art: 'tulip-lamp', width: 1, height: 1, style: 'Balletcore', description: 'Đèn cây hoa tulip phát ánh sáng dịu êm' },
  { id: 'beanbag', name: 'Ghế lười Marshmallow', price: 85000, appeal: 4, level: 1, art: 'beanbag', width: 1, height: 1, style: 'Casual', description: 'Ghế lười hạt xốp ombre tím hồng cực êm' },

  // Cấp 2: Nâng tầm phong cách
  { id: 'sofa', name: 'Sofa marshmallow', price: 180000, appeal: 5, level: 2, art: 'sofa', width: 2, height: 1, style: 'Soft Girl', description: 'Sofa nhung êm ái cho khách ngồi nghỉ' },
  { id: 'mannequin', name: 'Ma-nơ-canh Nàng thơ', price: 190000, appeal: 5, level: 2, art: 'mannequin', width: 1, height: 1, style: 'Preppy', description: 'Trưng đúng 1 sản phẩm set outfit mẫu.', display: { kind: 'outfit', capacity: 1, categories: ['sets'] } },
  { id: 'coquette-mirror', name: 'Gương nơ ren Coquette', price: 165000, appeal: 6, level: 2, art: 'coquette-mirror', width: 1, height: 1, style: 'Coquette', description: 'Gương viền nơ ren và ngọc trai công chúa' },
  { id: 'wavy-mirror', name: 'Gương uốn sóng Neon Y2K', price: 185000, appeal: 6, level: 2, art: 'wavy-mirror', width: 1, height: 1, style: 'Y2K', description: 'Gương selfie uốn lượn phong cách Ultrafragola' },
  { id: 'monstera-plant', name: 'Chậu Monstera gốm', price: 90000, appeal: 4, level: 2, art: 'monstera-plant', width: 1, height: 1, style: 'Clean Girl', description: 'Monstera lá xẻ sang trọng trong chậu terrazzo' },
  { id: 'vinyl-player', name: 'Máy nghe nhạc Melody', price: 95000, appeal: 5, level: 1, art: 'vinyl-player', width: 1, height: 1, style: 'Vintage', description: 'Chạm để chọn bài, bật tắt và điều chỉnh âm lượng nhạc trong boutique.' },
  { id: 'gallery-print', name: 'Tranh lớn Gallery Lovely', price: 115000, appeal: 6, level: 2, art: 'gallery-print', width: 2, height: 1, style: 'Balletcore', description: 'Tranh lớn typography và ruy băng làm điểm nhấn cho mảng tường' },
  { id: 'botanical-print', name: 'Tranh Botanical Blush', price: 105000, appeal: 5, level: 2, art: 'botanical-print', width: 1, height: 1, style: 'Cottagecore', description: 'Bản in hoa lá cổ điển với khung gỗ hồng' },
  { id: 'parfum-print', name: 'Tranh Parfum Paris', price: 125000, appeal: 6, level: 2, art: 'parfum-print', width: 1, height: 1, style: 'Luxury', description: 'Poster nước hoa nữ tính mang sắc hồng kem' },
  { id: 'ribbon-sign', name: 'Biển nơ Welcome', price: 145000, appeal: 6, level: 2, art: 'ribbon-sign', width: 3, height: 1, style: 'Coquette', description: 'Biển chào đón cỡ lớn ba ô cho góc check-in' },
  { id: 'wall-rack', name: 'Sào đồ Pastel đôi', price: 185000, appeal: 5, level: 2, art: 'wall-rack', width: 2, height: 1, style: 'Soft Girl', description: 'Sào đôi 24 món thời trang, có thể nâng cấp thêm slot.', display: { kind: 'clothing', capacity: 24, categories: ['tops', 'bottoms', 'dresses', 'sets', 'outerwear'], upgrade: { maxLevel: 3, slotsPerLevel: 12, baseCost: 160000 } } },
  { id: 'shoe-cabinet', name: 'Tủ giày Cloud', price: 195000, appeal: 5, level: 2, art: 'shoe-cabinet', width: 2, height: 1, style: 'Clean Girl', description: 'Tủ giày có đèn 30 đôi, có thể nâng cấp thêm slot.', display: { kind: 'shoes', capacity: 30, categories: ['shoes'], upgrade: { maxLevel: 3, slotsPerLevel: 15, baseCost: 175000 } } },

  // Cấp 3: Boutique điểm hẹn
  { id: 'fitting', name: 'Phòng thử đồ rèm hồng', price: 250000, appeal: 7, level: 3, art: 'fitting', width: 2, height: 2, style: 'Casual', description: 'Khu vực thử đồ kín đáo và tiện nghi' },
  { id: 'neon-sign', name: 'Đèn neon FASHION', price: 210000, appeal: 7, level: 3, art: 'neon-sign', width: 3, height: 1, style: 'Streetwear', description: 'Bảng neon ba ô phát sáng thu hút mọi ánh nhìn' },
  { id: 'lightbox-sign', name: 'Biển đèn Fashion Club', price: 235000, appeal: 8, level: 3, art: 'lightbox-sign', width: 3, height: 1, style: 'Y2K', description: 'Hộp đèn pastel ba ô cho góc chụp ảnh trong shop' },
  { id: 'shoe-sketch-print', name: 'Tranh Kitten Heel', price: 155000, appeal: 7, level: 3, art: 'shoe-sketch-print', width: 1, height: 1, style: 'Clean Girl', description: 'Bản phác họa giày thời trang trên nền xanh dịu' },
  { id: 'perfume-table', name: 'Bàn đá nến thơm & nước hoa', price: 175000, appeal: 7, level: 3, art: 'perfume-table', width: 1, height: 1, style: 'Minimal', description: 'Bàn đá cẩm thạch trưng bày hương thơm tinh tế' },
  { id: 'coffee-corner', name: 'Quầy trà & Cafe takeaway', price: 240000, appeal: 8, level: 3, art: 'coffee-corner', width: 2, height: 1, style: 'Clean Girl', description: 'Góc phục vụ đồ uống cho khách thảnh thơi mua sắm' },
  { id: 'bag-cabinet', name: 'Tủ túi Blush', price: 255000, appeal: 7, level: 3, art: 'bag-cabinet', width: 2, height: 1, style: 'Coquette', description: 'Tủ boutique 28 túi xách, có thể nâng cấp thêm slot.', display: { kind: 'bags', capacity: 28, categories: ['bags'], upgrade: { maxLevel: 3, slotsPerLevel: 14, baseCost: 220000 } } },

  // Cấp 4 & 5: Nhà mốt cao cấp & Sang trọng
  { id: 'lux-rack', name: 'Sào đồ vòm mạ vàng', price: 320000, appeal: 9, level: 4, art: 'lux-rack', width: 2, height: 1, style: 'Luxury', description: 'Sào treo cao cấp 32 món, có thể nâng cấp thêm slot.', display: { kind: 'clothing', capacity: 32, categories: ['tops', 'bottoms', 'dresses', 'sets', 'outerwear'], upgrade: { maxLevel: 3, slotsPerLevel: 16, baseCost: 280000 } } },
  { id: 'glass-showcase', name: 'Tủ túi pha lê LED', price: 360000, appeal: 10, level: 4, art: 'glass-showcase', width: 2, height: 1, style: 'Luxury', description: 'Tủ kính 20 túi xách, có thể nâng cấp thêm slot.', display: { kind: 'bags', capacity: 20, categories: ['bags'], upgrade: { maxLevel: 3, slotsPerLevel: 10, baseCost: 320000 } } },
  { id: 'crystal-chandelier', name: 'Đèn chùm pha lê Hoàng Gia', price: 480000, appeal: 12, level: 5, art: 'crystal-chandelier', width: 2, height: 1, style: 'Luxury', description: 'Đèn chùm pha lê tỏa sáng rực rỡ cả gian phòng' },
  { id: 'couture-rack', name: 'Sào couture Vầng Trăng', price: 820000, appeal: 13, level: 5, art: 'couture-rack', width: 2, height: 1, style: 'Luxury', description: 'Sào vòm đồng champagne trưng 40 thiết kế couture.', display: { kind: 'clothing', capacity: 40, categories: ['tops', 'bottoms', 'dresses', 'sets', 'outerwear'], upgrade: { maxLevel: 3, slotsPerLevel: 20, baseCost: 420000 } } },
  { id: 'jewel-shoe-wall', name: 'Tủ giày Jewel Gallery', price: 760000, appeal: 12, level: 5, art: 'jewel-shoe-wall', width: 2, height: 1, style: 'Luxury', description: 'Tủ giày kính màu khói với 36 vị trí trưng bày.', display: { kind: 'shoes', capacity: 36, categories: ['shoes'], upgrade: { maxLevel: 3, slotsPerLevel: 18, baseCost: 390000 } } },
  { id: 'atelier-island', name: 'Đảo phụ kiện Atelier', price: 1100000, appeal: 15, level: 6, art: 'atelier-island', width: 2, height: 1, style: 'Minimal', description: 'Bàn đảo đá sáng dành cho 30 phụ kiện cao cấp.', display: { kind: 'accessories', capacity: 30, categories: ['accessories'], upgrade: { maxLevel: 3, slotsPerLevel: 15, baseCost: 560000 } } },
  { id: 'runway-mannequin', name: 'Ma-nơ-canh Runway Spotlight', price: 980000, appeal: 15, level: 6, art: 'runway-mannequin', width: 2, height: 1, style: 'K-pop', description: 'Bục runway có đèn viền, trưng một set chủ đạo.', display: { kind: 'outfit', capacity: 1, categories: ['sets'] } },
  { id: 'global-showcase', name: 'Tủ túi Global Flagship', price: 1650000, appeal: 19, level: 7, art: 'global-showcase', width: 2, height: 1, style: 'Luxury', description: 'Tủ flagship ánh pha lê trưng 36 mẫu túi biểu tượng.', display: { kind: 'bags', capacity: 36, categories: ['bags'], upgrade: { maxLevel: 3, slotsPerLevel: 18, baseCost: 780000 } } },
  { id: 'champagne-sofa', name: 'Sofa Champagne Lounge', price: 1350000, appeal: 18, level: 7, art: 'champagne-sofa', width: 2, height: 1, style: 'Luxury', description: 'Sofa lounge bọc nhung kem với khung kim loại champagne.' },
  { id: 'crystal-luxe', name: 'Quả cầu pha lê Crystal Luxe', price: 15000000, appeal: 35, level: 9, art: 'crystal-luxe', width: 2, height: 2, style: 'Luxury', description: 'Bảo vật pha lê ánh cực quang trên bệ vàng hồng, tạo điểm nhấn xa hoa cho boutique.' },
];
const functionalFurniturePrices: Record<string, number> = {
  rack: 150000,
  table: 135000,
  'shoe-shelf': 175000,
  'bag-stand': 195000,
  mannequin: 310000,
  'wall-rack': 320000,
  'shoe-cabinet': 345000,
  'bag-cabinet': 480000,
  'lux-rack': 650000,
  'glass-showcase': 750000,
  'couture-rack': 820000,
  'jewel-shoe-wall': 760000,
  'atelier-island': 1100000,
  'runway-mannequin': 980000,
  'global-showcase': 1650000,
};
for (const item of furniture) item.price = functionalFurniturePrices[item.id] ?? item.price;
export const levels = [
  { name: 'Little beginnings', label: 'Boutique nhỏ xinh', xp: 0, cost: 0 },
  { name: 'Blooming boutique', label: 'Boutique nở rộ', xp: 240, cost: 450000 },
  { name: 'The local favorite', label: 'Góc phố yêu thích', xp: 650, cost: 1000000 },
  { name: 'Style destination', label: 'Điểm hẹn thời trang', xp: 1250, cost: 1900000 },
  { name: 'Fashion house', label: 'Nhà mốt của bạn', xp: 2100, cost: 3100000 },
  { name: 'The atelier', label: 'Atelier cao cấp', xp: 3200, cost: 4800000 },
  { name: 'Around the world', label: 'Thương hiệu toàn cầu', xp: 4700, cost: 7000000 },
  { name: 'Made by you', label: 'Xưởng may cá nhân', xp: 6500, cost: 9800000 },
  { name: 'Signature house', label: 'Nhà mốt chữ ký', xp: 8700, cost: 13000000 },
  { name: 'Fashion legacy', label: 'Di sản thời trang', xp: 11500, cost: 17500000 },
];
export const dailyEvents = [
  { name: 'Ngày khai trương', description: 'Những khách đầu tiên đang chờ khám phá shop của bạn.', discount: 1, extra: 0 },
  { name: 'Ưu đãi nhà cung cấp', description: 'Giảm 5% giá nhập tất cả sản phẩm trong hôm nay.', discount: .95, extra: 0 },
  { name: 'Một ngày mưa nhẹ', description: 'Ít khách hơn một chút. Dành thời gian chọn đồ thật xinh nhé.', discount: 1, extra: -1 },
  { name: 'Mưa giông bất chợt', description: 'Mưa lớn kèm sấm chớp. Ít hơn 2 khách ghé shop trong hôm nay.', discount: 1, extra: -2 },
  { name: 'Fashion weekend', description: 'Thêm 2 khách ghé shop. Sẵn sàng cho một ngày bận rộn!', discount: 1, extra: 2 },
];
export const compatible: Partial<Record<Style, Style[]>> = {
  Coquette: ['Soft Girl', 'Y2K', 'Balletcore'], Streetwear: ['Casual', 'K-pop', 'Blokecore', 'Gorpcore', 'Grunge'],
  Minimal: ['Preppy', 'Luxury', 'Clean Girl'], Vintage: ['Preppy', 'Casual', 'Boho', 'Poetcore'],
  Luxury: ['Minimal', 'Clean Girl'], 'K-pop': ['Y2K', 'Streetwear', 'Grunge'],
  'Soft Girl': ['Coquette', 'Balletcore', 'Cottagecore'], Preppy: ['Dark Academia', 'Sporty Chic', 'Poetcore'],
  Y2K: ['K-pop', 'Streetwear', 'Grunge'], Casual: ['Clean Girl', 'Streetwear', 'Sporty Chic'],
  Balletcore: ['Coquette', 'Soft Girl', 'Sporty Chic'], 'Clean Girl': ['Minimal', 'Casual', 'Luxury'],
  'Sporty Chic': ['Blokecore', 'Casual', 'Balletcore'], Blokecore: ['Sporty Chic', 'Streetwear'],
  Gorpcore: ['Streetwear', 'Sporty Chic'], 'Dark Academia': ['Preppy', 'Poetcore', 'Vintage'],
  Cottagecore: ['Boho', 'Soft Girl', 'Vintage'], Boho: ['Cottagecore', 'Vintage'],
  Grunge: ['Streetwear', 'Y2K'], Poetcore: ['Dark Academia', 'Vintage', 'Minimal'],
};
