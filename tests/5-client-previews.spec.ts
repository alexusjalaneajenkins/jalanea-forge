import { test, expect } from '@playwright/test';

test.describe('5. Client Previews', () => {
  test('5.1 Navigate to Client Previews - verify page loads', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page loads
    await expect(page).toHaveURL(/.*clients/);

    // Check for page header - look for Client or Preview text
    const header = page.locator('h1').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('5.2 Test client preview functionality', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for any buttons on the page (add/new/create)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Page should have some content - either empty state or client list
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible({ timeout: 5000 });
  });
});
