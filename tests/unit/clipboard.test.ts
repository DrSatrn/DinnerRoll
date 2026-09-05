import { describe, it, expect } from 'vitest';
import {
  formatFriendlyShortDate,
  formatSchedulePlainText,
  formatScheduleHtmlTable
} from '../../src/lib/integrations/clipboard';
import { buildMailtoUrl } from '../../src/lib/integrations/email';
import { getThemePalette, THEME_LIST } from '../../src/lib/themes';
import type { AcceptedPlan } from '../../src/lib/domain/models';

const samplePlan: AcceptedPlan = {
  id: 'plan-1',
  acceptedAt: '2026-09-05T10:00:00Z',
  startDate: '2026-09-05',
  endDate: '2026-09-07',
  slots: [
    {
      id: 's1',
      date: '2026-09-05',
      mealPeriod: 'Dinner',
      mealName: 'Garlic Butter Prawn Linguine',
      category: 'Fish',
      isLeftover: false,
      isBlocked: false,
      servingsConsumed: 2,
      calories: 510,
      protein: 26
    },
    {
      id: 's2',
      date: '2026-09-06',
      mealPeriod: 'Dinner',
      mealName: 'Garlic Butter Prawn Linguine',
      category: 'Fish',
      isLeftover: true,
      isBlocked: false,
      servingsConsumed: 2,
      calories: 510,
      protein: 26
    },
    {
      id: 's3',
      date: '2026-09-07',
      mealPeriod: 'Dinner',
      isBlocked: true,
      isLeftover: false,
      servingsConsumed: 0
    }
  ],
  warnings: []
};

describe('Clipboard & Sharing Formatter', () => {
  it('formats short, friendly dates without raw ISO strings', () => {
    const formatted = formatFriendlyShortDate('2026-09-05');
    expect(formatted).toContain('Sep');
    expect(formatted).toContain('5');
    // Must not be the raw ISO date string that triggers iOS phone/date detector links
    expect(formatted).not.toBe('2026-09-05');
  });

  it('generates clean plain text without === banners and with friendly dates', () => {
    const text = formatSchedulePlainText(samplePlan, { showNutrition: true });
    expect(text).not.toContain('===');
    expect(text).toContain('DinnerRoll Plan:');
    expect(text).toContain('Garlic Butter Prawn Linguine');
    expect(text).toContain('(Leftover)');
    expect(text).toContain('[Blocked]');
    expect(text).toContain('510 kcal');
  });

  it('can hide nutrition info from plain text export', () => {
    const text = formatSchedulePlainText(samplePlan, { showNutrition: false });
    expect(text).not.toContain('510 kcal');
    expect(text).toContain('Garlic Butter Prawn Linguine');
  });

  it('generates structured HTML table with inline theme styling', () => {
    const html = formatScheduleHtmlTable(samplePlan, { showNutrition: true, themeId: 'warm-terracotta' });
    expect(html).toContain('<table');
    expect(html).toContain('DinnerRoll Schedule');
    expect(html).toContain('Garlic Butter Prawn Linguine');
    expect(html).toContain('Leftover');
    expect(html).toContain('510 kcal');
  });

  it('builds valid mailto URL with encoded subject and body', () => {
    const url = buildMailtoUrl('DinnerRoll Plan', 'Line 1\nLine 2');
    expect(url.startsWith('mailto:?subject=DinnerRoll%20Plan&body=')).toBe(true);
    expect(url).toContain('Line%201');
  });

  it('provides all 4 predefined themes with complete palettes', () => {
    expect(THEME_LIST.length).toBe(4);
    const themeIds = THEME_LIST.map(t => t.id);
    expect(themeIds).toContain('warm-terracotta');
    expect(themeIds).toContain('nordic-slate');
    expect(themeIds).toContain('midnight-diner');
    expect(themeIds).toContain('olive-grove');

    for (const theme of THEME_LIST) {
      expect(theme.colors.bgApp).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.textPrimary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.accentPrimary).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
