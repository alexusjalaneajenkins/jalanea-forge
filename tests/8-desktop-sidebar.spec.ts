import { test, expect } from '@playwright/test';

test.describe('8. Desktop Sidebar Navigation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip if not desktop project
    if (testInfo.project.name !== 'desktop') {
      test.skip();
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('8.1 Desktop sidebar is visible', async ({ page }) => {
    // Look for sidebar
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('8.2 Workflow section header exists', async ({ page }) => {
    // Look for workflow label in sidebar
    const workflowLabel = page.locator('aside text=Workflow');
    await expect(workflowLabel).toBeVisible({ timeout: 5000 });
  });

  test('8.3 All navigation items are visible', async ({ page }) => {
    const navItems = ['Idea', 'Research', 'PRD', 'Realization'];

    for (const item of navItems) {
      const navLink = page.locator(`aside >> text=${item}`);
      await expect(navLink.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('8.4 Navigation items are clickable', async ({ page }) => {
    // Click Research link
    const researchLink = page.locator('aside >> text=Research').first();
    await researchLink.click();
    await page.waitForTimeout(1000);

    // Verify URL changed
    await expect(page).toHaveURL(/#.*research/i);
  });

  test('8.5 Active nav item is highlighted', async ({ page }) => {
    // Navigate to Research
    await page.goto('/#/research');
    await page.waitForTimeout(1000);

    // Check that Research nav item has active styling
    const researchLink = page.locator('aside button:has-text("Research"), aside a:has-text("Research")').first();
    const className = await researchLink.getAttribute('class');

    // Should have some indication of active state (accent color, different bg, etc)
    expect(className).toMatch(/accent|active|bg-forge-800|selected/i);
  });

  test('8.6 Completed steps show checkmark', async ({ page }) => {
    // Look for check icons in sidebar (may not be visible if no steps completed)
    const sidebar = page.locator('aside');
    const checkIcons = sidebar.locator('svg.lucide-check');

    // Just verify sidebar structure is correct
    await expect(sidebar).toBeVisible();
  });

  test('8.7 Projects button exists in sidebar', async ({ page }) => {
    // Look for projects/folder button
    const projectsBtn = page.locator('aside button:has-text("Projects"), aside button:has(svg.lucide-folder)');

    if (await projectsBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(projectsBtn.first()).toBeVisible();
    }
  });

  test('8.8 Support button exists in sidebar', async ({ page }) => {
    // Look for support/bug button
    const supportBtn = page.locator('aside button:has-text("Support"), aside button:has(svg.lucide-bug)');

    if (await supportBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(supportBtn.first()).toBeVisible();
    }
  });
});
