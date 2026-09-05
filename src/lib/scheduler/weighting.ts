import type { Meal, MealCategory, MealHistoryMetadata } from '../domain/models';
import { diffInDays } from './date-utils';

export interface WeightCalculationContext {
  targetDate: string;
  previousSlotCategory?: string;
  categoryWeights: Map<string, number>;
  historyMap: Map<string, MealHistoryMetadata>;
  inPlanLastServedDates: Map<string, string>; // mealId -> date served earlier in current unaccepted plan
  relaxationLevel: number;
}

export function calculateEffectiveWeight(
  meal: Meal,
  context: WeightCalculationContext
): number {
  const baseWeight = 1.0;

  // 1. Category weight (relaxed to 1.0 at relaxation level >= 2)
  let categoryWeight = 1.0;
  if (context.relaxationLevel < 2) {
    const configuredWeight = context.categoryWeights.get(meal.category);
    categoryWeight = typeof configuredWeight === 'number' && configuredWeight > 0 ? configuredWeight : 1.0;
  }

  // 2. Meal-specific weight modifier
  const mealWeightModifier = typeof meal.weightModifier === 'number' && meal.weightModifier > 0
    ? meal.weightModifier
    : 1.0;

  // 3. Recency weight
  // Determine most recent served date (from accepted history or in-plan earlier occurrences)
  const inPlanDate = context.inPlanLastServedDates.get(meal.id);
  const historyDate = context.historyMap.get(meal.id)?.lastServedDate;
  
  let mostRecentDate: string | undefined;
  if (inPlanDate && historyDate) {
    mostRecentDate = inPlanDate > historyDate ? inPlanDate : historyDate;
  } else {
    mostRecentDate = inPlanDate || historyDate;
  }

  let recencyWeight = 1.0;
  if (!mostRecentDate) {
    // Never served: slight boost to encourage diversity
    recencyWeight = 1.15;
  } else {
    const daysSince = diffInDays(context.targetDate, mostRecentDate);
    if (daysSince <= 0) {
      recencyWeight = 0.1;
    } else if (daysSince < 14) {
      recencyWeight = 0.6;
    } else if (daysSince < 28) {
      recencyWeight = 0.9;
    } else {
      recencyWeight = 1.1;
    }
  }

  // 4. Diversity weight: discourage consecutive days of the same category
  let diversityWeight = 1.0;
  if (context.relaxationLevel < 2 && context.previousSlotCategory && context.previousSlotCategory === meal.category) {
    diversityWeight = 0.4; // soften consecutive category clustering
  }

  const effectiveWeight = baseWeight * categoryWeight * recencyWeight * mealWeightModifier * diversityWeight;
  return Math.max(0.01, effectiveWeight);
}
