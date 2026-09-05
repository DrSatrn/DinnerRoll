<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import type { MealCategory } from '../../domain/models';
  import { IconClose, IconPlus, IconTrash } from '../../icons';

  let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();

  let newCategoryName = $state('');
  let newCategoryWeight = $state(1.0);

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;

    const name = newCategoryName.trim();
    if (appState.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      appState.showToast(`Category "${name}" already exists.`, 'warning');
      return;
    }

    const id = 'cat-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    await appState.saveCategory({
      id,
      name,
      weight: Number(newCategoryWeight) || 1.0
    });

    newCategoryName = '';
    newCategoryWeight = 1.0;
  }

  async function handleUpdateWeight(cat: MealCategory, newWeight: number) {
    await appState.saveCategory({
      ...cat,
      weight: Math.max(0.1, Number(newWeight))
    });
  }

  async function handleDeleteCategory(cat: MealCategory) {
    const mealsUsingCategory = appState.meals.filter(m => m.category === cat.name);
    if (mealsUsingCategory.length > 0) {
      appState.showToast(
        `Cannot delete "${cat.name}": it is assigned to ${mealsUsingCategory.length} meal(s). Reassign them first.`,
        'warning'
      );
      return;
    }

    await appState.deleteCategory(cat.id);
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cat-modal-title">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h2 id="cat-modal-title" class="modal-title">Meal Categories</h2>
          <span class="modal-subtitle">Configure categories and relative selection weights.</span>
        </div>
        <button type="button" class="modal-close" onclick={() => (isOpen = false)} aria-label="Close modal">
          <IconClose size={20} />
        </button>
      </div>

      <div class="modal-body">
        <div class="categories-table">
          <div class="table-header">
            <span class="col-name">Category</span>
            <span class="col-weight">Selection Bias</span>
            <span class="col-meals">Meals</span>
            <span class="col-action"></span>
          </div>

          <div class="table-rows">
            {#each appState.categories as cat}
              {@const mealCount = appState.meals.filter(m => m.category === cat.name).length}
              <div class="table-row">
                <span class="cat-name-cell">{cat.name}</span>
                <div class="cat-weight-cell">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5.0"
                    class="input weight-input"
                    value={cat.weight}
                    onchange={(e) => handleUpdateWeight(cat, parseFloat((e.target as HTMLInputElement).value))}
                  />
                  <span class="weight-label">x</span>
                </div>
                <span class="meal-count-cell">{mealCount} meal{mealCount === 1 ? '' : 's'}</span>
                <div class="action-cell">
                  <button
                    type="button"
                    class="delete-btn"
                    onclick={() => handleDeleteCategory(cat)}
                    disabled={mealCount > 0}
                    title={mealCount > 0 ? 'Assigned to meals; cannot delete' : 'Delete category'}
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="add-cat-bar">
          <input
            type="text"
            class="input add-cat-input"
            placeholder="New category name..."
            bind:value={newCategoryName}
          />
          <div class="weight-input-wrapper">
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5.0"
              class="input weight-input"
              placeholder="1.0"
              bind:value={newCategoryWeight}
            />
            <span class="weight-label">x</span>
          </div>
          <button type="button" class="btn btn-secondary" onclick={handleAddCategory} disabled={!newCategoryName.trim()}>
            <IconPlus size={15} />
            <span>Add</span>
          </button>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-primary" onclick={() => (isOpen = false)}>
          Done
        </button>
      </div>
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
    max-width: 540px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .modal-subtitle {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .modal-close {
    color: var(--text-tertiary);
    padding: 0.25rem;
  }

  .modal-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    flex: 1;
  }

  .categories-table {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 40px;
    background-color: var(--bg-subtle);
    padding: 0.5rem 0.85rem;
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-light);
  }

  .table-rows {
    display: flex;
    flex-direction: column;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 40px;
    align-items: center;
    padding: 0.5rem 0.85rem;
    border-bottom: 1px solid var(--border-light);
    font-size: 0.88rem;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .cat-name-cell {
    font-weight: 600;
  }

  .cat-weight-cell {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .weight-input {
    width: 65px;
    padding: 0.25rem 0.45rem;
    height: 32px;
    font-size: 0.85rem;
  }

  .weight-label {
    font-size: 0.8rem;
    color: var(--text-tertiary);
  }

  .meal-count-cell {
    font-size: 0.8rem;
    color: var(--text-tertiary);
  }

  .action-cell {
    display: flex;
    justify-content: flex-end;
  }

  .delete-btn {
    color: var(--text-tertiary);
    padding: 0.2rem;
    border-radius: 4px;
    transition: color 0.15s ease;
  }

  .delete-btn:hover:not(:disabled) {
    color: var(--accent-error);
  }

  .delete-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .add-cat-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .add-cat-input {
    flex: 1;
    height: 38px;
  }

  .weight-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .modal-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-light);
    background-color: var(--bg-subtle);
    display: flex;
    justify-content: flex-end;
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
  }
</style>
