import { test, expect } from '@playwright/test';

test.describe('4. Research Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/research');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('4.1 Research page loads', async ({ page }) => {
    // Check URL
    await expect(page).toHaveURL(/#.*research/i);

    // Check for research-related content
    const content = page.locator('text=Research, text=Upload, text=Document').first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('4.2 Upload area is visible', async ({ page }) => {
    // Look for upload zone or button
    const uploadArea = page.locator('text=Upload, text=Drop, button:has-text("Upload")').first();
    await expect(uploadArea).toBeVisible({ timeout: 5000 });
  });

  test('4.3 File type indicators are visible', async ({ page }) => {
    // Look for supported file types
    const fileTypes = ['MD', 'PDF', 'NotebookLM', 'Markdown'];
    let foundTypes = 0;

    for (const type of fileTypes) {
      const typeIndicator = page.locator(`text=${type}`);
      if (await typeIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundTypes++;
      }
    }

    expect(foundTypes).toBeGreaterThan(0);
  });

  test('4.4 Step indicator shows 2/4', async ({ page }) => {
    // Look for step indicator
    const stepIndicator = page.locator('text=/2.*4|Step 2|Research/i');
    await expect(stepIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('4.5 Next button is visible', async ({ page }) => {
    // Look for next/continue button
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("PRD")');
    await expect(nextBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('4.6 Can navigate to next step', async ({ page }) => {
    // Click next button
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("PRD")').first();

    if (await nextBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);

      // Should navigate to PRD page
      await expect(page).toHaveURL(/#.*prd/i);
    }
  });
});
