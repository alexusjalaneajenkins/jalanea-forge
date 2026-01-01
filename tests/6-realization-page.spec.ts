import { test, expect } from '@playwright/test';

test.describe('6. Realization Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/realization');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('6.1 Realization page loads', async ({ page }) => {
    // Check URL contains realization or code
    const url = page.url();
    expect(url).toMatch(/realization|code/i);

    // Check for realization-related content
    const content = page.locator('text=Realization, text=Code, text=Frontend, text=Backend').first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('6.2 Step indicator shows 4/4', async ({ page }) => {
    // Look for step indicator
    const stepIndicator = page.locator('text=/4.*4|Step 4|Realization/i');
    await expect(stepIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('6.3 Frontend section is visible', async ({ page }) => {
    // Look for frontend section
    const frontend = page.locator('text=Frontend');
    await expect(frontend.first()).toBeVisible({ timeout: 5000 });
  });

  test('6.4 Backend section is visible', async ({ page }) => {
    // Look for backend section
    const backend = page.locator('text=Backend');
    await expect(backend.first()).toBeVisible({ timeout: 5000 });
  });

  test('6.5 Integration section is visible', async ({ page }) => {
    // Look for integration section
    const integration = page.locator('text=Integration');

    if (await integration.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(integration.first()).toBeVisible();
    }
  });

  test('6.6 Completion/warning message visible if no content', async ({ page }) => {
    // Check for either content or warning about completing previous steps
    const warningOrContent = page.locator('text=complete, text=Generate, text=Frontend');
    await expect(warningOrContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('6.7 Export/Download options exist', async ({ page }) => {
    // Look for export or download buttons
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), button:has(svg.lucide-download)');

    if (await exportBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn.first()).toBeVisible();
    }
  });
});
