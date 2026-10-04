import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const sourceDir = path.resolve('.tmp/nhanvatcuoi-import/nhanvatcuoi');
const outputDir = path.resolve('public/assets/characters/customers');
const matches = [
  ['lily', 'Nhân vật với nụ cười rạng rỡ-5.png'],
  ['emma', 'Nhân vật cười vui rạng rỡ-8.png'],
  ['sophie', 'Cô gái cười rạng rỡ-6.png'],
  ['mia', 'Nhân vật cười vui rạng rỡ-4.png'],
  ['zoe', 'Nhân vật vui vẻ với nụ cười-7.png'],
  ['ruby', 'Nhân vật với nụ cười vui tươi-9.png'],
  ['kai', 'Cô gái cười rạng rỡ-3.png'],
  ['linh', 'Nụ cười rạng rỡ-10.png'],
  ['an', 'Nụ cười rạng rỡ của nhân vật-1.png'],
  ['bao', 'Nụ cười rạng rỡ của cô gái-2.png'],
  ['chloe', 'Nhân vật cười vui toàn thân-1.png'],
  ['nari', 'Nhân vật cười vui rạng rỡ-2.png'],
  ['jade', 'Nhân vật cười rạng rỡ-3.png'],
  ['nhi', 'Nhân vật cười vui rạng rỡ-4 (1).png'],
  ['vy', 'Nhân vật cười vui tươi-5.png'],
  ['rina', 'Nhân vật toàn thân cười rạng rỡ-8.png'],
  ['may', 'Nụ cười vui rạng rỡ-6.png'],
  ['thu', 'Nhân vật cười rạng rỡ-7.png'],
  ['zoe-offroute', 'Nhân vật cười rạng rỡ-9.png'],
  ['elle', 'Nhân vật cười vui rạng rỡ-10.png'],
];

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (let index = 0; index < matches.length; index += 1) {
  const [id, filename] = matches[index];
  const source = await fs.readFile(path.join(sourceDir, filename));
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
  const outputName = `${String(index + 1).padStart(2, '0')}-${id}-happy.webp`;
  await fs.writeFile(path.join(outputDir, outputName), Buffer.from(encoded, 'base64'));
  console.log(`${outputName} <- ${filename}`);
}
await browser.close();
