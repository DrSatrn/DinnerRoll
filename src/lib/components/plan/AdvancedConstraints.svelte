<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { IconChevronDown, IconPlus, IconClose } from '../../icons';
  import type { ConstraintMetric, ConstraintOperator } from '../../domain/models';

  let isOpen = $state(false);

  let newTarget = $state<'plan' | 'slot'>('plan');
  let newSlotId = $state('');
  let newMetric = $state<ConstraintMetric>('calories');
  let newOperator = $state<ConstraintOperator>('<=');
  let newNumericValue = $state(600);
  let newCategoryValue = $state('Beef');

  function handleAddConstraint() {
    const val = newMetric === 'category' ? newCategoryValue : newNumericValue;
    appState.addConstraint({
      target: newTarget,
      slotId: newTarget === 'slot' ? newSlotId : undefined,
      metric: newMetric,
      operator: newMetric === 'category' ? '==' : newOperator,
      value: val
    });
  }
</script>

<div class="advanced-section">
  <button
    type="button"
    class="advanced-ribbon"
    onclick={() => (isOpen = !isOpen)}
    aria-expanded={isOpen}
  >
    <div class="ribbon-line"></div>
    <div class="ribbon-label">
      <span>Advanced Constraints</span>
      <IconChevronDown size={14} class="ribbon-chevron {isOpen ? 'rotated' : ''}" />
    </div>
    <div class="ribbon-line"></div>
  </button>

  {#if isOpen}
    <div class="advanced-content">
      {#if appState.planConstraints.length > 0}
        <div class="active-constraints">
          <span class="constraints-title">Active Constraints ({appState.planConstraints.length}):</span>
          <div class="chips-list">
            {#each appState.planConstraints as c}
              <div class="constraint-chip">
                <span class="chip-scope">[{c.target.toUpperCase()}]</span>
                <span class="chip-rule">
                  {c.metric} {c.operator} {c.value} {c.metric === 'calories' ? 'kcal' : c.metric === 'category' ? '' : 'g'}
                </span>
                <button
                  type="button"
                  class="chip-remove"
                  onclick={() => appState.removeConstraint(c.id)}
                  aria-label="Remove constraint"
                >
                  <IconClose size={12} />
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="constraint-form">
        <div class="form-row">
          <div class="form-field">
            <label for="c-target" class="field-label">Scope</label>
            <select id="c-target" class="select" bind:value={newTarget}>
              <option value="plan">Whole Plan</option>
              <option value="slot">Specific Slot</option>
            </select>
          </div>

          {#if newTarget === 'slot'}
            <div class="form-field">
              <label for="c-slot" class="field-label">Target Slot</label>
              <select id="c-slot" class="select" bind:value={newSlotId}>
                <option value="">Select a slot...</option>
                {#each appState.planSlots as slot}
                  <option value={slot.id}>{slot.date} ({slot.mealPeriod})</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="form-field">
            <label for="c-metric" class="field-label">Metric</label>
            <select id="c-metric" class="select" bind:value={newMetric}>
              <option value="calories">Calories</option>
              <option value="protein">Protein (g)</option>
              <option value="fat">Fat (g)</option>
              <option value="carbs">Carbs (g)</option>
              <option value="category">Category</option>
            </select>
          </div>

          {#if newMetric !== 'category'}
            <div class="form-field operator-field">
              <label for="c-operator" class="field-label">Condition</label>
              <select id="c-operator" class="select" bind:value={newOperator}>
                <option value="<=">&le; At most</option>
                <option value=">=">&ge; At least</option>
              </select>
            </div>

            <div class="form-field">
              <label for="c-num-val" class="field-label">Target Value</label>
              <input id="c-num-val" type="number" class="input" bind:value={newNumericValue} min="0" step="5" />
            </div>
          {:else}
            <div class="form-field">
              <label for="c-cat-val" class="field-label">Must Equal</label>
              <select id="c-cat-val" class="select" bind:value={newCategoryValue}>
                {#each appState.categories as cat}
                  <option value={cat.name}>{cat.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          <button
            type="button"
            class="btn btn-secondary add-constraint-btn"
            onclick={handleAddConstraint}
            disabled={newTarget === 'slot' && !newSlotId}
          >
            <IconPlus size={15} />
            <span>Add Constraint</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .advanced-section {
    margin: 1.25rem 0;
  }

  .advanced-ribbon {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.5rem 0;
    cursor: pointer;
    user-select: none;
  }

  .ribbon-line {
    flex: 1;
    height: 1px;
    background-color: var(--border-light);
  }

  .ribbon-label {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.25rem 0.85rem;
    font-size: 0.76rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-full);
    background-color: var(--bg-surface);
    transition: all 0.15s ease;
  }

  .advanced-ribbon:hover .ribbon-label {
    color: var(--text-primary);
    border-color: var(--border-medium);
  }

  :global(.ribbon-chevron) {
    transition: transform 0.2s ease;
  }

  :global(.ribbon-chevron.rotated) {
    transform: rotate(180deg);
  }

  .advanced-content {
    margin-top: 0.85rem;
    padding: 1.15rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
  }

  .active-constraints {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 1rem;
  }

  .constraints-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .chips-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .constraint-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.65rem;
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
  }

  .chip-scope {
    font-weight: 700;
    font-size: 0.7rem;
    color: var(--accent-terracotta);
  }

  .chip-rule {
    color: var(--text-primary);
  }

  .chip-remove {
    display: flex;
    align-items: center;
    color: var(--text-tertiary);
    padding: 0.1rem;
    border-radius: 50%;
  }

  .chip-remove:hover {
    color: var(--accent-error);
  }

  .constraint-form {
    display: flex;
    flex-direction: column;
  }

  .form-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 110px;
  }

  .field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .add-constraint-btn {
    height: 38px;
    align-self: flex-end;
  }

  @media (max-width: 640px) {
    .form-row {
      flex-direction: column;
      align-items: stretch;
    }

    .add-constraint-btn {
      width: 100%;
    }
  }
</style>
