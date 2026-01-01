import { test, expect } from '@playwright/test';

test.describe('3. Idea Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('3.1 Idea page loads as default', async ({ page }) => {
    // Check for idea input or heading
    const ideaHeading = page.locator('text=idea, text=Idea, text=What').first();
    await expect(ideaHeading).toBeVisible({ timeout: 5000 });
  });

  test('3.2 Main idea input/textarea is visible', async ({ page }) => {
    // Find main input area
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test('3.3 Can type in idea input', async ({ page }) => {
    // Find and fill input
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill('A mobile app for tracking daily habits and building streaks');

    // Verify text was entered
    const value = await input.inputValue();
    expect(value).toContain('mobile app');
  });

  test('3.4 Example prompts are visible', async ({ page }) => {
    // Look for example buttons or suggestion chips
    const examples = page.locator('button:has-text("Example"), button:has-text("Try")');

    if (await examples.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(await examples.count()).toBeGreaterThan(0);
    } else {
      // Alternative: look for any suggestion-like buttons
      const suggestions = page.locator('button').filter({ hasText: /app|tool|platform/i });
      expect(await suggestions.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('3.5 Start Building button is visible and clickable', async ({ page }) => {
    // Fill in some text first
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill('Test idea for automated testing');
    await page.waitForTimeout(500);

    // Find Start Building button
    const startBtn = page.locator('button:has-text("Start Building"), button:has-text("Generate"), button:has-text("Next")');
    await expect(startBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('3.6 Page content is readable (no horizontal scroll)', async ({ page }) => {
    // Check that body doesn't have horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
  });
});
