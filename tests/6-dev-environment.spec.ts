import { test, expect } from '@playwright/test';

test.describe('6. Dev Environment', () => {
  test('6.1 Navigate to Dev Environment - verify page loads', async ({ page }) => {
    await page.goto('/dashboard/dev');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page loads
    await expect(page).toHaveURL(/.*dev/);

    // Check for page header
    const header = page.locator('h1').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('6.2 Test dev environment features', async ({ page }) => {
    await page.goto('/dashboard/dev');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for main content area
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });

    // Check for any card-like elements or project entries
    const cards = page.locator('[class*="card"], [class*="border"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});
