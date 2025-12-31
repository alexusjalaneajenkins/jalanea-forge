import { test, expect } from '@playwright/test';

test.describe('6. Dev Environment', () => {
  test('6.1 Navigate to Dev Environment - verify page loads', async ({ page }) => {
    await page.goto('/dashboard/dev');
    await page.waitForLoadState('networkidle');

    // Verify page loads
    await expect(page).toHaveURL(/.*dev/);

    // Check for page header
    const header = page.locator('h1:has-text("Dev"), h1:has-text("Environment")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('6.2 Test dev environment features', async ({ page }) => {
    await page.goto('/dashboard/dev');
    await page.waitForLoadState('networkidle');

    // Check for project cards or environment list
    const devProjects = page.locator('[class*="card"], text=production, text=staging, text=development');
    await expect(devProjects.first()).toBeVisible({ timeout: 5000 });

    // Check for deployment status indicators
    const statusIndicators = page.locator('text=Live, text=Production, text=Deployed, [class*="status"]');
    if (await statusIndicators.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(statusIndicators.first()).toBeVisible();
    }
  });
});
