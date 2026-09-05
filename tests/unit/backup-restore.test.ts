import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { DinnerRollDB } from '../../src/lib/persistence/db';
import {
  createCompleteBackup,
  restoreCompleteBackup,
  validateBackupPayload
} from '../../src/lib/import-export/json-backup';
import { loadSampleData, getAllMeals } from '../../src/lib/persistence/storage';
import { CURRENT_SCHEMA_VERSION } from '../../src/lib/domain/constants';

describe('JSON Backup & Restore Round-Trip', () => {
  let testDb: DinnerRollDB;

  beforeEach(async () => {
    testDb = new DinnerRollDB('BackupTestDB-' + Math.random().toString(36).substring(2, 9));
    await testDb.open();
  });

  it('completes a full round-trip export and restore', async () => {
    // 1. Seed with sample household data (30 meals, recipes, etc.)
    await loadSampleData(testDb);
    const initialMeals = await getAllMeals(testDb);
    expect(initialMeals.length).toBe(30);

    // 2. Export complete backup
    const backup = await createCompleteBackup(testDb);
    expect(backup.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(backup.meals.length).toBe(30);
    expect(backup.recipes.length).toBe(14);

    // 3. Clear database in a fresh instance
    const restoreDb = new DinnerRollDB('RestoreTargetDB-' + Math.random().toString(36).substring(2, 9));
    await restoreDb.open();

    // 4. Restore backup into target database
    const result = await restoreCompleteBackup(backup, restoreDb);
    expect(result.success).toBe(true);

    const restoredMeals = await getAllMeals(restoreDb);
    expect(restoredMeals.length).toBe(30);
    expect(restoredMeals[0].name).toBe(initialMeals[0].name);
  });

  it('rejects malformed or incomplete backup payloads without corrupting data', async () => {
    await loadSampleData(testDb);

    // Missing schemaVersion
    const invalidPayload1 = { meals: [] };
    const res1 = await restoreCompleteBackup(invalidPayload1, testDb);
    expect(res1.success).toBe(false);
    expect(res1.message).toContain('incomplete');

    // Future unsupported schema version
    const invalidPayload2 = { schemaVersion: 999, meals: [] };
    const res2 = await restoreCompleteBackup(invalidPayload2, testDb);
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('newer version');

    // Malformed meal objects
    const invalidPayload3 = {
      schemaVersion: 1,
      meals: [{ id: 'm1' }] // missing name, category, etc.
    };
    const res3 = await restoreCompleteBackup(invalidPayload3, testDb);
    expect(res3.success).toBe(false);

    // Ensure original data was preserved
    const mealsAfterFailedAttempts = await getAllMeals(testDb);
    expect(mealsAfterFailedAttempts.length).toBe(30);
  });

  it('validates payload helper returns appropriate error messages', () => {
    expect(validateBackupPayload(null).isValid).toBe(false);
    expect(validateBackupPayload('not json').isValid).toBe(false);
    expect(validateBackupPayload({}).isValid).toBe(false);
  });
});
