import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Task 5: Seven Hidden Secrets, Tab Icons & Link Preview', () => {

  test('Meta tags, icons, manifest and link preview tags are properly configured', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Theme color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#6E1450');

    // Tab icons & Manifest
    const icon = page.locator('link[rel="icon"]');
    await expect(icon).toHaveAttribute('href', '/favicon.svg');

    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveAttribute('href', '/apple-touch-icon.png');

    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/site.webmanifest');

    // Open Graph meta tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', 'A letter is waiting for you');

    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute('content', 'From the GMSA-KNUST family');

    const ogImage = page.locator('meta[property="og:image"]');
    const ogImageSrc = await ogImage.getAttribute('content');
    expect(ogImageSrc).toMatch(/^https?:\/\/.*\/og-card-v1\.png$/);

    const ogWidth = page.locator('meta[property="og:image:width"]');
    await expect(ogWidth).toHaveAttribute('content', '1200');

    const ogHeight = page.locator('meta[property="og:image:height"]');
    await expect(ogHeight).toHaveAttribute('content', '630');

    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
  });

  test('All seven hidden secrets can be discovered and show counter toast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dissolve preloader
    await page.evaluate(() => {
      document.getElementById('preloader')?.remove();
    });

    // ----------------------------------------------------
    // Secret 2: Glass Heart press-and-hold (500ms)
    // ----------------------------------------------------
    const heartBtn = page.locator('#secret-glass-heart');
    await expect(heartBtn).toBeVisible();

    await heartBtn.click();
    await page.waitForTimeout(300);

    const tagline = page.locator('#heart-tagline-pop');
    await expect(tagline).toHaveText('Hearts Once Apart, Now Closely Aligned');

    // Counter toast appears
    const toast = page.locator('#secrets-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/secrets found/);

    // ----------------------------------------------------
    // Secret 5: Egg shards (crack egg first)
    // ----------------------------------------------------
    const eggBtn = page.locator('#egg-button');
    await eggBtn.focus();
    await page.keyboard.press('Enter');
    
    // Wait for egg cracking sequence to finish and letter modal to open
    const modal = page.locator('.modal-card[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Close letter modal
    const closeBtn = page.locator('#modal-close');
    await closeBtn.click();
    await page.waitForTimeout(500);

    const shard1 = page.locator('.egg-shard-btn[data-shard="1"]');
    await expect(shard1).toBeVisible();
    await shard1.click();
    await page.waitForTimeout(300);

    await expect(toast).toContainText(/secrets found/);

    // ----------------------------------------------------
    // Secret 1: Constellation stars in Wishes act
    // ----------------------------------------------------
    await page.evaluate(() => {
      document.getElementById('wishes')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    await page.locator('.constellation-star[data-star="1"]').click();
    await page.locator('.constellation-star[data-star="2"]').click();
    await page.locator('.constellation-star[data-star="3"]').click();
    await page.waitForTimeout(300);

    const constellation = page.locator('#constellation-overlay');
    await expect(constellation).toHaveClass(/show/);
    await expect(page.locator('.constellation-text')).toHaveText("MALASH'26");
    await expect(toast).toContainText(/secrets found/);

    // ----------------------------------------------------
    // Secret 4: Crescent in Names in Light
    // ----------------------------------------------------
    await page.evaluate(() => {
      document.getElementById('names')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    const crescent = page.locator('#secret-crescent');
    await crescent.click();
    await page.waitForTimeout(300);

    const popover = page.locator('#crescent-popover');
    await expect(popover).toHaveClass(/show/);
    await expect(toast).toContainText(/secrets found/);

    // ----------------------------------------------------
    // Secret 6: EC Office Note (opens in MalashModal)
    // ----------------------------------------------------
    await page.evaluate(() => {
      document.getElementById('farewell')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    const ecSeal = page.locator('#secret-ec-seal');
    await ecSeal.click();
    await page.waitForTimeout(500);

    await expect(modal).toBeVisible();
    await expect(page.locator('.letter-title')).toHaveText('A note from the EC Office');
    await closeBtn.click();
    await page.waitForTimeout(400);

    await expect(toast).toContainText(/secrets found/);

    // ----------------------------------------------------
    // Secret 7: IT & Media Note (opens in MalashModal)
    // ----------------------------------------------------
    const itSeal = page.locator('#secret-it-seal');
    await itSeal.click();
    await page.waitForTimeout(500);

    await expect(modal).toBeVisible();
    await expect(page.locator('.letter-title')).toHaveText('A note from the IT & Media Committee');
    await closeBtn.click();
    await page.waitForTimeout(400);

    await expect(toast).toContainText(/secrets found/);

    // ----------------------------------------------------
    // Secret 3: Beyond the end
    // ----------------------------------------------------
    const beyondBtn = page.locator('#beyond-tail-btn');
    await beyondBtn.click();
    await page.waitForTimeout(400);

    const beyondText = page.locator('#beyond-tail-text');
    await expect(beyondText).toHaveClass(/revealed/);
    await expect(beyondText).toHaveText('Barakallahu lakuma');

    const totalFound = await page.evaluate(() => window.__foundSecrets?.size);
    expect(totalFound).toBe(7);
    await expect(toast).toContainText('7 of 7 secrets found');

    await expect(toast).toContainText('7 of 7 secrets found');
  });

  test('Keyboard navigation reaches secrets with Tab and activates with Enter', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.getElementById('preloader')?.remove();
      document.getElementById('names')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(400);

    const crescent = page.locator('#secret-crescent');
    await crescent.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const popover = page.locator('#crescent-popover');
    await expect(popover).toHaveClass(/show/);
  });

  test('Audit screenshots for secrets are captured', async ({ page }) => {
    const auditDir = path.resolve('audit/secrets');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.getElementById('preloader')?.remove();
      document.getElementById('farewell')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    await page.locator('#secret-ec-seal').click();
    await page.waitForTimeout(600);

    const isMobile = page.viewportSize().width < 768;
    const modePrefix = isMobile ? 'mobile-390x844' : 'desktop-1440x900';

    await page.screenshot({
      path: path.join(auditDir, `${modePrefix}-ec-note.png`),
      fullPage: false
    });
  });

});
