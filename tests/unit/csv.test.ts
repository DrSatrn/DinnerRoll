import { describe, it, expect } from 'vitest';
import { parseMealsCSV, parseCSVLine } from '../../src/lib/import-export/csv-importer';
import { exportMealsToCSV } from '../../src/lib/import-export/csv-exporter';
import { SAMPLE_MEALS } from '../../src/lib/domain/sample-data';

describe('CSV Ingestion & Export Engine', () => {
  it('parses CSV lines with escaped quotes and commas', () => {
    const line = '"Chicken, Herb & Garlic",Chicken,4,3,"Lunch,Dinner"';
    const parsed = parseCSVLine(line);
    expect(parsed).toEqual(['Chicken, Herb & Garlic', 'Chicken', '4', '3', 'Lunch,Dinner']);
  });

  it('imports valid CSV data with macros and meal periods', () => {
    const csvContent = `Name,Category,Servings,UseByDays,MealTypes,CaloriesPerServing,ProteinGramsPerServing,FatGramsPerServing,CarbsGramsPerServing,MinimumRepeatWeeks,WeightModifier,Enabled
"Roast Beef","Beef",4,3,"Dinner",600,45,20,15,4,1.2,true
"Greek Salad","Vegetarian",2,2,"Lunch,Dinner",280,8,22,12,,,true`;

    const { meals, errors } = parseMealsCSV(csvContent);
    expect(errors.length).toBe(0);
    expect(meals.length).toBe(2);

    const beef = meals[0];
    expect(beef.name).toBe('Roast Beef');
    expect(beef.category).toBe('Beef');
    expect(beef.servings).toBe(4);
    expect(beef.useByDays).toBe(3);
    expect(beef.mealTypes).toEqual(['Dinner']);
    expect(beef.caloriesPerServing).toBe(600);
    expect(beef.proteinGramsPerServing).toBe(45);
    expect(beef.minimumRepeatWeeks).toBe(4);
    expect(beef.weightModifier).toBe(1.2);
    expect(beef.enabled).toBe(true);

    const salad = meals[1];
    expect(salad.name).toBe('Greek Salad');
    expect(salad.mealTypes).toEqual(['Lunch', 'Dinner']);
    expect(salad.minimumRepeatWeeks).toBeUndefined();
  });

  it('exports meals to CSV and re-imports losslessly', () => {
    const csvOutput = exportMealsToCSV(SAMPLE_MEALS);
    const { meals: reimported, errors } = parseMealsCSV(csvOutput);

    expect(errors.length).toBe(0);
    expect(reimported.length).toBe(SAMPLE_MEALS.length);

    for (let i = 0; i < SAMPLE_MEALS.length; i++) {
      expect(reimported[i].name).toBe(SAMPLE_MEALS[i].name);
      expect(reimported[i].category).toBe(SAMPLE_MEALS[i].category);
      expect(reimported[i].servings).toBe(SAMPLE_MEALS[i].servings);
      expect(reimported[i].useByDays).toBe(SAMPLE_MEALS[i].useByDays);
      expect(reimported[i].caloriesPerServing).toBe(SAMPLE_MEALS[i].caloriesPerServing);
      expect(reimported[i].proteinGramsPerServing).toBe(SAMPLE_MEALS[i].proteinGramsPerServing);
    }
  });

  it('flags missing required columns gracefully', () => {
    const badCSV = 'UnknownHeader1,UnknownHeader2\nValue1,Value2';
    const { meals, errors } = parseMealsCSV(badCSV);
    expect(meals.length).toBe(0);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Required columns missing');
  });
});
