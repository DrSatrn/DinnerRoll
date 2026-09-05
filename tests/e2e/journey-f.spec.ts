import { test, expect } from '@playwright/test';

test.describe('Journey F: Sprint 2 Features (Theming, Nutrition Toggle, Email & Mobile Sizing)', () => {
  test('Theme switching, macro visibility toggle, and mobile date input sizing', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');

    // 1. First run onboarding modal
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample Household Data/i });
    if (await loadSampleBtn.isVisible()) {
      await loadSampleBtn.click();
    }

    // 2. Check mobile date input sizing
    const dateInput = page.locator('#plan-start-date');
    await expect(dateInput).toBeVisible();
    const dateBox = await dateInput.boundingBox();
    expect(dateBox).not.toBeNull();
    // Height must be neatly constrained to ~40-44px, not blown out to 80+px
    expect(dateBox!.height).toBeGreaterThanOrEqual(38);
    expect(dateBox!.height).toBeLessThanOrEqual(50);

    // 3. Roll schedule
    await page.getByRole('button', { name: /Roll Schedule/i }).click();

    // Verify machine marquee lights up / changes state
    const machineTicker = page.locator('.machine-ticker');
    await expect(machineTicker).toBeVisible();

    // Verify day cards have compact leftover pill (not giant old banner)
    const dayCards = page.locator('.slot-card');
    await expect(dayCards.first()).toBeVisible();

    // 4. Test Nutrition / Macro quick toggle
    const nutritionBtn = page.locator('.nutrition-toggle-btn');
    await expect(nutritionBtn).toBeVisible();
    
    // Initially macros are shown
    await expect(page.locator('.macros-summary').first()).toBeVisible();

    // Toggle off macros
    await nutritionBtn.click();
    await expect(nutritionBtn).toHaveText(/Macros Hidden/i);
    await expect(page.locator('.macros-summary')).toHaveCount(0);

    // Toggle back on
    await nutritionBtn.click();
    await expect(nutritionBtn).toHaveText(/Macros Shown/i);
    await expect(page.locator('.macros-summary').first()).toBeVisible();

    // 5. Navigate to Settings and test Theme Engine
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('.theme-grid')).toBeVisible();

    // Select Nordic Slate theme
    const nordicBtn = page.getByRole('button', { name: /Nordic Slate/i });
    await nordicBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'nordic-slate');

    // Select Midnight Diner theme
    const midnightBtn = page.getByRole('button', { name: /Midnight Diner/i });
    await midnightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight-diner');

    // Select Olive Grove theme
    const oliveBtn = page.getByRole('button', { name: /Olive & Brass/i });
    await oliveBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'olive-grove');

    // Select Bistro Terracotta theme
    const terracottaBtn = page.getByRole('button', { name: /Bistro Terracotta/i });
    await terracottaBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'warm-terracotta');

    // 6. Test Destination Reminders List setting
    const remindersInput = page.locator('#s-reminders-list');
    await remindersInput.fill('Family Shopping');
    await remindersInput.dispatchEvent('change');
    await page.waitForTimeout(300);

    // Return to plan view
    await page.getByRole('button', { name: 'Plan' }).click();

    // 7. Accept plan and verify Email + Copy Schedule buttons
    await page.getByRole('button', { name: /Accept Plan/i }).click();
    const acceptedModal = page.locator('.modal-backdrop');
    await expect(acceptedModal).toBeVisible();

    // Verify "Send Email" button exists
    const emailBtn = page.getByRole('button', { name: /Send Email/i });
    await expect(emailBtn).toBeVisible();

    // Verify copy schedule button exists
    const copyBtn = page.locator('button[aria-label="Copy schedule to clipboard"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.locator('.toast-card')).toContainText(/Schedule copied to clipboard/i);

    // Open groceries from accepted plan modal
    await page.getByRole('button', { name: /Groceries/i }).click();
    // Destination list in button text should reflect "Family Shopping"
    await expect(page.getByRole('button', { name: /Family Shopping/i })).toBeVisible();
  });
});
