import type { HouseholdSettings, MealCategory, MealPeriod } from './models';

export const CURRENT_SCHEMA_VERSION = 1;
export const APP_VERSION = '1.0.0';

export const DEFAULT_MEAL_PERIODS: MealPeriod[] = ['Dinner'];
export const ALL_MEAL_PERIODS: MealPeriod[] = ['Breakfast', 'Lunch', 'Dinner'];

export const DEFAULT_CATEGORIES: MealCategory[] = [
  { id: 'cat-chicken', name: 'Chicken', weight: 1.0, isDefault: true },
  { id: 'cat-beef', name: 'Beef', weight: 1.0, isDefault: true },
  { id: 'cat-pork', name: 'Pork', weight: 1.0, isDefault: true },
  { id: 'cat-fish', name: 'Fish', weight: 1.0, isDefault: true },
  { id: 'cat-vegetarian', name: 'Vegetarian', weight: 1.0, isDefault: true },
  { id: 'cat-other', name: 'Other', weight: 1.0, isDefault: true },
];

export const DEFAULT_SETTINGS: HouseholdSettings = {
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Brisbane' : 'Australia/Brisbane',
  defaultPlanDurationDays: 7,
  defaultMealPeriods: ['Dinner'],
  breakfastServingsRequired: 2,
  lunchServingsRequired: 2,
  dinnerServingsRequired: 2,
  defaultMinimumRepeatWeeks: 3,
  maxFullPlanRerolls: 1,
  maxIndividualSlotRerolls: 1,
  reducedMotion: false,
};

export const MAX_PLAN_DURATION_DAYS = 28;
