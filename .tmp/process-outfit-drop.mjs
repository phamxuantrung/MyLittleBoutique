import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const jobs = [
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_15 6 thg 10, 2026-10.png', 'bottoms', '11-golden-bloom-skirt.webp', 900],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_12 6 thg 10, 2026-9.png', 'bottoms', '12-silver-star-mini.webp', 877],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_11 6 thg 10, 2026-8.png', 'bottoms', '13-lavender-campus-pleat.webp', 869],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_10 6 thg 10, 2026-7.png', 'bottoms', '14-ruby-beat-jogger.webp', 955],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_09 6 thg 10, 2026-6.png', 'bottoms', '15-cocoa-daily-pants.webp', 963],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_07 6 thg 10, 2026-5.png', 'bottoms', '16-matcha-trail-cargo.webp', 991],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_05 6 thg 10, 2026-4.png', 'tops', '17-vanilla-line-blouse.webp', 847],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_04 6 thg 10, 2026-3.png', 'tops', '18-noir-downtown-hoodie.webp', 954],
  ['C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_03 6 thg 10, 2026-2.png', 'tops', '19-blue-pop-crop.webp', 906],
];

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (const [sourcePath, category, outputName, garmentBottom] of jobs) {
  const source = (await fs.readFile(sourcePath)).toString('base64');
  const outputBase64 = await page.evaluate(async ({ sourceBase64, garmentBottom }) => {
    const blob = await (await fetch(`data:image/png;base64,${sourceBase64}`)).blob();
    const image = await createImageBitmap(blob);
    const sourceCanvas = new OffscreenCanvas(image.width, image.height);
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;
    let minX = image.width;
    let minY = garmentBottom;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y <= garmentBottom; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        if (pixels[(y * image.width + x) * 4 + 3] <= 8) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const target = new OffscreenCanvas(512, 512);
    const context = target.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const scale = Math.min(480 / width, 480 / height);
    const drawWidth = Math.round(width * scale);
    const drawHeight = Math.round(height * scale);
    context.drawImage(image, minX, minY, width, height, Math.round((512 - drawWidth) / 2), Math.round((512 - drawHeight) / 2), drawWidth, drawHeight);
    const output = await target.convertToBlob({ type: 'image/webp', quality: .82 });
    const buffer = await output.arrayBuffer();
    let binary = '';
    for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }, { sourceBase64: source, garmentBottom });
  const outputDirectory = path.resolve('src/assets/products', category);
  await fs.mkdir(outputDirectory, { recursive: true });
  const output = Buffer.from(outputBase64, 'base64');
  await fs.writeFile(path.join(outputDirectory, outputName), output);
  console.log(`${outputName}: ${Math.round(output.length / 1024)} KB`);
}
await browser.close();
