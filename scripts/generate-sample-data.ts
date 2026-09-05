import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getSampleHouseholdBackup, SAMPLE_MEALS } from '../src/lib/domain/sample-data';
import { exportMealsToCSV } from '../src/lib/import-export/csv-exporter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const examplesDir = path.join(rootDir, 'data', 'examples');
if (!fs.existsSync(examplesDir)) {
  fs.mkdirSync(examplesDir, { recursive: true });
}

// 1. Write sample-household.json
const backupData = getSampleHouseholdBackup();
const jsonPath = path.join(examplesDir, 'sample-household.json');
fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf-8');
console.log(`Wrote ${jsonPath} (${backupData.meals.length} meals, ${backupData.recipes.length} recipes)`);

// 2. Write sample-meals.csv
const csvContent = exportMealsToCSV(SAMPLE_MEALS);
const csvPath = path.join(examplesDir, 'sample-meals.csv');
fs.writeFileSync(csvPath, csvContent, 'utf-8');
console.log(`Wrote ${csvPath} (${SAMPLE_MEALS.length} meals)`);
