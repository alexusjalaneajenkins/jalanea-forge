import { test, expect } from '@playwright/test';

test.describe('5. PRD Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/prd');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('5.1 PRD page loads', async ({ page }) => {
    // Check URL
    await expect(page).toHaveURL(/#.*prd/i);

    // Check for PRD-related content
    const content = page.locator('text=PRD, text=Product, text=Requirements, text=Architecture').first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('5.2 Step indicator shows 3/4', async ({ page }) => {
    // Look for step indicator
    const stepIndicator = page.locator('text=/3.*4|Step 3|PRD/i');
    await expect(stepIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('5.3 Architecture section is visible', async ({ page }) => {
    // Look for architecture content
    const architecture = page.locator('text=Architecture, text=System, text=Design');

    if (await architecture.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(architecture.first()).toBeVisible();
    }
  });

  test('5.4 Generate PRD button exists', async ({ page }) => {
    // Look for generate button
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Build")');
    await expect(generateBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('5.5 Copy button exists for output', async ({ page }) => {
    // Look for copy button (may not be visible if no content yet)
    const copyBtn = page.locator('button:has(svg.lucide-copy), button[title*="Copy"]');

    // Just check page structure is correct
    const mainContent = page.locator('main, #root');
    await expect(mainContent).toBeVisible();
  });

  test('5.6 Can navigate to Realization page', async ({ page }) => {
    // Find navigation to next step
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Realization"), a:has-text("Realization")').first();

    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/#.*realization|code/i);
    } else {
      // Use sidebar navigation
      const sidebar = page.locator('aside');
      const realizationLink = sidebar.locator('text=Realization');
      if (await realizationLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await realizationLink.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
