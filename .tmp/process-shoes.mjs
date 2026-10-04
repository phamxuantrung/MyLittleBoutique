import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.tmp/shoe-source');
const [folder] = await fs.readdir(root);
const sourceDir = path.join(root, folder);
const outputDir = path.resolve('src/assets/products/shoes');
const outputNames = [
  '01-oat-sneakers.webp', '02-editor-loafers.webp', '03-candy-runner.webp', '04-ribbon-rehearsal.webp',
  '05-after-school.webp', '06-retro-cloud.webp', '07-ballet-pirouette.webp', '08-low-profile.webp',
  '09-platform-crush.webp', '10-loafer-mule.webp', '11-kitten-heel.webp', '12-slingback-muse.webp',
  '13-daisy-ribbon-sandal.webp', '14-fisherman-diary.webp', '15-midnight-rebel-boots.webp',
  '16-library-walk-boots.webp', '17-desert-bloom-boots.webp', '18-trail-day.webp',
  '19-mesh-whisper.webp', '20-cherry-gloss.webp',
];
const garmentBottoms = [1004, 953, 1015, 1028, 1018, 1010, 1019, 993, 1015, 968, 976, 924, 982, 1015, 1005, 1000, 979, 1017, 1017, 994];
const sequence = (name) => (name.includes('23_41_') ? 0 : 100) + Number(name.match(/-(\d+)\.png$/)?.[1]);
const files = (await fs.readdir(sourceDir)).filter((name) => name.endsWith('.png')).sort((a, b) => sequence(a) - sequence(b));
if (files.length !== 20) throw new Error(`Expected 20 shoe images, found ${files.length}`);

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
