import type { Meal, MealPeriod } from '../domain/models';

export interface CSVParseResult {
  meals: Meal[];
  errors: string[];
}

/**
 * Robust RFC 4180 compliant CSV line parser supporting quoted fields and embedded commas.
 */
export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseCSVText(csvText: string): string[][] {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows: string[][] = [];
  let accumulated = '';
  let insideQuotes = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line && !insideQuotes) continue;

    accumulated += (accumulated ? '\n' : '') + rawLine;
    
    // Count quotes
    let quoteCount = 0;
    for (const ch of accumulated) {
      if (ch === '"') quoteCount++;
    }

    if (quoteCount % 2 === 0) {
      rows.push(parseCSVLine(accumulated));
      accumulated = '';
    }
  }

  return rows;
}

function parseMealPeriods(raw: string): MealPeriod[] {
  const validPeriods: MealPeriod[] = ['Breakfast', 'Lunch', 'Dinner'];
  const cleaned = raw.replace(/"/g, '').split(/[,;|]/).map(s => s.trim());
  const periods: MealPeriod[] = [];

  for (const part of cleaned) {
    const matched = validPeriods.find(p => p.toLowerCase() === part.toLowerCase());
    if (matched && !periods.includes(matched)) {
      periods.push(matched);
    }
  }

  return periods.length > 0 ? periods : ['Dinner'];
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'meal-' + Math.random().toString(36).substring(2, 11);
}

export function parseMealsCSV(csvText: string): CSVParseResult {
  const rows = parseCSVText(csvText);
  if (rows.length < 2) {
    return { meals: [], errors: ['CSV file must contain a header row and at least one meal record.'] };
  }

  const header = rows[0].map(h => h.trim().toLowerCase());
  const nameIdx = header.findIndex(h => h === 'name' || h === 'meal name');
  const categoryIdx = header.findIndex(h => h === 'category' || h === 'meal group');
  const servingsIdx = header.findIndex(h => h === 'servings' || h === 'portion count');
  const useByIdx = header.findIndex(h => h === 'usebydays' || h === 'use by days' || h === 'shelf life days');
  const mealTypesIdx = header.findIndex(h => h === 'mealtypes' || h === 'meal types' || h === 'meal period');
  
  // Optional columns
  const idIdx = header.findIndex(h => h === 'id');
  const minRepeatIdx = header.findIndex(h => h === 'minimumrepeatweeks' || h === 'repeat weeks');
  const calIdx = header.findIndex(h => h === 'caloriesperserving' || h === 'calories');
  const proteinIdx = header.findIndex(h => h === 'proteingramsperserving' || h === 'protein' || h === 'protein (g)');
  const fatIdx = header.findIndex(h => h === 'fatgramsperserving' || h === 'fat' || h === 'fat (g)');
  const carbsIdx = header.findIndex(h => h === 'carbsgramsperserving' || h === 'carbs' || h === 'carbohydrates' || h === 'carbs (g)');
  const recipeIdIdx = header.findIndex(h => h === 'recipeid' || h === 'recipe');
  const enabledIdx = header.findIndex(h => h === 'enabled' || h === 'active');
  const weightModIdx = header.findIndex(h => h === 'weightmodifier' || h === 'weight modifier' || h === 'weight bias');

  if (nameIdx === -1 || categoryIdx === -1) {
    return {
      meals: [],
      errors: ['Required columns missing: "Name" and "Category" must be present in the header.']
    };
  }

  const meals: Meal[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const name = row[nameIdx]?.trim();
    if (!name) continue; // skip blank rows

    const category = row[categoryIdx]?.trim() || 'Other';
    const servings = servingsIdx !== -1 ? parseInt(row[servingsIdx], 10) : 4;
    const useByDays = useByIdx !== -1 ? parseInt(row[useByIdx], 10) : 3;
    const mealTypesRaw = mealTypesIdx !== -1 ? row[mealTypesIdx] : 'Dinner';
    const mealTypes = parseMealPeriods(mealTypesRaw);

    if (isNaN(servings) || servings <= 0) {
      errors.push(`Row ${rowNum} (${name}): Servings must be a positive integer.`);
      continue;
    }

    if (isNaN(useByDays) || useByDays <= 0) {
      errors.push(`Row ${rowNum} (${name}): UseByDays must be a positive integer.`);
      continue;
    }

    const meal: Meal = {
      id: idIdx !== -1 && row[idIdx]?.trim() ? row[idIdx].trim() : generateId(),
      name,
      category,
      servings,
      useByDays,
      mealTypes
    };

    if (minRepeatIdx !== -1 && row[minRepeatIdx]?.trim()) {
      const parsed = parseInt(row[minRepeatIdx], 10);
      if (!isNaN(parsed) && parsed >= 0) meal.minimumRepeatWeeks = parsed;
    }

    if (calIdx !== -1 && row[calIdx]?.trim()) {
      const parsed = parseFloat(row[calIdx]);
      if (!isNaN(parsed) && parsed >= 0) meal.caloriesPerServing = Math.round(parsed);
    }

    if (proteinIdx !== -1 && row[proteinIdx]?.trim()) {
      const parsed = parseFloat(row[proteinIdx]);
      if (!isNaN(parsed) && parsed >= 0) meal.proteinGramsPerServing = Math.round(parsed);
    }

    if (fatIdx !== -1 && row[fatIdx]?.trim()) {
      const parsed = parseFloat(row[fatIdx]);
      if (!isNaN(parsed) && parsed >= 0) meal.fatGramsPerServing = Math.round(parsed);
    }

    if (carbsIdx !== -1 && row[carbsIdx]?.trim()) {
      const parsed = parseFloat(row[carbsIdx]);
      if (!isNaN(parsed) && parsed >= 0) meal.carbsGramsPerServing = Math.round(parsed);
    }

    if (recipeIdIdx !== -1 && row[recipeIdIdx]?.trim()) {
      meal.recipeId = row[recipeIdIdx].trim();
    }

    if (enabledIdx !== -1 && row[enabledIdx]?.trim()) {
      const val = row[enabledIdx].trim().toLowerCase();
      meal.enabled = val !== 'false' && val !== '0' && val !== 'no';
    } else {
      meal.enabled = true;
    }

    if (weightModIdx !== -1 && row[weightModIdx]?.trim()) {
      const parsed = parseFloat(row[weightModIdx]);
      if (!isNaN(parsed) && parsed >= 0) meal.weightModifier = parsed;
    }

    meals.push(meal);
  }

  return { meals, errors };
}
