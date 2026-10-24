import { test, expect } from '@playwright/test';

test.describe('Egg Reveal & Letter Modal Suite', () => {
  test('quick tap shows "Hold to open" hint', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#letter').scrollIntoViewIfNeeded();

    const egg = page.locator('#egg-button');
    await expect(egg).toBeVisible();

    // Perform quick tap (< 250ms pointerdown then pointerup)
    const box = await egg.boundingBox();
    expect(box).not.toBeNull();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.up();

    const hint = page.locator('#egg-hold-hint');
    await expect(hint).toHaveClass(/visible/, { timeout: 3000 });
  });

  test('0.9s press-and-hold cracks the egg and opens letter modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#letter').scrollIntoViewIfNeeded();

    const egg = page.locator('#egg-button');
    await expect(egg).toBeVisible();

    const box = await egg.boundingBox();
    expect(box).not.toBeNull();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Press and hold for 1000ms
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();

    // Verify modal appears
    const modal = page.locator('.modal-card');
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Verify close
    const closeBtn = page.locator('#modal-close');
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 4000 });

    // Verify egg remains visible as cracked keepsake base
    await expect(egg).toHaveClass(/cracked/);
    await expect(egg).toBeVisible();
    await expect(egg).toHaveAttribute('aria-label', 'Open letter');
  });

  test('keyboard Enter opens egg immediately and Escape closes modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#letter').scrollIntoViewIfNeeded();

    const egg = page.locator('#egg-button');
    await egg.focus();
    await page.keyboard.press('Enter');

    const modal = page.locator('.modal-card');
    await expect(modal).toBeVisible({ timeout: 6000 });

    // Press Escape to close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible({ timeout: 4000 });

    // Focus returns to egg button
    await expect(egg).toBeFocused();
  });

  test('reopens 3 times in dark and light themes without losing state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#letter').scrollIntoViewIfNeeded();

    const egg = page.locator('#egg-button');
    const modal = page.locator('.modal-card');
    const closeBtn = page.locator('#modal-close');

    // First open
    await egg.press('Enter');
    await expect(modal).toBeVisible({ timeout: 8000 });
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 4000 });

    // Reopen 1
    await egg.click();
    await expect(modal).toBeVisible({ timeout: 4000 });
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 4000 });

    // Toggle theme to light
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(400);

    // Reopen 2 in light theme
    await egg.click();
    await expect(modal).toBeVisible({ timeout: 4000 });
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 4000 });

    // Reopen 3 in light theme
    await egg.click();
    await expect(modal).toBeVisible({ timeout: 4000 });
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 4000 });
  });

  test('reopening works after scrolling away and returning', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#letter').scrollIntoViewIfNeeded();

    const egg = page.locator('#egg-button');
    const modal = page.locator('.modal-card');
    const closeBtn = page.locator('#modal-close');

    await egg.press('Enter');
    await expect(modal).toBeVisible({ timeout: 8000 });
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 4000 });

    // Scroll away to journey
    await page.locator('#journey').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Scroll back to letter
    await page.locator('#letter').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Reopen
    await egg.click();
    await expect(modal).toBeVisible({ timeout: 4000 });
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 4000 });
  });
});

const viewports = [
  { width: 320, height: 568, name: '320x568-iphone-se' },
  { width: 390, height: 844, name: '390x844-iphone-13' },
  { width: 768, height: 1024, name: '768x1024-ipad' },
  { width: 1440, height: 900, name: '1440x900-desktop' }
];

test.describe('Nameplate overlap and viewport checks', () => {
  for (const vp of viewports) {
    test(`no overlap between nameplate and letter copy at ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.locator('#letter').scrollIntoViewIfNeeded();

      // Check page nameplate vs egg button
      const letterName = page.locator('#letter-name');
      const eggBtn = page.locator('#egg-button');
      const nameBox = await letterName.boundingBox();
      const eggBox = await eggBtn.boundingBox();

      expect(nameBox).not.toBeNull();
      expect(eggBox).not.toBeNull();
      expect(nameBox.y + nameBox.height).toBeLessThanOrEqual(eggBox.y + 4);

      // Open modal
      await eggBtn.press('Enter');
      const modal = page.locator('.modal-card');
      await expect(modal).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(600);

      // Check modal nameplate header vs modal body
      const modalHeader = page.locator('.modal-header');
      const modalBody = page.locator('.modal-body');
      const headerBox = await modalHeader.boundingBox();
      const bodyBox = await modalBody.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(bodyBox).not.toBeNull();
      // The header containing Sacramento names must strictly sit ABOVE the body copy
      expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(bodyBox.y + 2);

      // Verify close button reachable
      const closeBtn = page.locator('#modal-close');
      await closeBtn.click();
      await expect(modal).not.toBeVisible({ timeout: 4000 });
    });
  }
});
