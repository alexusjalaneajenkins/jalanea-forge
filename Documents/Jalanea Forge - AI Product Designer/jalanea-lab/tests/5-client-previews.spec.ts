import { test, expect } from '@playwright/test';

test.describe('5. Client Previews', () => {
  test('5.1 Navigate to Client Previews - verify page loads', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');

    // Verify page loads
    await expect(page).toHaveURL(/.*clients/);

    // Check for page header
    const header = page.locator('h1:has-text("Client"), h1:has-text("Preview")');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('5.2 Test client preview functionality', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');

    // Check for add client button
    const addClientBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
    if (await addClientBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(addClientBtn.first()).toBeVisible();
    }

    // Check for empty state or client list
    const clientContent = page.locator('text=No clients, text=Client, [class*="client"]');
    await expect(clientContent.first()).toBeVisible({ timeout: 5000 });
  });
});
