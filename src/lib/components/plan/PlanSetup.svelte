<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import type { MealPeriod } from '../../domain/models';
  import { ALL_MEAL_PERIODS } from '../../domain/constants';
  import { IconBreakfast, IconLunch, IconDinner } from '../../icons';

  const durationOptions = [3, 5, 7, 10, 14, 21];

  function toggleMealPeriod(period: MealPeriod) {
    if (appState.planMealPeriods.includes(period)) {
      if (appState.planMealPeriods.length > 1) {
        appState.planMealPeriods = appState.planMealPeriods.filter(p => p !== period);
        appState.initializeUnpopulatedGrid();
      } else {
        appState.showToast('At least one meal period must remain selected.', 'warning');
      }
    } else {
      appState.planMealPeriods = [...appState.planMealPeriods, period];
      appState.initializeUnpopulatedGrid();
    }
  }

  function handleDurationChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    appState.planDurationDays = parseInt(target.value, 10);
    appState.initializeUnpopulatedGrid();
  }

  function handleStartDateChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value) {
      appState.planStartDate = target.value;
      appState.initializeUnpopulatedGrid();
    }
  }
</script>

<div class="setup-bar">
  <div class="setup-group">
    <label for="plan-start-date" class="setup-label">Starting Date</label>
    <input
      id="plan-start-date"
      type="date"
      class="input setup-input"
      value={appState.planStartDate}
      onchange={handleStartDateChange}
    />
  </div>

  <div class="setup-group">
    <label for="plan-duration" class="setup-label">Duration</label>
    <select
      id="plan-duration"
      class="select setup-select"
      value={appState.planDurationDays}
      onchange={handleDurationChange}
    >
      {#each durationOptions as days}
        <option value={days}>{days} Days {days === 7 ? '(1 Week)' : days === 14 ? '(2 Weeks)' : ''}</option>
      {/each}
    </select>
  </div>

  <div class="setup-group">
    <span class="setup-label">Meal Periods</span>
    <div class="period-toggle-group">
      {#each ALL_MEAL_PERIODS as period}
        {@const isSelected = appState.planMealPeriods.includes(period)}
        <button
          type="button"
          class="period-chip {isSelected ? 'active' : ''}"
          onclick={() => toggleMealPeriod(period)}
          aria-pressed={isSelected}
        >
          {#if period === 'Breakfast'}<IconBreakfast size={15} />{/if}
          {#if period === 'Lunch'}<IconLunch size={15} />{/if}
          {#if period === 'Dinner'}<IconDinner size={15} />{/if}
          <span>{period}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .setup-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1.25rem;
    padding: 1.1rem 1.25rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .setup-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .setup-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .setup-input, .setup-select {
    width: auto;
    min-width: 140px;
    height: 38px;
  }

  .period-toggle-group {
    display: flex;
    gap: 0.35rem;
  }

  .period-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.8rem;
    font-size: 0.88rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    transition: all 0.15s ease;
    height: 38px;
  }

  .period-chip:hover {
    background-color: var(--bg-subtle);
    color: var(--text-primary);
  }

  .period-chip.active {
    background-color: var(--accent-terracotta-light);
    border-color: var(--accent-terracotta);
    color: var(--accent-terracotta);
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .setup-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .setup-input, .setup-select {
      width: 100%;
    }

    .period-chip {
      flex: 1;
      justify-content: center;
    }
  }
</style>
