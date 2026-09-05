<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { exportMealsToCSV } from '../../import-export/csv-exporter';
  import MealEditModal from './MealEditModal.svelte';
  import CSVImportModal from './CSVImportModal.svelte';
  import CategoryManagerModal from './CategoryManagerModal.svelte';
  import {
    IconPlus,
    IconEdit,
    IconTrash,
    IconUpload,
    IconDownload,
    IconSettings
  } from '../../icons';
  import type { Meal } from '../../domain/models';

  let searchQuery = $state('');
  let selectedCategory = $state('All');
  let selectedPeriod = $state('All');

  let editingMeal = $state<Meal | null>(null);
  let isMealModalOpen = $state(false);
  let isCSVModalOpen = $state(false);
  let isCategoryModalOpen = $state(false);

  let filteredMeals = $derived.by(() => {
    return appState.meals.filter(meal => {
      const matchesSearch =
        !searchQuery.trim() ||
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'All' || meal.category === selectedCategory;
      const matchesPeriod = selectedPeriod === 'All' || meal.mealTypes.includes(selectedPeriod as any);

      return matchesSearch && matchesCat && matchesPeriod;
    });
  });

  function handleAddMeal() {
    editingMeal = null;
    isMealModalOpen = true;
  }

  function handleEditMeal(meal: Meal) {
    editingMeal = meal;
    isMealModalOpen = true;
  }

  async function handleToggleEnabled(meal: Meal) {
    await appState.saveMeal({
      ...meal,
      enabled: meal.enabled === false ? true : false
    });
  }

  async function handleDeleteMeal(meal: Meal) {
    if (confirm(`Remove "${meal.name}" from your meal collection?`)) {
      await appState.deleteMeal(meal.id);
    }
  }

  function handleExportCSV() {
    const csvData = exportMealsToCSV(appState.meals);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dinnerroll-meals-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    appState.showToast(`Exported ${appState.meals.length} meals to CSV.`, 'success');
  }
</script>

