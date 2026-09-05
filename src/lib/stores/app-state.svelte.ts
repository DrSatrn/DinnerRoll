import type {
  HouseholdSettings,
  AppTheme,
  Meal,
  Recipe,
  MealCategory,
  AcceptedPlan,
  MealHistoryMetadata,
  ScheduledSlot,
  PlanConstraint,
  PlanSession,
  PlanGenerationSnapshot,
  RelaxationWarning
} from '../domain/models';
import {
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_MEAL_PERIODS
} from '../domain/constants';
import {
  getSettings,
  updateSettings,
  getAllMeals,
  saveMeal as dbSaveMeal,
  deleteMeal as dbDeleteMeal,
  getAllRecipes,
  saveRecipe as dbSaveRecipe,
  deleteRecipe as dbDeleteRecipe,
  getAllCategories,
  saveCategory as dbSaveCategory,
  deleteCategory as dbDeleteCategory,
  getAllAcceptedPlans,
  deleteAcceptedPlan as dbDeleteAcceptedPlan,
  getMealHistoryMap,
  acceptPlanTransaction,
  loadSampleData as dbLoadSampleData,
  clearAllData as dbClearAllData,
  isDatabaseEmpty
} from '../persistence/storage';
import { generatePlan, rerollSingleSlot } from '../scheduler/engine';
import { getTodayLocalDate, addDays } from '../scheduler/date-utils';

class AppState {
  currentView = $state<'plan' | 'meals' | 'history' | 'settings'>('plan');
  isLoading = $state(true);
  showOnboarding = $state(false);
  toast = $state<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  settings = $state<HouseholdSettings>(DEFAULT_SETTINGS);
  meals = $state<Meal[]>([]);
  recipes = $state<Recipe[]>([]);
  categories = $state<MealCategory[]>(DEFAULT_CATEGORIES);
  acceptedPlans = $state<AcceptedPlan[]>([]);
  mealHistoryMap = $state<Map<string, MealHistoryMetadata>>(new Map());

  // Plan Session State
  planStartDate = $state(getTodayLocalDate());
  planDurationDays = $state(7);
  planMealPeriods = $state(DEFAULT_MEAL_PERIODS);
  planSlots = $state<ScheduledSlot[]>([]);
  planConstraints = $state<PlanConstraint[]>([]);
  planWarnings = $state<RelaxationWarning[]>([]);

  // Roll & Reroll Session Tracking
  hasRolled = $state(false);
  isSpinning = $state(false);
  fullPlanRerollsRemaining = $state(1);
  individualSlotRerollsRemaining = $state(1);
  generationHistory = $state<PlanGenerationSnapshot[]>([]);
  historyIndex = $state(-1); // pointer into generationHistory

  // Accepted plan viewing state
  viewingAcceptedPlan = $state<AcceptedPlan | null>(null);

