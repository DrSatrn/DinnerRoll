import { test, expect } from '@playwright/test';

test.describe('Journey A: Core Schedule Flow', () => {
  test('Launch, load sample data, block a day, roll, accept, and inspect plan', async ({ page }) => {
    await page.goto('/');

    // 1. First run onboarding modal appears
    const onboardingModal = page.locator('.modal-backdrop');
    await expect(onboardingModal).toBeVisible();

    // 2. Click "Load Sample Household Data"
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample Household Data/i });
    await loadSampleBtn.click();

    // Modal should close and toast should appear
    await expect(onboardingModal).not.toBeVisible();

    // 3. Verify 7 day schedule grid is present
    const dayColumns = page.locator('.day-column');
    await expect(dayColumns).toHaveCount(7);

    // 4. Block day 3 (Wednesday)
    const day3Slot = dayColumns.nth(2).locator('.slot-card');
    const blockBtn = day3Slot.locator('.block-toggle-btn');
    await blockBtn.click();
    await expect(day3Slot).toHaveClass(/blocked/);

    // 5. Click "Roll Schedule"
    const rollBtn = page.getByRole('button', { name: /Roll Schedule/i });
    await rollBtn.click();

    // Day 3 should remain blocked; other days should have meals
    await expect(day3Slot.locator('.blocked-label')).toHaveText('Blocked');
    const day1Slot = dayColumns.nth(0).locator('.slot-card');
    await expect(day1Slot.locator('.meal-name')).toBeVisible();

    // 6. Click "Accept Plan"
    const acceptBtn = page.getByRole('button', { name: /Accept Plan/i });
    await acceptBtn.click();

    // 7. Accepted plan modal should open
    const acceptedModal = page.locator('.modal-backdrop');
    await expect(acceptedModal).toBeVisible();
    await expect(acceptedModal.locator('#plan-modal-title')).toBeVisible();

    // Check action buttons in accepted plan modal
    await expect(page.getByRole('button', { name: /Groceries/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to Calendar/i })).toBeVisible();
  });
});
