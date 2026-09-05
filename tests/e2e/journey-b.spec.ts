import { test, expect } from '@playwright/test';

test.describe('Journey B: Full Reroll and History Stepper', () => {
  test('Roll, full reroll, return to earlier roll in session, and accept', async ({ page }) => {
    await page.goto('/');

    // Handle onboarding
    const sampleBtn = page.getByRole('button', { name: /Load Sample Household Data/i });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();
    await expect(sampleBtn).not.toBeVisible();

    // 1. Initial Roll
    const rollBtn = page.getByRole('button', { name: /Roll Schedule/i });
    await rollBtn.click();

    // Capture Day 1 meal name from Roll 1
    const day1MealName = await page.locator('.day-column').first().locator('.meal-name').innerText();

    // Verify history indicator says "Roll 1 of 1"
    const historyIndicator = page.locator('.history-indicator');
    await expect(historyIndicator).toHaveText('Roll 1 of 1');

    // 2. Perform Full Reroll
    const rerollAllBtn = page.getByRole('button', { name: /Reroll All/i });
    await expect(rerollAllBtn).toBeEnabled();
    await rerollAllBtn.click();

    // Verify history indicator is now "Roll 2 of 2"
    await expect(historyIndicator).toHaveText('Roll 2 of 2');

    // Full rerolls limit reached
    await expect(rerollAllBtn).toBeDisabled();

    // 3. Return to Previous Roll
    const prevBtn = page.getByRole('button', { name: /Previous Roll/i });
    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();

    // Verify indicator is back to "Roll 1 of 2"
    await expect(historyIndicator).toHaveText('Roll 1 of 2');

    // Verify Day 1 has returned to Roll 1's meal!
    const restoredDay1Meal = await page.locator('.day-column').first().locator('.meal-name').innerText();
    expect(restoredDay1Meal).toBe(day1MealName);

    // 4. Accept the restored previous plan
    const acceptBtn = page.getByRole('button', { name: /Accept Plan/i });
    await acceptBtn.click();

    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(day1MealName).first()).toBeVisible();
  });
});
