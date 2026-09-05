import { test, expect } from '@playwright/test';

test.describe('Inspect Pokies Animation and Card Heights', () => {
  test('Verify equal card heights, leftover tag, reload button, and 3D pokies spin', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 950 });
    await page.goto('/');

    // 1. Load sample data if needed
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample Household Data/i });
    if (await loadSampleBtn.isVisible()) {
      await loadSampleBtn.click();
      await page.waitForTimeout(300);
    }

    // 2. Select 14-day duration to test multiple rows with fresh and leftover cards
    await page.selectOption('#plan-duration', '14');
    await page.waitForTimeout(300);

    // 3. Roll schedule and capture mid-spin
    const rollBtn = page.getByRole('button', { name: /Roll Schedule/i });
    await rollBtn.click();

    // Capture at 350ms (whirling 3D pokies drum)
    await page.waitForTimeout(350);
    await page.screenshot({ path: '/Users/streanor/.gemini/antigravity/brain/af684940-1f7d-4a21-a08d-0a19eefe21d8/verify_pokies_spin_mid.png' });

    // Wait for all cascading reels to settle (3.0s)
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/Users/streanor/.gemini/antigravity/brain/af684940-1f7d-4a21-a08d-0a19eefe21d8/verify_pokies_settled.png' });

    // Measure heights of all .slot-card elements
    const cards = page.locator('.slot-card');
    const count = await cards.count();
    console.log(`Found ${count} slot cards across 14-day schedule`);
    expect(count).toBe(14);

    const heights: number[] = [];
    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) heights.push(Math.round(box.height * 10) / 10);
    }
    console.log('Card heights:', heights);

    // Verify all card heights are strictly equal to 180px
    const allEqual = heights.every(h => h === 180);
    expect(allEqual).toBe(true);

    // Verify leftover pills exist and text is fully "Leftover"
    const leftoverPills = page.locator('.leftover-pill');
    const leftoverCount = await leftoverPills.count();
    console.log(`Found ${leftoverCount} leftover cards`);
    expect(leftoverCount).toBeGreaterThan(0);

    for (let i = 0; i < leftoverCount; i++) {
      const text = await leftoverPills.nth(i).innerText();
      expect(text.trim().toUpperCase()).toContain('LEFTOVER');
    }

    // 4. Test single-slot reroll
    const firstRerollBtn = page.locator('.slot-reroll-btn').first();
    if (await firstRerollBtn.isVisible()) {
      await firstRerollBtn.click();
      // Capture individual 3D drum reel spinning
      await page.waitForTimeout(350);
      await page.screenshot({ path: '/Users/streanor/.gemini/antigravity/brain/af684940-1f7d-4a21-a08d-0a19eefe21d8/verify_slot_reroll_spin.png' });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: '/Users/streanor/.gemini/antigravity/brain/af684940-1f7d-4a21-a08d-0a19eefe21d8/verify_slot_reroll_settled.png' });
    }

    // 5. Navigate to Settings and inspect polished reload button
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(400);

    const backupSection = page.locator('text=Local Backup & Restore');
    await backupSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: '/Users/streanor/.gemini/antigravity/brain/af684940-1f7d-4a21-a08d-0a19eefe21d8/verify_settings_reload_button.png',
      fullPage: false
    });
  });
});
