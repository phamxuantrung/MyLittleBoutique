import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Chỉnh `shear` riêng cho từng món rồi chạy: node .tmp/tune-furniture-angle.mjs
// 0.00 = góc SVG gốc; 0.08 = nhẹ; 0.10 = mức hiện tại; 0.18 = khá mạnh.
// Đặt `enabled: false` nếu muốn giữ nguyên ảnh hiện tại của món đó.
const items = [
  { name: 'Sào đồ Pastel đôi', input: 'Sào đồ pastel đôi.svg', output: 'pastel-double-rack.png', shear: 0, enabled: true },
  { name: 'Tủ giày Cloud', input: 'tủ giày cloud.svg', output: 'cloud-shoe-cabinet.png', shear: 0.08, enabled: true },
  { name: 'Tủ túi Blush', input: 'tủ túi blush.svg', output: 'blush-bag-cabinet.png', shear: 0.14, enabled: true },
  { name: 'Sào đồ vòm mạ vàng', input: 'sào đồ vòm mạ vàng.svg', output: 'gold-arch-rack.png', shear: 0, enabled: true },
  { name: 'Sào couture Vầng Trăng', input: 'sào couture vầng trăng.svg', output: 'moon-couture-rack.png', shear: 0, enabled: true },
  { name: 'Tủ túi pha lê LED', input: 'tủ túi pha lê led.svg', output: 'crystal-led-bag-showcase.png', shear: 0.04, enabled: true },
  { name: 'Tủ túi Global Flagship', input: 'tủ túi global flagship.svg', output: 'global-flagship-showcase.png', shear: 0.10, enabled: true },
  { name: 'Đảo phụ kiện Atelier', input: 'đảo phụ kiện Atelier.svg', output: 'atelier-accessory-island.png', shear: 0.10, enabled: true },
  { name: 'Tủ giày Jewel Gallery', input: 'tủ giày jewel gallery.svg', output: 'jewel-shoe-gallery.png', shear: 0.09, enabled: true },
  { name: 'Bình hoa Blush', input: 'Bình hoa Blush - 1x1 ô.svg', output: 'blush-flower-vase.png', shear: 0.10, enabled: true },
  { name: 'Cây Olive nhỏ', input: 'Cây olive nhỏ - 1x1 ô.svg', output: 'small-olive-tree.png', shear: 0.10, enabled: true },
  { name: 'Ma-nơ-canh Nàng thơ', input: 'ma-nơ-canh nàng thơ - 1x1 ô.svg', output: 'poet-mannequin.png', shear: 0.10, enabled: true },
  { name: 'Chậu Monstera gốm', input: 'Chậu monstera gốm - 1x1 ô.svg', output: 'ceramic-monstera.png', shear: 0.10, enabled: true },
  { name: 'Ghế lười Marshmallow', input: 'Ghế lười marshmallow - 1x1 ô.svg', output: 'marshmallow-beanbag.png', shear: 0.10, enabled: true },
  { name: 'Máy nghe nhạc Melody', input: 'Máy phát nhạc đĩa than pastel.png', output: 'melody-player.png', shear: 0, enabled: true },
  { name: 'Quầy trà & Cafe takeaway', input: 'Quầy trà & cafe takeaway - 2x1 ô.svg', output: 'takeaway-coffee-counter.png', shear: 0, enabled: true },
  { name: 'Quầy thanh toán', input: 'Sofa marshmallow - 2x1 ô.svg', output: 'checkout-counter.png', shear: 0, enabled: true },
  { name: 'Sofa Marshmallow', input: 'Quầy thanh toán - 2x1 ô.svg', output: 'marshmallow-sofa.png', shear: 0.06, enabled: true },
  { name: 'Thảm Atelier Pastel', input: 'Thảm Atelier Pastel - 2x2 ô.svg', output: 'atelier-pastel-rug.png', shear: 0, anchor: 'center', enabled: true },
  { name: 'Thảm lông Trái tim', input: 'Thảm lông trái tim - 2x2 ô.svg', output: 'heart-fur-rug.png', shear: 0, anchor: 'center', enabled: true },
  { name: 'Thảm caro Retro', input: 'Thảm caro retro - 2x2 ô.svg', output: 'retro-checkered-rug.png', shear: -0.05, anchor: 'center', enabled: true },
  { name: 'Gương nơ ren Coquette', input: 'Gương nơ ren coquette - 1x1 ô.svg', output: 'coquette-bow-mirror.png', shear: 0, enabled: true },
  { name: 'Gương uốn sóng Neon Y2K', input: 'Gương uốn sóng neon y2k - 1x1 ô.svg', output: 'neon-wavy-mirror.png', shear: 0, enabled: true },
  { name: 'Gương vòm Muse', input: 'Gương vòm muse - 1x1 ô.svg', output: 'muse-arch-mirror.png', shear: 0, enabled: true },
  { name: 'Đèn cây hoa Tulip', input: 'Đèn cây hoa tulip - 1x1 ô.svg', output: 'tulip-floor-lamp.png', shear: 0, enabled: true },
  { name: 'Bàn đá nến thơm & nước hoa', input: 'Bàn đá nến thơm & nước hoa - 1x1 ô.svg', output: 'perfume-stone-table.png', shear: 0.10, enabled: true },
  { name: 'Sofa Champagne Lounge', input: 'Sofa champagne Lounge - 2x1 ô.svg', output: 'champagne-lounge-sofa.png', shear: 0.06, enabled: true },
  { name: 'Ma-nơ-canh Runway Spotlight', input: 'Ma-nơ-canh runway spotlight - 2x1 ô.svg', output: 'runway-spotlight-mannequin.png', shear: 0.04, enabled: true },
  { name: 'Phòng thử đồ rèm hồng', input: 'pink-curtain-fitting-room-source.png', output: 'pink-curtain-fitting-room.png', shear: 0.02, targetWidth: 300, targetHeight: 340, enabled: true },
  { name: 'Rèm sáo Blush', input: 'Rèm sáo blush 1x1 ô.png', output: 'blush-blinds.png', shear: 0, targetWidth: 150, targetHeight: 240, baseY: 400, enabled: true },
  { name: 'Tranh Botanical Blush', input: 'Tranh botanical 1x1 ô.png', output: 'botanical-blush-print.png', shear: 0, targetWidth: 150, targetHeight: 240, baseY: 400, enabled: true },
  { name: 'Tranh Kitten Heel', input: 'Tranh kitten heel 1x1 ô.png', output: 'kitten-heel-print.png', shear: 0, targetWidth: 150, targetHeight: 240, baseY: 400, enabled: true },
  { name: 'Tranh Parfum Paris', input: 'Tranh Parfum Paris 1x1 ô.png', output: 'parfum-paris-print.png', shear: 0, targetWidth: 150, targetHeight: 240, baseY: 400, enabled: true },
  { name: 'Tranh Runway Dress', input: 'Tranh runway dress 1x1 ô.png', output: 'runway-dress-print.png', shear: 0, targetWidth: 150, targetHeight: 240, baseY: 400, enabled: true },
  { name: 'Bộ tranh Fashion Muse', input: 'Bộ tranh fashion muse 2x1 ô.png', output: 'fashion-muse-prints.png', shear: 0.14, targetWidth: 270, targetHeight: 240, baseY: 400, enabled: true },
  { name: 'Tranh lớn Gallery Lovely', input: 'Tranh lớn Gallery Lovely 2x1 ô.png', output: 'gallery-lovely-print.png', shear: 0.04, targetWidth: 270, targetHeight: 240, baseY: 400, enabled: true },
  { name: 'Biển nơ Welcome', input: 'Biển nơ Welcom 3x1 ô.png', output: 'welcome-ribbon-sign.png', shear: 0.16, targetWidth: 330, targetHeight: 220, baseY: 400, enabled: true },
  { name: 'Biển đèn Fashion Club', input: 'Biển đèn fashion club 3x1 ô.png', output: 'fashion-club-lightbox.png', shear: 0.13, targetWidth: 330, targetHeight: 220, baseY: 400, enabled: true },
  { name: 'Đèn neon Fashion', input: 'Đèn neon fashion 3x1 ô.png', output: 'fashion-neon-sign.png', shear: 0.2, targetWidth: 330, targetHeight: 220, baseY: 400, enabled: true },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
const page = await browser.newPage();
const rendered = [];

for (const {
  name, input, output, shear, anchor = 'floor', enabled,
  targetWidth = 300, targetHeight = 320, baseY = 440,
} of items) {
  if (!enabled) continue;
  const artwork = await readFile(`.tmp/furniture-angle-source/${input}`);
  const mime = input.toLowerCase().endsWith('.png') ? 'image/png' : 'image/svg+xml';
  const source = `data:${mime};base64,${artwork.toString('base64')}`;
  const result = await page.evaluate(async ({ source, shear, anchor, targetWidth, targetHeight, baseY }) => {
    const image = new Image();
    image.src = source;
    await image.decode();

    const sample = document.createElement('canvas');
    const sampleScale = Math.min(1, 1152 / image.naturalWidth, 768 / image.naturalHeight);
    sample.width = Math.round(image.naturalWidth * sampleScale);
    sample.height = Math.round(image.naturalHeight * sampleScale);
    const sampleContext = sample.getContext('2d');
    sampleContext.drawImage(image, 0, 0, sample.width, sample.height);

    const findBounds = (canvas) => {
      const context = canvas.getContext('2d');
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] < 10) continue;
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
      if (maxX < minX || maxY < minY) throw new Error('Không tìm thấy phần ảnh hiển thị');
      return { minX, minY, maxX, maxY };
    };

    const sourceBounds = findBounds(sample);
    const sourceWidth = sourceBounds.maxX - sourceBounds.minX + 1;
    const sourceHeight = sourceBounds.maxY - sourceBounds.minY + 1;
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);
    const normalized = document.createElement('canvas');
    normalized.width = 360;
    normalized.height = 460;
    normalized.getContext('2d').drawImage(
      sample,
      sourceBounds.minX, sourceBounds.minY, sourceWidth, sourceHeight,
      Math.round((360 - width) / 2), baseY - height, width, height,
    );

    const staging = document.createElement('canvas');
    staging.width = 360;
    staging.height = 560;
    const stagingContext = staging.getContext('2d');
    stagingContext.setTransform(1, shear, 0, 1, 0, 60 - shear * 180);
    stagingContext.drawImage(normalized, 0, 0);
    const skewedBounds = findBounds(staging);

    const output = document.createElement('canvas');
    output.width = 360;
    output.height = 460;
    const offsetY = anchor === 'center'
      ? 230 - (skewedBounds.minY + skewedBounds.maxY) / 2
      : baseY - skewedBounds.maxY;
    output.getContext('2d').drawImage(staging, 0, offsetY);
    return output.toDataURL('image/png');
  }, { source, shear, anchor, targetWidth, targetHeight, baseY });

  await writeFile(`public/assets/furniture/${output}`, Buffer.from(result.split(',')[1], 'base64'));
  rendered.push({ name, shear, data: result });
}

await page.setViewportSize({ width: 1080, height: 1380 });
await page.setContent(`<style>
  *{box-sizing:border-box}body{margin:0;padding:24px;background:#f8eefa;font:16px Arial;color:#5c2851}
  main{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  article{height:420px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;border:2px solid #e7afd0;border-radius:18px}
  img{width:300px;height:350px;object-fit:contain}
  strong{height:42px;text-align:center}
</style><main>${rendered.map(item => `<article><img src="${item.data}"><strong>${item.name} · ${item.shear.toFixed(2)}</strong></article>`).join('')}</main>`);
await page.screenshot({ path: '.tmp/furniture-angle-preview.png', fullPage: true });
await browser.close();
console.table(rendered.map(({ name, shear }) => ({ name, shear })));
