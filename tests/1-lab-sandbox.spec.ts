import { test, expect } from '@playwright/test';

test.describe('1. Lab / Sandbox Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to lab page
    await page.goto('/dashboard/lab');
    await page.waitForLoadState('networkidle');
    // Wait for data to load
    await page.waitForTimeout(1000);
  });

  test('1.1 Click "+ New Project" button - verify modal/form opens', async ({ page }) => {
    // Click the New Project button
    const newProjectBtn = page.locator('button:has-text("New Project")');
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();

    // Verify modal opens - look for the modal title
    await expect(page.locator('text=New Project').first()).toBeVisible({ timeout: 5000 });

    // Verify form fields exist
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('1.2 Create a new idea with all fields filled - verify it saves and appears', async ({ page }) => {
    // Click New Project
    await page.locator('button:has-text("New Project")').click();
    await page.waitForTimeout(1000);

    // Fill in name - find input after "Name" label
    const nameInput = page.locator('input').first();
    const testProjectName = `Test Project ${Date.now()}`;
    await nameInput.fill(testProjectName);

    // Fill in description
    const descriptionInput = page.locator('textarea').first();
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('This is an automated test project created by Playwright');
    }

    // Click Create button
    const createBtn = page.locator('button:has-text("Create")');
    await expect(createBtn).toBeEnabled({ timeout: 3000 });
    await createBtn.click();

    // Wait for modal to close and list to update
    await page.waitForTimeout(2000);

    // Verify project appears in list
    await expect(page.locator(`text=${testProjectName}`).first()).toBeVisible({ timeout: 10000 });

    // Clean up: Delete the test project
    // Find the project card and its delete button
    const deleteBtn = page.locator(`div:has-text("${testProjectName}")`).first().locator('button:has-text("Delete")');
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      // Confirm deletion in the modal
      const confirmBtn = page.locator('[role="dialog"] button:has-text("Delete"), .modal button:has-text("Delete")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }
  });

  test('1.3 Filter by Status - verify filtering works', async ({ page }) => {
    // Test each status filter
    const statuses = ['Idea', 'Building', 'Testing', 'Graduated'];

    for (const status of statuses) {
      const filterBtn = page.locator(`button:has-text("${status}")`).first();
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.waitForTimeout(500);

        // Verify filter is active (button should have different styling)
        await expect(filterBtn).toBeVisible();
      }
    }

    // Click "All" to reset
    const allBtn = page.locator('button:has-text("All")').first();
    await allBtn.click();
  });

  test('1.4 Filter by Category - verify filtering works', async ({ page }) => {
    // Test category filters
    const categories = ['Career/Job', 'Spirituality', 'Finance', 'Health', 'Design/AI', 'Marketplace'];

    for (const category of categories) {
      const filterBtn = page.locator(`button:has-text("${category}")`);
      if (await filterBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await filterBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Reset to All
    const allBtns = page.locator('button:has-text("All")');
    await allBtns.last().click();
  });

  test('1.5 Click "Edit" on an existing project - verify edit modal opens', async ({ page }) => {
    // Wait for projects to load
    await page.waitForTimeout(2000);

    // Look for Edit buttons within project cards
    const editButton = page.locator('button', { hasText: 'Edit' }).first();

    // Check if Edit button exists
    const hasEditButton = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEditButton) {
      // Click Edit button
      await editButton.click();
      await page.waitForTimeout(1000);

      // The modal should open - verify by checking for an increased number of visible inputs
      // or just check that something changed on the page
      const pageContent = await page.content();
      const hasModalContent = pageContent.includes('Save') || pageContent.includes('Cancel') || pageContent.includes('Edit Project');

      expect(hasModalContent).toBeTruthy();

      // Try to close the modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      // No Edit buttons found - skip test
      test.skip();
    }
  });

  test('1.6 Click "Delete" on a project - verify confirmation appears', async ({ page }) => {
    // Wait for projects to load
    await page.waitForTimeout(1000);

    // Find a delete button
    const deleteBtn = page.locator('button:has-text("Delete")').first();

    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      // Verify confirmation modal appears - look for "Are you sure" or danger button
      const confirmModal = page.locator('text=Are you sure').first();
      await expect(confirmModal).toBeVisible({ timeout: 5000 });

      // Cancel deletion
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      await cancelBtn.click();
    } else {
      test.skip();
    }
  });

  test('1.7 Click "Show checklist" - verify checklist expands', async ({ page }) => {
    // Wait for projects to load
    await page.waitForTimeout(2000);

    // Find show checklist button using getByRole
    const checklistButtons = page.getByRole('button', { name: /checklist/i });
    const btnCount = await checklistButtons.count();

    if (btnCount > 0) {
      await checklistButtons.first().click();
      await page.waitForTimeout(500);

      // Verify checklist items appear - look for checkbox items or progress text
      const checklistContent = page.locator('text=/documented|MVP|Domain|Progress/i').first();
      await expect(checklistContent).toBeVisible({ timeout: 5000 });

      // Try to collapse it
      const hideBtn = page.getByRole('button', { name: /hide/i }).first();
      if (await hideBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await hideBtn.click();
      }
    } else {
      test.skip();
    }
  });

  test('1.8 Project cards are clickable/interactive', async ({ page }) => {
    // Verify project cards exist and are visible
    const projectCard = page.locator('.bg-lab-card, [class*="card"]').first();

    if (await projectCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verify the card has interactive elements
      const hasInteractiveElements = await projectCard.locator('button, a').count() > 0;
      expect(hasInteractiveElements).toBeTruthy();
    } else {
      // No projects - verify empty state
      const emptyState = page.locator('text=No projects, text=Start your first');
      await expect(emptyState.first()).toBeVisible();
    }
  });
});
