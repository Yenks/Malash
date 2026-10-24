import { test, expect } from '@playwright/test';

async function enterCourtyard(page, theme, mode) {
  await page.goto(`/?theme=${theme}`);
  await expect(page.locator('h1')).toHaveText('A letter is waiting for you');
  if (mode === 'scroll') await page.getByRole('button', { name: 'Scroll down' }).click();
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.locator('.courtyard')).toBeVisible();
}

test.describe('The Paper Garden modal and travel state', () => {
  for (const theme of ['light', 'dark']) for (const mode of ['sideways', 'scroll']) {
    test(`${theme} theme / ${mode} travel: letter dismissals and state switches`, async ({ page }) => {
      page.on('pageerror', error => console.error('PAGEERROR', error));
      page.on('console', message => { if (message.type() === 'error') console.error('BROWSER', message.text()); });
      await enterCourtyard(page, theme, mode);
      const egg = page.locator('#egg-button');
      await egg.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 12000 });
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await egg.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await egg.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.locator('.modal-backdrop').click({ position: { x: 4, y: 4 } });
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.locator('.dock-stop').nth(2).click();
      await page.getByRole('button', { name: 'Switch travel mode' }).click({ noWaitAfter: true }); await page.waitForTimeout(1700);
      await expect(page.locator('.dock-stop[aria-current="step"]')).toHaveAttribute('aria-label', 'The Tree of Wishes');
      await page.getByRole('button', { name: 'Switch theme' }).click({ noWaitAfter: true });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
      await page.locator('.dock-stop').nth(1).click();
      await egg.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
    });
  }

  test('wish progress and card maker work without exposing the WhatsApp number', async ({ page }) => {
    await enterCourtyard(page, 'dark', 'sideways');
    await page.locator('.dock-stop').nth(2).click();
    await page.locator('.blossom-button').first().click();
    await expect(page.locator('.read-count')).toContainText('1 of');
    await page.getByRole('button', { name: 'All wishes' }).click();
    await expect(page.locator('.wish-list p')).toHaveCount(12);
    await page.locator('.dock-stop').nth(5).click(); await page.waitForTimeout(1700);
    await page.locator('.step-tabs button').nth(5).click();
    await page.getByRole('button', { name: 'Create card' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('233508993496');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});


