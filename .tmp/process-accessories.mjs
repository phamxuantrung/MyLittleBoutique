import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('.tmp/accessory-source/Phụ kiện');
const outputDir = path.resolve('src/assets/products/accessories');
const outputNames = [
  '01-ballet-bow.webp', '02-tiny-pearls.webp', '03-oval-sunnies.webp', '04-club-cap.webp',
  '05-cloud-leg-warmers.webp', '06-daisy-clips.webp', '07-pearl-headband.webp', '08-satin-bow.webp',
  '09-heart-choker.webp', '10-pearl-drop-earrings.webp', '11-lucky-charms.webp', '12-heart-glasses.webp',
  '13-wire-glasses.webp', '14-ribbon-beret.webp', '15-star-bucket-hat.webp',
  '16-maison-pearl-choker.webp', '17-global-halo-glasses.webp',
];
const garmentBottoms = [977, 901, 787, 839, 927, 876, 860, 1001, 888, 942, 935, 841, 771, 1007, 931, 956, 854];
const sequence = (name) => (name.includes('23_13_') ? 0 : 100) + Number(name.match(/-(\d+)\.png$/)?.[1]);
const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith('.png')).sort((a, b) => sequence(a) - sequence(b));
if (files.length !== 17) throw new Error(`Expected 17 accessory images, found ${files.length}`);

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (let index = 0; index < files.length; index += 1) {
  const bytes = await fs.readFile(path.join(sourceDir, files[index]));
  const base64 = await page.evaluate(async ({ source, garmentBottom }) => {
    const blob = await (await fetch(`data:image/png;base64,${source}`)).blob();
    const image = await createImageBitmap(blob);
    const sourceCanvas = new OffscreenCanvas(image.width, image.height);
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;
    let minX = image.width, minY = garmentBottom, maxX = 0, maxY = 0;
    for (let y = 0; y <= garmentBottom; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        if (pixels[(y * image.width + x) * 4 + 3] <= 8) continue;
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const target = new OffscreenCanvas(512, 512);
    const context = target.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const scale = Math.min(480 / width, 480 / height);
    const drawWidth = Math.round(width * scale), drawHeight = Math.round(height * scale);
    context.drawImage(image, minX, minY, width, height, Math.round((512 - drawWidth) / 2), Math.round((512 - drawHeight) / 2), drawWidth, drawHeight);
    const output = await target.convertToBlob({ type: 'image/webp', quality: 0.84 });
    const buffer = await output.arrayBuffer();
    let binary = '';
    for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }, { source: bytes.toString('base64'), garmentBottom: garmentBottoms[index] });
  const output = Buffer.from(base64, 'base64');
  await fs.writeFile(path.join(outputDir, outputNames[index]), output);
  console.log(`${index + 1}. ${outputNames[index]} (${Math.round(output.length / 1024)} KB)`);
}
await browser.close();
