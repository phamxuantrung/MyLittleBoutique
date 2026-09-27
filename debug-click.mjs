import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://127.0.0.1:5173/');
  await page.waitForSelector('#game-canvas[data-ready="true"]');
  
  await page.locator('.desktop-nav [data-id="stock"]').click();
  await page.waitForTimeout(500);

  const ribbon = page.locator('[data-action="buy"][data-id="ribbon"]');
  console.log('Ribbon count:', await ribbon.count());
  console.log('Ribbon isVisible:', await ribbon.isVisible());

  // Scroll into view
  await ribbon.scrollIntoViewIfNeeded();
  const box = await ribbon.boundingBox();
  console.log('Ribbon box:', box);

  if (box) {
    const elAtPoint = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return {
        tag: el?.tagName,
        class: el?.className,
        id: el?.id,
        action: el?.dataset?.action,
        outer: el?.outerHTML?.slice(0, 100)
      };
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    console.log('Element at point:', elAtPoint);
  }

  console.log('Attempting ribbon.click()...');
  try {
    await ribbon.click({ timeout: 3000 });
    console.log('Click succeeded!');
  } catch (e) {
    console.log('Click failed with error:', e.message);
  }

  console.log('Money value:', await page.getByTestId('money').textContent());
  await browser.close();
}

run().catch(console.error);
