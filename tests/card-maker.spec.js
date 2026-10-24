import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Task 4: Wish Card Maker and Export Flow', () => {

  test('Card Maker UI has all required steps and controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to Farewell act
    await page.evaluate(() => {
      document.getElementById('farewell')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(600);

    // Verify canvas exists
    const canvas = page.locator('#wish-card-canvas');
    await expect(canvas).toBeVisible();

    // Step 1: 4 templates exist
    const templateChips = page.locator('.template-chip');
    await expect(templateChips).toHaveCount(4);
    await expect(page.locator('.template-chip[data-template="ivory"]')).toHaveClass(/active/);

    // Step 2: 5 swatches exist
    const swatches = page.locator('.color-swatch');
    await expect(swatches).toHaveCount(5);

    // Step 3: Message fields and counters
    const nameInput = page.locator('#card-name');
    const wishInput = page.locator('#card-wish');
    const nameCount = page.locator('#card-name-count');
    const wishCount = page.locator('#card-wish-count');
    const quickWishBtn = page.locator('#quick-wish-btn');

    await expect(nameInput).toBeVisible();
    await expect(wishInput).toBeVisible();
    await expect(nameCount).toHaveText('0 / 30');
    await expect(wishCount).toHaveText('0 / 140');
    await expect(quickWishBtn).toBeVisible();

    // Step 4: Blessing select
    const blessingSelect = page.locator('#card-blessing');
    await expect(blessingSelect).toBeVisible();
    const blessingOptions = page.locator('#card-blessing option');
    expect(await blessingOptions.count()).toBeGreaterThan(3);

    // Step 5: Sticker chips
    const stickerChips = page.locator('.sticker-chip');
    await expect(stickerChips).toHaveCount(6);

    // Step 6: Format & size chips
    const alignChips = page.locator('.format-chip[data-align]');
    await expect(alignChips).toHaveCount(3);
    const sizeChips = page.locator('.format-chip[data-size]');
    await expect(sizeChips).toHaveCount(2);

    // Export button
    const createBtn = page.locator('#create-card');
    await expect(createBtn).toBeVisible();
  });

  test('Interactive controls update character counts, canvas size, and quick wishes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.getElementById('farewell')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    const nameInput = page.locator('#card-name');
    const wishInput = page.locator('#card-wish');
    const nameCount = page.locator('#card-name-count');
    const wishCount = page.locator('#card-wish-count');

    // Type name
    await nameInput.fill('Abdul-Rahman');
    await expect(nameCount).toHaveText('12 / 30');

    // Quick wish button cycles wishes
    const quickBtn = page.locator('#quick-wish-btn');
    await quickBtn.click();
    const wishVal = await wishInput.inputValue();
    expect(wishVal.length).toBeGreaterThan(5);
    await expect(wishCount).toHaveText(`${wishVal.length} / 140`);

    // Blessing preview updates
    const blessingSelect = page.locator('#card-blessing');
    await blessingSelect.selectOption({ index: 1 });
    const blessingPreview = page.locator('#blessing-preview');
    await expect(blessingPreview).not.toBeEmpty();

    // Canvas size switches between card (1080x1350) and status (1080x1920)
    const statusBtn = page.locator('.format-chip[data-size="status"]');
    await statusBtn.click();
    await page.waitForTimeout(200);

    const dimsStatus = await page.evaluate(() => {
      const c = document.getElementById('wish-card-canvas');
      return { width: c.width, height: c.height };
    });
    expect(dimsStatus.width).toBe(1080);
    expect(dimsStatus.height).toBe(1920);

    const cardBtn = page.locator('.format-chip[data-size="card"]');
    await cardBtn.click();
    await page.waitForTimeout(200);

    const dimsCard = await page.evaluate(() => {
      const c = document.getElementById('wish-card-canvas');
      return { width: c.width, height: c.height };
    });
    expect(dimsCard.width).toBe(1080);
    expect(dimsCard.height).toBe(1350);
  });

  test('Stickers toggle correctly with maximum 3 selection limit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.getElementById('farewell')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // Default: 1 sticker active (heart)
    const activeStickers = page.locator('.sticker-chip.active');
    await expect(activeStickers).toHaveCount(1);

    // Tap star and lantern
    await page.locator('.sticker-chip[data-sticker="star"]').click();
    await page.locator('.sticker-chip[data-sticker="lantern"]').click();
    await expect(page.locator('.sticker-chip.active')).toHaveCount(3);

    // Tapping a 4th sticker (crescent) should not exceed max 3
    await page.locator('.sticker-chip[data-sticker="crescent"]').click();
    await expect(page.locator('.sticker-chip.active')).toHaveCount(3);

    // Tapping an active sticker (star) deselects it
    await page.locator('.sticker-chip[data-sticker="star"]').click();
    await expect(page.locator('.sticker-chip.active')).toHaveCount(2);
  });

  test('Export flow opens modal sheet with preview, download link, and STRICTLY NO contact details', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.getElementById('farewell')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(500);

    // Enter details
    await page.locator('#card-name').fill('Zainab');
    await page.locator('#quick-wish-btn').click();

    // Click Create card
    const createBtn = page.locator('#create-card');
    await createBtn.click();
    await page.waitForTimeout(600);

    // Modal dialog opens
    const modal = page.locator('.modal-card[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check title and preview image
    const title = page.locator('#modal-nameplate');
    await expect(title).toHaveText('Your card is ready');

    const previewImg = page.locator('.export-preview-img');
    await expect(previewImg).toBeVisible();
    const imgSrc = await previewImg.getAttribute('src');
    expect(imgSrc).toMatch(/^blob:/);

    // Save button has download attribute with proper naming
    const saveBtn = page.locator('#export-save-btn');
    await expect(saveBtn).toBeVisible();
    const downloadAttr = await saveBtn.getAttribute('download');
    expect(downloadAttr).toBe('wish-card-zainab-malash26.png');

    // STRICT PRIVACY & CONTACT DETAILS CHECK
    const pageHtml = await page.content();
    // No wa.me or WhatsApp direct message links
    expect(pageHtml).not.toContain('wa.me');
    expect(pageHtml).not.toContain('api.whatsapp.com');
    // No mailto links
    expect(pageHtml).not.toContain('mailto:');
    // No telephone links
    expect(pageHtml).not.toContain('tel:');
    // No phone numbers in Ghana (+233) format
    expect(pageHtml).not.toMatch(/\+233\d{9}/);

    // Close modal
    const closeBtn = page.locator('#modal-close');
    await closeBtn.click();
    await page.waitForTimeout(400);
    await expect(modal).not.toBeVisible();
  });

  test('Responsive visual audit screenshots in light and dark mode', async ({ page }) => {
    const auditDir = path.resolve('audit/card-maker');
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      document.getElementById('farewell')?.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(800);

    // Type a sample wish
    await page.locator('#card-name').fill('Ibrahim');
    await page.locator('#quick-wish-btn').click();

    const isMobile = page.viewportSize().width < 768;
    const modePrefix = isMobile ? 'mobile-390x844' : 'desktop-1440x900';

    // Dark mode screenshot
    await page.screenshot({
      path: path.join(auditDir, `${modePrefix}-dark.png`),
      fullPage: false
    });

    // Toggle theme to light mode
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(500);

    // Light mode screenshot
    await page.screenshot({
      path: path.join(auditDir, `${modePrefix}-light.png`),
      fullPage: false
    });
  });

});
