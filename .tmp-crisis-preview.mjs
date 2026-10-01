import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1491, height: 768 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
if (await page.locator('[data-action="confirm-shop-name"]').isVisible().catch(() => false)) {
  await page.locator('[data-action="confirm-shop-name"]').click();
  await page.waitForSelector('#day-card');
}
await page.evaluate(() => {
  document.querySelector('dialog')?.close();
  const trigger = document.createElement('button');
  trigger.dataset.action = 'debug-action';
  trigger.dataset.id = 'advanced-features';
  document.body.append(trigger);
  trigger.click();
  trigger.remove();
});
await page.waitForSelector('#crisis-alert-button:not([hidden])');
await page.evaluate(() => document.querySelector('dialog')?.close());
await page.waitForTimeout(1800);
await mkdir('artifacts', { recursive: true });
const cluster = page.locator('.top-left-cluster');
await page.screenshot({ path: 'artifacts/crisis-alert-full.png' });
await cluster.screenshot({ path: 'artifacts/crisis-alert-preview.png' });
await page.locator('#crisis-alert-button').click();
await page.locator('.crisis-detail-modal').screenshot({ path: 'artifacts/crisis-detail-modal.png' });
await browser.close();
