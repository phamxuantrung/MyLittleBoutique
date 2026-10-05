import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const files = [
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_15 6 thg 10, 2026-10.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_12 6 thg 10, 2026-9.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_11 6 thg 10, 2026-8.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_10 6 thg 10, 2026-7.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_09 6 thg 10, 2026-6.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_07 6 thg 10, 2026-5.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_05 6 thg 10, 2026-4.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_04 6 thg 10, 2026-3.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 01_14_03 6 thg 10, 2026-2.png',
];

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (const file of files) {
  const source = (await fs.readFile(file)).toString('base64');
  const result = await page.evaluate(async sourceBase64 => {
    const blob = await (await fetch(`data:image/png;base64,${sourceBase64}`)).blob();
    const image = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const occupiedRows = [];
    for (let y = 0; y < image.height; y += 1) {
      let count = 0;
      for (let x = 0; x < image.width; x += 1) if (pixels[(y * image.width + x) * 4 + 3] > 8) count += 1;
      if (count > 3) occupiedRows.push(y);
    }
    const ranges = [];
    for (const y of occupiedRows) {
      const last = ranges.at(-1);
      if (!last || y > last[1] + 1) ranges.push([y, y]);
      else last[1] = y;
    }
    return { width: image.width, height: image.height, ranges };
  }, source);
  console.log(file.split('/').at(-1), JSON.stringify(result));
}
await browser.close();
