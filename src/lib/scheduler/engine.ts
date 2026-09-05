import type {
  Meal,
  MealCategory,
  MealHistoryMetadata,
  HouseholdSettings,
  MealPeriod,
  ScheduledSlot,
  PlanConstraint,
  RelaxationWarning,
  PlanGenerationSnapshot
} from '../domain/models';
import { PRNG } from './prng';
import { addDays } from './date-utils';
import { LeftoverTracker } from './leftovers';
import { findEligibleMealsWithRelaxation, type EligibilityContext } from './eligibility';
import { calculateEffectiveWeight, type WeightCalculationContext } from './weighting';

export interface GeneratePlanOptions {
  startDate: string;
  durationDays: number;
  mealPeriods: MealPeriod[];
  allMeals: Meal[];
  categories: MealCategory[];
  settings: HouseholdSettings;
  historyMap: Map<string, MealHistoryMetadata>;
  existingSlots?: ScheduledSlot[]; // preserved blocked slots
  constraints?: PlanConstraint[];
  prngSeed?: number;
}

export interface RerollSingleSlotOptions {
  slotToReroll: ScheduledSlot;
  allSlots: ScheduledSlot[];
  allMeals: Meal[];
  categories: MealCategory[];
  settings: HouseholdSettings;
  historyMap: Map<string, MealHistoryMetadata>;
  constraints?: PlanConstraint[];
  prngSeed?: number;
}

export function generatePlan(options: GeneratePlanOptions): PlanGenerationSnapshot {
  const {
    startDate,
    durationDays,
    mealPeriods,
    allMeals,
    categories,
    settings,
    historyMap,
    existingSlots = [],
    constraints = [],
    prngSeed
  } = options;

  const prng = new PRNG(prngSeed);
  const leftoverTracker = new LeftoverTracker();
  const categoryWeightsMap = new Map<string, number>(categories.map(c => [c.name, c.weight]));
  const inPlanLastServedDates = new Map<string, string>();
  const collectedWarnings: RelaxationWarning[] = [];
  const generatedSlots: ScheduledSlot[] = [];

  // Map existing blocked statuses by date and period
  const blockedMap = new Map<string, boolean>();
  for (const s of existingSlots) {
    if (s.isBlocked) {
      blockedMap.set(`${s.date}-${s.mealPeriod}`, true);
    }
  }

  let previousCategory: string | undefined = undefined;

  for (let dayOffset = 0; dayOffset < durationDays; dayOffset++) {
    const slotDate = addDays(startDate, dayOffset);

    for (const mealPeriod of mealPeriods) {
      const slotKey = `${slotDate}-${mealPeriod}`;
      const slotId = `slot-${slotDate}-${mealPeriod.toLowerCase()}`;
      const isBlocked = blockedMap.get(slotKey) === true;

      const householdDemand =
        mealPeriod === 'Breakfast'
          ? settings.breakfastServingsRequired
          : mealPeriod === 'Lunch'
          ? settings.lunchServingsRequired
          : settings.dinnerServingsRequired;

      if (isBlocked) {
        generatedSlots.push({
          id: slotId,
          date: slotDate,
          mealPeriod,
          isBlocked: true,
          isLeftover: false,
          servingsConsumed: 0
        });
        continue;
      }

      // Check if an existing leftover batch is eligible and safe for this slot
      const leftoverClaim = leftoverTracker.claimLeftoverForSlot(slotDate, mealPeriod, householdDemand);

      if (leftoverClaim) {
        const batchMeal = leftoverClaim.batch.meal;
        generatedSlots.push({
          id: slotId,
          date: slotDate,
          mealPeriod,
          isBlocked: false,
          mealId: batchMeal.id,
          mealName: batchMeal.name,
          category: batchMeal.category,
          isLeftover: true,
          originDate: leftoverClaim.batch.originDate,
          originSlotId: leftoverClaim.batch.originSlotId,
          servingsConsumed: leftoverClaim.portionsClaimed,
          calories: batchMeal.caloriesPerServing,
          protein: batchMeal.proteinGramsPerServing,
          fat: batchMeal.fatGramsPerServing,
          carbs: batchMeal.carbsGramsPerServing
        });
        previousCategory = batchMeal.category;
        continue;
      }

      // Otherwise, select a fresh meal
      const eligibilityContext: EligibilityContext = {
        targetDate: slotDate,
        mealPeriod,
        slotId,
        defaultMinimumRepeatWeeks: settings.defaultMinimumRepeatWeeks,
        historyMap,
        inPlanLastServedDates,
        constraints,
        currentPlanMeals: generatedSlots.filter(s => !s.isBlocked && s.mealId).map(s => allMeals.find(m => m.id === s.mealId)!).filter(Boolean)
      };

      const filterResult = findEligibleMealsWithRelaxation(allMeals, eligibilityContext);

      if (filterResult.warning) {
        // Record unique warning category
        if (!collectedWarnings.some(w => w.ruleCategory === filterResult.warning!.ruleCategory)) {
          collectedWarnings.push(filterResult.warning);
        }
      }

      const eligibleMeals = filterResult.eligibleMeals;

      if (eligibleMeals.length === 0) {
        // In the extreme case where literally zero enabled meals exist for this period
        generatedSlots.push({
          id: slotId,
          date: slotDate,
          mealPeriod,
          isBlocked: false,
          mealName: 'No eligible meal',
          isLeftover: false,
          servingsConsumed: 0
        });
        continue;
      }

      // Calculate effective weights
      const weightContext: WeightCalculationContext = {
        targetDate: slotDate,
        previousSlotCategory: previousCategory,
        categoryWeights: categoryWeightsMap,
        historyMap,
        inPlanLastServedDates,
        relaxationLevel: filterResult.relaxationLevel
      };

      const weightedPool = eligibleMeals.map(meal => ({
        item: meal,
        weight: calculateEffectiveWeight(meal, weightContext)
      }));

      const chosenMeal = prng.pickWeighted(weightedPool) || eligibleMeals[0];

      // Record in plan state
      inPlanLastServedDates.set(chosenMeal.id, slotDate);
      previousCategory = chosenMeal.category;

      // Register leftovers if this cook produces surplus portions
      leftoverTracker.registerCookedMeal(chosenMeal, slotDate, slotId, householdDemand);

      generatedSlots.push({
        id: slotId,
        date: slotDate,
        mealPeriod,
        isBlocked: false,
        mealId: chosenMeal.id,
        mealName: chosenMeal.name,
        category: chosenMeal.category,
        isLeftover: false,
        servingsConsumed: Math.min(householdDemand, chosenMeal.servings),
        calories: chosenMeal.caloriesPerServing,
        protein: chosenMeal.proteinGramsPerServing,
        fat: chosenMeal.fatGramsPerServing,
        carbs: chosenMeal.carbsGramsPerServing,
        relaxationLevel: filterResult.relaxationLevel
      });
    }
  }

  return {
    slots: generatedSlots,
    warnings: collectedWarnings
  };
}

