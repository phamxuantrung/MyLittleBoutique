import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.tmp/outerwear-source');
const [folder] = await fs.readdir(root);
const sourceDir = path.join(root, folder);
const outputDir = path.resolve('src/assets/products/outerwear');
const outputNames = ['01-blazer-atelier.webp', '02-strawberry-cream.webp', '03-vanilla-office.webp', '04-strawberry-cloud.webp', '05-rebel-heart.webp', '06-autumn-letters.webp', '07-eclipse-atelier.webp'];
const garmentBottoms = [991, 1017, 973, 1028, 1016, 1117, 1100];
const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith('.png')).sort((a, b) => Number(a.match(/-(\d+)\.png$/)?.[1]) - Number(b.match(/-(\d+)\.png$/)?.[1]));
if (files.length !== 7) throw new Error(`Expected 7 outerwear images, found ${files.length}`);
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (let index = 0; index < files.length; index += 1) {
  const bytes = await fs.readFile(path.join(sourceDir, files[index]));
  const base64 = await page.evaluate(async ({ source, garmentBottom }) => {
    const blob = await (await fetch(`data:image/png;base64,${source}`)).blob();
    const image = await createImageBitmap(blob);
    const sourceCanvas = new OffscreenCanvas(image.width, image.height);
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true }); sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;
    let minX = image.width, minY = garmentBottom, maxX = 0, maxY = 0;
    for (let y = 0; y <= garmentBottom; y += 1) for (let x = 0; x < image.width; x += 1) {
      if (pixels[(y * image.width + x) * 4 + 3] <= 8) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const width = maxX - minX + 1, height = maxY - minY + 1;
    const target = new OffscreenCanvas(512, 512), context = target.getContext('2d');
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    const scale = Math.min(480 / width, 480 / height), drawWidth = Math.round(width * scale), drawHeight = Math.round(height * scale);
    context.drawImage(image, minX, minY, width, height, Math.round((512 - drawWidth) / 2), Math.round((512 - drawHeight) / 2), drawWidth, drawHeight);
    const output = await target.convertToBlob({ type: 'image/webp', quality: 0.84 });
    const buffer = await output.arrayBuffer(); let binary = '';
    for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }, { source: bytes.toString('base64'), garmentBottom: garmentBottoms[index] });
  const output = Buffer.from(base64, 'base64'); await fs.writeFile(path.join(outputDir, outputNames[index]), output);
  console.log(`${index + 1}. ${outputNames[index]} (${Math.round(output.length / 1024)} KB)`);
}
await browser.close();
