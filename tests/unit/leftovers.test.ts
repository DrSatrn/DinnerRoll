import { describe, it, expect } from 'vitest';
import { LeftoverTracker } from '../../src/lib/scheduler/leftovers';
import { generatePlan } from '../../src/lib/scheduler/engine';
import type { Meal } from '../../src/lib/domain/models';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../../src/lib/domain/constants';

const curryMeal: Meal = {
  id: 'curry-1',
  name: 'Beef Curry',
  servings: 4,
  useByDays: 3, // safe for 3 days after cook date
  category: 'Beef',
  mealTypes: ['Dinner'],
  enabled: true
};

describe('LeftoverTracker Portions and Expiry', () => {
  it('correctly tracks surplus portions and respects use-by cutoffs', () => {
    const tracker = new LeftoverTracker();
    const cookDate = '2026-09-02'; // Wednesday
    const demand = 2; // Household consumes 2 servings on Wed

    tracker.registerCookedMeal(curryMeal, cookDate, 'slot-wed', demand);
    expect(tracker.getActiveBatches().length).toBe(1);
    expect(tracker.getActiveBatches()[0].remainingPortions).toBe(2);
    expect(tracker.getActiveBatches()[0].useByDate).toBe('2026-09-05'); // Wed + 3d = Sat

    // Next day: 2026-09-03 (Thursday) inside use-by window
    const claimThu = tracker.claimLeftoverForSlot('2026-09-03', 'Dinner', 2);
    expect(claimThu).toBeDefined();
    expect(claimThu?.portionsClaimed).toBe(2);
    expect(tracker.getActiveBatches().length).toBe(0); // exhausted
  });

  it('never schedules leftovers beyond use-by date', () => {
    const tracker = new LeftoverTracker();
    const cookDate = '2026-09-01'; // useBy = 2026-09-04
    tracker.registerCookedMeal(curryMeal, cookDate, 'slot-1', 2);

    // Target date: 2026-09-05 (expired!)
    const claimExpired = tracker.claimLeftoverForSlot('2026-09-05', 'Dinner', 2);
    expect(claimExpired).toBeUndefined();
  });

  it('carries leftovers across blocked dates', () => {
    // 3 days plan: Wed (cook), Thu (blocked), Fri (eat leftovers)
    const existingSlots = [
      {
        id: 'slot-2026-09-03-dinner',
        date: '2026-09-03', // Thursday blocked
        mealPeriod: 'Dinner' as const,
        isBlocked: true,
        isLeftover: false,
        servingsConsumed: 0
      }
    ];

    const plan = generatePlan({
      startDate: '2026-09-02',
      durationDays: 3,
      mealPeriods: ['Dinner'],
      allMeals: [curryMeal],
      categories: DEFAULT_CATEGORIES,
      settings: { ...DEFAULT_SETTINGS, dinnerServingsRequired: 2 },
      historyMap: new Map(),
      existingSlots,
      prngSeed: 42
    });

    const wedSlot = plan.slots.find(s => s.date === '2026-09-02');
    const thuSlot = plan.slots.find(s => s.date === '2026-09-03');
    const friSlot = plan.slots.find(s => s.date === '2026-09-04');

    expect(wedSlot?.mealName).toBe('Beef Curry');
    expect(wedSlot?.isLeftover).toBe(false);

    expect(thuSlot?.isBlocked).toBe(true);

    // Friday should receive the unconsumed leftover from Wednesday!
    expect(friSlot?.mealName).toBe('Beef Curry');
    expect(friSlot?.isLeftover).toBe(true);
    expect(friSlot?.originDate).toBe('2026-09-02');
  });
});
