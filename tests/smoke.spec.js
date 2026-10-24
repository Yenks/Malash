import { test, expect } from '@playwright/test';

test.describe('Smoke tests - baseline and core experience', () => {
  test('no console errors on initial load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('vertical scrolling changes the active act', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const firstActive = await page.locator('.chapter-rail a.active').getAttribute('data-chapter');
    expect(firstActive).toBe('home');

    // Scroll to wishes act
    await page.locator('#wishes').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const scrolledActive = await page.locator('.chapter-rail a.active').getAttribute('data-chapter');
    expect(scrolledActive).toBe('wishes');
  });

  test('theme toggle works without losing state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(400);
    const newTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(newTheme).not.toBe(initialTheme);
  });

  test('the egg cracks and the letter opens, closes and can reopen three times', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    await page.locator('#letter').scrollIntoViewIfNeeded();
    const eggButton = page.locator('#egg-button');
    await expect(eggButton).toBeVisible();
    await eggButton.press('Enter');

    // Verify letter opens
    const card = page.locator('#letter-card, .modal-card');
    await expect(card).toBeVisible({ timeout: 8000 });

    // Attempt close
    const closeBtn = page.locator('#modal-close, .close-btn, [aria-label="Close"]');
    await expect(closeBtn).toBeVisible({ timeout: 4000 });
    await closeBtn.click();
    await expect(card).not.toBeVisible({ timeout: 4000 });

    // Reopen 1
    await eggButton.click();
    await expect(card).toBeVisible({ timeout: 4000 });
    await closeBtn.click();
    await expect(card).not.toBeVisible({ timeout: 4000 });

    // Reopen 2
    await eggButton.click();
    await expect(card).toBeVisible({ timeout: 4000 });
    await closeBtn.click();
    await expect(card).not.toBeVisible({ timeout: 4000 });

    // Reopen 3
    await eggButton.click();
    await expect(card).toBeVisible({ timeout: 4000 });
  });
});
