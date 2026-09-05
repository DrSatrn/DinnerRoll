import type { Meal, MealPeriod, PlanConstraint, RelaxationWarning, MealHistoryMetadata } from '../domain/models';
import { diffInDays } from './date-utils';

export interface EligibilityContext {
  targetDate: string;
  mealPeriod: MealPeriod;
  slotId: string;
  defaultMinimumRepeatWeeks: number;
  historyMap: Map<string, MealHistoryMetadata>;
  inPlanLastServedDates: Map<string, string>; // mealId -> date string
  constraints: PlanConstraint[];
  planAverageCaloriesTarget?: number;
  currentPlanMeals: Meal[]; // meals already placed in current plan
}

export interface EligibilityFilterResult {
  eligibleMeals: Meal[];
  relaxationLevel: number;
  warning?: RelaxationWarning;
}

export function matchesConstraint(meal: Meal, constraint: PlanConstraint): boolean {
  let mealValue: number | string | undefined;

  switch (constraint.metric) {
    case 'calories':
      mealValue = meal.caloriesPerServing;
      break;
    case 'protein':
      mealValue = meal.proteinGramsPerServing;
      break;
    case 'fat':
      mealValue = meal.fatGramsPerServing;
      break;
    case 'carbs':
      mealValue = meal.carbsGramsPerServing;
      break;
    case 'category':
      mealValue = meal.category.toLowerCase();
      break;
  }

  if (mealValue === undefined) {
    // If meal doesn't specify macro and constraint is macro, treat as not matching constraint
    return false;
  }

  if (typeof mealValue === 'string') {
    const targetVal = String(constraint.value).toLowerCase();
    if (constraint.operator === '==') return mealValue === targetVal;
    return false;
  }

  const numVal = Number(mealValue);
  const targetNum = Number(constraint.value);

  if (constraint.operator === '<=') return numVal <= targetNum;
  if (constraint.operator === '>=') return numVal >= targetNum;
  if (constraint.operator === '==') return numVal === targetNum;

  return true;
}

/**
 * Filter meals by non-relaxable hard invariants:
 * - Meal must be enabled
 * - Meal must support the slot's meal period
 */
export function filterHardInvariants(meals: Meal[], mealPeriod: MealPeriod): Meal[] {
  return meals.filter(m => m.enabled !== false && m.mealTypes.includes(mealPeriod));
}

/**
 * Checks repeat window compliance for a given meal.
 */
export function checkRepeatCompliance(
  meal: Meal,
  context: EligibilityContext,
  relaxationLevel: number
): boolean {
  // Find most recent appearance (accepted history or earlier in current plan)
  const inPlanDate = context.inPlanLastServedDates.get(meal.id);
  const historyDate = context.historyMap.get(meal.id)?.lastServedDate;

  let mostRecentDate: string | undefined;
  if (inPlanDate && historyDate) {
    mostRecentDate = inPlanDate > historyDate ? inPlanDate : historyDate;
  } else {
    mostRecentDate = inPlanDate || historyDate;
  }

  if (!mostRecentDate) return true; // never served, always compliant

  const daysSince = diffInDays(context.targetDate, mostRecentDate);
  if (daysSince <= 0) return false; // same day repeat not allowed

  // Level 3 or higher: meal-specific repeat override relaxed
  // Level 1 or higher: default repeat period relaxed
  if (meal.minimumRepeatWeeks !== undefined) {
    if (relaxationLevel >= 3) {
      return daysSince >= 1; // allow repeat
    }
    return daysSince >= meal.minimumRepeatWeeks * 7;
  }

  // Uses default repeat weeks
  if (relaxationLevel >= 1) {
    return daysSince >= 1; // allow repeat
  }

  return daysSince >= context.defaultMinimumRepeatWeeks * 7;
}

/**
 * Check slot and plan constraints for a meal.
 */
export function checkConstraintsCompliance(
  meal: Meal,
  context: EligibilityContext,
  relaxationLevel: number
): boolean {
  // Level 4: nutrition constraints relaxed
  // Level 2: category constraints relaxed
  for (const constraint of context.constraints) {
    // Only check constraints applicable to this slot or plan-wide
    if (constraint.target === 'slot' && constraint.slotId && constraint.slotId !== context.slotId) {
      continue;
    }

    if (constraint.metric === 'category') {
      if (relaxationLevel >= 2) continue; // relaxed category
      if (!matchesConstraint(meal, constraint)) return false;
    } else {
      // Nutrition constraint
      if (relaxationLevel >= 4) continue; // relaxed nutrition
      if (!matchesConstraint(meal, constraint)) return false;
    }
  }

  return true;
}

/**
 * Evaluates candidates through relaxation levels 0 through 4.
 * Returns the highest priority level that produces candidates.
 */
export function findEligibleMealsWithRelaxation(
  allMeals: Meal[],
  context: EligibilityContext
): EligibilityFilterResult {
  const basePool = filterHardInvariants(allMeals, context.mealPeriod);
  if (basePool.length === 0) {
    return { eligibleMeals: [], relaxationLevel: 0 };
  }

  // Level 0: Strict - all configured rules satisfied
  const level0 = basePool.filter(
    m => checkRepeatCompliance(m, context, 0) && checkConstraintsCompliance(m, context, 0)
  );
  if (level0.length > 0) {
    return { eligibleMeals: level0, relaxationLevel: 0 };
  }

  // Level 1: Relax default repeat period
  const level1 = basePool.filter(
    m => checkRepeatCompliance(m, context, 1) && checkConstraintsCompliance(m, context, 1)
  );
  if (level1.length > 0) {
    return {
      eligibleMeals: level1,
      relaxationLevel: 1,
      warning: {
        level: 1,
        ruleCategory: 'Repeat Frequency',
        description: 'Standard repeat interval relaxed to find an eligible meal.'
      }
    };
  }

  // Level 2: Relax category distribution preferences
  const level2 = basePool.filter(
    m => checkRepeatCompliance(m, context, 2) && checkConstraintsCompliance(m, context, 2)
  );
  if (level2.length > 0) {
    return {
      eligibleMeals: level2,
      relaxationLevel: 2,
      warning: {
        level: 2,
        ruleCategory: 'Category Preference',
        description: 'Category constraint relaxed to fulfill schedule.'
      }
    };
  }

  // Level 3: Relax meal-specific repeat overrides
  const level3 = basePool.filter(
    m => checkRepeatCompliance(m, context, 3) && checkConstraintsCompliance(m, context, 3)
  );
  if (level3.length > 0) {
    return {
      eligibleMeals: level3,
      relaxationLevel: 3,
      warning: {
        level: 3,
        ruleCategory: 'Meal Repeat Override',
        description: 'Custom meal repeat frequency relaxed.'
      }
    };
  }

  // Level 4: Relax optional nutrition constraints
  const level4 = basePool.filter(
    m => checkRepeatCompliance(m, context, 4) && checkConstraintsCompliance(m, context, 4)
  );
  if (level4.length > 0) {
    return {
      eligibleMeals: level4,
      relaxationLevel: 4,
      warning: {
        level: 4,
        ruleCategory: 'Nutrition Constraints',
        description: 'Advanced nutrition targets relaxed to ensure every slot is filled.'
      }
    };
  }

  // Absolute fallback: any meal meeting hard invariants
  return {
    eligibleMeals: basePool,
    relaxationLevel: 4,
    warning: {
      level: 4,
      ruleCategory: 'All Constraints',
      description: 'Constraints relaxed to provide a scheduled meal.'
    }
  };
}