  async init() {
    this.isLoading = true;
    try {
      const empty = await isDatabaseEmpty();
      if (empty) {
        this.showOnboarding = true;
      }

      this.settings = await getSettings();
      this.planDurationDays = this.settings.defaultPlanDurationDays;
      this.planMealPeriods = [...this.settings.defaultMealPeriods];
      this.fullPlanRerollsRemaining = this.settings.maxFullPlanRerolls;
      this.individualSlotRerollsRemaining = this.settings.maxIndividualSlotRerolls;

      this.meals = await getAllMeals();
      this.recipes = await getAllRecipes();
      this.categories = await getAllCategories();
      this.acceptedPlans = await getAllAcceptedPlans();
      this.mealHistoryMap = await getMealHistoryMap();

      this.applyTheme(this.settings.theme || 'warm-terracotta');
      this.initializeUnpopulatedGrid();
    } catch (err) {
      console.error('Failed to initialize app state:', err);
      this.showToast('Could not load stored data.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    this.toast = { message, type };
    setTimeout(() => {
      if (this.toast?.message === message) {
        this.toast = null;
      }
    }, 4500);
  }

  initializeUnpopulatedGrid() {
    // Retain existing blocked status where possible
    const blockedMap = new Map<string, boolean>();
    for (const s of this.planSlots) {
      if (s.isBlocked) {
        blockedMap.set(`${s.date}-${s.mealPeriod}`, true);
      }
    }

    const newSlots: ScheduledSlot[] = [];
    for (let d = 0; d < this.planDurationDays; d++) {
      const date = addDays(this.planStartDate, d);
      for (const p of this.planMealPeriods) {
        const slotKey = `${date}-${p}`;
        newSlots.push({
          id: `slot-${date}-${p.toLowerCase()}`,
          date,
          mealPeriod: p,
          isBlocked: blockedMap.get(slotKey) === true,
          isLeftover: false,
          servingsConsumed: 0
        });
      }
    }
    this.planSlots = newSlots;
    this.hasRolled = false;
    this.generationHistory = [];
    this.historyIndex = -1;
    this.planWarnings = [];
    this.fullPlanRerollsRemaining = this.settings.maxFullPlanRerolls;
    this.individualSlotRerollsRemaining = this.settings.maxIndividualSlotRerolls;
  }

  toggleSlotBlocked(slotId: string) {
    const slot = this.planSlots.find(s => s.id === slotId);
    if (!slot) return;

    slot.isBlocked = !slot.isBlocked;
    if (slot.isBlocked) {
      slot.mealId = undefined;
      slot.mealName = undefined;
      slot.category = undefined;
      slot.isLeftover = false;
      slot.servingsConsumed = 0;
    }
  }

  async rollPlan() {
    this.isSpinning = true;

    const result = generatePlan({
      startDate: this.planStartDate,
      durationDays: this.planDurationDays,
      mealPeriods: this.planMealPeriods,
      allMeals: this.meals,
      categories: this.categories,
      settings: this.settings,
      historyMap: this.mealHistoryMap,
      existingSlots: this.planSlots,
      constraints: this.planConstraints
    });

    const snapshot: PlanGenerationSnapshot = {
      slots: JSON.parse(JSON.stringify(result.slots)),
      warnings: [...result.warnings]
    };

    this.generationHistory = [...this.generationHistory, snapshot];
    this.historyIndex = this.generationHistory.length - 1;
    this.planSlots = result.slots;
    this.planWarnings = result.warnings;
    this.hasRolled = true;

    // Subtle presentation pause for reel settling animation
    if (!this.settings.reducedMotion) {
      setTimeout(() => {
        this.isSpinning = false;
      }, 550);
    } else {
      this.isSpinning = false;
    }
  }

  async rerollFullPlan() {
    if (this.fullPlanRerollsRemaining <= 0) {
      this.showToast('Full-plan reroll allowance reached for this session.', 'warning');
      return;
    }

    this.fullPlanRerollsRemaining--;
    await this.rollPlan();
  }

  rerollSlot(slotId: string) {
    if (this.individualSlotRerollsRemaining <= 0) {
      this.showToast('Individual-slot reroll allowance reached for this session.', 'warning');
      return;
    }

    const slot = this.planSlots.find(s => s.id === slotId);
    if (!slot || slot.isBlocked) return;

    const { slot: updated, warning } = rerollSingleSlot({
      slotToReroll: slot,
      allSlots: this.planSlots,
      allMeals: this.meals,
      categories: this.categories,
      settings: this.settings,
      historyMap: this.mealHistoryMap,
      constraints: this.planConstraints
    });

    const idx = this.planSlots.findIndex(s => s.id === slotId);
    if (idx !== -1) {
      this.planSlots[idx] = updated;
      this.individualSlotRerollsRemaining--;

      if (warning && !this.planWarnings.some(w => w.ruleCategory === warning.ruleCategory)) {
        this.planWarnings.push(warning);
      }

      // Record this state in generation history
      const snapshot: PlanGenerationSnapshot = {
        slots: JSON.parse(JSON.stringify(this.planSlots)),
        warnings: [...this.planWarnings]
      };
      this.generationHistory = [...this.generationHistory, snapshot];
      this.historyIndex = this.generationHistory.length - 1;
    }
  }

  navigatePlanHistory(direction: 'prev' | 'next') {
    if (direction === 'prev' && this.historyIndex > 0) {
      this.historyIndex = this.historyIndex - 1;
      const snapshot = this.generationHistory[this.historyIndex];
      this.planSlots = JSON.parse(JSON.stringify(snapshot.slots));
      this.planWarnings = [...snapshot.warnings];
    } else if (direction === 'next' && this.historyIndex < this.generationHistory.length - 1) {
      this.historyIndex = this.historyIndex + 1;
      const snapshot = this.generationHistory[this.historyIndex];
      this.planSlots = JSON.parse(JSON.stringify(snapshot.slots));
      this.planWarnings = [...snapshot.warnings];
    }
  }

  async acceptPlan(): Promise<AcceptedPlan | null> {
    if (!this.hasRolled || this.planSlots.length === 0) return null;

    const endDate = addDays(this.planStartDate, this.planDurationDays - 1);
    const acceptedPlan: AcceptedPlan = {
      id: 'plan-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)),
      acceptedAt: new Date().toISOString(),
      startDate: this.planStartDate,
      endDate,
      slots: JSON.parse(JSON.stringify(this.planSlots)),
      warnings: [...this.planWarnings]
    };

    try {
      await acceptPlanTransaction(acceptedPlan);
      this.acceptedPlans = await getAllAcceptedPlans();
      this.mealHistoryMap = await getMealHistoryMap();
      this.viewingAcceptedPlan = acceptedPlan;
      this.showToast('Meal plan accepted and saved.', 'success');
      return acceptedPlan;
    } catch (err) {
      console.error('Failed to accept plan:', err);
      this.showToast('Could not save accepted plan.', 'error');
      return null;
    }
  }

  addConstraint(constraint: Omit<PlanConstraint, 'id'>) {
    const id = 'c-' + Math.random().toString(36).substring(2, 9);
    this.planConstraints.push({ id, ...constraint });
  }

  removeConstraint(id: string) {
    this.planConstraints = this.planConstraints.filter(c => c.id !== id);
  }

  applyTheme(theme: AppTheme) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  async updateTheme(theme: AppTheme) {
    this.applyTheme(theme);
    await this.updateSettingsData({ theme });
  }

  async toggleNutrition() {
    const nextVal = this.settings.showNutritionInfo === false;
    await this.updateSettingsData({ showNutritionInfo: nextVal });
  }

  async updateSettingsData(partial: Partial<HouseholdSettings>) {
    if (partial.theme) {
      this.applyTheme(partial.theme);
    }
    const updated = await updateSettings(partial);
    this.settings = updated;
    this.showToast('Settings saved.', 'success');
  }

  async saveMeal(meal: Meal) {
    await dbSaveMeal(meal);
    this.meals = await getAllMeals();
    this.showToast(`Saved "${meal.name}".`, 'success');
  }

  async deleteMeal(id: string) {
    await dbDeleteMeal(id);
    this.meals = await getAllMeals();
    this.showToast('Meal removed.', 'info');
  }

  async saveCategory(cat: MealCategory) {
    await dbSaveCategory(cat);
    this.categories = await getAllCategories();
    this.showToast(`Saved category "${cat.name}".`, 'success');
  }

  async deleteCategory(id: string) {
    await dbDeleteCategory(id);
    this.categories = await getAllCategories();
    this.showToast('Category removed.', 'info');
  }

  async saveRecipe(recipe: Recipe) {
    await dbSaveRecipe(recipe);
    this.recipes = await getAllRecipes();
    this.showToast(`Saved recipe "${recipe.name}".`, 'success');
  }

  async deleteRecipe(id: string) {
    await dbDeleteRecipe(id);
    this.recipes = await getAllRecipes();
    this.showToast('Recipe removed.', 'info');
  }

  async deleteAcceptedPlan(id: string) {
    await dbDeleteAcceptedPlan(id);
    this.acceptedPlans = await getAllAcceptedPlans();
    if (this.viewingAcceptedPlan?.id === id) {
      this.viewingAcceptedPlan = null;
    }
    this.showToast('Accepted plan deleted from history.', 'info');
  }

  async loadSampleData() {
    this.isLoading = true;
    try {
      await dbLoadSampleData();
      await this.init();
      this.showOnboarding = false;
      this.showToast('Loaded sample household dataset (30 meals).', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Failed to load sample dataset.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async clearAllData() {
    this.isLoading = true;
    try {
      await dbClearAllData();
      await this.init();
      this.showToast('Reset all household data.', 'info');
    } catch (err) {
      console.error(err);
      this.showToast('Failed to clear data.', 'error');
    } finally {
      this.isLoading = false;
    }
  }
}

export const appState = new AppState();
