import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve('public/assets/characters/customers');
const normalFiles = (await fs.readdir(directory)).filter(file => /^\d{2}-.+\.webp$/.test(file) && !file.includes('-happy.')).sort();
const pairs = await Promise.all(normalFiles.map(async normal => ({
  normal,
  normalData: (await fs.readFile(path.join(directory, normal))).toString('base64'),
  happyData: (await fs.readFile(path.join(directory, normal.replace('.webp', '-happy.webp')))).toString('base64'),
})));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
const output = await page.evaluate(async pairs => {
  const sheet = new OffscreenCanvas(1000, 920);
  const context = sheet.getContext('2d');
  context.fillStyle = '#f7eef7'; context.fillRect(0, 0, sheet.width, sheet.height);
  context.imageSmoothingEnabled = false;
  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const images = [];
    for (const data of [pair.normalData, pair.happyData]) {
      const blob = await (await fetch(`data:image/webp;base64,${data}`)).blob();
      images.push(await createImageBitmap(blob));
    }
    const cellX = (index % 5) * 200, cellY = Math.floor(index / 5) * 230;
    context.drawImage(images[0], cellX + 10, cellY + 8, 81, 99);
    context.drawImage(images[1], cellX + 109, cellY + 8, 81, 99);
    context.fillStyle = '#43213f'; context.font = '12px sans-serif'; context.textAlign = 'center';
    context.fillText(pair.normal.replace('.webp', ''), cellX + 100, cellY + 126);
  }
  const bytes = new Uint8Array(await (await sheet.convertToBlob({ type: 'image/png' })).arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}, pairs);
await browser.close();
await fs.writeFile(path.resolve('.tmp/customer-state-pairs.png'), Buffer.from(output, 'base64'));
