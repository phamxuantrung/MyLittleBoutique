import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('.tmp/nhanvatcuoi-import/nhanvatcuoi');
const files = (await fs.readdir(sourceDir)).filter(file => file.toLowerCase().endsWith('.png')).sort((a, b) => a.localeCompare(b, 'vi'));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
const inputs = await Promise.all(files.map(async file => ({ file, base64: (await fs.readFile(path.join(sourceDir, file))).toString('base64') })));
const result = await page.evaluate(async inputs => {
  const images = [];
  for (const input of inputs) {
    const blob = await (await fetch(`data:image/png;base64,${input.base64}`)).blob();
    const image = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let transparent = 0, partial = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) transparent += 1;
      else if (pixels[index] < 255) partial += 1;
    }
    images.push({ ...input, image, width: image.width, height: image.height, transparent, partial });
  }
  const cellWidth = 240, cellHeight = 270, sheet = new OffscreenCanvas(cellWidth * 5, cellHeight * 4);
  const context = sheet.getContext('2d');
  context.fillStyle = '#f6eef7'; context.fillRect(0, 0, sheet.width, sheet.height);
  context.imageSmoothingEnabled = false;
  images.forEach((entry, index) => {
    const x = (index % 5) * cellWidth, y = Math.floor(index / 5) * cellHeight;
    const scale = Math.min(220 / entry.width, 225 / entry.height);
    const width = Math.round(entry.width * scale), height = Math.round(entry.height * scale);
    context.drawImage(entry.image, x + Math.round((cellWidth - width) / 2), y + 6, width, height);
    context.fillStyle = '#43213f'; context.font = '13px sans-serif'; context.textAlign = 'center';
    context.fillText(`${index + 1}. ${entry.width}Ã—${entry.height}`, x + cellWidth / 2, y + 247);
  });
  const preview = new Uint8Array(await (await sheet.convertToBlob({ type: 'image/png' })).arrayBuffer());
  let binary = '';
  for (let index = 0; index < preview.length; index += 0x8000) binary += String.fromCharCode(...preview.subarray(index, index + 0x8000));
  return { metadata: images.map(({ file, width, height, transparent, partial }) => ({ file, width, height, transparent, partial })), preview: btoa(binary) };
}, inputs);
await browser.close();
await fs.writeFile(path.resolve('.tmp/happy-characters-contact-sheet.png'), Buffer.from(result.preview, 'base64'));
console.log(JSON.stringify(result.metadata, null, 2));
