import { test, expect } from '@playwright/test';

test.describe('3. Dashboard', () => {
  test('3.1 Verify dashboard loads with stats/overview', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard page loads
    await expect(page).toHaveURL(/.*dashboard/);

    // Check for welcome header (use first() to avoid strict mode violation)
    await expect(page.locator('h1:has-text("Welcome back")').first()).toBeVisible({ timeout: 10000 });

    // Check for stat cards (Total Projects, Active Experiments, etc.)
    await expect(page.locator('text=Total Projects')).toBeVisible({ timeout: 5000 });

    // Verify page has content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('3.2 Check widgets and quick actions work', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for Recent Activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible({ timeout: 5000 });

    // Check for Quick Actions section
    await expect(page.locator('text=Quick Actions')).toBeVisible({ timeout: 5000 });

    // Check for Add New Project button
    const addProjectBtn = page.locator('button:has-text("Add New Project")');
    await expect(addProjectBtn).toBeVisible({ timeout: 5000 });
  });
});
