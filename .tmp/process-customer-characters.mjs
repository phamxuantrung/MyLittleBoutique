import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('.tmp/nhanvat-import/nhanvat');
const outputDir = path.resolve('public/assets/characters/customers');
const ids = ['lily', 'emma', 'sophie', 'mia', 'zoe', 'ruby', 'kai', 'linh', 'an', 'bao', 'chloe', 'nari', 'jade', 'nhi', 'vy', 'rina', 'may', 'thu', 'zoe-offroute', 'elle'];
const files = (await fs.readdir(sourceDir)).filter(file => file.toLowerCase().endsWith('.png')).sort((a, b) => a.localeCompare(b, 'vi'));
if (files.length !== ids.length) throw new Error(`Expected ${ids.length} PNG files, found ${files.length}`);
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (let index = 0; index < files.length; index += 1) {
  const source = await fs.readFile(path.join(sourceDir, files[index]));
  const encoded = await page.evaluate(async base64 => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const image = await createImageBitmap(blob);
    const sourceCanvas = new OffscreenCanvas(image.width, image.height);
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;
    let minX = image.width, minY = image.height, maxX = -1, maxY = -1;
    for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
      if (pixels[(y * image.width + x) * 4 + 3] <= 12) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    if (maxX < minX || maxY < minY) throw new Error('No visible character pixels');
    const width = maxX - minX + 1, height = maxY - minY + 1;
    const target = new OffscreenCanvas(180, 220);
    const context = target.getContext('2d');
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    const scale = Math.min(168 / width, 208 / height);
    const drawWidth = Math.round(width * scale), drawHeight = Math.round(height * scale);
    const drawX = Math.round((180 - drawWidth) / 2), drawY = 220 - drawHeight - 5;
    context.drawImage(image, minX, minY, width, height, drawX, drawY, drawWidth, drawHeight);
    const result = new Uint8Array(await (await target.convertToBlob({ type: 'image/webp', quality: .9 })).arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < result.length; offset += 0x8000) binary += String.fromCharCode(...result.subarray(offset, offset + 0x8000));
    return btoa(binary);
  }, source.toString('base64'));
  const name = `${String(index + 1).padStart(2, '0')}-${ids[index]}.webp`;
  await fs.writeFile(path.join(outputDir, name), Buffer.from(encoded, 'base64'));
  console.log(`${name} <- ${files[index]}`);
}
await browser.close();
