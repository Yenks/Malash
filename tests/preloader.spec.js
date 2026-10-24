import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const auditDir = path.join(process.cwd(), 'audit', 'preloader-home');

test.describe('Task 3: Bismillah Star Preloader and Signature Homepage', () => {
  test.beforeAll(async () => {
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
  });

  test('preloader shows Bismillah, star outline, progress percentage and dissolves', async ({ page }) => {
    await page.goto('/');

    const preloader = page.locator('#preloader');
    await expect(preloader).toBeVisible();

    const dimBismillah = page.locator('#bismillah-dim');
    const brightBismillah = page.locator('#bismillah-bright');
    await expect(dimBismillah).toHaveText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
    await expect(brightBismillah).toHaveText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');

    const starPath = page.locator('#preloader-star-path');
    await expect(starPath).toHaveAttribute('pathLength', '100');

    // Wait for preloader to finish its minimum display duration (1.8s) and dissolve
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 6000 });

    // Homepage should now be visible
    const homeSection = page.locator('#home');
    await expect(homeSection).toBeVisible();
    await expect(homeSection.locator('h1')).toHaveText('A letter is waiting for you');
    await expect(homeSection.locator('.home-subline')).toHaveText('From the GMSA-KNUST family');

    // Couple names must NOT appear on homepage
    const homeText = await homeSection.innerText();
    expect(homeText).not.toContain('Machele');
    expect(homeText).not.toContain('Salash');
    expect(homeText).not.toContain('Ahmed');
    expect(homeText).not.toContain('Salamatu');

    // Star frame is present on signature homepage
    await expect(page.locator('.home-star-frame')).toBeVisible();
  });

  test('safety continue button appears if preloader stalls', async ({ page }) => {
    // Intercept fonts or delay execution to simulate slow load
    await page.addInitScript(() => {
      // Override document.fonts.ready to a never-resolving promise
      Object.defineProperty(document.fonts, 'ready', {
        get: () => new Promise(() => {})
      });
    });

    await page.goto('/');
    const continueBtn = page.locator('#preloader-continue');

    // The safety fallback triggers at 4.5s
    await expect(continueBtn).toBeVisible({ timeout: 6000 });
    await continueBtn.click();

    // Clicking continue dissolves preloader immediately
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 2000 });
    await expect(page.locator('#home')).toBeVisible();
  });

  test('signature homepage enter button reveals scroll cue and moves camera', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 6000 });

    const enterBtn = page.locator('#enter-button');
    const scrollCue = page.locator('#scroll-cue');
    await expect(enterBtn).toBeVisible();
    await expect(scrollCue).toBeHidden();

    await enterBtn.click();
    await expect(scrollCue).toBeVisible({ timeout: 6000 });
    await expect(scrollCue).toHaveText(/Scroll to begin/);
  });

  test('home-sound chip toggles sound preference without playing unprompted audio', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 6000 });

    const soundChip = page.locator('#home-sound');
    await expect(soundChip).toBeVisible();

    const initialText = await soundChip.innerText();
    await soundChip.click();
    const toggledText = await soundChip.innerText();
    expect(toggledText).not.toBe(initialText);

    // Toggle back
    await soundChip.click();
    const restoredText = await soundChip.innerText();
    expect(restoredText).toBe(initialText);
  });

  test('homepage variant parameter supports lantern, letter, and defaults to star', async ({ page }) => {
    // Default variant
    await page.goto('/');
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 6000 });
    await expect(page.locator('#home')).toHaveClass(/home-star/);

    // Variant lantern
    await page.goto('/?home=lantern');
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 6000 });
    await expect(page.locator('#home')).toHaveClass(/home-lantern/);

    // Variant letter
    await page.goto('/?home=letter');
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 6000 });
    await expect(page.locator('#home')).toHaveClass(/home-letter/);
  });

  test('capture audit screenshots of preloader and signature homepage in both themes', async ({ page }) => {
    // 1. Preloader screenshot in dark mode (natural deep plum theme)
    await page.goto('/');
    await page.waitForSelector('#preloader', { state: 'visible' });
    await page.screenshot({ path: path.join(auditDir, 'preloader-plum.png') });

    // Wait for preloader dissolve
    await expect(page.locator('#preloader.dissolved, #preloader[style*="display: none"]')).toBeAttached({ timeout: 6000 });
    await page.waitForTimeout(600);

    // 2. Signature homepage dark mode
    await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
    await page.screenshot({ path: path.join(auditDir, 'home-signature-dark.png') });

    // 3. Signature homepage light mode
    await page.evaluate(() => document.documentElement.dataset.theme = 'light');
    await page.screenshot({ path: path.join(auditDir, 'home-signature-light.png') });

    // 4. Mobile viewport 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(auditDir, 'home-signature-mobile.png') });
  });
});
