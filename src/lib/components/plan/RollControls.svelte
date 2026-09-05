<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import {
    IconRoll,
    IconReroll,
    IconAccept,
    IconChevronLeft,
    IconChevronRight,
    IconWarning
  } from '../../icons';

  let isAccepting = $state(false);

  async function handleAccept() {
    isAccepting = true;
    try {
      await appState.acceptPlan();
    } finally {
      isAccepting = false;
    }
  }
</script>

<div class="roll-controls-container">
  {#if appState.planWarnings.length > 0}
    <div class="relaxation-alert" role="status">
      <IconWarning size={18} class="alert-icon" />
      <div class="alert-text">
        <span class="alert-title">Schedule Compromise Applied</span>
        <div class="alert-descriptions">
          {#each appState.planWarnings as warning}
            <span class="alert-item">&bull; {warning.ruleCategory}: {warning.description}</span>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="controls-bar">
    {#if !appState.hasRolled}
      <button
        type="button"
        class="btn btn-primary btn-lg roll-main-btn"
        onclick={() => appState.rollPlan()}
        disabled={appState.isSpinning || appState.meals.length === 0}
      >
        <IconRoll size={20} />
        <span>Roll Schedule</span>
      </button>
    {:else}
      <div class="history-stepper">
        <button
          type="button"
          class="btn btn-secondary stepper-btn"
          onclick={() => appState.navigatePlanHistory('prev')}
          disabled={appState.historyIndex <= 0}
          title="Return to previous generated roll in this session"
          aria-label="Previous roll"
        >
          <IconChevronLeft size={16} />
          <span>Previous Roll</span>
        </button>

        <span class="history-indicator">
          Roll {appState.historyIndex + 1} of {appState.generationHistory.length}
        </span>

        <button
          type="button"
          class="btn btn-secondary stepper-btn"
          onclick={() => appState.navigatePlanHistory('next')}
          disabled={appState.historyIndex >= appState.generationHistory.length - 1}
          title="Go forward to next generated roll in this session"
          aria-label="Next roll"
        >
          <span>Next Roll</span>
          <IconChevronRight size={16} />
        </button>
      </div>

      <div class="action-buttons-group">
        <button
          type="button"
          class="btn btn-secondary"
          onclick={() => appState.rerollFullPlan()}
          disabled={appState.fullPlanRerollsRemaining <= 0 || appState.isSpinning}
          title="Reroll the full plan ({appState.fullPlanRerollsRemaining} remaining)"
        >
          <IconReroll size={16} />
          <span>Reroll All ({appState.fullPlanRerollsRemaining} left)</span>
        </button>

        <button
          type="button"
          class="btn btn-success btn-lg accept-btn"
          onclick={handleAccept}
          disabled={isAccepting}
        >
          <IconAccept size={18} />
          <span>Accept Plan</span>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .roll-controls-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.25rem;
  }

  .relaxation-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem 1.1rem;
    border-radius: var(--radius-md);
    background-color: var(--accent-amber-light);
    border: 1px solid #FCD34D;
    color: #78350F;
  }

  :global(.alert-icon) {
    color: var(--accent-amber);
    flex-shrink: 0;
    margin-top: 0.15rem;
  }

  .alert-text {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .alert-title {
    font-size: 0.88rem;
    font-weight: 700;
  }

  .alert-descriptions {
    display: flex;
    flex-direction: column;
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .controls-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .btn-lg {
    padding: 0.7rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .roll-main-btn {
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }

  .history-stepper {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .history-indicator {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    padding: 0 0.35rem;
  }

  .stepper-btn {
    font-size: 0.84rem;
    padding: 0.45rem 0.75rem;
  }

  .action-buttons-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    .controls-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 0.85rem;
    }

    .history-stepper {
      justify-content: space-between;
      width: 100%;
    }

    .action-buttons-group {
      flex-direction: column;
      width: 100%;
    }

    .action-buttons-group .btn {
      width: 100%;
    }
  }
</style>
