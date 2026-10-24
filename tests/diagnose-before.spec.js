import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Task 2 Diagnosis - Before Screenshots & Font Audits', () => {
  const viewports = [
    { width: 390, height: 844, name: '390x844' },
    { width: 768, height: 1024, name: '768x1024' },
    { width: 1440, height: 900, name: '1440x900' }
  ];

  const acts = ['home', 'letter', 'wishes', 'journey', 'names', 'farewell'];

  for (const vp of viewports) {
    for (const theme of ['light', 'dark']) {
      test(`capture all acts at ${vp.name} in ${theme} mode`, async ({ page }) => {
        const outDir = path.resolve(`audit/ui/before/${vp.name}-${theme}`);
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

  test('diagnose font loading with document.fonts.check and computed styles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const fontStatus = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        exo2Regular: document.fonts.check('400 16px "Exo 2"'),
        exo2SemiBold: document.fonts.check('600 16px "Exo 2"'),
        sacramento: document.fonts.check('400 32px Sacramento'),
        amiri: document.fonts.check('400 24px Amiri'),
        arefRuqaa: document.fonts.check('400 24px "Aref Ruqaa"'),
        bodyComputedFont: window.getComputedStyle(document.body).fontFamily,
        nameplateFont: window.getComputedStyle(document.querySelector('.nameplate') || document.body).fontFamily,
        arabicVerseFont: window.getComputedStyle(document.querySelector('.verse-ar') || document.body).fontFamily,
      };
    });

    console.log('Font Status Diagnostic:', JSON.stringify(fontStatus, null, 2));
  });
});
