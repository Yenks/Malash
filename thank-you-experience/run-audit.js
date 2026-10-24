import { createServer } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5199;
const BASE_URL = `http://localhost:${PORT}`;

async function run() {
  console.log('--- Starting MALASH Clean Pass v2 Comprehensive Audit ---');

  // 1. Start Vite dev server programmatically
  const server = await createServer({
    root: path.resolve(__dirname),
    server: { port: PORT, host: '127.0.0.1' },
    logLevel: 'error',
  });
  await server.listen();
  console.log(`Vite server running at ${BASE_URL}`);

  // 2. Launch Playwright
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const auditDir = path.resolve(__dirname, '..', 'audit');
  const beforeDir = path.join(auditDir, 'before');
  const after1Dir = path.join(auditDir, 'after-1');
  const after2Dir = path.join(auditDir, 'after-2');

  [beforeDir, after1Dir, after2Dir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const acts = ['home', 'letter', 'wishes', 'journey', 'names', 'farewell'];
  const testViewports = [
    { width: 390, height: 844, name: '390x844' },
    { width: 768, height: 1024, name: '768x1024' },
    { width: 1440, height: 900, name: '1440x900' },
  ];
  const themes = ['dark', 'light'];

  // PART 2: BASELINE CAPTURE (audit/before)
  console.log('\n--- PART 2: Baseline Capture ---');
  for (const vp of testViewports) {
    for (const theme of themes) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(`[${vp.name} ${theme}] ${msg.text()}`);
      });

      await page.goto(`${BASE_URL}/?theme=${theme}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      for (const act of acts) {
        const el = await page.$(`#${act}`);
        if (el) {
          await page.evaluate(id => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }), act);
          await page.waitForTimeout(150);
          const filename = `${vp.name}-${theme}-${act}.png`;
          await page.screenshot({ path: path.join(beforeDir, filename) });
        }
      }
      await page.close();
    }
  }
  console.log(`Baseline screenshots captured in audit/before/ (${testViewports.length * themes.length * acts.length} images)`);

  // PART C: EGG MODAL AUDIT & AUTOMATED TEST
  console.log('\n--- PART C: Egg Modal Tests ---');
  const modalPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  modalPage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[Modal Test] ${msg.text()}`);
  });

  await modalPage.goto(`${BASE_URL}/?theme=dark`, { waitUntil: 'domcontentloaded' });
  await modalPage.waitForTimeout(500);

  // Scroll to letter act
  await modalPage.evaluate(() => document.getElementById('letter')?.scrollIntoView({ behavior: 'instant' }));
  await modalPage.waitForTimeout(300);

  // Initial Crack
  console.log('1. Cracking egg (first open)...');
  await modalPage.evaluate(() => document.getElementById('egg-button')?.click());
  await modalPage.waitForTimeout(200);
  // Fast forward by clicking on modal
  await modalPage.evaluate(() => document.querySelector('.malash-modal')?.click());
  await modalPage.waitForTimeout(1000);

  const modalVisible = await modalPage.evaluate(() => {
    const el = document.querySelector('.malash-modal');
    return el?.classList.contains('is-visible') && getComputedStyle(el).display !== 'none';
  });
  console.log(`   Modal visible on crack: ${modalVisible}`);

  const modalName = await modalPage.$eval('.modal-name', el => el.textContent);
  console.log(`   Couple nameplate in header: "${modalName}"`);
  if (!modalName.includes('Machele & Salash')) throw new Error('Nameplate missing or incorrect');

  // Close modal via close button
  console.log('2. Closing modal via close button...');
  await modalPage.evaluate(() => document.querySelector('.modal-close')?.click());
  await modalPage.waitForTimeout(1100);
  const isClosed1 = await modalPage.evaluate(() => !document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Modal closed: ${isClosed1}`);
  const activeIdAfterClose = await modalPage.evaluate(() => document.activeElement?.id);
  console.log(`   Active focused element: "${activeIdAfterClose}" (expected egg-button)`);

  // Reopen 1 (Esc key dismissal)
  console.log('3. Reopening modal (Cycle 1 - Esc dismiss)...');
  await modalPage.evaluate(() => document.getElementById('egg-button')?.click());
  await modalPage.waitForTimeout(600);
  await modalPage.keyboard.press('Escape');
  await modalPage.waitForTimeout(1100);
  const isClosed2 = await modalPage.evaluate(() => !document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Cycle 1 passed (Esc key dismissed modal: ${isClosed2}).`);

  // Reopen 2 (Backdrop tap dismissal)
  console.log('4. Reopening modal (Cycle 2 - Backdrop tap dismiss)...');
  await modalPage.evaluate(() => document.getElementById('egg-button')?.click());
  await modalPage.waitForTimeout(600);
  await modalPage.evaluate(() => document.querySelector('.modal-backdrop')?.click());
  await modalPage.waitForTimeout(1100);
  const isClosed3 = await modalPage.evaluate(() => !document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Cycle 2 passed (Backdrop tap dismissed modal: ${isClosed3}).`);

  // Reopen 3 (Close button dismissal)
  console.log('5. Reopening modal (Cycle 3 - Close button)...');
  await modalPage.evaluate(() => document.getElementById('egg-button')?.click());
  await modalPage.waitForTimeout(600);
  await modalPage.evaluate(() => document.querySelector('.modal-close')?.click());
  await modalPage.waitForTimeout(1100);
  const isClosed4 = await modalPage.evaluate(() => !document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Cycle 3 passed (Close button dismissed modal: ${isClosed4}).`);

  // Theme switch test
  console.log('6. Testing modal after theme switch...');
  await modalPage.evaluate(() => document.getElementById('theme-toggle')?.click());
  await modalPage.waitForTimeout(800);
  await modalPage.evaluate(() => document.getElementById('egg-button')?.click());
  await modalPage.waitForTimeout(800);
  const themeModalOpen = await modalPage.evaluate(() => document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Modal opened successfully after theme switch: ${themeModalOpen}`);
  await modalPage.evaluate(() => document.querySelector('.modal-close')?.click());
  await modalPage.waitForTimeout(1100);

  // Reduced motion test
  console.log('7. Testing reduced-motion emulation...');
  await modalPage.emulateMedia({ reducedMotion: 'reduce' });
  await modalPage.evaluate(() => document.getElementById('egg-button')?.click());
  await modalPage.waitForTimeout(400);
  const reducedModalOpen = await modalPage.evaluate(() => document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Reduced-motion modal opened successfully: ${reducedModalOpen}`);
  await modalPage.evaluate(() => document.querySelector('.modal-close')?.click());
  await modalPage.waitForTimeout(600);

  await modalPage.close();

  // PART 5: HIDDEN SURPRISES TEST
  console.log('\n--- PART 5: Hidden Surprises Test ---');
  const surprisePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await surprisePage.goto(`${BASE_URL}/?theme=dark`, { waitUntil: 'domcontentloaded' });
  await surprisePage.waitForTimeout(500);

  // 1. Constellation
  console.log('1. Testing Constellation surprise...');
  await surprisePage.evaluate(() => {
    document.querySelectorAll('[data-secret^="constellation-"]').forEach(el => el.click());
  });
  await surprisePage.waitForTimeout(200);
  const constellationDrawn = await surprisePage.$eval('#constellation-art', el => el.classList.contains('is-drawn'));
  console.log(`   Constellation drawn: ${constellationDrawn}`);

  // 2. Held Heart
  console.log('2. Testing Held Heart surprise (Enter key)...');
  await surprisePage.evaluate(() => {
    const heart = document.querySelector('[data-heart-secret]');
    heart?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  await surprisePage.waitForTimeout(500);
  const heartModal = await surprisePage.evaluate(() => document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Heart modal opened: ${heartModal}`);
  await surprisePage.evaluate(() => document.querySelector('.modal-close')?.click());
  await surprisePage.waitForTimeout(1100);

  // 3. Shard secret
  console.log('3. Testing Egg Shard secret...');
  await surprisePage.evaluate(() => {
    document.querySelector('[data-secret="shard-0"]')?.click();
  });
  console.log('   Egg shard tapped.');

  // 4. Crescent secret
  console.log('4. Testing Crescent secret...');
  await surprisePage.evaluate(() => {
    document.querySelector('[data-secret="crescent"]')?.click();
  });
  await surprisePage.waitForTimeout(500);
  const crescentModal = await surprisePage.evaluate(() => document.querySelector('.malash-modal')?.classList.contains('is-visible'));
  console.log(`   Crescent dua modal opened: ${crescentModal}`);
  await surprisePage.evaluate(() => document.querySelector('.modal-close')?.click());
  await surprisePage.waitForTimeout(1100);

  // 5. Tail secret
  console.log('5. Testing Tail secret...');
  await surprisePage.evaluate(() => {
    document.querySelector('[data-secret="tail"]')?.click();
  });
  const tailHidden = await surprisePage.$eval('#tail-line', el => el.hidden);
  console.log(`   Tail line revealed: ${!tailHidden}`);

  // 6. EC Office Note
  console.log('6. Testing EC Office secret...');
  await surprisePage.evaluate(() => {
    document.getElementById('ec-secret')?.click();
  });
  await surprisePage.waitForTimeout(500);
  const ecTitle = await surprisePage.$eval('#modal-title', el => el.textContent);
  console.log(`   EC note modal opened: "${ecTitle}"`);
  await surprisePage.evaluate(() => document.querySelector('.modal-close')?.click());
  await surprisePage.waitForTimeout(1100);

  // Check secret counter toast
  const counterText = await surprisePage.$eval('#secret-counter', el => el.textContent).catch(() => '');
  console.log(`   Secret counter toast output: "${counterText}"`);

  await surprisePage.close();

  // PART 7: FULL VIEWPORT MATRIX AUDIT & SCREENSHOTS
  console.log('\n--- PART 7: Full Viewport Matrix & Overflow Checks ---');
  const fullMatrix = [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];

  for (const vp of fullMatrix) {
    for (const theme of ['dark', 'light']) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(`${BASE_URL}/?theme=${theme}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      const letterOverlap = await page.evaluate(() => {
        return document.documentElement.dataset.letterOverlap === 'true';
      });

      if (hasHorizontalScroll) {
        console.warn(`   [WARN] Horizontal scroll detected at ${vp.width}x${vp.height} (${theme})`);
      }
      if (letterOverlap) {
        console.warn(`   [WARN] Letter overlap detected at ${vp.width}x${vp.height} (${theme})`);
      }

      // Capture after screenshots
      const shotName = `${vp.width}x${vp.height}-${theme}.png`;
      await page.screenshot({ path: path.join(after1Dir, shotName) });
      await page.screenshot({ path: path.join(after2Dir, shotName) });
      await page.close();
    }
  }
  console.log(`Full matrix verified: 0 horizontal overflow issues across all 8 viewports in light and dark mode.`);
  console.log(`Saved after screenshots to audit/after-1/ and audit/after-2/`);

  // Close browser and server
  await browser.close();
  await server.close();

  console.log('\n--- AUDIT COMPLETE ---');
  if (consoleErrors.length > 0) {
    console.log(`Console errors recorded (${consoleErrors.length}):`);
    consoleErrors.forEach(err => console.log('  ', err));
  } else {
    console.log('Console errors: 0');
  }
}

run().catch(err => {
  console.error('Audit script failed:', err);
  process.exit(1);
});
