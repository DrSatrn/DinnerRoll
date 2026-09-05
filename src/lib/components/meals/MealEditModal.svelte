<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import type { Meal, MealPeriod } from '../../domain/models';
  import { ALL_MEAL_PERIODS } from '../../domain/constants';
  import { IconClose } from '../../icons';

  let {
    meal = $bindable<Meal | null>(null),
    isOpen = $bindable(false)
  } = $props<{
    meal: Meal | null;
    isOpen: boolean;
  }>();

  // Local form state
  let name = $state('');
  let category = $state('Chicken');
  let servings = $state(4);
  let useByDays = $state(3);
  let selectedMealTypes = $state<MealPeriod[]>(['Dinner']);
  let minimumRepeatWeeks = $state<number | ''>('');
  let caloriesPerServing = $state<number | ''>('');
  let proteinGramsPerServing = $state<number | ''>('');
  let fatGramsPerServing = $state<number | ''>('');
  let carbsGramsPerServing = $state<number | ''>('');
  let weightModifier = $state<number>(1.0);
  let enabled = $state(true);
  let recipeId = $state<string>('');

  $effect(() => {
    if (isOpen) {
      if (meal) {
        name = meal.name;
        category = meal.category;
        servings = meal.servings;
        useByDays = meal.useByDays;
        selectedMealTypes = [...meal.mealTypes];
        minimumRepeatWeeks = meal.minimumRepeatWeeks ?? '';
        caloriesPerServing = meal.caloriesPerServing ?? '';
        proteinGramsPerServing = meal.proteinGramsPerServing ?? '';
        fatGramsPerServing = meal.fatGramsPerServing ?? '';
        carbsGramsPerServing = meal.carbsGramsPerServing ?? '';
        weightModifier = meal.weightModifier ?? 1.0;
        enabled = meal.enabled !== false;
        recipeId = meal.recipeId ?? '';
      } else {
        name = '';
        category = appState.categories[0]?.name || 'Chicken';
        servings = 4;
        useByDays = 3;
        selectedMealTypes = ['Dinner'];
        minimumRepeatWeeks = '';
        caloriesPerServing = '';
        proteinGramsPerServing = '';
        fatGramsPerServing = '';
        carbsGramsPerServing = '';
        weightModifier = 1.0;
        enabled = true;
        recipeId = '';
      }
    }
  });

  function togglePeriod(period: MealPeriod) {
    if (selectedMealTypes.includes(period)) {
      if (selectedMealTypes.length > 1) {
        selectedMealTypes = selectedMealTypes.filter(p => p !== period);
      }
    } else {
      selectedMealTypes = [...selectedMealTypes, period];
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name.trim()) {
      appState.showToast('Meal name is required.', 'warning');
      return;
    }

    const id = meal?.id || 'meal-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36));

    const updatedMeal: Meal = {
      id,
      name: name.trim(),
      category,
      servings: Math.max(1, Number(servings)),
      useByDays: Math.max(1, Number(useByDays)),
      mealTypes: selectedMealTypes,
      enabled,
      weightModifier: Number(weightModifier) || 1.0
    };

    if (minimumRepeatWeeks !== '' && !isNaN(Number(minimumRepeatWeeks))) {
      updatedMeal.minimumRepeatWeeks = Number(minimumRepeatWeeks);
    }
    if (caloriesPerServing !== '' && !isNaN(Number(caloriesPerServing))) {
      updatedMeal.caloriesPerServing = Number(caloriesPerServing);
    }
    if (proteinGramsPerServing !== '' && !isNaN(Number(proteinGramsPerServing))) {
      updatedMeal.proteinGramsPerServing = Number(proteinGramsPerServing);
    }
    if (fatGramsPerServing !== '' && !isNaN(Number(fatGramsPerServing))) {
      updatedMeal.fatGramsPerServing = Number(fatGramsPerServing);
    }
    if (carbsGramsPerServing !== '' && !isNaN(Number(carbsGramsPerServing))) {
      updatedMeal.carbsGramsPerServing = Number(carbsGramsPerServing);
    }
    if (recipeId) {
      updatedMeal.recipeId = recipeId;
    }

    await appState.saveMeal(updatedMeal);
    isOpen = false;
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="meal-edit-title">
    <div class="modal-card">
      <div class="modal-header">
        <h2 id="meal-edit-title" class="modal-title">{meal ? 'Edit Meal' : 'Add New Meal'}</h2>
        <button type="button" class="modal-close" onclick={() => (isOpen = false)} aria-label="Close modal">
          <IconClose size={20} />
        </button>
      </div>

      <form onsubmit={handleSubmit} class="modal-form">
        <div class="form-body">
          <div class="form-group">
            <label for="m-name" class="form-label">Meal Name *</label>
            <input id="m-name" type="text" class="input" bind:value={name} placeholder="e.g. Lemon Herb Roast Chicken" required />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="m-cat" class="form-label">Category *</label>
              <select id="m-cat" class="select" bind:value={category}>
                {#each appState.categories as cat}
                  <option value={cat.name}>{cat.name}</option>
                {/each}
              </select>
            </div>

            <div class="form-group">
              <label for="m-recipe" class="form-label">Linked Recipe</label>
              <select id="m-recipe" class="select" bind:value={recipeId}>
                <option value="">None (No linked recipe)</option>
                {#each appState.recipes as recipe}
                  <option value={recipe.id}>{recipe.name}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="m-servings" class="form-label">Cook Portions Produced *</label>
              <input id="m-servings" type="number" class="input" bind:value={servings} min="1" max="24" required />
              <span class="field-hint">Used for leftover allocations</span>
            </div>

            <div class="form-group">
              <label for="m-useby" class="form-label">Use-By Days (Shelf Life) *</label>
              <input id="m-useby" type="number" class="input" bind:value={useByDays} min="1" max="14" required />
              <span class="field-hint">Leftover safety cutoff</span>
            </div>
          </div>

          <div class="form-group">
            <span class="form-label">Eligible Meal Periods *</span>
            <div class="period-toggle-group">
              {#each ALL_MEAL_PERIODS as period}
                {@const isChecked = selectedMealTypes.includes(period)}
                <button
                  type="button"
                  class="period-chip {isChecked ? 'active' : ''}"
                  onclick={() => togglePeriod(period)}
                >
                  <span>{period}</span>
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label for="m-repeat" class="form-label">Minimum Repeat Weeks (Optional)</label>
            <input
              id="m-repeat"
              type="number"
              class="input"
              bind:value={minimumRepeatWeeks}
              placeholder="Default: {appState.settings.defaultMinimumRepeatWeeks} weeks"
              min="1"
            />
          </div>

          <div class="form-section-title">Nutritional Information (Per Portion)</div>
          <div class="form-grid-4">
            <div class="form-group">
              <label for="m-cal" class="form-label">Calories</label>
              <input id="m-cal" type="number" class="input" bind:value={caloriesPerServing} placeholder="kcal" min="0" />
            </div>
            <div class="form-group">
              <label for="m-pro" class="form-label">Protein (g)</label>
              <input id="m-pro" type="number" class="input" bind:value={proteinGramsPerServing} placeholder="g" min="0" />
            </div>
            <div class="form-group">
              <label for="m-fat" class="form-label">Fat (g)</label>
              <input id="m-fat" type="number" class="input" bind:value={fatGramsPerServing} placeholder="g" min="0" />
            </div>
            <div class="form-group">
              <label for="m-carbs" class="form-label">Carbs (g)</label>
              <input id="m-carbs" type="number" class="input" bind:value={carbsGramsPerServing} placeholder="g" min="0" />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label for="m-weight" class="form-label">Weight Modifier</label>
              <input id="m-weight" type="number" step="0.1" class="input" bind:value={weightModifier} min="0.1" max="5.0" />
              <span class="field-hint">1.0 = normal, 1.5 = +50%, 0.7 = -30%</span>
            </div>

            <div class="form-group toggle-group">
              <span class="form-label">Meal Status</span>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={enabled} />
                <span>Enabled for scheduling</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick={() => (isOpen = false)}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            Save Meal
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(45, 42, 38, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 95;
    padding: 1rem;
  }

  .modal-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 620px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 1.15rem 1.5rem;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .modal-close {
    color: var(--text-tertiary);
    padding: 0.25rem;
  }

  .modal-form {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
  }

  .form-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .field-hint {
    font-size: 0.72rem;
    color: var(--text-tertiary);
  }

  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }

  .form-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.65rem;
  }

  .form-section-title {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    padding-top: 0.5rem;
    border-top: 1px solid var(--border-light);
  }

  .period-toggle-group {
    display: flex;
    gap: 0.4rem;
  }

  .period-chip {
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    font-size: 0.85rem;
    transition: all 0.15s ease;
  }

  .period-chip.active {
    background-color: var(--accent-terracotta-light);
    border-color: var(--accent-terracotta);
    color: var(--accent-terracotta);
    font-weight: 600;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    margin-top: 0.4rem;
    cursor: pointer;
  }

  .modal-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-light);
    background-color: var(--bg-subtle);
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
  }

  @media (max-width: 640px) {
    .form-grid-2, .form-grid-4 {
      grid-template-columns: 1fr;
    }
  }
</style>
