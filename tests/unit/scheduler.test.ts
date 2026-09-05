import { describe, it, expect } from 'vitest';
import { generatePlan, rerollSingleSlot } from '../../src/lib/scheduler/engine';
import { PRNG } from '../../src/lib/scheduler/prng';
import { calculateEffectiveWeight } from '../../src/lib/scheduler/weighting';
import { filterHardInvariants, checkRepeatCompliance, matchesConstraint } from '../../src/lib/scheduler/eligibility';
import type { Meal, HouseholdSettings, MealCategory, PlanConstraint } from '../../src/lib/domain/models';
import { DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from '../../src/lib/domain/constants';

const mockMeals: Meal[] = [
  {
    id: 'm1',
    name: 'Herb Roast Chicken',
    servings: 4,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Dinner'],
    caloriesPerServing: 500,
    proteinGramsPerServing: 40,
    fatGramsPerServing: 20,
    carbsGramsPerServing: 10,
    enabled: true
  },
  {
    id: 'm2',
    name: 'Beef Stew',
    servings: 4,
    useByDays: 3,
    category: 'Beef',
    mealTypes: ['Dinner'],
    caloriesPerServing: 600,
    proteinGramsPerServing: 45,
    fatGramsPerServing: 25,
    carbsGramsPerServing: 20,
    minimumRepeatWeeks: 6, // custom override
    enabled: true
  },
  {
    id: 'm3',
    name: 'Disabled Fish Curry',
    servings: 4,
    useByDays: 2,
    category: 'Fish',
    mealTypes: ['Dinner'],
    enabled: false
  },
  {
    id: 'm4',
    name: 'Breakfast Omelette',
    servings: 2,
    useByDays: 1,
    category: 'Vegetarian',
    mealTypes: ['Breakfast'],
    enabled: true
  },
  {
    id: 'm5',
    name: 'Pork Chops',
    servings: 4,
    useByDays: 2,
    category: 'Pork',
    mealTypes: ['Dinner'],
    weightModifier: 2.0,
    enabled: true
  }
];

describe('PRNG Determinism & Distribution', () => {
  it('generates identical sequences with identical seeds', () => {
    const prng1 = new PRNG(12345);
    const prng2 = new PRNG(12345);

    for (let i = 0; i < 20; i++) {
      expect(prng1.next()).toBe(prng2.next());
    }
  });

  it('selects items according to weights', () => {
    const prng = new PRNG(42);
    const items = [
      { item: 'A', weight: 10 },
      { item: 'B', weight: 0 }
    ];

    for (let i = 0; i < 10; i++) {
      expect(prng.pickWeighted(items)).toBe('A');
    }
  });
});

describe('Eligibility & Hard Invariants', () => {
  it('filters out disabled meals and mismatched meal periods', () => {
    const dinnerPool = filterHardInvariants(mockMeals, 'Dinner');
    expect(dinnerPool.some(m => m.id === 'm3')).toBe(false); // disabled
    expect(dinnerPool.some(m => m.id === 'm4')).toBe(false); // breakfast only
    expect(dinnerPool.some(m => m.id === 'm1')).toBe(true);
    expect(dinnerPool.some(m => m.id === 'm2')).toBe(true);
    expect(dinnerPool.some(m => m.id === 'm5')).toBe(true);
  });

  it('respects default repeat weeks and custom repeat overrides', () => {
    const inPlanMap = new Map<string, string>();
    inPlanMap.set('m1', '2026-09-01');
    inPlanMap.set('m2', '2026-09-01');

    const context = {
      targetDate: '2026-09-15', // 14 days later
      mealPeriod: 'Dinner' as const,
      slotId: 'slot-1',
      defaultMinimumRepeatWeeks: 3, // 21 days
      historyMap: new Map(),
      inPlanLastServedDates: inPlanMap,
      constraints: [],
      currentPlanMeals: []
    };

    // m1 uses default 3 weeks (21 days) -> 14 days is too soon
    expect(checkRepeatCompliance(mockMeals[0], context, 0)).toBe(false);

    // m2 has minimumRepeatWeeks: 6 (42 days) -> 14 days is far too soon
    expect(checkRepeatCompliance(mockMeals[1], context, 0)).toBe(false);

    // If target date is 25 days later (2026-09-26):
    const laterContext = { ...context, targetDate: '2026-09-26' };
    // m1 (3 weeks = 21 days) is now compliant
    expect(checkRepeatCompliance(mockMeals[0], laterContext, 0)).toBe(true);
    // m2 (6 weeks = 42 days) is still not compliant
    expect(checkRepeatCompliance(mockMeals[1], laterContext, 0)).toBe(false);
  });

  it('evaluates nutrition constraints correctly', () => {
    const calConstraint: PlanConstraint = {
      id: 'c1',
      target: 'plan',
      metric: 'calories',
      operator: '<=',
      value: 550
    };

    expect(matchesConstraint(mockMeals[0], calConstraint)).toBe(true); // 500 <= 550
    expect(matchesConstraint(mockMeals[1], calConstraint)).toBe(false); // 600 not <= 550
  });
});

describe('Weighting Logic', () => {
  it('boosts weight when meal or category has positive bias', () => {
    const catWeights = new Map<string, number>([
      ['Chicken', 1.0],
      ['Pork', 1.5]
    ]);

    const context = {
      targetDate: '2026-09-05',
      categoryWeights: catWeights,
      historyMap: new Map(),
      inPlanLastServedDates: new Map(),
      relaxationLevel: 0
    };

    const chickenWeight = calculateEffectiveWeight(mockMeals[0], context);
    // Pork has weightModifier: 2.0 and category bias: 1.5
    const porkWeight = calculateEffectiveWeight(mockMeals[4], context);

    expect(porkWeight).toBeGreaterThan(chickenWeight * 2);
  });

  it('reduces diversityWeight on consecutive category slots', () => {
    const catWeights = new Map<string, number>([['Chicken', 1.0]]);
    const normalContext = {
      targetDate: '2026-09-05',
      previousSlotCategory: 'Beef',
      categoryWeights: catWeights,
      historyMap: new Map(),
      inPlanLastServedDates: new Map(),
      relaxationLevel: 0
    };
    const consecutiveContext = {
      ...normalContext,
      previousSlotCategory: 'Chicken'
    };

    const normalWeight = calculateEffectiveWeight(mockMeals[0], normalContext);
    const consecutiveWeight = calculateEffectiveWeight(mockMeals[0], consecutiveContext);

    expect(consecutiveWeight).toBeLessThan(normalWeight);
  });
});

describe('Full Plan Generation Determinism', () => {
  it('generates consistent plans with same seed and settings', () => {
    const options = {
      startDate: '2026-09-01',
      durationDays: 7,
      mealPeriods: ['Dinner' as const],
      allMeals: mockMeals,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      prngSeed: 9999
    };

    const run1 = generatePlan(options);
    const run2 = generatePlan(options);

    expect(run1.slots.length).toBe(7);
    expect(run2.slots.length).toBe(7);

    for (let i = 0; i < 7; i++) {
      expect(run1.slots[i].mealId).toBe(run2.slots[i].mealId);
      expect(run1.slots[i].isBlocked).toBe(run2.slots[i].isBlocked);
    }
  });

  it('preserves blocked slots and does not allocate meals to them', () => {
    const existingSlots = [
      {
        id: 'slot-2026-09-03-dinner',
        date: '2026-09-03',
        mealPeriod: 'Dinner' as const,
        isBlocked: true,
        isLeftover: false,
        servingsConsumed: 0
      }
    ];

    const plan = generatePlan({
      startDate: '2026-09-01',
      durationDays: 5,
      mealPeriods: ['Dinner' as const],
      allMeals: mockMeals,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      existingSlots,
      prngSeed: 123
    });

    const blockedSlot = plan.slots.find(s => s.date === '2026-09-03');
    expect(blockedSlot?.isBlocked).toBe(true);
    expect(blockedSlot?.mealId).toBeUndefined();
  });
});
