import { describe, it, expect } from 'vitest';
import { generatePlan } from '../../src/lib/scheduler/engine';
import { findEligibleMealsWithRelaxation } from '../../src/lib/scheduler/eligibility';
import type { Meal, PlanConstraint } from '../../src/lib/domain/models';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../../src/lib/domain/constants';

const singleMeal: Meal = {
  id: 'm-only',
  name: 'Solo Pasta',
  servings: 2,
  useByDays: 1,
  category: 'Vegetarian',
  mealTypes: ['Dinner'],
  caloriesPerServing: 500,
  enabled: true
};

describe('Rule Exhaustion & Controlled Relaxation', () => {
  it('relaxes repeat window when candidate pool is too small for strict frequency', () => {
    // 7 day plan with only 1 meal: strict 3-week repeat rule is impossible!
    // The scheduler must relax repeat rules (Level 1) rather than failing.
    const plan = generatePlan({
      startDate: '2026-09-01',
      durationDays: 7,
      mealPeriods: ['Dinner'],
      allMeals: [singleMeal],
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      prngSeed: 123
    });

    // All slots should still be populated
    expect(plan.slots.filter(s => s.mealName === 'Solo Pasta').length).toBe(7);

    // Warning must be generated explaining the relaxation
    expect(plan.warnings.length).toBeGreaterThan(0);
    expect(plan.warnings.some(w => w.ruleCategory === 'Repeat Frequency')).toBe(true);
  });

  it('relaxes nutrition constraints (Level 4) when strict targets cannot be met', () => {
    const strictConstraint: PlanConstraint = {
      id: 'c-impossible',
      target: 'plan',
      metric: 'calories',
      operator: '<=',
      value: 200 // impossible since Solo Pasta is 500 kcal
    };

    const context = {
      targetDate: '2026-09-01',
      mealPeriod: 'Dinner' as const,
      slotId: 'slot-1',
      defaultMinimumRepeatWeeks: 3,
      historyMap: new Map(),
      inPlanLastServedDates: new Map(),
      constraints: [strictConstraint],
      currentPlanMeals: []
    };

    const result = findEligibleMealsWithRelaxation([singleMeal], context);
    expect(result.eligibleMeals.length).toBe(1);
    expect(result.relaxationLevel).toBe(4);
    expect(result.warning?.ruleCategory).toBe('Nutrition Constraints');
  });

  it('never relaxes disabled status or mismatched meal period', () => {
    const disabledMeal: Meal = {
      id: 'm-disabled',
      name: 'Off-limits Steak',
      servings: 2,
      useByDays: 2,
      category: 'Beef',
      mealTypes: ['Dinner'],
      enabled: false
    };

    const breakfastOnlyMeal: Meal = {
      id: 'm-breakfast',
      name: 'Pancakes',
      servings: 2,
      useByDays: 1,
      category: 'Other',
      mealTypes: ['Breakfast'],
      enabled: true
    };

    const plan = generatePlan({
      startDate: '2026-09-01',
      durationDays: 3,
      mealPeriods: ['Dinner'],
      allMeals: [disabledMeal, breakfastOnlyMeal],
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      prngSeed: 42
    });

    // Neither disabledMeal nor breakfastOnlyMeal can EVER be placed in Dinner
    for (const slot of plan.slots) {
      expect(slot.mealId).toBeUndefined();
    }
  });
});
