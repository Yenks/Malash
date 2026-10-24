import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const allViewports = [
  { width: 320, height: 568, name: '320x568' },
  { width: 360, height: 640, name: '360x640' },
  { width: 390, height: 844, name: '390x844' },
  { width: 412, height: 915, name: '412x915' },
  { width: 768, height: 1024, name: '768x1024' },
  { width: 1024, height: 768, name: '1024x768' },
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1920, height: 1080, name: '1920x1080' }
];

const auditViewports = [
  { width: 390, height: 844, name: '390x844' },
  { width: 768, height: 1024, name: '768x1024' },
  { width: 1440, height: 900, name: '1440x900' }
];

const acts = ['home', 'letter', 'wishes', 'journey', 'names', 'farewell'];

test.describe('Task 2 Verification Suite', () => {
  // 1. Font loading verification
  test('all required custom fonts are loaded and active', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const fonts = await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('400 16px "Exo 2"'),
        document.fonts.load('600 16px "Exo 2"'),
        document.fonts.load('400 32px Sacramento'),
        document.fonts.load('400 24px Amiri'),
        document.fonts.load('400 24px "Aref Ruqaa"')
      ]);
      await document.fonts.ready;
      return {
        exo2: document.fonts.check('400 16px "Exo 2"'),
        exo2Bold: document.fonts.check('600 16px "Exo 2"'),
        sacramento: document.fonts.check('400 32px Sacramento'),
        amiri: document.fonts.check('400 24px Amiri'),
        arefRuqaa: document.fonts.check('400 24px "Aref Ruqaa"'),
      };
    });

    expect(fonts.exo2).toBe(true);
    expect(fonts.exo2Bold).toBe(true);
    expect(fonts.sacramento).toBe(true);
    expect(fonts.amiri).toBe(true);
    expect(fonts.arefRuqaa).toBe(true);
  });

  // 2. Three Prayers data-driven verification
  test('Three Prayers renders 3 arch cards with data-driven content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#journey').scrollIntoViewIfNeeded();

    const cards = page.locator('.prayer-card');
    await expect(cards).toHaveCount(3);

    const names = await cards.locator('.prayer-name').allTextContents();
    expect(names).toEqual(['Sakinah', 'Mawaddah', 'Rahmah']);

    const meanings = await cards.locator('.prayer-meaning').allTextContents();
    expect(meanings).toEqual(['Tranquillity', 'Affection', 'Mercy']);
  });

  // 3. Names in Light single-column sequence verification
  test('Names in Light is single-column with blessing sheet and Ameen button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#names').scrollIntoViewIfNeeded();

    const namesWrap = page.locator('.names-wrap');
    await expect(namesWrap).toBeVisible();

    // Verify blessing sheet exists and contains verse and dua
    const sheet = page.locator('.blessing-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('.verse-ar')).toBeVisible();
    await expect(sheet.locator('.dua-ar')).toBeVisible();

    // Verify Ameen button with hint directly beneath
    const ameenBtn = page.locator('#ameen-button');
    const ameenHint = page.locator('.ameen-hint');
    await expect(ameenBtn).toBeVisible();
    await expect(ameenHint).toBeVisible();

    const btnBox = await ameenBtn.boundingBox();
    const hintBox = await ameenHint.boundingBox();
    expect(btnBox.y + btnBox.height).toBeLessThanOrEqual(hintBox.y + 4);
  });

  // 4. Horizontal scroll & overflow check across all 8 viewports
  for (const vp of allViewports) {
    test(`no horizontal overflow at ${vp.name} in both themes`, async ({ page }) => {
      for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/?theme=${theme}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(400);

        // Check each act
        for (const act of acts) {
          await page.locator(`#${act}`).scrollIntoViewIfNeeded();
          await page.waitForTimeout(100);

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });
          expect(hasOverflow, `Overflow detected at ${vp.name} (${theme}) on #${act}`).toBe(false);
        }
      }
    });
  }

  // 5. Capture "after" audit screenshots
  for (const vp of auditViewports) {
    for (const theme of ['light', 'dark']) {
      test(`capture after audit screenshots at ${vp.name} in ${theme} mode`, async ({ page }) => {
        const outDir = path.resolve(`audit/ui/after/${vp.name}-${theme}`);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/?theme=${theme}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(600);

        for (const act of acts) {
          const actEl = page.locator(`#${act}`);
          await actEl.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);

          const shotPath = path.join(outDir, `${act}.png`);
          await page.screenshot({ path: shotPath });
        }
      });
    }
  }
});
