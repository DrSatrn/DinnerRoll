import { db as defaultDb, DinnerRollDB, type SettingsRecord } from './db';
import type {
  Meal,
  Recipe,
  MealCategory,
  HouseholdSettings,
  AcceptedPlan,
  MealHistoryMetadata
} from '../domain/models';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../domain/constants';
import { SAMPLE_MEALS, SAMPLE_RECIPES } from '../domain/sample-data';

export async function isDatabaseEmpty(database: DinnerRollDB = defaultDb): Promise<boolean> {
  const mealCount = await database.meals.count();
  const planCount = await database.acceptedPlans.count();
  return mealCount === 0 && planCount === 0;
}

export async function initSettingsIfMissing(database: DinnerRollDB = defaultDb): Promise<HouseholdSettings> {
  const existing = await database.settings.get('current');
  if (existing) {
    const { id: _, ...settings } = existing;
    return settings;
  }
  const record: SettingsRecord = {
    id: 'current',
    ...DEFAULT_SETTINGS
  };
  await database.settings.put(record);
  return DEFAULT_SETTINGS;
}

export async function getSettings(database: DinnerRollDB = defaultDb): Promise<HouseholdSettings> {
  return await initSettingsIfMissing(database);
}

export async function updateSettings(
  partial: Partial<HouseholdSettings>,
  database: DinnerRollDB = defaultDb
): Promise<HouseholdSettings> {
  const current = await getSettings(database);
  const cleanPartial = JSON.parse(JSON.stringify(partial));
  const updated: SettingsRecord = {
    id: 'current',
    ...current,
    ...cleanPartial
  };
  await database.settings.put(updated);
  const { id: _, ...result } = updated;
  return result;
}

export async function getAllCategories(database: DinnerRollDB = defaultDb): Promise<MealCategory[]> {
  const list = await database.categories.toArray();
  if (list.length === 0) {
    await database.categories.bulkPut(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return list;
}

export async function saveCategory(category: MealCategory, database: DinnerRollDB = defaultDb): Promise<void> {
  await database.categories.put(category);
}

export async function deleteCategory(id: string, database: DinnerRollDB = defaultDb): Promise<void> {
  await database.categories.delete(id);
}

export async function getAllMeals(database: DinnerRollDB = defaultDb): Promise<Meal[]> {
  return await database.meals.toArray();
}

export async function getMealById(id: string, database: DinnerRollDB = defaultDb): Promise<Meal | undefined> {
  return await database.meals.get(id);
}

export async function saveMeal(meal: Meal, database: DinnerRollDB = defaultDb): Promise<void> {
  await database.meals.put(meal);
}

export async function deleteMeal(id: string, database: DinnerRollDB = defaultDb): Promise<void> {
  await database.meals.delete(id);
}

export async function getAllRecipes(database: DinnerRollDB = defaultDb): Promise<Recipe[]> {
  return await database.recipes.toArray();
}

export async function getRecipeById(id: string, database: DinnerRollDB = defaultDb): Promise<Recipe | undefined> {
  return await database.recipes.get(id);
}

export async function saveRecipe(recipe: Recipe, database: DinnerRollDB = defaultDb): Promise<void> {
  await database.recipes.put(recipe);
}

export async function deleteRecipe(id: string, database: DinnerRollDB = defaultDb): Promise<void> {
  await database.recipes.delete(id);
}

export async function getAllAcceptedPlans(database: DinnerRollDB = defaultDb): Promise<AcceptedPlan[]> {
  return await database.acceptedPlans.orderBy('startDate').reverse().toArray();
}

export async function getMealHistoryMap(database: DinnerRollDB = defaultDb): Promise<Map<string, MealHistoryMetadata>> {
  const allHistory = await database.mealHistory.toArray();
  const map = new Map<string, MealHistoryMetadata>();
  for (const h of allHistory) {
    map.set(h.mealId, h);
  }
  return map;
}

/**
 * Persist an accepted plan and update meal history metadata atomically.
 * Only explicit acceptance mutates history.
 */
export async function acceptPlanTransaction(
  plan: AcceptedPlan,
  database: DinnerRollDB = defaultDb
): Promise<void> {
  await database.transaction('rw', [database.acceptedPlans, database.mealHistory], async () => {
    // 1. Save the accepted plan
    await database.acceptedPlans.put(plan);

    // 2. Determine unique meal occurrences by mealId and their dates
    // For leftovers, the meal was technically cooked on slot.date or slot.originDate
    const mealDateMap = new Map<string, string>();

    for (const slot of plan.slots) {
      if (!slot.isBlocked && slot.mealId) {
        const slotDate = slot.date;
        const existing = mealDateMap.get(slot.mealId);
        if (!existing || slotDate > existing) {
          mealDateMap.set(slot.mealId, slotDate);
        }
      }
    }

    // 3. Update history records
    for (const [mealId, lastDate] of mealDateMap.entries()) {
      const existing = await database.mealHistory.get(mealId);
      if (existing) {
        const newerDate = existing.lastServedDate > lastDate ? existing.lastServedDate : lastDate;
        await database.mealHistory.put({
          mealId,
          lastServedDate: newerDate,
          timesAccepted: existing.timesAccepted + 1
        });
      } else {
        await database.mealHistory.put({
          mealId,
          lastServedDate: lastDate,
          timesAccepted: 1
        });
      }
    }
  });
}

export async function deleteAcceptedPlan(id: string, database: DinnerRollDB = defaultDb): Promise<void> {
  await database.acceptedPlans.delete(id);
}

export async function loadSampleData(database: DinnerRollDB = defaultDb): Promise<void> {
  await database.transaction(
    'rw',
    [
      database.meals,
      database.recipes,
      database.categories,
      database.settings,
      database.acceptedPlans,
      database.mealHistory
    ],
    async () => {
      await database.meals.clear();
      await database.recipes.clear();
      await database.categories.clear();
      await database.acceptedPlans.clear();
      await database.mealHistory.clear();

      await database.meals.bulkPut(SAMPLE_MEALS);
      await database.recipes.bulkPut(SAMPLE_RECIPES);
      await database.categories.bulkPut(DEFAULT_CATEGORIES);
      await database.settings.put({
        id: 'current',
        ...DEFAULT_SETTINGS
      });
    }
  );
}

export async function clearAllData(database: DinnerRollDB = defaultDb): Promise<void> {
  await database.transaction(
    'rw',
    [
      database.meals,
      database.recipes,
      database.categories,
      database.settings,
      database.acceptedPlans,
      database.mealHistory
    ],
    async () => {
      await database.meals.clear();
      await database.recipes.clear();
      await database.categories.clear();
      await database.acceptedPlans.clear();
      await database.mealHistory.clear();
      await database.settings.put({
        id: 'current',
        ...DEFAULT_SETTINGS
      });
    }
  );
}
