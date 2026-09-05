import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { DinnerRollDB } from '../../src/lib/persistence/db';
import {
  acceptPlanTransaction,
  getAllAcceptedPlans,
  getMealHistoryMap
} from '../../src/lib/persistence/storage';
import { generatePlan } from '../../src/lib/scheduler/engine';
import type { AcceptedPlan, Meal } from '../../src/lib/domain/models';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../../src/lib/domain/constants';

const sampleTestMeals: Meal[] = [
  {
    id: 'meal-test-1',
    name: 'Tuscan Chicken',
    servings: 4,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Dinner'],
    enabled: true
  },
  {
    id: 'meal-test-2',
    name: 'Sirloin Steak',
    servings: 2,
    useByDays: 2,
    category: 'Beef',
    mealTypes: ['Dinner'],
    enabled: true
  }
];

describe('Accepted-History Invariant & Transient Sessions', () => {
  let testDb: DinnerRollDB;

  beforeEach(async () => {
    testDb = new DinnerRollDB('TestDB-' + Math.random().toString(36).substring(2, 9));
    await testDb.open();
  });

  it('transient rolls do NOT alter history or metadata before acceptance', async () => {
    // 1. Generate multiple transient rolls
    const roll1 = generatePlan({
      startDate: '2026-09-01',
      durationDays: 7,
      mealPeriods: ['Dinner'],
      allMeals: sampleTestMeals,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      prngSeed: 111
    });

    const roll2 = generatePlan({
      startDate: '2026-09-01',
      durationDays: 7,
      mealPeriods: ['Dinner'],
      allMeals: sampleTestMeals,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      prngSeed: 222
    });

    expect(roll1.slots.length).toBe(7);
    expect(roll2.slots.length).toBe(7);

    // Verify database remains completely empty (no accepted plans, no history)
    const plans = await getAllAcceptedPlans(testDb);
    const historyMap = await getMealHistoryMap(testDb);

    expect(plans.length).toBe(0);
    expect(historyMap.size).toBe(0);
  });

  it('explicit acceptance updates plan records and history metadata atomically', async () => {
    const planToAccept: AcceptedPlan = {
      id: 'plan-100',
      acceptedAt: '2026-09-05T12:00:00.000Z',
      startDate: '2026-09-01',
      endDate: '2026-09-07',
      slots: [
        {
          id: 'slot-1',
          date: '2026-09-01',
          mealPeriod: 'Dinner',
          mealId: 'meal-test-1',
          mealName: 'Tuscan Chicken',
          isBlocked: false,
          isLeftover: false,
          servingsConsumed: 2
        },
        {
          id: 'slot-2',
          date: '2026-09-02',
          mealPeriod: 'Dinner',
          mealId: 'meal-test-1',
          mealName: 'Tuscan Chicken',
          isBlocked: false,
          isLeftover: true,
          servingsConsumed: 2
        },
        {
          id: 'slot-3',
          date: '2026-09-03',
          mealPeriod: 'Dinner',
          mealId: 'meal-test-2',
          mealName: 'Sirloin Steak',
          isBlocked: false,
          isLeftover: false,
          servingsConsumed: 2
        }
      ],
      warnings: []
    };

    await acceptPlanTransaction(planToAccept, testDb);

    // Check accepted plans
    const storedPlans = await getAllAcceptedPlans(testDb);
    expect(storedPlans.length).toBe(1);
    expect(storedPlans[0].id).toBe('plan-100');

    // Check history map
    const history = await getMealHistoryMap(testDb);
    expect(history.has('meal-test-1')).toBe(true);
    expect(history.has('meal-test-2')).toBe(true);

    const m1Meta = history.get('meal-test-1')!;
    expect(m1Meta.timesAccepted).toBe(1);
    expect(m1Meta.lastServedDate).toBe('2026-09-02'); // latest date in this plan

    const m2Meta = history.get('meal-test-2')!;
    expect(m2Meta.timesAccepted).toBe(1);
    expect(m2Meta.lastServedDate).toBe('2026-09-03');
  });

  it('accepting an earlier session generation correctly updates history', async () => {
    // Generate Roll A
    const rollA = generatePlan({
      startDate: '2026-09-01',
      durationDays: 2,
      mealPeriods: ['Dinner'],
      allMeals: sampleTestMeals,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      prngSeed: 10
    });

    // Generate Roll B (Reroll)
    const rollB = generatePlan({
      startDate: '2026-09-01',
      durationDays: 2,
      mealPeriods: ['Dinner'],
      allMeals: sampleTestMeals,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      historyMap: new Map(),
      prngSeed: 20
    });

    // User chooses to go back and accept Roll A
    const planA: AcceptedPlan = {
      id: 'plan-session-a',
      acceptedAt: '2026-09-05T12:00:00.000Z',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
      slots: rollA.slots,
      warnings: rollA.warnings
    };

    await acceptPlanTransaction(planA, testDb);

    const storedPlans = await getAllAcceptedPlans(testDb);
    expect(storedPlans.length).toBe(1);
    expect(storedPlans[0].id).toBe('plan-session-a');
    expect(storedPlans[0].slots[0].mealId).toBe(rollA.slots[0].mealId);
  });
});
