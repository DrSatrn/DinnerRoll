import { test, expect } from '@playwright/test';

test.describe('Journey C: Advanced Constraints and Single-Slot Reroll Limit', () => {
  test('Apply advanced constraint, roll schedule, perform single slot reroll and check limit', async ({ page }) => {
    await page.goto('/');

    const sampleBtn = page.getByRole('button', { name: /Load Sample Household Data/i });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();
    await expect(sampleBtn).not.toBeVisible();

    // 1. Open Advanced Constraints
    const advancedRibbon = page.getByRole('button', { name: /Advanced Constraints/i });
    await advancedRibbon.click();

    // 2. Add Whole Plan Category = Beef constraint
    await page.locator('#c-metric').selectOption('category');
    await page.locator('#c-cat-val').selectOption('Beef');
    await page.getByRole('button', { name: /Add Constraint/i }).click();

    // Verify constraint chip appears
    await expect(page.locator('.constraint-chip')).toBeVisible();
    await expect(page.locator('.chip-rule')).toContainText('category == Beef');

    // 3. Roll Schedule
    const rollBtn = page.getByRole('button', { name: /Roll Schedule/i });
    await rollBtn.click();

    // 4. Individual slot reroll
    const slotCard = page.locator('.slot-card').first();
    const rerollSlotBtn = slotCard.locator('.slot-reroll-btn');
    await expect(rerollSlotBtn).toBeVisible();
    await rerollSlotBtn.click();

    // Verify individual reroll limit (default 1) is now exhausted:
    // Slot reroll buttons should disappear
    await expect(page.locator('.slot-reroll-btn')).toHaveCount(0);
  });
});
