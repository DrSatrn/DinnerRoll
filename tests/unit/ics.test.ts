import { describe, it, expect } from 'vitest';
import { generateICSForSlots } from '../../src/lib/integrations/ics';
import type { ScheduledSlot } from '../../src/lib/domain/models';

describe('ICS Calendar Export Engine', () => {
  it('generates standard RFC 5545 compliant calendar content', () => {
    const slots: ScheduledSlot[] = [
      {
        id: 'slot-1',
        date: '2026-09-08',
        mealPeriod: 'Dinner',
        mealName: 'Lemon Herb Roast Chicken',
        category: 'Chicken',
        isBlocked: false,
        isLeftover: false,
        servingsConsumed: 2,
        calories: 520,
        protein: 42,
        fat: 22,
        carbs: 12
      },
      {
        id: 'slot-2',
        date: '2026-09-09',
        mealPeriod: 'Dinner',
        isBlocked: true,
        isLeftover: false,
        servingsConsumed: 0
      },
      {
        id: 'slot-3',
        date: '2026-09-10',
        mealPeriod: 'Dinner',
        mealName: 'Lemon Herb Roast Chicken',
        category: 'Chicken',
        isBlocked: false,
        isLeftover: true,
        originDate: '2026-09-08',
        servingsConsumed: 2,
        calories: 520,
        protein: 42
      }
    ];

    const icsString = generateICSForSlots(slots, 'Family Meals');

    // Structure validation
    expect(icsString).toContain('BEGIN:VCALENDAR');
    expect(icsString).toContain('VERSION:2.0');
    expect(icsString).toContain('PRODID:-//DinnerRoll//Household Meal Scheduler//EN');
    expect(icsString).toContain('X-WR-CALNAME:Family Meals');
    expect(icsString).toContain('END:VCALENDAR');

    // Blocked slot should NOT generate an event
    expect(icsString).not.toContain('20260909');

    // Event 1: Fresh dinner
    expect(icsString).toContain('SUMMARY:Lemon Herb Roast Chicken (Dinner)');
    expect(icsString).toContain('DTSTART:20260908T183000');
    expect(icsString).toContain('DTEND:20260908T193000');
    expect(icsString).toContain('520 kcal');

    // Event 2: Leftover dinner
    expect(icsString).toContain('SUMMARY:[Leftovers] Lemon Herb Roast Chicken (Dinner)');
    expect(icsString).toContain('Type: Leftover (Cooked on 2026-09-08)');
  });

  it('escapes special characters and folds long lines', () => {
    const slots: ScheduledSlot[] = [
      {
        id: 'slot-special',
        date: '2026-09-15',
        mealPeriod: 'Dinner',
        mealName: 'Chicken, Rice; with Very Long Special Description That Exceeds Seventy-Five Characters in Total Width',
        category: 'Chicken',
        isBlocked: false,
        isLeftover: false,
        servingsConsumed: 2
      }
    ];

    const ics = generateICSForSlots(slots);
    // Escaping commas and semicolons
    expect(ics).toContain('\\,');
    expect(ics).toContain('\\;');

    // Verify all lines in CRLF folded text are <= 75 chars (except trailing CRLF)
    const lines = ics.split('\r\n');
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });
});
