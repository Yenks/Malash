import { chromium } from 'playwright';
import { createServer } from 'vite';

const port = 5187;
const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(`http://127.0.0.1:${port}/?theme=${theme}`);
    await page.waitForSelector('#egg-button');
    for (const fraction of [.25, .5, .9]) {
      await page.evaluate(f => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction);
      await page.waitForTimeout(100);
      for (const method of ['button', 'escape', 'backdrop']) {
        const before = await page.evaluate(() => scrollY);
        if (!await page.locator('#egg-button').evaluate(el => el.classList.contains('cracked'))) {
          await page.locator('#egg-button').click();
          await page.waitForFunction(() => document.querySelector('#egg-button')?.classList.contains('cracked'), { timeout: 10000 });
        }
        await page.locator('#egg-button').click();
        await page.waitForSelector('.malash-modal.is-visible');
        if (method === 'button') await page.locator('.modal-close').click();
        if (method === 'escape') await page.keyboard.press('Escape');
        if (method === 'backdrop') await page.locator('.modal-backdrop').click({ position: { x: 3, y: 3 } });
        await page.waitForFunction(() => !document.querySelector('.malash-modal')?.classList.contains('is-visible'));
        await page.waitForTimeout(30);
        const after = await page.evaluate(() => scrollY);
        if (Math.abs(after - before) > 2) throw new Error(`${theme} ${fraction} ${method}: scroll changed ${before} -> ${after}`);
      }
    }
    await page.close();
  }
  console.log('Vertical modal scroll preservation passed: both themes, 25/50/90%, all three dismissal methods.');
} finally {
  await browser?.close();
  await server.close();
}
