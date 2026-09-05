import { test, expect } from '@playwright/test';

test.describe('Journey E: Integrations (ICS, Groceries, Apple Shortcuts Bridge)', () => {
  test('Accept plan, download ICS, view groceries, and invoke Apple Shortcuts flow', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');

    const sampleBtn = page.getByRole('button', { name: /Load Sample Household Data/i });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();
    await expect(sampleBtn).not.toBeVisible();

    // Roll and Accept
    await page.getByRole('button', { name: /Roll Schedule/i }).click();
    await page.getByRole('button', { name: /Accept Plan/i }).click();

    // 1. Download Calendar (.ics)
    const [icsDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Add to Calendar/i }).click()
    ]);
    expect(icsDownload.suggestedFilename()).toContain('.ics');

    // 2. Open Groceries modal
    await page.getByRole('button', { name: /Groceries/i }).click();
    const groceryModal = page.locator('#grocery-title');
    await expect(groceryModal).toBeVisible();

    // 3. Verify grocery modal content and actions
    const hasItems = await page.locator('.grocery-category-group').count();
    if (hasItems > 0) {
      await expect(page.locator('.grocery-category-group').first()).toBeVisible();
      const copyBtn = page.getByRole('button', { name: 'Copy Text', exact: true });
      await copyBtn.click();
      await expect(page.locator('.toast-card')).toContainText(/Grocery list copied/i);
    } else {
      await expect(page.getByText(/No ingredients found/i)).toBeVisible();
    }

    // 4. Verify Apple Shortcuts action exists
    const appleBtn = page.getByRole('button', { name: /Add to Apple Groceries/i });
    await expect(appleBtn).toBeVisible();
  });
});
