import { test, expect } from '@playwright/test';

test.describe('7. Settings', () => {
  test('7.1 Navigate to Settings - verify page loads', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page loads
    await expect(page).toHaveURL(/.*settings/);

    // Check for settings header
    const header = page.locator('h1').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('7.2 Test settings options are available', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for main content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });

    // Check for any buttons on the page
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('7.3 Test export functionality exists', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find export button
    const exportBtn = page.locator('button:has-text("Export")');
    await expect(exportBtn).toBeVisible({ timeout: 5000 });

    // Don't actually click it in tests to avoid download popups
  });
});
