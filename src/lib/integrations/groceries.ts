import type { ScheduledSlot, Meal, Recipe, Ingredient } from '../domain/models';

export interface AggregatedGroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  sourceMeals: string[];
}

export interface GroceryListResult {
  items: AggregatedGroceryItem[];
  itemsByCategory: Record<string, AggregatedGroceryItem[]>;
  textSummary: string;
}

/**
 * Normalises unit and quantity into a standard base for aggregation.
 * Supports:
 * - g / kg -> base: g
 * - ml / L -> base: ml
 * - tsp / tbsp -> base: tsp (1 tbsp = 3 tsp)
 */
function normalizeUnitAndQuantity(quantity: number, unit: string): { baseQty: number; standardUnit: string } {
  const u = unit.trim().toLowerCase();

  switch (u) {
    case 'kg':
      return { baseQty: quantity * 1000, standardUnit: 'g' };
    case 'g':
      return { baseQty: quantity, standardUnit: 'g' };
    case 'l':
    case 'liter':
    case 'litre':
      return { baseQty: quantity * 1000, standardUnit: 'ml' };
    case 'ml':
      return { baseQty: quantity, standardUnit: 'ml' };
    case 'tbsp':
    case 'tablespoon':
      return { baseQty: quantity * 3, standardUnit: 'tsp' };
    case 'tsp':
    case 'teaspoon':
      return { baseQty: quantity, standardUnit: 'tsp' };
    default:
      return { baseQty: quantity, standardUnit: unit };
  }
}

/**
 * Converts a base quantity back to human-friendly display units.
 * e.g. 1250 g -> 1.25 kg; 1500 ml -> 1.5 L; 6 tsp -> 2 tbsp
 */
function formatHumanQuantity(baseQty: number, standardUnit: string): { quantity: number; unit: string } {
  if (standardUnit === 'g') {
    if (baseQty >= 1000) {
      return { quantity: Number((baseQty / 1000).toFixed(2)), unit: 'kg' };
    }
    return { quantity: Math.round(baseQty), unit: 'g' };
  }

  if (standardUnit === 'ml') {
    if (baseQty >= 1000) {
      return { quantity: Number((baseQty / 1000).toFixed(2)), unit: 'L' };
    }
    return { quantity: Math.round(baseQty), unit: 'ml' };
  }

  if (standardUnit === 'tsp') {
    if (baseQty >= 3 && baseQty % 3 === 0) {
      return { quantity: baseQty / 3, unit: 'tbsp' };
    }
    return { quantity: Number(baseQty.toFixed(1)), unit: 'tsp' };
  }

  return { quantity: Number(baseQty.toFixed(2)), unit: standardUnit };
}

export function generateGroceryList(
  slots: ScheduledSlot[],
  allMeals: Meal[],
  allRecipes: Recipe[]
): GroceryListResult {
  const mealMap = new Map<string, Meal>(allMeals.map(m => [m.id, m]));
  const recipeMap = new Map<string, Recipe>(allRecipes.map(r => [r.id, r]));

  // Map key: `${name.toLowerCase()}|${standardUnit}`
  const aggregationMap = new Map<
    string,
    {
      name: string;
      baseQty: number;
      standardUnit: string;
      category: string;
      sourceMeals: Set<string>;
    }
  >();

  // Only iterate slots where isLeftover is false (do not double-count leftovers)
  for (const slot of slots) {
    if (slot.isBlocked || !slot.mealId || slot.isLeftover) {
      continue;
    }

    const meal = mealMap.get(slot.mealId);
    if (!meal || !meal.recipeId) continue;

    const recipe = recipeMap.get(meal.recipeId);
    if (!recipe || recipe.ingredients.length === 0) continue;

    // Scaling factor: portions cooked divided by recipe serving basis
    const portionsCooked = meal.servings;
    const scaleFactor = recipe.servingBasis > 0 ? portionsCooked / recipe.servingBasis : 1;

    for (const ing of recipe.ingredients) {
      const scaledQty = ing.quantity * scaleFactor;
      const { baseQty, standardUnit } = normalizeUnitAndQuantity(scaledQty, ing.unit);
      const key = `${ing.name.toLowerCase().trim()}|${standardUnit.toLowerCase()}`;

      const existing = aggregationMap.get(key);
      if (existing) {
        existing.baseQty += baseQty;
        existing.sourceMeals.add(meal.name);
      } else {
        aggregationMap.set(key, {
          name: ing.name.trim(),
          baseQty,
          standardUnit,
          category: ing.category || 'Pantry',
          sourceMeals: new Set([meal.name])
        });
      }
    }
  }

  const items: AggregatedGroceryItem[] = [];

  for (const entry of aggregationMap.values()) {
    const { quantity, unit } = formatHumanQuantity(entry.baseQty, entry.standardUnit);
    items.push({
      name: entry.name,
      quantity,
      unit,
      category: entry.category,
      sourceMeals: Array.from(entry.sourceMeals)
    });
  }

  // Sort by category then name
  items.sort((a, b) => {
    const catComp = a.category.localeCompare(b.category);
    if (catComp !== 0) return catComp;
    return a.name.localeCompare(b.name);
  });

  const itemsByCategory: Record<string, AggregatedGroceryItem[]> = {};
  for (const item of items) {
    if (!itemsByCategory[item.category]) {
      itemsByCategory[item.category] = [];
    }
    itemsByCategory[item.category].push(item);
  }

  // Build clean text summary
  let textSummary = 'DinnerRoll Grocery List\n=======================\n\n';
  for (const [cat, catItems] of Object.entries(itemsByCategory)) {
    textSummary += `[${cat}]\n`;
    for (const item of catItems) {
      const qtyStr = item.quantity ? `${item.quantity} ${item.unit} ` : '';
      textSummary += `- ${qtyStr}${item.name}\n`;
    }
    textSummary += '\n';
  }

  return {
    items,
    itemsByCategory,
    textSummary: textSummary.trim()
  };
}
