import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const files = [
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_37 4 thg 10, 2026-1.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_38 4 thg 10, 2026-2.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_40 4 thg 10, 2026-3.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_41 4 thg 10, 2026-4.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_42 4 thg 10, 2026-5.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_43 4 thg 10, 2026-6.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_44 4 thg 10, 2026-7.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_45 4 thg 10, 2026-8.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_46 4 thg 10, 2026-9.png',
  'C:/Users/ADMIN/Downloads/Ảnh ChatGPT 00_49_47 4 thg 10, 2026-10.png',
];
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
for (const file of files) {
  const bytes = await fs.readFile(file);
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
  console.log(file.split('/').at(-1), JSON.stringify(result));
}
await browser.close();
