import { test, expect } from '@playwright/test';

test.describe('7. Settings', () => {
  test('7.1 Navigate to Settings - verify page loads', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Verify page loads
    await expect(page).toHaveURL(/.*settings/);

    // Check for settings header
    const header = page.locator('h1:has-text("Settings")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('7.2 Test settings options are available', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Check for common settings sections
    const settingsSections = page.locator('text=Export, text=Import, text=Reset, text=Data, text=Backup');
    await expect(settingsSections.first()).toBeVisible({ timeout: 5000 });

    // Check for buttons/controls
    const settingsControls = page.locator('button:has-text("Export"), button:has-text("Import"), button:has-text("Reset")');
    const controlCount = await settingsControls.count();
    expect(controlCount).toBeGreaterThan(0);
  });

  test('7.3 Test export functionality exists', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Find export button
    const exportBtn = page.locator('button:has-text("Export")');
    await expect(exportBtn).toBeVisible({ timeout: 5000 });

    // Don't actually click it in tests to avoid download popups
  });
});
