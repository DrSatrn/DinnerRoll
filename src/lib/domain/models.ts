export type MealPeriod = 'Breakfast' | 'Lunch' | 'Dinner';

export interface MealCategory {
  id: string;
  name: string;
  weight: number; // default 1.0, relative multiplier
  isDefault?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  servings: number;
  useByDays: number; // shelf-life for leftovers in days (e.g. 2, 3, 4)
  category: string;
  mealTypes: MealPeriod[];
  // Optional fields:
  minimumRepeatWeeks?: number;
  caloriesPerServing?: number;
  proteinGramsPerServing?: number;
  fatGramsPerServing?: number;
  carbsGramsPerServing?: number;
  recipeId?: string;
  enabled?: boolean; // defaults to true
  weightModifier?: number; // defaults to 1.0
}

export interface Ingredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'L' | 'tsp' | 'tbsp' | 'cup' | 'item' | string;
  category?: 'Produce' | 'Meat' | 'Dairy' | 'Pantry' | 'Bakery' | 'Other' | string;
}

export interface Recipe {
  id: string;
  name: string;
  servingBasis: number; // number of servings this ingredient list yields
  instructions?: string;
  notes?: string;
  ingredients: Ingredient[];
}

export interface HouseholdSettings {
  timezone: string;
  defaultPlanDurationDays: number;
  defaultMealPeriods: MealPeriod[];
  breakfastServingsRequired: number;
  lunchServingsRequired: number;
  dinnerServingsRequired: number;
  defaultMinimumRepeatWeeks: number;
  maxFullPlanRerolls: number;
  maxIndividualSlotRerolls: number;
  reducedMotion: boolean;
}

export interface ScheduledSlot {
  id: string;
  date: string; // YYYY-MM-DD local date
  mealPeriod: MealPeriod;
  isBlocked: boolean;
  mealId?: string;
  mealName?: string;
  category?: string;
  isLeftover: boolean;
  originDate?: string; // date of the original meal cook
  originSlotId?: string;
  servingsConsumed: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  relaxationLevel?: number;
}

export type ConstraintMetric = 'calories' | 'protein' | 'fat' | 'carbs' | 'category';
export type ConstraintOperator = '<=' | '>=' | '==';

export interface PlanConstraint {
  id: string;
  target: 'plan' | 'slot';
  slotId?: string; // if target === 'slot'
  metric: ConstraintMetric;
  operator: ConstraintOperator;
  value: number | string;
}

export interface RelaxationWarning {
  level: number;
  ruleCategory: string;
  description: string;
}

export interface PlanGenerationSnapshot {
  slots: ScheduledSlot[];
  warnings: RelaxationWarning[];
}

export interface PlanSession {
  id: string;
  startDate: string; // YYYY-MM-DD
  durationDays: number;
  mealPeriods: MealPeriod[];
  slots: ScheduledSlot[]; // currently displayed slots
  constraints: PlanConstraint[];
  fullPlanRerollsRemaining: number;
  individualSlotRerollsRemaining: number;
  generationHistory: PlanGenerationSnapshot[];
  historyIndex: number;
  warnings: RelaxationWarning[];
}

export interface AcceptedPlan {
  id: string;
  acceptedAt: string; // ISO string
  startDate: string;
  endDate: string;
  slots: ScheduledSlot[];
  warnings: RelaxationWarning[];
}

export interface MealHistoryMetadata {
  mealId: string;
  lastServedDate: string; // YYYY-MM-DD of latest accepted occurrence
  timesAccepted: number;
}

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  meals: Meal[];
  recipes: Recipe[];
  categories: MealCategory[];
  settings: HouseholdSettings;
  acceptedPlans: AcceptedPlan[];
  mealHistory: MealHistoryMetadata[];
}
