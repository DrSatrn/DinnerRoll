<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { formatHumanDate } from '../../scheduler/date-utils';
  import AcceptedPlanModal from '../plan/AcceptedPlanModal.svelte';
  import { IconCalendar, IconTrash, IconExport } from '../../icons';
  import type { AcceptedPlan } from '../../domain/models';

  let selectedPlan = $state<AcceptedPlan | null>(null);

  async function handleDelete(plan: AcceptedPlan) {
    if (confirm(`Delete accepted plan from ${plan.startDate} to ${plan.endDate}?`)) {
      await appState.deleteAcceptedPlan(plan.id);
    }
  }
</script>

<div class="history-view-container">
  <div class="view-header">
    <div>
      <h1 class="view-title">Plan History</h1>
      <p class="view-subtitle">Review previously accepted household meal plans ({appState.acceptedPlans.length} plans).</p>
    </div>
  </div>

  {#if appState.acceptedPlans.length === 0}
    <div class="empty-state">
      <IconCalendar size={36} class="empty-icon" />
      <p class="empty-text">No accepted plans yet.</p>
      <span class="empty-hint">Roll and accept a meal plan in the Plan tab to record your first scheduled week.</span>
      <button type="button" class="btn btn-primary" onclick={() => (appState.currentView = 'plan')}>
        Go to Plan
      </button>
    </div>
  {:else}
    <div class="plans-list">
      {#each appState.acceptedPlans as plan}
        {@const mealCount = plan.slots.filter(s => !s.isBlocked && s.mealName).length}
        {@const leftoverCount = plan.slots.filter(s => s.isLeftover).length}
        <div class="history-card">
          <div class="card-main">
            <div class="date-badge">
              <span class="badge-start">{plan.startDate.slice(5)}</span>
              <span class="badge-arrow">&rarr;</span>
              <span class="badge-end">{plan.endDate.slice(5)}</span>
            </div>

            <div class="card-info">
              <h3 class="plan-date-range">
                {formatHumanDate(plan.startDate)} &ndash; {formatHumanDate(plan.endDate)}
              </h3>
              <div class="plan-meta">
                <span>{mealCount} meals scheduled</span>
                {#if leftoverCount > 0}
                  <span>&bull; {leftoverCount} leftover portion{leftoverCount === 1 ? '' : 's'}</span>
                {/if}
                <span>&bull; Accepted {new Date(plan.acceptedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              onclick={() => (selectedPlan = plan)}
            >
              <IconExport size={15} />
              <span>View &amp; Export</span>
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-sm delete-btn"
              onclick={() => handleDelete(plan)}
              title="Delete from history"
              aria-label="Delete plan"
            >
              <IconTrash size={15} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <AcceptedPlanModal bind:plan={selectedPlan} />
</div>

<style>
  .history-view-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .empty-state {
    padding: 3.5rem 1.5rem;
    text-align: center;
    background-color: var(--bg-surface);
    border: 1px dashed var(--border-medium);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  :global(.empty-icon) {
    color: var(--text-tertiary);
  }

  .empty-text {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-hint {
    font-size: 0.85rem;
    color: var(--text-tertiary);
    margin-bottom: 0.5rem;
  }

  .plans-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .history-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1.15rem 1.25rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    transition: border-color 0.15s ease;
  }

  .history-card:hover {
    border-color: var(--border-medium);
  }

  .card-main {
    display: flex;
    align-items: center;
    gap: 1.15rem;
  }

  .date-badge {
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    padding: 0.45rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--accent-terracotta);
  }

  .badge-arrow {
    color: var(--text-tertiary);
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .plan-date-range {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .plan-meta {
    font-size: 0.8rem;
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-sm {
    padding: 0.4rem 0.75rem;
    font-size: 0.84rem;
  }

  .delete-btn:hover {
    color: var(--accent-error);
  }

  @media (max-width: 640px) {
    .history-card {
      flex-direction: column;
      align-items: stretch;
      gap: 0.85rem;
    }

    .card-actions {
      justify-content: flex-end;
    }
  }
</style>
