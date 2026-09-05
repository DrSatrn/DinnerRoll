import { test, expect } from '@playwright/test';

test.describe('Journey D: Full Backup, Reset, and Restore Cycle', () => {
  test('Export backup, clear all data, restore backup, and verify complete restoration', async ({ page }) => {
    await page.goto('/');

    const sampleBtn = page.getByRole('button', { name: /Load Sample Household Data/i });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();
    await expect(sampleBtn).not.toBeVisible();

    // Go to Settings
    await page.getByRole('button', { name: /Settings/i }).click();
    await expect(page.getByRole('heading', { name: /Household Settings/i })).toBeVisible();

    // 1. Trigger export backup download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export Complete Backup/i }).click()
    ]);

    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();

    // 2. Clear all local data through UI (accepting browser confirm)
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /Clear All Local Data/i }).click();

    // Onboarding modal appears because database is now empty
    const startBlankBtn = page.getByRole('button', { name: /Start Blank/i });
    await expect(startBlankBtn).toBeVisible();
    await startBlankBtn.click();

    // 3. Go to Meals view to verify state was wiped
    await page.getByRole('button', { name: 'Meals', exact: true }).click();
    await expect(page.getByText('No meals match your criteria.')).toBeVisible();

    // 4. Return to Settings and restore backup file
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Restore Backup/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(backupPath!);

    // Verify success toast
    await expect(page.locator('.toast-card')).toContainText(/Successfully restored/i);

    // 5. Verify Meals are restored
    await page.getByRole('button', { name: 'Meals', exact: true }).click();
    await expect(page.locator('.meal-card')).toHaveCount(30);
  });
});
