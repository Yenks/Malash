import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Audit screenshots capture', () => {
  const configs = [
    { width: 390, height: 844, name: '390x844' },
    { width: 1440, height: 900, name: '1440x900' },
  ];

  for (const cfg of configs) {
    for (const theme of ['light', 'dark']) {
      test(`capture egg and modal audit screenshots at ${cfg.name} in ${theme} mode`, async ({ page }) => {
        const auditDir = path.resolve('audit/egg-reveal');
        if (!fs.existsSync(auditDir)) {
          fs.mkdirSync(auditDir, { recursive: true });
        }

        await page.setViewportSize({ width: cfg.width, height: cfg.height });
        await page.goto(`/?theme=${theme}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(600);

        // Scroll to letter
        await page.locator('#letter').scrollIntoViewIfNeeded();
        await page.waitForTimeout(600);

        // Capture egg in letter act
        const eggPath = path.join(auditDir, `egg-${cfg.name}-${theme}.png`);
        await page.screenshot({ path: eggPath });

        // Open modal
        const eggBtn = page.locator('#egg-button');
        await eggBtn.press('Enter');
        await page.locator('.modal-card').waitFor({ state: 'visible', timeout: 8000 });
        await page.waitForTimeout(800);

        // Capture modal open
        const modalPath = path.join(auditDir, `modal-${cfg.name}-${theme}.png`);
        await page.screenshot({ path: modalPath });
      });
    }
  }
});
