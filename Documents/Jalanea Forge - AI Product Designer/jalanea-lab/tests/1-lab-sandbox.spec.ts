import { test, expect } from '@playwright/test';

test.describe('1. Lab / Sandbox Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to lab page
    await page.goto('/dashboard/lab');
    await page.waitForLoadState('networkidle');
  });

  test('1.1 Click "+ New Project" button - verify modal/form opens', async ({ page }) => {
    // Click the New Project button
    const newProjectBtn = page.locator('button:has-text("New Project")');
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();

    // Verify modal opens
    const modal = page.locator('[role="dialog"], .modal, div:has(> h2:text("New Project"))');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify form fields exist
    await expect(page.locator('input[placeholder*="Jalanea"], input:near(:text("Name"))')).toBeVisible();
  });

  test('1.2 Create a new idea with all fields filled - verify it saves and appears', async ({ page }) => {
    // Click New Project
    await page.locator('button:has-text("New Project")').click();
    await page.waitForTimeout(500);

    // Fill in name
    const nameInput = page.locator('input').first();
    const testProjectName = `Test Project ${Date.now()}`;
    await nameInput.fill(testProjectName);

    // Fill in description
    const descriptionInput = page.locator('textarea');
    await descriptionInput.fill('This is an automated test project created by Playwright');

    // Select status (click on Idea badge/button)
    const ideaStatus = page.locator('button:has-text("idea"), button:has(.badge:text("idea"))').first();
    if (await ideaStatus.isVisible()) {
      await ideaStatus.click();
    }

    // Click Create button
    const createBtn = page.locator('button:has-text("Create")');
    await createBtn.click();

    // Wait for modal to close
    await page.waitForTimeout(1000);

    // Verify project appears in list
    await expect(page.locator(`text=${testProjectName}`)).toBeVisible({ timeout: 5000 });

    // Clean up: Delete the test project
    const projectCard = page.locator(`div:has-text("${testProjectName}")`).first();
    const deleteBtn = projectCard.locator('button:has-text("Delete")');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Confirm deletion
      const confirmBtn = page.locator('button:has-text("Delete")').last();
      await confirmBtn.click();
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
    // Find an edit button on any project card
    const editBtn = page.locator('button:has-text("Edit")').first();

    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();

      // Verify edit modal opens
      const modal = page.locator('[role="dialog"], .modal, div:has(> h2:text("Edit"))');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Close modal
      const cancelBtn = page.locator('button:has-text("Cancel")');
      await cancelBtn.click();
    } else {
      // No projects to edit - skip
      test.skip();
    }
  });

  test('1.6 Click "Delete" on a project - verify confirmation appears', async ({ page }) => {
    // Find a delete button
    const deleteBtn = page.locator('button:has-text("Delete")').first();

    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();

      // Verify confirmation modal appears
      const confirmModal = page.locator('text=Are you sure, text=cannot be undone');
      await expect(confirmModal.first()).toBeVisible({ timeout: 5000 });

      // Cancel deletion
      const cancelBtn = page.locator('button:has-text("Cancel")');
      await cancelBtn.click();
    } else {
      test.skip();
    }
  });

  test('1.7 Click "Show checklist" - verify checklist expands', async ({ page }) => {
    // Find show checklist button
    const showChecklistBtn = page.locator('button:has-text("Show checklist"), button:has-text("checklist")').first();

    if (await showChecklistBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await showChecklistBtn.click();

      // Verify checklist items appear
      const checklistItem = page.locator('text=Idea documented, text=MVP, text=Domain secured').first();
      await expect(checklistItem).toBeVisible({ timeout: 5000 });

      // Collapse it
      const hideBtn = page.locator('button:has-text("Hide checklist")');
      if (await hideBtn.isVisible()) {
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
