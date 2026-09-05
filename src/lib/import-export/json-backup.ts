import { db as defaultDb, DinnerRollDB } from '../persistence/db';
import type { BackupPayload, Meal, Recipe, MealCategory, HouseholdSettings, AcceptedPlan, MealHistoryMetadata } from '../domain/models';
import { CURRENT_SCHEMA_VERSION, APP_VERSION, DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from '../domain/constants';

export interface RestoreResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function createCompleteBackup(database: DinnerRollDB = defaultDb): Promise<BackupPayload> {
  const [meals, recipes, categories, acceptedPlans, mealHistory, settingsRecord] = await Promise.all([
    database.meals.toArray(),
    database.recipes.toArray(),
    database.categories.toArray(),
    database.acceptedPlans.toArray(),
    database.mealHistory.toArray(),
    database.settings.get('current')
  ]);

  const { id: _, ...settings } = settingsRecord || { id: 'current', ...DEFAULT_SETTINGS };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    meals,
    recipes,
    categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
    settings,
    acceptedPlans,
    mealHistory
  };
}

export function validateBackupPayload(data: unknown): { isValid: boolean; error?: string; payload?: BackupPayload } {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: 'The provided backup file is not valid JSON.'
    };
  }

  const payload = data as Record<string, unknown>;

  if (typeof payload.schemaVersion !== 'number') {
    return {
      isValid: false,
      error: 'The backup file is missing schema version metadata.'
    };
  }

  if (payload.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return {
      isValid: false,
      error: `This backup was created with a newer version of DinnerRoll (schema v${payload.schemaVersion}). Please update DinnerRoll to restore this file.`
    };
  }

  if (!Array.isArray(payload.meals)) {
    return {
      isValid: false,
      error: 'This backup file is missing the meals collection.'
    };
  }

  for (const meal of payload.meals) {
    if (!meal || typeof meal !== 'object' || !meal.id || !meal.name || !meal.category) {
      return {
        isValid: false,
        error: 'One or more meal records in the backup are malformed or missing required fields.'
      };
    }
  }

  return {
    isValid: true,
    payload: {
      schemaVersion: payload.schemaVersion,
      exportedAt: typeof payload.exportedAt === 'string' ? payload.exportedAt : new Date().toISOString(),
      appVersion: typeof payload.appVersion === 'string' ? payload.appVersion : APP_VERSION,
      meals: payload.meals as Meal[],
      recipes: Array.isArray(payload.recipes) ? (payload.recipes as Recipe[]) : [],
      categories: Array.isArray(payload.categories) ? (payload.categories as MealCategory[]) : DEFAULT_CATEGORIES,
      settings: payload.settings && typeof payload.settings === 'object' ? { ...DEFAULT_SETTINGS, ...payload.settings } : DEFAULT_SETTINGS,
      acceptedPlans: Array.isArray(payload.acceptedPlans) ? (payload.acceptedPlans as AcceptedPlan[]) : [],
      mealHistory: Array.isArray(payload.mealHistory) ? (payload.mealHistory as MealHistoryMetadata[]) : []
    }
  };
}

export async function restoreCompleteBackup(
  backupData: unknown,
  database: DinnerRollDB = defaultDb
): Promise<RestoreResult> {
  const validation = validateBackupPayload(backupData);
  if (!validation.isValid || !validation.payload) {
    return {
      success: false,
      message: 'This backup file appears to be incomplete and was not imported. Your current DinnerRoll data has not been changed.',
      error: validation.error
    };
  }

  const { meals, recipes, categories, settings, acceptedPlans, mealHistory } = validation.payload;

  try {
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

        if (meals.length > 0) await database.meals.bulkPut(meals);
        if (recipes.length > 0) await database.recipes.bulkPut(recipes);
        if (categories.length > 0) await database.categories.bulkPut(categories);
        if (acceptedPlans.length > 0) await database.acceptedPlans.bulkPut(acceptedPlans);
        if (mealHistory.length > 0) await database.mealHistory.bulkPut(mealHistory);

        await database.settings.put({
          id: 'current',
          ...settings
        });
      }
    );

    return {
      success: true,
      message: `Successfully restored ${meals.length} meals, ${recipes.length} recipes, and ${acceptedPlans.length} accepted plans.`
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return {
      success: false,
      message: 'An error occurred during restore. Your previous data was preserved.',
      error: message
    };
  }
}
