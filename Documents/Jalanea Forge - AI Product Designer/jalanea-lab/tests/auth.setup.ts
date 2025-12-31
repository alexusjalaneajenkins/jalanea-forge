import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Go to the login page
  await page.goto('/');

  // Wait for login page to load
  await page.waitForLoadState('networkidle');

  // Check if we're on login page (has password input)
  const passwordInput = page.locator('input[type="password"]');

  if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Enter the password
    await passwordInput.fill('jalanea_e37254281em');

    // Click login/submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Enter")');
    await submitButton.click();

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  }

  // Verify we're logged in by checking for dashboard elements
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });

  // Save auth state
  await page.context().storageState({ path: authFile });
});
