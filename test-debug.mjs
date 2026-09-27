import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));
  
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('#game-canvas[data-ready="true"]');
  console.log('Money before:', await page.getByTestId('money').textContent());
  
  await page.locator('.desktop-nav [data-id="stock"]').click();
  console.log('Navigated to stock. Panel hidden?', await page.locator('#content-panel').getAttribute('hidden'));
  
  const ribbonBtn = page.locator('[data-action="buy"][data-id="ribbon"]');
  console.log('Ribbon count:', await ribbonBtn.count());
  console.log('Ribbon visible:', await ribbonBtn.isVisible());
  console.log('Ribbon bounding box:', await ribbonBtn.boundingBox());
  
  // Try clicking
  console.log('Clicking ribbon buy button...');
  await ribbonBtn.click();
  
  console.log('Money after click:', await page.getByTestId('money').textContent());
  
  await browser.close();
}

debug().catch(console.error);
