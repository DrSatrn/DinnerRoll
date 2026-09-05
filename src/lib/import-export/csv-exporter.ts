import type { Meal } from '../domain/models';

function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportMealsToCSV(meals: Meal[]): string {
  const headers = [
    'Name',
    'Category',
    'Servings',
    'UseByDays',
    'MealTypes',
    'MinimumRepeatWeeks',
    'CaloriesPerServing',
    'ProteinGramsPerServing',
    'FatGramsPerServing',
    'CarbsGramsPerServing',
    'RecipeId',
    'Enabled',
    'WeightModifier',
    'Id'
  ];

  const rows = meals.map(meal => {
    return [
      escapeCSVField(meal.name),
      escapeCSVField(meal.category),
      escapeCSVField(meal.servings),
      escapeCSVField(meal.useByDays),
      escapeCSVField(meal.mealTypes.join(',')),
      escapeCSVField(meal.minimumRepeatWeeks ?? ''),
      escapeCSVField(meal.caloriesPerServing ?? ''),
      escapeCSVField(meal.proteinGramsPerServing ?? ''),
      escapeCSVField(meal.fatGramsPerServing ?? ''),
      escapeCSVField(meal.carbsGramsPerServing ?? ''),
      escapeCSVField(meal.recipeId ?? ''),
      escapeCSVField(meal.enabled !== false ? 'true' : 'false'),
      escapeCSVField(meal.weightModifier ?? ''),
      escapeCSVField(meal.id)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
