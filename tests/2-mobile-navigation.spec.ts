import { test, expect } from '@playwright/test';

test.describe('2. Mobile Navigation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip if not mobile project
    if (testInfo.project.name !== 'mobile') {
      test.skip();
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('2.1 Hamburger menu is visible on mobile', async ({ page }) => {
    // Look for hamburger menu button
    const hamburger = page.locator('button:has(svg.lucide-menu), button[aria-label*="menu"]');
    await expect(hamburger.first()).toBeVisible({ timeout: 5000 });
  });

  test('2.2 Tapping hamburger opens sidebar drawer', async ({ page }) => {
    // Click hamburger menu
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Verify sidebar is visible
    const sidebar = page.locator('.mobile-sidebar.active, aside[aria-label="Mobile navigation"]');
    await expect(sidebar.first()).toBeVisible({ timeout: 3000 });

    // Verify FORGE logo in sidebar
    const sidebarLogo = page.locator('.mobile-sidebar text=FORGE');
    await expect(sidebarLogo).toBeVisible();
  });

  test('2.3 Sidebar has workflow navigation items', async ({ page }) => {
    // Open sidebar
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Check for workflow items
    const workflowItems = ['Idea', 'Research', 'PRD', 'Realization'];

    for (const item of workflowItems) {
      const navItem = page.locator(`.mobile-sidebar button:has-text("${item}")`);
      await expect(navItem).toBeVisible({ timeout: 3000 });
    }
  });

  test('2.4 Close button works on sidebar', async ({ page }) => {
    // Open sidebar
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Click close button
    const closeBtn = page.locator('.mobile-sidebar button:has(svg.lucide-x)');
    await closeBtn.click();
    await page.waitForTimeout(500);

    // Verify sidebar is closed (not visible or not active)
    const sidebar = page.locator('.mobile-sidebar.active');
    await expect(sidebar).not.toBeVisible({ timeout: 3000 });
  });

  test('2.5 Overlay closes sidebar when tapped', async ({ page }) => {
    // Open sidebar
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Click overlay
    const overlay = page.locator('.mobile-menu-overlay.active');
    await overlay.click({ position: { x: 300, y: 300 } });
    await page.waitForTimeout(500);

    // Verify sidebar is closed
    const sidebar = page.locator('.mobile-sidebar.active');
    await expect(sidebar).not.toBeVisible({ timeout: 3000 });
  });

  test('2.6 Navigation via sidebar works', async ({ page }) => {
    // Open sidebar
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Click Research page
    const researchBtn = page.locator('.mobile-sidebar button:has-text("Research")');
    await researchBtn.click();
    await page.waitForTimeout(1000);

    // Verify navigation worked
    await expect(page).toHaveURL(/#.*research/i);
  });

  test('2.7 My Projects button exists in sidebar', async ({ page }) => {
    // Open sidebar
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Check for My Projects button
    const projectsBtn = page.locator('.mobile-sidebar button:has-text("My Projects")');
    await expect(projectsBtn).toBeVisible();
  });

  test('2.8 Get Support button exists in sidebar', async ({ page }) => {
    // Open sidebar
    const hamburger = page.locator('button:has(svg.lucide-menu)').first();
    await hamburger.click();
    await page.waitForTimeout(500);

    // Check for Support button
    const supportBtn = page.locator('.mobile-sidebar button:has-text("Support")');
    await expect(supportBtn).toBeVisible();
  });
});
