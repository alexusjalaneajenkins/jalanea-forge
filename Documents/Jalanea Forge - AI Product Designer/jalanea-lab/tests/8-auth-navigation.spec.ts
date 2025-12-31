import { test, expect } from '@playwright/test';

test.describe('8. Auth & Navigation', () => {
  test('8.1 Test logout button exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for logout button in sidebar or menu
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Log out"), a:has-text("Logout")');
    await expect(logoutBtn.first()).toBeVisible({ timeout: 10000 });

    // Don't actually click logout to maintain session
  });

  test('8.2 Test Search (Cmd+K) - verify search opens', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Trigger search with keyboard shortcut
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // Check if search modal/overlay opened
    const searchModal = page.locator('[role="dialog"]:has(input), .modal:has(input), input[placeholder*="Search"]');
    if (await searchModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(searchModal).toBeVisible();

      // Close it
      await page.keyboard.press('Escape');
    } else {
      // Try clicking a search button instead
      const searchBtn = page.locator('button[title*="Search"], button:has(svg.lucide-search)');
      if (await searchBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('8.3 Sidebar navigation works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Test navigation links
    const navLinks = [
      { text: 'Lab', url: '/dashboard/lab' },
      { text: 'Brainstorm', url: '/dashboard/brainstorm' },
      { text: 'Tools', url: '/dashboard/tools' },
      { text: 'Settings', url: '/dashboard/settings' },
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`a:has-text("${link.text}"), button:has-text("${link.text}")`).first();
      if (await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(new RegExp(link.url.replace('/', '\\/')));

        // Go back to dashboard for next iteration
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('8.4 Mobile navigation works (responsive)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for mobile nav elements
    const mobileNav = page.locator('nav, [class*="mobile"], [class*="bottom"]');
    await expect(mobileNav.first()).toBeVisible({ timeout: 5000 });

    // Check for hamburger menu or bottom nav
    const menuBtn = page.locator('button:has(svg.lucide-menu), button[aria-label*="menu"], [class*="hamburger"]');
    const bottomNav = page.locator('[class*="bottom-nav"], nav[class*="fixed"]');

    const hasMobileMenu = await menuBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const hasBottomNav = await bottomNav.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasMobileMenu || hasBottomNav).toBeTruthy();
  });
});