<div class="meals-view-container">
  <div class="view-header">
    <div>
      <h1 class="view-title">Meal Library</h1>
      <p class="view-subtitle">Manage your household dishes, categories, and recipes ({appState.meals.length} total).</p>
    </div>

    <div class="header-actions">
      <button type="button" class="btn btn-secondary" onclick={() => (isCategoryModalOpen = true)}>
        <IconSettings size={16} />
        <span>Categories</span>
      </button>

      <button type="button" class="btn btn-secondary" onclick={() => (isCSVModalOpen = true)}>
        <IconUpload size={16} />
        <span>Import CSV</span>
      </button>

      <button type="button" class="btn btn-secondary" onclick={handleExportCSV} disabled={appState.meals.length === 0}>
        <IconDownload size={16} />
        <span>Export CSV</span>
      </button>

      <button type="button" class="btn btn-primary" onclick={handleAddMeal}>
        <IconPlus size={16} />
        <span>Add Meal</span>
      </button>
    </div>
  </div>

  <div class="filter-toolbar">
    <div class="search-box">
      <input
        type="search"
        class="input search-input"
        placeholder="Search dishes by name or category..."
        bind:value={searchQuery}
      />
    </div>

    <div class="filter-dropdowns">
      <select class="select filter-select" bind:value={selectedCategory}>
        <option value="All">All Categories</option>
        {#each appState.categories as cat}
          <option value={cat.name}>{cat.name}</option>
        {/each}
      </select>

      <select class="select filter-select" bind:value={selectedPeriod}>
        <option value="All">All Periods</option>
        <option value="Dinner">Dinner</option>
        <option value="Lunch">Lunch</option>
        <option value="Breakfast">Breakfast</option>
      </select>
    </div>
  </div>

  {#if filteredMeals.length === 0}
    <div class="empty-state">
      <p>No meals match your criteria.</p>
      {#if appState.meals.length === 0}
        <button type="button" class="btn btn-primary load-sample-btn" onclick={() => appState.loadSampleData()}>
          Load Sample Household Meals
        </button>
      {/if}
    </div>
  {:else}
    <div class="meals-grid">
      {#each filteredMeals as meal}
        <div class="meal-card {meal.enabled === false ? 'disabled-meal' : ''}">
          <div class="meal-card-top">
            <span class="category-chip">{meal.category}</span>
            <div class="status-toggle">
              <label class="switch-label">
                <input
                  type="checkbox"
                  checked={meal.enabled !== false}
                  onchange={() => handleToggleEnabled(meal)}
                />
                <span class="status-text">{meal.enabled !== false ? 'Active' : 'Disabled'}</span>
              </label>
            </div>
          </div>

          <h3 class="meal-title">{meal.name}</h3>

          <div class="meal-specs">
            <span class="spec-item">{meal.servings} portions</span>
            <span class="spec-divider">&bull;</span>
            <span class="spec-item">{meal.useByDays}d use-by</span>
            <span class="spec-divider">&bull;</span>
            <span class="spec-item">{meal.mealTypes.join(', ')}</span>
          </div>

          {#if meal.minimumRepeatWeeks}
            <div class="override-badge">
              <span>Repeat: {meal.minimumRepeatWeeks} weeks override</span>
            </div>
          {/if}

          {#if appState.settings.showNutritionInfo && meal.caloriesPerServing}
            <div class="macro-chips">
              <span class="macro-item">{meal.caloriesPerServing} kcal</span>
              <span class="macro-item">{meal.proteinGramsPerServing || 0}g P</span>
              <span class="macro-item">{meal.fatGramsPerServing || 0}g F</span>
              <span class="macro-item">{meal.carbsGramsPerServing || 0}g C</span>
            </div>
          {/if}

          <div class="meal-card-actions">
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => handleEditMeal(meal)}>
              <IconEdit size={14} />
              <span>Edit</span>
            </button>
            <button type="button" class="btn btn-ghost btn-sm delete-action" onclick={() => handleDeleteMeal(meal)}>
              <IconTrash size={14} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <MealEditModal bind:isOpen={isMealModalOpen} bind:meal={editingMeal} />
  <CSVImportModal bind:isOpen={isCSVModalOpen} />
  <CategoryManagerModal bind:isOpen={isCategoryModalOpen} />
</div>

<style>
  .meals-view-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .view-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .view-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .view-subtitle {
    font-size: 0.92rem;
    color: var(--text-secondary);
    margin-top: 0.2rem;
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .filter-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    background-color: var(--bg-surface);
    padding: 0.85rem 1.15rem;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
  }

  .search-box {
    flex: 1;
    min-width: 200px;
  }

  .search-input {
    height: 38px;
  }

  .filter-dropdowns {
    display: flex;
    gap: 0.5rem;
  }

  .filter-select {
    height: 38px;
    min-width: 140px;
  }

  .empty-state {
    padding: 3rem 1rem;
    text-align: center;
    background-color: var(--bg-surface);
    border: 1px dashed var(--border-medium);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .load-sample-btn {
    margin-top: 0.5rem;
  }

  .meals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .meal-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1.15rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: all 0.15s ease;
  }

  .meal-card:hover {
    border-color: var(--border-medium);
  }

  .meal-card.disabled-meal {
    opacity: 0.6;
    background-color: var(--bg-subtle);
  }

  .meal-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .category-chip {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent-terracotta);
    background-color: var(--accent-terracotta-light);
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-sm);
  }

  .switch-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
  }

  .status-text {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }

  .meal-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .meal-specs {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .spec-divider {
    color: var(--border-medium);
  }

  .override-badge {
    font-size: 0.74rem;
    color: var(--accent-sage);
    font-weight: 500;
  }

  .macro-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.25rem;
  }

  .macro-item {
    font-size: 0.72rem;
    background-color: var(--bg-subtle);
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
  }

  .meal-card-actions {
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .btn-sm {
    padding: 0.25rem 0.6rem;
    font-size: 0.8rem;
  }

  .delete-action:hover {
    color: var(--accent-error);
  }

  @media (max-width: 640px) {
    .filter-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-dropdowns {
      flex-direction: column;
    }

    .header-actions {
      width: 100%;
    }

    .header-actions .btn {
      flex: 1;
    }
  }
</style>
