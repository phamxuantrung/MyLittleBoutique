import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const sources = [
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_20_12 4 thg 10, 2026-1.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_20_14 4 thg 10, 2026-2.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_20_15 4 thg 10, 2026-3.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_20_16 4 thg 10, 2026-4.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_20_17 4 thg 10, 2026-5.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_20_19 4 thg 10, 2026-6.png',
];
const outputNames = [
  '11-ribbon-beat-crop.webp',
  '12-pearl-kiss-camisole.webp',
  '13-rose-whisper-offshoulder.webp',
  '14-lavender-haze-offshoulder.webp',
  '15-city-girls-jersey.webp',
  '16-maison-rose-corset.webp',
];
const garmentBottoms = [851, 940, 900, 920, 923, 982];
const outputDir = path.resolve('src/assets/products/tops');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (let index = 0; index < sources.length; index += 1) {
  const bytes = await fs.readFile(sources[index]);
  const base64 = await page.evaluate(async ({ source, garmentBottom }) => {
    const blob = await (await fetch(`data:image/png;base64,${source}`)).blob();
    const image = await createImageBitmap(blob);
    const sourceCanvas = new OffscreenCanvas(image.width, image.height);
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;
    let minX = image.width, minY = garmentBottom, maxX = 0, maxY = 0;
    for (let y = 0; y <= garmentBottom; y += 1) for (let x = 0; x < image.width; x += 1) {
      if (pixels[(y * image.width + x) * 4 + 3] <= 8) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const width = maxX - minX + 1, height = maxY - minY + 1;
    const target = new OffscreenCanvas(512, 512), context = target.getContext('2d');
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    const scale = Math.min(480 / width, 480 / height);
    const drawWidth = Math.round(width * scale), drawHeight = Math.round(height * scale);
    context.drawImage(image, minX, minY, width, height, Math.round((512 - drawWidth) / 2), Math.round((512 - drawHeight) / 2), drawWidth, drawHeight);
    const output = await target.convertToBlob({ type: 'image/webp', quality: 0.84 });
    const buffer = await output.arrayBuffer(); let binary = '';
    for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }, { source: bytes.toString('base64'), garmentBottom: garmentBottoms[index] });
  const output = Buffer.from(base64, 'base64');
  await fs.writeFile(path.join(outputDir, outputNames[index]), output);
  console.log(`${outputNames[index]} (${Math.round(output.length / 1024)} KB)`);
}
await browser.close();
