import type { Meal, ScheduledSlot, MealPeriod } from '../domain/models';
import { addDays } from './date-utils';

export interface LeftoverBatch {
  meal: Meal;
  originDate: string;
  originSlotId: string;
  remainingPortions: number;
  useByDate: string; // YYYY-MM-DD cutoff date (inclusive)
}

export class LeftoverTracker {
  private activeBatches: LeftoverBatch[] = [];

  /**
   * Register portions cooked from a newly scheduled fresh meal.
   * If portions remaining >= required demand, store the leftover batch.
   */
  registerCookedMeal(
    meal: Meal,
    originDate: string,
    originSlotId: string,
    consumedPortions: number
  ): void {
    const remaining = meal.servings - consumedPortions;
    if (remaining > 0 && meal.useByDays > 0) {
      const useByDate = addDays(originDate, meal.useByDays);
      this.activeBatches.push({
        meal,
        originDate,
        originSlotId,
        remainingPortions: remaining,
        useByDate
      });
    }
  }

  /**
   * Find an eligible leftover batch for a slot on targetDate and mealPeriod,
   * requiring requiredPortions.
   * Always prioritizes batches expiring earliest (FIFO food safety).
   */
  claimLeftoverForSlot(
    targetDate: string,
    mealPeriod: MealPeriod,
    requiredPortions: number
  ): { batch: LeftoverBatch; portionsClaimed: number } | undefined {
    // Purge expired batches
    this.activeBatches = this.activeBatches.filter(b => b.useByDate >= targetDate && b.remainingPortions > 0);

    // Sort by useByDate ascending (eat what expires first)
    this.activeBatches.sort((a, b) => a.useByDate.localeCompare(b.useByDate));

    for (const batch of this.activeBatches) {
      // Must be on or after cook date
      if (targetDate <= batch.originDate) continue;
      // Must be within food-safe use-by date
      if (targetDate > batch.useByDate) continue;
      // Must match meal period capability
      if (!batch.meal.mealTypes.includes(mealPeriod)) continue;
      // Must have enough remaining portions to satisfy household demand
      if (batch.remainingPortions >= requiredPortions) {
        batch.remainingPortions -= requiredPortions;
        if (batch.remainingPortions <= 0) {
          this.activeBatches = this.activeBatches.filter(b => b !== batch);
        }
        return { batch, portionsClaimed: requiredPortions };
      }
    }

    return undefined;
  }

  getActiveBatches(): readonly LeftoverBatch[] {
    return this.activeBatches;
  }
}