/**
 * Reroll an individual slot while respecting constraints and other plan meals.
 */
export function rerollSingleSlot(options: RerollSingleSlotOptions): { slot: ScheduledSlot; warning?: RelaxationWarning } {
  const {
    slotToReroll,
    allSlots,
    allMeals,
    categories,
    settings,
    historyMap,
    constraints = [],
    prngSeed
  } = options;

  if (slotToReroll.isBlocked) {
    return { slot: { ...slotToReroll } };
  }

  const prng = new PRNG(prngSeed);
  const categoryWeightsMap = new Map<string, number>(categories.map(c => [c.name, c.weight]));

  // In-plan dates excluding this specific slot
  const inPlanLastServedDates = new Map<string, string>();
  for (const s of allSlots) {
    if (s.id !== slotToReroll.id && !s.isBlocked && s.mealId) {
      inPlanLastServedDates.set(s.mealId, s.date);
    }
  }

  const householdDemand =
    slotToReroll.mealPeriod === 'Breakfast'
      ? settings.breakfastServingsRequired
      : slotToReroll.mealPeriod === 'Lunch'
      ? settings.lunchServingsRequired
      : settings.dinnerServingsRequired;

  const eligibilityContext: EligibilityContext = {
    targetDate: slotToReroll.date,
    mealPeriod: slotToReroll.mealPeriod,
    slotId: slotToReroll.id,
    defaultMinimumRepeatWeeks: settings.defaultMinimumRepeatWeeks,
    historyMap,
    inPlanLastServedDates,
    constraints,
    currentPlanMeals: allSlots
      .filter(s => s.id !== slotToReroll.id && !s.isBlocked && s.mealId)
      .map(s => allMeals.find(m => m.id === s.mealId)!)
      .filter(Boolean)
  };

  const filterResult = findEligibleMealsWithRelaxation(allMeals, eligibilityContext);

  // If possible, prefer a different meal than the current one
  let pool = filterResult.eligibleMeals;
  if (pool.length > 1 && slotToReroll.mealId) {
    const alternativePool = pool.filter(m => m.id !== slotToReroll.mealId);
    if (alternativePool.length > 0) {
      pool = alternativePool;
    }
  }

  const weightContext: WeightCalculationContext = {
    targetDate: slotToReroll.date,
    categoryWeights: categoryWeightsMap,
    historyMap,
    inPlanLastServedDates,
    relaxationLevel: filterResult.relaxationLevel
  };

  const weightedPool = pool.map(meal => ({
    item: meal,
    weight: calculateEffectiveWeight(meal, weightContext)
  }));

  const chosenMeal = prng.pickWeighted(weightedPool) || pool[0];

  const updatedSlot: ScheduledSlot = {
    ...slotToReroll,
    mealId: chosenMeal.id,
    mealName: chosenMeal.name,
    category: chosenMeal.category,
    isLeftover: false, // individual slot reroll replaces with fresh dish
    originDate: undefined,
    originSlotId: undefined,
    servingsConsumed: Math.min(householdDemand, chosenMeal.servings),
    calories: chosenMeal.caloriesPerServing,
    protein: chosenMeal.proteinGramsPerServing,
    fat: chosenMeal.fatGramsPerServing,
    carbs: chosenMeal.carbsGramsPerServing,
    relaxationLevel: filterResult.relaxationLevel
  };

  return { slot: updatedSlot, warning: filterResult.warning };
}
