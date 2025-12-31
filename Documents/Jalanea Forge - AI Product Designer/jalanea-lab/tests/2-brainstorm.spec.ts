import { test, expect } from '@playwright/test';

test.describe('2. Brainstorm Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/brainstorm');
    await page.waitForLoadState('networkidle');
  });

  test('2.1 Send message with Claude - verify response', async ({ page }) => {
    // Ensure Claude is selected
    const claudeBtn = page.locator('button:has-text("Claude")');
    await claudeBtn.click();

    // Find input and send a message
    const input = page.locator('input[type="text"], input[placeholder*="Brainstorm"]');
    await input.fill('Say "Hello from test" in one short sentence');

    // Click send button
    const sendBtn = page.locator('button:has(svg), button[type="submit"]').last();
    await sendBtn.click();

    // Wait for response (loading indicator should appear then disappear)
    const loadingIndicator = page.locator('text=thinking, text=loading');
    if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loadingIndicator).toBeHidden({ timeout: 60000 });
    }

    // Verify response appears
    await expect(page.locator('.markdown-content, [class*="assistant"], div:has-text("Hello")')).toBeVisible({ timeout: 60000 });
  });

  test('2.2 Send message with Gemini - verify response', async ({ page }) => {
    // Switch to Gemini
    const geminiBtn = page.locator('button:has-text("Gemini")');
    await geminiBtn.click();

    // Send a message
    const input = page.locator('input[type="text"], input[placeholder*="Brainstorm"]');
    await input.fill('Say "Gemini test successful" in one short sentence');

    const sendBtn = page.locator('button:has(svg), button[type="submit"]').last();
    await sendBtn.click();

    // Wait for response
    await page.waitForTimeout(2000);
    await expect(page.locator('.markdown-content, [class*="message"]').last()).toBeVisible({ timeout: 60000 });
  });

  test('2.3 Verify markdown renders properly', async ({ page }) => {
    // Select Claude
    const claudeBtn = page.locator('button:has-text("Claude")');
    await claudeBtn.click();

    // Send message requesting formatted response
    const input = page.locator('input[type="text"]');
    await input.fill('Reply with exactly this: **bold text** and a bullet list with 2 items');

    const sendBtn = page.locator('button:has(svg)').last();
    await sendBtn.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Check that markdown is rendered (should see <strong> or <b> tags, not raw **)
    const response = page.locator('.markdown-content').last();
    await expect(response).toBeVisible({ timeout: 60000 });

    // Verify no raw markdown asterisks are visible
    const responseText = await response.textContent();
    const hasRawMarkdown = responseText?.includes('**bold') || responseText?.includes('* ');

    // The markdown should be rendered, not raw
    if (hasRawMarkdown) {
      throw new Error('Markdown is not rendering properly - raw asterisks visible');
    }
  });

  test('2.4 Clear chat (trash icon) - verify chat clears', async ({ page }) => {
    // First send a message if chat is empty
    const existingMessages = page.locator('.markdown-content, [class*="message"]');
    if (await existingMessages.count() === 0) {
      const input = page.locator('input[type="text"]');
      await input.fill('Test message to clear');
      const sendBtn = page.locator('button:has(svg)').last();
      await sendBtn.click();
      await page.waitForTimeout(3000);
    }

    // Click clear/trash button
    const clearBtn = page.locator('button[title*="Clear"], button:has(svg.lucide-trash-2), button:has([class*="trash"])');
    await clearBtn.click();

    // Verify chat is cleared (empty state should appear)
    await expect(page.locator('text=AI Brainstorm Partner, text=Your AI')).toBeVisible({ timeout: 5000 });
  });

  test('2.5 Test suggested prompts - verify they populate input', async ({ page }) => {
    // Clear chat first if needed
    const clearBtn = page.locator('button[title*="Clear"], button:has(svg.lucide-trash-2)');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(500);
    }

    // Find a suggested prompt button
    const suggestedPrompt = page.locator('button:has-text("prioritize"), button:has-text("monetize"), button:has-text("feature ideas")').first();

    if (await suggestedPrompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      const promptText = await suggestedPrompt.textContent();
      await suggestedPrompt.click();

      // Verify input is populated
      const input = page.locator('input[type="text"]');
      const inputValue = await input.inputValue();
      expect(inputValue).toBeTruthy();
      expect(inputValue.length).toBeGreaterThan(5);
    }
  });
});
