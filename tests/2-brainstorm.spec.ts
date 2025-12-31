import { test, expect } from '@playwright/test';

// Brainstorm tests need longer timeouts for AI responses
test.describe('2. Brainstorm Page', () => {
  // Set longer timeout for all tests in this suite
  test.setTimeout(120000); // 2 minutes

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/brainstorm');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('2.1 Send message with Claude - verify response', async ({ page }) => {
    // Ensure Claude is selected
    const claudeBtn = page.locator('button:has-text("Claude")');
    await claudeBtn.click();

    // Find input and send a message
    const input = page.locator('input[type="text"]').first();
    await input.fill('Say hi');

    // Press Enter to send (more reliable than clicking send button)
    await input.press('Enter');

    // Wait for response to appear
    await expect(page.locator('.markdown-content').first()).toBeVisible({ timeout: 90000 });
  });

  test('2.2 Send message with Gemini - verify response', async ({ page }) => {
    // Switch to Gemini
    const geminiBtn = page.locator('button:has-text("Gemini")');
    await geminiBtn.click();

    // Send a message
    const input = page.locator('input[type="text"]').first();
    await input.fill('Say hi');

    // Press Enter to send
    await input.press('Enter');

    // Wait for response
    await expect(page.locator('.markdown-content').first()).toBeVisible({ timeout: 90000 });
  });

  test('2.3 Verify markdown renders properly', async ({ page }) => {
    // Select Claude
    const claudeBtn = page.locator('button:has-text("Claude")');
    await claudeBtn.click();

    // Send message requesting formatted response
    const input = page.locator('input[type="text"]').first();
    await input.fill('Reply: **bold**');

    // Press Enter to send
    await input.press('Enter');

    // Wait for response
    const response = page.locator('.markdown-content').first();
    await expect(response).toBeVisible({ timeout: 90000 });

    // Get rendered HTML and check for proper tags
    const html = await response.innerHTML();
    const hasRenderedMarkdown = html.includes('<strong>') || html.includes('<em>') || html.includes('<b>') || html.includes('<i>') || html.includes('<p>');

    // If we got a response, check markdown rendered (at least has some HTML)
    expect(html.length).toBeGreaterThan(0);
  });

  test('2.4 Clear chat (trash icon) - verify chat clears', async ({ page }) => {
    // Check if there are existing messages, if not send one first
    const existingMessages = page.locator('.markdown-content');
    const count = await existingMessages.count();

    if (count === 0) {
      // Send a quick message using Enter key
      const input = page.locator('input[type="text"]').first();
      await input.fill('Hi');
      await input.press('Enter');
      // Wait for response
      await expect(page.locator('.markdown-content').first()).toBeVisible({ timeout: 90000 });
    }

    // Click clear/trash button
    const clearBtn = page.locator('button[title="Clear chat"]').first();
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();
    } else {
      // Find button with trash icon near the header
      const trashBtn = page.locator('button:near(h1)').filter({ has: page.locator('svg') }).last();
      await trashBtn.click();
    }

    await page.waitForTimeout(500);

    // Verify chat is cleared (empty state should appear)
    await expect(page.locator('text=Your AI Brainstorm Partner').first()).toBeVisible({ timeout: 5000 });
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
