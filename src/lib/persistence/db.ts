import Dexie, { type EntityTable } from 'dexie';
import type {
  Meal,
  Recipe,
  MealCategory,
  HouseholdSettings,
  AcceptedPlan,
  MealHistoryMetadata,
  BackupPayload
} from '../domain/models';
import { CURRENT_SCHEMA_VERSION, APP_VERSION } from '../domain/constants';

export interface SettingsRecord extends HouseholdSettings {
  id: string; // always 'current'
}

export class DinnerRollDB extends Dexie {
  meals!: EntityTable<Meal, 'id'>;
  recipes!: EntityTable<Recipe, 'id'>;
  categories!: EntityTable<MealCategory, 'id'>;
  settings!: EntityTable<SettingsRecord, 'id'>;
  acceptedPlans!: EntityTable<AcceptedPlan, 'id'>;
  mealHistory!: EntityTable<MealHistoryMetadata, 'mealId'>;

  constructor(databaseName = 'DinnerRollDB') {
    super(databaseName);

    // Schema v1
    this.version(1).stores({
      meals: 'id, name, category, enabled',
      recipes: 'id, name',
      categories: 'id, name',
      settings: 'id',
      acceptedPlans: 'id, startDate, acceptedAt',
      mealHistory: 'mealId, lastServedDate'
    });
  }
}

export const db = new DinnerRollDB();
