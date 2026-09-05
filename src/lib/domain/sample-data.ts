import type { Meal, Recipe, MealCategory, HouseholdSettings, BackupPayload } from './models';
import { CURRENT_SCHEMA_VERSION, APP_VERSION, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './constants';

export const SAMPLE_CATEGORIES: MealCategory[] = DEFAULT_CATEGORIES;
export const SAMPLE_SETTINGS: HouseholdSettings = DEFAULT_SETTINGS;

export const SAMPLE_RECIPES: Recipe[] = [
  {
    id: 'recipe-lemon-herb-chicken',
    name: 'Lemon Herb Roast Chicken',
    servingBasis: 4,
    instructions: 'Rub chicken with olive oil, lemon juice, garlic, and chopped rosemary. Roast at 200C for 45 minutes.',
    ingredients: [
      { id: 'ing-1', recipeId: 'recipe-lemon-herb-chicken', name: 'Chicken Breast', quantity: 800, unit: 'g', category: 'Meat' },
      { id: 'ing-2', recipeId: 'recipe-lemon-herb-chicken', name: 'Lemon', quantity: 2, unit: 'item', category: 'Produce' },
      { id: 'ing-3', recipeId: 'recipe-lemon-herb-chicken', name: 'Olive Oil', quantity: 30, unit: 'ml', category: 'Pantry' },
      { id: 'ing-4', recipeId: 'recipe-lemon-herb-chicken', name: 'Fresh Rosemary', quantity: 2, unit: 'tbsp', category: 'Produce' },
      { id: 'ing-5', recipeId: 'recipe-lemon-herb-chicken', name: 'Garlic Cloves', quantity: 4, unit: 'item', category: 'Produce' }
    ]
  },
  {
    id: 'recipe-chicken-tikka-masala',
    name: 'Chicken Tikka Masala',
    servingBasis: 4,
    instructions: 'Marinate chicken in yogurt and spices. Brown in pan, then simmer in spiced tomato cream sauce.',
    ingredients: [
      { id: 'ing-6', recipeId: 'recipe-chicken-tikka-masala', name: 'Chicken Thighs', quantity: 750, unit: 'g', category: 'Meat' },
      { id: 'ing-7', recipeId: 'recipe-chicken-tikka-masala', name: 'Greek Yogurt', quantity: 200, unit: 'g', category: 'Dairy' },
      { id: 'ing-8', recipeId: 'recipe-chicken-tikka-masala', name: 'Canned Crushed Tomatoes', quantity: 400, unit: 'g', category: 'Pantry' },
      { id: 'ing-9', recipeId: 'recipe-chicken-tikka-masala', name: 'Heavy Cream', quantity: 150, unit: 'ml', category: 'Dairy' },
      { id: 'ing-10', recipeId: 'recipe-chicken-tikka-masala', name: 'Garam Masala', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { id: 'ing-11', recipeId: 'recipe-chicken-tikka-masala', name: 'Basmati Rice', quantity: 300, unit: 'g', category: 'Pantry' }
    ]
  },
  {
    id: 'recipe-teriyaki-chicken',
    name: 'Teriyaki Chicken Bowl',
    servingBasis: 4,
    instructions: 'Pan-sear chicken thighs and glaze with homemade teriyaki reduction. Serve over steamed jasmine rice with broccoli.',
    ingredients: [
      { id: 'ing-12', recipeId: 'recipe-teriyaki-chicken', name: 'Chicken Thighs', quantity: 600, unit: 'g', category: 'Meat' },
      { id: 'ing-13', recipeId: 'recipe-teriyaki-chicken', name: 'Soy Sauce', quantity: 60, unit: 'ml', category: 'Pantry' },
      { id: 'ing-14', recipeId: 'recipe-teriyaki-chicken', name: 'Mirin', quantity: 45, unit: 'ml', category: 'Pantry' },
      { id: 'ing-15', recipeId: 'recipe-teriyaki-chicken', name: 'Brown Sugar', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { id: 'ing-16', recipeId: 'recipe-teriyaki-chicken', name: 'Broccoli Florets', quantity: 350, unit: 'g', category: 'Produce' },
      { id: 'ing-17', recipeId: 'recipe-teriyaki-chicken', name: 'Jasmine Rice', quantity: 300, unit: 'g', category: 'Pantry' }
    ]
  },
  {
    id: 'recipe-beef-lasagne',
    name: 'Classic Beef Lasagne',
    servingBasis: 6,
    instructions: 'Layer rich beef ragu, fresh pasta sheets, and creamy béchamel. Bake at 190C for 40 minutes until golden and bubbling.',
    ingredients: [
      { id: 'ing-18', recipeId: 'recipe-beef-lasagne', name: 'Minced Beef', quantity: 800, unit: 'g', category: 'Meat' },
      { id: 'ing-19', recipeId: 'recipe-beef-lasagne', name: 'Canned Crushed Tomatoes', quantity: 800, unit: 'g', category: 'Pantry' },
      { id: 'ing-20', recipeId: 'recipe-beef-lasagne', name: 'Lasagne Sheets', quantity: 250, unit: 'g', category: 'Pantry' },
      { id: 'ing-21', recipeId: 'recipe-beef-lasagne', name: 'Whole Milk', quantity: 500, unit: 'ml', category: 'Dairy' },
      { id: 'ing-22', recipeId: 'recipe-beef-lasagne', name: 'Cheddar Cheese', quantity: 200, unit: 'g', category: 'Dairy' },
      { id: 'ing-23', recipeId: 'recipe-beef-lasagne', name: 'Butter', quantity: 50, unit: 'g', category: 'Dairy' }
    ]
  },
  {
    id: 'recipe-beef-ragu',
    name: 'Slow Cooker Beef Ragù',
    servingBasis: 6,
    instructions: 'Slow cook beef chuck with red wine, mirepoix, and passata for 7 hours. Shred and serve with pappardelle.',
    ingredients: [
      { id: 'ing-24', recipeId: 'recipe-beef-ragu', name: 'Beef Chuck', quantity: 1, unit: 'kg', category: 'Meat' },
      { id: 'ing-25', recipeId: 'recipe-beef-ragu', name: 'Red Wine', quantity: 200, unit: 'ml', category: 'Pantry' },
      { id: 'ing-26', recipeId: 'recipe-beef-ragu', name: 'Passata', quantity: 700, unit: 'g', category: 'Pantry' },
      { id: 'ing-27', recipeId: 'recipe-beef-ragu', name: 'Brown Onion', quantity: 2, unit: 'item', category: 'Produce' },
      { id: 'ing-28', recipeId: 'recipe-beef-ragu', name: 'Carrots', quantity: 3, unit: 'item', category: 'Produce' },
      { id: 'ing-29', recipeId: 'recipe-beef-ragu', name: 'Pappardelle Pasta', quantity: 500, unit: 'g', category: 'Pantry' }
    ]
  },
  {
    id: 'recipe-beef-broccoli',
    name: 'Stir-Fried Beef and Broccoli',
    servingBasis: 4,
    instructions: 'Flash-fry thin flank steak slices with broccoli florets, oyster sauce, garlic and ginger.',
    ingredients: [
      { id: 'ing-30', recipeId: 'recipe-beef-broccoli', name: 'Beef Flank Steak', quantity: 500, unit: 'g', category: 'Meat' },
      { id: 'ing-31', recipeId: 'recipe-beef-broccoli', name: 'Broccoli Florets', quantity: 400, unit: 'g', category: 'Produce' },
      { id: 'ing-32', recipeId: 'recipe-beef-broccoli', name: 'Oyster Sauce', quantity: 45, unit: 'ml', category: 'Pantry' },
      { id: 'ing-33', recipeId: 'recipe-beef-broccoli', name: 'Soy Sauce', quantity: 30, unit: 'ml', category: 'Pantry' },
      { id: 'ing-34', recipeId: 'recipe-beef-broccoli', name: 'Ginger Root', quantity: 1, unit: 'tbsp', category: 'Produce' }
    ]
  },
  {
    id: 'recipe-pork-chops',
    name: 'Pan-Seared Pork Chops with Apples',
    servingBasis: 4,
    instructions: 'Sear thick pork chops in butter, sauté sliced crisp apples with fresh thyme and cider vinegar.',
    ingredients: [
      { id: 'ing-35', recipeId: 'recipe-pork-chops', name: 'Pork Chops', quantity: 4, unit: 'item', category: 'Meat' },
      { id: 'ing-36', recipeId: 'recipe-pork-chops', name: 'Green Apples', quantity: 3, unit: 'item', category: 'Produce' },
      { id: 'ing-37', recipeId: 'recipe-pork-chops', name: 'Butter', quantity: 40, unit: 'g', category: 'Dairy' },
      { id: 'ing-38', recipeId: 'recipe-pork-chops', name: 'Fresh Thyme', quantity: 1, unit: 'tbsp', category: 'Produce' }
    ]
  },
  {
    id: 'recipe-pulled-pork',
    name: 'Pulled Pork Tacos',
    servingBasis: 6,
    instructions: 'Spice-rubbed pork shoulder braised until fork-tender. Shred and serve in warm corn tortillas with pickled onion.',
    ingredients: [
      { id: 'ing-39', recipeId: 'recipe-pulled-pork', name: 'Pork Shoulder', quantity: 1.2, unit: 'kg', category: 'Meat' },
      { id: 'ing-40', recipeId: 'recipe-pulled-pork', name: 'Corn Tortillas', quantity: 12, unit: 'item', category: 'Bakery' },
      { id: 'ing-41', recipeId: 'recipe-pulled-pork', name: 'Red Onion', quantity: 2, unit: 'item', category: 'Produce' },
      { id: 'ing-42', recipeId: 'recipe-pulled-pork', name: 'Limes', quantity: 3, unit: 'item', category: 'Produce' }
    ]
  },
  {
    id: 'recipe-crispy-salmon',
    name: 'Crispy Skin Salmon with Asparagus',
    servingBasis: 2,
    instructions: 'Pan-sear salmon skin-side down until ultra crispy. Serve with butter-glazed asparagus spears and lemon wedges.',
    ingredients: [
      { id: 'ing-43', recipeId: 'recipe-crispy-salmon', name: 'Salmon Fillets', quantity: 2, unit: 'item', category: 'Meat' },
      { id: 'ing-44', recipeId: 'recipe-crispy-salmon', name: 'Asparagus Spears', quantity: 250, unit: 'g', category: 'Produce' },
      { id: 'ing-45', recipeId: 'recipe-crispy-salmon', name: 'Butter', quantity: 30, unit: 'g', category: 'Dairy' },
      { id: 'ing-46', recipeId: 'recipe-crispy-salmon', name: 'Lemon', quantity: 1, unit: 'item', category: 'Produce' }
    ]
  },
  {
    id: 'recipe-fish-tacos',
    name: 'Fish Tacos with Lime Crema',
    servingBasis: 4,
    instructions: 'Pan-sear spiced white fish fillets. Assemble in warm tortillas with shredded cabbage and lime crema.',
    ingredients: [
      { id: 'ing-47', recipeId: 'recipe-fish-tacos', name: 'White Fish Fillets', quantity: 500, unit: 'g', category: 'Meat' },
      { id: 'ing-48', recipeId: 'recipe-fish-tacos', name: 'Corn Tortillas', quantity: 8, unit: 'item', category: 'Bakery' },
      { id: 'ing-49', recipeId: 'recipe-fish-tacos', name: 'Green Cabbage', quantity: 200, unit: 'g', category: 'Produce' },
      { id: 'ing-50', recipeId: 'recipe-fish-tacos', name: 'Sour Cream', quantity: 120, unit: 'ml', category: 'Dairy' },
      { id: 'ing-51', recipeId: 'recipe-fish-tacos', name: 'Limes', quantity: 2, unit: 'item', category: 'Produce' }
    ]
  },
  {
    id: 'recipe-mushroom-risotto',
    name: 'Creamy Mushroom Risotto',
    servingBasis: 4,
    instructions: 'Sauté mixed woodland mushrooms. Slowly incorporate warm vegetable broth into arborio rice with parmesan and thyme.',
    ingredients: [
      { id: 'ing-52', recipeId: 'recipe-mushroom-risotto', name: 'Arborio Rice', quantity: 350, unit: 'g', category: 'Pantry' },
      { id: 'ing-53', recipeId: 'recipe-mushroom-risotto', name: 'Mixed Mushrooms', quantity: 400, unit: 'g', category: 'Produce' },
      { id: 'ing-54', recipeId: 'recipe-mushroom-risotto', name: 'Vegetable Broth', quantity: 1, unit: 'L', category: 'Pantry' },
      { id: 'ing-55', recipeId: 'recipe-mushroom-risotto', name: 'Parmesan Cheese', quantity: 80, unit: 'g', category: 'Dairy' },
      { id: 'ing-56', recipeId: 'recipe-mushroom-risotto', name: 'Butter', quantity: 40, unit: 'g', category: 'Dairy' }
    ]
  },
  {
    id: 'recipe-chickpea-curry',
    name: 'Chickpea and Sweet Potato Curry',
    servingBasis: 6,
    instructions: 'Simmer roasted sweet potato cubes, tender chickpeas, and spinach in creamy coconut curry broth.',
    ingredients: [
      { id: 'ing-57', recipeId: 'recipe-chickpea-curry', name: 'Canned Chickpeas', quantity: 800, unit: 'g', category: 'Pantry' },
      { id: 'ing-58', recipeId: 'recipe-chickpea-curry', name: 'Sweet Potatoes', quantity: 600, unit: 'g', category: 'Produce' },
      { id: 'ing-59', recipeId: 'recipe-chickpea-curry', name: 'Coconut Milk', quantity: 400, unit: 'ml', category: 'Pantry' },
      { id: 'ing-60', recipeId: 'recipe-chickpea-curry', name: 'Baby Spinach', quantity: 200, unit: 'g', category: 'Produce' },
      { id: 'ing-61', recipeId: 'recipe-chickpea-curry', name: 'Curry Powder', quantity: 2, unit: 'tbsp', category: 'Pantry' }
    ]
  },
  {
    id: 'recipe-shakshuka',
    name: 'Shakshuka with Warm Sourdough',
    servingBasis: 4,
    instructions: 'Poach eggs gently in a spiced bell pepper and tomato sauce. Garnish with feta, coriander, and serve with toasted crusty sourdough.',
    ingredients: [
      { id: 'ing-62', recipeId: 'recipe-shakshuka', name: 'Eggs', quantity: 6, unit: 'item', category: 'Dairy' },
      { id: 'ing-63', recipeId: 'recipe-shakshuka', name: 'Canned Crushed Tomatoes', quantity: 400, unit: 'g', category: 'Pantry' },
      { id: 'ing-64', recipeId: 'recipe-shakshuka', name: 'Red Bell Pepper', quantity: 2, unit: 'item', category: 'Produce' },
      { id: 'ing-65', recipeId: 'recipe-shakshuka', name: 'Feta Cheese', quantity: 100, unit: 'g', category: 'Dairy' },
      { id: 'ing-66', recipeId: 'recipe-shakshuka', name: 'Sourdough Loaf', quantity: 1, unit: 'item', category: 'Bakery' }
    ]
  },
  {
    id: 'recipe-blueberry-pancakes',
    name: 'Fluffy Blueberry Pancakes',
    servingBasis: 4,
    instructions: 'Whisk batter until just combined. Fold in fresh blueberries and cook on a griddle until bubbles form. Flip once.',
    ingredients: [
      { id: 'ing-67', recipeId: 'recipe-blueberry-pancakes', name: 'All-Purpose Flour', quantity: 250, unit: 'g', category: 'Pantry' },
      { id: 'ing-68', recipeId: 'recipe-blueberry-pancakes', name: 'Whole Milk', quantity: 300, unit: 'ml', category: 'Dairy' },
      { id: 'ing-69', recipeId: 'recipe-blueberry-pancakes', name: 'Eggs', quantity: 2, unit: 'item', category: 'Dairy' },
      { id: 'ing-70', recipeId: 'recipe-blueberry-pancakes', name: 'Fresh Blueberries', quantity: 150, unit: 'g', category: 'Produce' },
      { id: 'ing-71', recipeId: 'recipe-blueberry-pancakes', name: 'Maple Syrup', quantity: 100, unit: 'ml', category: 'Pantry' }
    ]
  }
];

export const SAMPLE_MEALS: Meal[] = [
  // Chicken (6 meals)
  {
    id: 'meal-chicken-lemon-herb',
    name: 'Lemon Herb Roast Chicken',
    servings: 4,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Dinner'],
    caloriesPerServing: 520,
    proteinGramsPerServing: 42,
    fatGramsPerServing: 22,
    carbsGramsPerServing: 12,
    recipeId: 'recipe-lemon-herb-chicken'
  },
  {
    id: 'meal-chicken-tikka-masala',
    name: 'Chicken Tikka Masala',
    servings: 4,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 580,
    proteinGramsPerServing: 38,
    fatGramsPerServing: 28,
    carbsGramsPerServing: 35,
    recipeId: 'recipe-chicken-tikka-masala'
  },
  {
    id: 'meal-chicken-schnitzel',
    name: 'Crispy Chicken Schnitzel',
    servings: 4,
    useByDays: 2,
    category: 'Chicken',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 620,
    proteinGramsPerServing: 40,
    fatGramsPerServing: 30,
    carbsGramsPerServing: 45
  },
  {
    id: 'meal-chicken-leek-pie',
    name: 'Chicken and Leek Pie',
    servings: 6,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Dinner'],
    caloriesPerServing: 640,
    proteinGramsPerServing: 32,
    fatGramsPerServing: 36,
    carbsGramsPerServing: 48
  },
  {
    id: 'meal-chicken-teriyaki-bowl',
    name: 'Teriyaki Chicken Bowl',
    servings: 4,
    useByDays: 2,
    category: 'Chicken',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 490,
    proteinGramsPerServing: 36,
    fatGramsPerServing: 14,
    carbsGramsPerServing: 55,
    recipeId: 'recipe-teriyaki-chicken'
  },
  {
    id: 'meal-chicken-greek-soup',
    name: 'Greek Lemon Chicken Soup',
    servings: 4,
    useByDays: 3,
    category: 'Chicken',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 380,
    proteinGramsPerServing: 28,
    fatGramsPerServing: 12,
    carbsGramsPerServing: 38,
    weightModifier: 1.2 // Optional flag 1
  },

  // Beef (6 meals)
  {
    id: 'meal-beef-lasagne',
    name: 'Classic Beef Lasagne',
    servings: 6,
    useByDays: 4,
    category: 'Beef',
    mealTypes: ['Lunch', 'Dinner'],
    minimumRepeatWeeks: 6, // Optional flag 2
    caloriesPerServing: 680,
    proteinGramsPerServing: 36,
    fatGramsPerServing: 32,
    carbsGramsPerServing: 58,
    recipeId: 'recipe-beef-lasagne'
  },
  {
    id: 'meal-beef-slow-ragu',
    name: 'Slow Cooker Beef Ragù',
    servings: 6,
    useByDays: 4,
    category: 'Beef',
    mealTypes: ['Dinner'],
    caloriesPerServing: 610,
    proteinGramsPerServing: 44,
    fatGramsPerServing: 24,
    carbsGramsPerServing: 50,
    recipeId: 'recipe-beef-ragu'
  },
  {
    id: 'meal-beef-burgers',
    name: 'Grass-fed Beef Burgers',
    servings: 4,
    useByDays: 2,
    category: 'Beef',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 650,
    proteinGramsPerServing: 38,
    fatGramsPerServing: 35,
    carbsGramsPerServing: 42
  },
  {
    id: 'meal-beef-broccoli-stirfry',
    name: 'Stir-Fried Beef and Broccoli',
    servings: 4,
    useByDays: 2,
    category: 'Beef',
    mealTypes: ['Dinner'],
    caloriesPerServing: 460,
    proteinGramsPerServing: 38,
    fatGramsPerServing: 18,
    carbsGramsPerServing: 28,
    recipeId: 'recipe-beef-broccoli'
  },
  {
    id: 'meal-beef-cottage-pie',
    name: 'Beef and Vegetable Cottage Pie',
    servings: 6,
    useByDays: 3,
    category: 'Beef',
    mealTypes: ['Dinner'],
    caloriesPerServing: 530,
    proteinGramsPerServing: 32,
    fatGramsPerServing: 22,
    carbsGramsPerServing: 48
  },
  {
    id: 'meal-beef-ribeye-steak',
    name: 'Seared Ribeye with Herb Butter',
    servings: 2,
    useByDays: 2,
    category: 'Beef',
    mealTypes: ['Dinner'],
    minimumRepeatWeeks: 8, // Optional flag 3
    caloriesPerServing: 720,
    proteinGramsPerServing: 48,
    fatGramsPerServing: 54,
    carbsGramsPerServing: 4
  },

  // Pork (5 meals)
  {
    id: 'meal-pork-belly-slaw',
    name: 'Crispy Pork Belly with Slaw',
    servings: 4,
    useByDays: 3,
    category: 'Pork',
    mealTypes: ['Dinner'],
    caloriesPerServing: 740,
    proteinGramsPerServing: 34,
    fatGramsPerServing: 62,
    carbsGramsPerServing: 10,
    weightModifier: 0.8 // Optional flag 4
  },
  {
    id: 'meal-pork-sweet-sour',
    name: 'Sweet and Sour Pork',
    servings: 4,
    useByDays: 2,
    category: 'Pork',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 550,
    proteinGramsPerServing: 28,
    fatGramsPerServing: 20,
    carbsGramsPerServing: 62
  },
  {
    id: 'meal-pork-chops-apple',
    name: 'Pan-Seared Pork Chops with Apples',
    servings: 4,
    useByDays: 2,
    category: 'Pork',
    mealTypes: ['Dinner'],
    caloriesPerServing: 480,
    proteinGramsPerServing: 38,
    fatGramsPerServing: 22,
    carbsGramsPerServing: 26,
    recipeId: 'recipe-pork-chops'
  },
  {
    id: 'meal-pork-pulled-tacos',
    name: 'Pulled Pork Tacos',
    servings: 6,
    useByDays: 4,
    category: 'Pork',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 560,
    proteinGramsPerServing: 36,
    fatGramsPerServing: 24,
    carbsGramsPerServing: 46,
    recipeId: 'recipe-pulled-pork'
  },
  {
    id: 'meal-pork-dumplings',
    name: 'Pork Dumplings with Ginger Soy',
    servings: 4,
    useByDays: 2,
    category: 'Pork',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 460,
    proteinGramsPerServing: 22,
    fatGramsPerServing: 18,
    carbsGramsPerServing: 52
  },

  // Fish (5 meals)
  {
    id: 'meal-fish-crispy-salmon',
    name: 'Crispy Skin Salmon with Asparagus',
    servings: 2,
    useByDays: 2,
    category: 'Fish',
    mealTypes: ['Dinner'],
    caloriesPerServing: 540,
    proteinGramsPerServing: 42,
    fatGramsPerServing: 34,
    carbsGramsPerServing: 12,
    recipeId: 'recipe-crispy-salmon'
  },
  {
    id: 'meal-fish-tacos-crema',
    name: 'Fish Tacos with Lime Crema',
    servings: 4,
    useByDays: 2,
    category: 'Fish',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 420,
    proteinGramsPerServing: 28,
    fatGramsPerServing: 16,
    carbsGramsPerServing: 42,
    recipeId: 'recipe-fish-tacos'
  },
  {
    id: 'meal-fish-prawn-linguine',
    name: 'Garlic Butter Prawn Linguine',
    servings: 4,
    useByDays: 2,
    category: 'Fish',
    mealTypes: ['Dinner'],
    caloriesPerServing: 510,
    proteinGramsPerServing: 26,
    fatGramsPerServing: 18,
    carbsGramsPerServing: 60
  },
  {
    id: 'meal-fish-baked-barramundi',
    name: 'Baked Barramundi with Salsa Verde',
    servings: 4,
    useByDays: 2,
    category: 'Fish',
    mealTypes: ['Dinner'],
    caloriesPerServing: 410,
    proteinGramsPerServing: 36,
    fatGramsPerServing: 18,
    carbsGramsPerServing: 14
  },
  {
    id: 'meal-fish-salmon-frittata',
    name: 'Smoked Salmon and Dill Frittata',
    servings: 4,
    useByDays: 3,
    category: 'Fish',
    mealTypes: ['Breakfast', 'Lunch', 'Dinner'],
    caloriesPerServing: 380,
    proteinGramsPerServing: 26,
    fatGramsPerServing: 24,
    carbsGramsPerServing: 8
  },

  // Vegetarian (5 meals)
  {
    id: 'meal-veg-mushroom-risotto',
    name: 'Creamy Mushroom Risotto',
    servings: 4,
    useByDays: 3,
    category: 'Vegetarian',
    mealTypes: ['Dinner'],
    caloriesPerServing: 490,
    proteinGramsPerServing: 14,
    fatGramsPerServing: 18,
    carbsGramsPerServing: 68,
    recipeId: 'recipe-mushroom-risotto'
  },
  {
    id: 'meal-veg-spinach-cannelloni',
    name: 'Spinach and Ricotta Cannelloni',
    servings: 4,
    useByDays: 3,
    category: 'Vegetarian',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 460,
    proteinGramsPerServing: 22,
    fatGramsPerServing: 20,
    carbsGramsPerServing: 48
  },
  {
    id: 'meal-veg-chickpea-curry',
    name: 'Chickpea and Sweet Potato Curry',
    servings: 6,
    useByDays: 4,
    category: 'Vegetarian',
    mealTypes: ['Lunch', 'Dinner'],
    caloriesPerServing: 420,
    proteinGramsPerServing: 16,
    fatGramsPerServing: 12,
    carbsGramsPerServing: 64,
    recipeId: 'recipe-chickpea-curry'
  },
  {
    id: 'meal-veg-lentil-pie',
    name: 'Lentil Shepherd\'s Pie',
    servings: 6,
    useByDays: 4,
    category: 'Vegetarian',
    mealTypes: ['Dinner'],
    caloriesPerServing: 390,
    proteinGramsPerServing: 18,
    fatGramsPerServing: 10,
    carbsGramsPerServing: 56
  },
  {
    id: 'meal-veg-shakshuka',
    name: 'Shakshuka with Warm Sourdough',
    servings: 4,
    useByDays: 2,
    category: 'Vegetarian',
    mealTypes: ['Breakfast', 'Lunch', 'Dinner'],
    caloriesPerServing: 340,
    proteinGramsPerServing: 16,
    fatGramsPerServing: 18,
    carbsGramsPerServing: 32,
    recipeId: 'recipe-shakshuka'
  },

  // Other / Breakfast / Specials (3 meals, includes 2 disabled seasonal items)
  {
    id: 'meal-other-blueberry-pancakes',
    name: 'Fluffy Blueberry Pancakes',
    servings: 4,
    useByDays: 2,
    category: 'Other',
    mealTypes: ['Breakfast'],
    caloriesPerServing: 410,
    proteinGramsPerServing: 10,
    fatGramsPerServing: 12,
    carbsGramsPerServing: 66,
    recipeId: 'recipe-blueberry-pancakes'
  },
  {
    id: 'meal-other-roast-goose',
    name: 'Seasonal Holiday Roast Goose',
    servings: 6,
    useByDays: 3,
    category: 'Other',
    mealTypes: ['Dinner'],
    caloriesPerServing: 780,
    proteinGramsPerServing: 42,
    fatGramsPerServing: 58,
    carbsGramsPerServing: 16,
    enabled: false // Optional flag 5
  },
  {
    id: 'meal-fish-clam-bake',
    name: 'Summer Clam Bake',
    servings: 4,
    useByDays: 1,
    category: 'Fish',
    mealTypes: ['Dinner'],
    caloriesPerServing: 450,
    proteinGramsPerServing: 32,
    fatGramsPerServing: 14,
    carbsGramsPerServing: 38,
    enabled: false // Optional flag 6
  }
];

export function getSampleHouseholdBackup(): BackupPayload {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: '2026-09-05T00:00:00.000Z',
    appVersion: APP_VERSION,
    meals: SAMPLE_MEALS,
    recipes: SAMPLE_RECIPES,
    categories: SAMPLE_CATEGORIES,
    settings: SAMPLE_SETTINGS,
    acceptedPlans: [],
    mealHistory: []
  };
}
