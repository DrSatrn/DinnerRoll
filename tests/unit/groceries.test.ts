import { describe, it, expect } from 'vitest';
import { generateGroceryList } from '../../src/lib/integrations/groceries';
import { createShortcutPayload, buildShortcutUrl } from '../../src/lib/integrations/shortcuts';
import type { ScheduledSlot, Meal, Recipe } from '../../src/lib/domain/models';

const testRecipe: Recipe = {
  id: 'recipe-curry',
  name: 'Curry',
  servingBasis: 4, // 4-portion recipe basis
  ingredients: [
    { id: 'i1', recipeId: 'recipe-curry', name: 'Chicken Breast', quantity: 500, unit: 'g', category: 'Meat' },
    { id: 'i2', recipeId: 'recipe-curry', name: 'Coconut Milk', quantity: 400, unit: 'ml', category: 'Pantry' },
    { id: 'i3', recipeId: 'recipe-curry', name: 'Curry Powder', quantity: 1, unit: 'tbsp', category: 'Pantry' }
  ]
};

const secondRecipe: Recipe = {
  id: 'recipe-roast',
  name: 'Roast Chicken',
  servingBasis: 4,
  ingredients: [
    // Same ingredient 'Chicken Breast' in grams -> should aggregate!
    { id: 'i4', recipeId: 'recipe-roast', name: 'Chicken Breast', quantity: 750, unit: 'g', category: 'Meat' },
    { id: 'i5', recipeId: 'recipe-roast', name: 'Curry Powder', quantity: 2, unit: 'tbsp', category: 'Pantry' }
  ]
};

const testMeals: Meal[] = [
  {
    id: 'm-curry',
    name: 'Curry',
    servings: 4,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Dinner'],
    recipeId: 'recipe-curry',
    enabled: true
  },
  {
    id: 'm-roast',
    name: 'Roast Chicken',
    servings: 4,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Dinner'],
    recipeId: 'recipe-roast',
    enabled: true
  }
];

describe('Grocery Generation & Aggregation', () => {
  it('aggregates ingredients with matching normalized units across multiple meals', () => {
    const slots: ScheduledSlot[] = [
      {
        id: 's1',
        date: '2026-09-01',
        mealPeriod: 'Dinner',
        mealId: 'm-curry',
        mealName: 'Curry',
        isBlocked: false,
        isLeftover: false,
        servingsConsumed: 2
      },
      {
        id: 's2',
        date: '2026-09-04',
        mealPeriod: 'Dinner',
        mealId: 'm-roast',
        mealName: 'Roast Chicken',
        isBlocked: false,
        isLeftover: false,
        servingsConsumed: 2
      }
    ];

    const result = generateGroceryList(slots, testMeals, [testRecipe, secondRecipe]);

    // Chicken Breast: 500g + 750g = 1250g -> 1.25 kg
    const chickenItem = result.items.find(i => i.name === 'Chicken Breast');
    expect(chickenItem).toBeDefined();
    expect(chickenItem?.quantity).toBe(1.25);
    expect(chickenItem?.unit).toBe('kg');

    // Curry Powder: 1 tbsp + 2 tbsp = 3 tbsp
    const curryPowder = result.items.find(i => i.name === 'Curry Powder');
    expect(curryPowder).toBeDefined();
    expect(curryPowder?.quantity).toBe(3);
    expect(curryPowder?.unit).toBe('tbsp');
  });

  it('never double-counts ingredients for leftover slots', () => {
    const slots: ScheduledSlot[] = [
      {
        id: 's1',
        date: '2026-09-01',
        mealPeriod: 'Dinner',
        mealId: 'm-curry',
        mealName: 'Curry',
        isBlocked: false,
        isLeftover: false, // fresh cook
        servingsConsumed: 2
      },
      {
        id: 's2',
        date: '2026-09-02',
        mealPeriod: 'Dinner',
        mealId: 'm-curry',
        mealName: 'Curry',
        isBlocked: false,
        isLeftover: true, // leftover from s1
        servingsConsumed: 2
      }
    ];

    const result = generateGroceryList(slots, testMeals, [testRecipe]);

    // Should only count once (from s1 fresh cook)
    const chickenItem = result.items.find(i => i.name === 'Chicken Breast');
    expect(chickenItem?.quantity).toBe(500);
    expect(chickenItem?.unit).toBe('g');
  });

  it('generates a valid Apple Shortcut URL payload', () => {
    const items = [
      { name: 'Apples', quantity: 6, unit: 'item', category: 'Produce', sourceMeals: ['Fruit Bowl'] }
    ];

    const payload = createShortcutPayload(items);
    expect(payload.source).toBe('DinnerRoll');
    expect(payload.version).toBe('1.0');
    expect(payload.items[0].name).toBe('Apples');
    expect(payload.items[0].display).toBe('6 item Apples');

    const url = buildShortcutUrl(items, 'DinnerRoll Groceries');
    expect(url.startsWith('shortcuts://run-shortcut?name=DinnerRoll%20Groceries')).toBe(true);
    expect(url).toContain('text=');
  });
});
