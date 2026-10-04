import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('.tmp/dress-source/Đầm');
const outputDir = path.resolve('src/assets/products/dresses');
const outputNames = [
  '01-sunday-date.webp',
  '02-golden-hour.webp',
  '03-moonlight.webp',
  '04-mini-pink-spotlight.webp',
  '05-maxi-garden-waltz.webp',
  '06-slip-cool-blue.webp',
  '07-maxi-meadow-muse.webp',
  '08-maxi-golden-lace.webp',
  '09-midnight-column.webp',
  '10-runway-aurora.webp',
];
const garmentBottoms = [1015, 1023, 1004, 983, 1066, 1000, 1072, 982, 1080, 983];
const files = (await fs.readdir(sourceDir))
  .filter((name) => name.endsWith('.png'))
  .sort((a, b) => Number(a.match(/-(\d+)\.png$/)?.[1]) - Number(b.match(/-(\d+)\.png$/)?.[1]));

if (files.length !== 10) throw new Error(`Expected 10 dress images, found ${files.length}`);
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
    let minX = image.width;
    let minY = garmentBottom;
    let maxX = 0;
    let maxY = 0;
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
    const output = await target.convertToBlob({ type: 'image/webp', quality: 0.84 });
    const buffer = await output.arrayBuffer();
    let binary = '';
    for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }, { source: bytes.toString('base64'), garmentBottom: garmentBottoms[index] });
  const output = Buffer.from(base64, 'base64');
  await fs.writeFile(path.join(outputDir, outputNames[index]), output);
  console.log(`${index + 1}. ${files[index]} -> ${outputNames[index]} (${Math.round(output.length / 1024)} KB)`);
}

await browser.close();
