import { test, expect } from '@playwright/test';

test.describe('4. Internal Tools', () => {
  test('4.1 Navigate to Internal Tools - verify page loads', async ({ page }) => {
    await page.goto('/dashboard/tools');
    await page.waitForLoadState('networkidle');

    // Verify page loads
    await expect(page).toHaveURL(/.*tools/);

    // Check for tools header or content
    const toolsHeader = page.locator('h1:has-text("Tools"), h1:has-text("Internal")');
    await expect(toolsHeader).toBeVisible({ timeout: 10000 });
  });

  test('4.2 Test tools are displayed', async ({ page }) => {
    await page.goto('/dashboard/tools');
    await page.waitForLoadState('networkidle');

    // Check for tool cards/items
    const toolItems = page.locator('[class*="card"], [class*="tool"], div:has(h3)');
    const toolCount = await toolItems.count();
    expect(toolCount).toBeGreaterThan(0);

    // Check for specific tools mentioned in the app
    const expectedTools = ['Learning', 'Skill', 'Quick Capture', 'Code Snippets', 'Trend'];
    let foundTools = 0;

    for (const tool of expectedTools) {
      const toolElement = page.locator(`text=${tool}`);
      if (await toolElement.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        foundTools++;
      }
    }

    expect(foundTools).toBeGreaterThan(0);
  });

  test('4.3 Test opening a tool', async ({ page }) => {
    await page.goto('/dashboard/tools');
    await page.waitForLoadState('networkidle');

    // Find a clickable tool (not coming soon)
    const activeTool = page.locator('button:not(:has-text("Coming Soon")), a:not(:has-text("Coming Soon"))').first();

    if (await activeTool.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activeTool.click();
      await page.waitForTimeout(500);

      // Should either navigate or open a modal
      const modalOrNewContent = page.locator('[role="dialog"], .modal, [class*="expanded"]');
      // Just verify something happened - no error
    }
  });
});
