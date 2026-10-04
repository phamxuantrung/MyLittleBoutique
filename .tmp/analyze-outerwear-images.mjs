import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.tmp/outerwear-source');
const [folder] = await fs.readdir(root);
const sourceDir = path.join(root, folder);
const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith('.png')).sort((a, b) => Number(a.match(/-(\d+)\.png$/)?.[1]) - Number(b.match(/-(\d+)\.png$/)?.[1]));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (const name of files) {
  const bytes = await fs.readFile(path.join(sourceDir, name));
  const result = await page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const image = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const occupied = [];
    for (let y = 0; y < image.height; y += 1) {
      let count = 0;
      for (let x = 0; x < image.width; x += 1) if (pixels[(y * image.width + x) * 4 + 3] > 8) count += 1;
      if (count > 3) occupied.push(y);
    }
    const ranges = [];
    for (const y of occupied) { const last = ranges.at(-1); if (!last || y > last[1] + 1) ranges.push([y, y]); else last[1] = y; }
    return { width: image.width, height: image.height, ranges };
  }, bytes.toString('base64'));
  console.log(name, JSON.stringify(result));
}
await browser.close();
