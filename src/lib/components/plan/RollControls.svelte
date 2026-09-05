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
        class="btn btn-primary btn-lg roll-main-btn tactile-lever-btn {appState.isSpinning ? 'spinning' : ''}"
        onclick={() => appState.rollPlan()}
        disabled={appState.isSpinning || appState.meals.length === 0}
        aria-label="Roll Schedule"
      >
        <IconRoll size={22} class={appState.isSpinning ? 'icon-spin' : ''} />
        <span>{appState.isSpinning ? 'Spinning Reels...' : 'Roll Schedule'}</span>
      </button>
    {:else}
      <div class="history-stepper">
        <button
          type="button"
          class="btn btn-secondary stepper-btn"
          onclick={() => appState.navigatePlanHistory('prev')}
          disabled={appState.historyIndex <= 0 || appState.isSpinning}
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
          disabled={appState.historyIndex >= appState.generationHistory.length - 1 || appState.isSpinning}
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
          class="btn btn-secondary tactile-reroll-btn"
          onclick={() => appState.rerollFullPlan()}
          disabled={appState.fullPlanRerollsRemaining <= 0 || appState.isSpinning}
          title="Reroll the full plan ({appState.fullPlanRerollsRemaining} remaining)"
        >
          <IconReroll size={16} class={appState.isSpinning ? 'icon-spin' : ''} />
          <span>Reroll All ({appState.fullPlanRerollsRemaining} left)</span>
        </button>

        <button
          type="button"
          class="btn btn-success btn-lg accept-btn tactile-accept-btn"
          onclick={handleAccept}
          disabled={isAccepting || appState.isSpinning}
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
    margin-top: 0.75rem;
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
    padding: 1.1rem 1.35rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .btn-lg {
    padding: 0.75rem 1.6rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .roll-main-btn {
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
  }

  .tactile-lever-btn {
    position: relative;
    padding: 0.9rem 2.2rem;
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 0 var(--accent-terracotta-hover), 0 8px 18px var(--chassis-glow);
    transition: all 0.12s ease;
  }

  .tactile-lever-btn:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--accent-terracotta-hover), 0 3px 8px var(--chassis-glow);
  }

  .tactile-lever-btn.spinning {
    animation: pulseLever 0.6s infinite alternate;
  }

  @keyframes pulseLever {
    0% { filter: brightness(1); }
    100% { filter: brightness(1.15); box-shadow: 0 4px 20px var(--chassis-glow); }
  }

  :global(.icon-spin) {
    animation: iconRotate 0.6s linear infinite;
  }

  @keyframes iconRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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

  .tactile-accept-btn {
    box-shadow: 0 3px 0 #284438;
    transition: all 0.12s ease;
  }

  .tactile-accept-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #284438;
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
