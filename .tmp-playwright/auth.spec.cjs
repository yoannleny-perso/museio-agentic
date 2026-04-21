const { test } = require('@playwright/test');

test('auth route', async ({ page }) => {
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err.stack || err.message));
  page.on('requestfailed', req => console.log('[requestfailed]', req.url(), req.failure()?.errorText));
  await page.goto('http://127.0.0.1:4173/auth', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('url', page.url());
  console.log('body text', JSON.stringify(await page.locator('body').innerText()));
});
