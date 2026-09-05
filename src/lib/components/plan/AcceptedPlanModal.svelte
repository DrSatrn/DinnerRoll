<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { formatHumanDate } from '../../scheduler/date-utils';
  import { downloadICSFile } from '../../integrations/ics';
  import { downloadPlanPDF } from '../../integrations/pdf';
  import { shareOrDownloadPlanImage } from '../../integrations/image';
  import { generateGroceryList } from '../../integrations/groceries';
  import GroceryModal from '../groceries/GroceryModal.svelte';
  import {
    IconClose,
    IconCalendar,
    IconGrocery,
    IconDownload,
    IconExport,
    IconCopy,
    IconLeftovers
  } from '../../icons';
  import type { AcceptedPlan } from '../../domain/models';

  let { plan = $bindable() } = $props<{ plan: AcceptedPlan | null }>();

  let isGroceryModalOpen = $state(false);

  function handleClose() {
    plan = null;
  }

  function handleDownloadICS() {
    if (!plan) return;
    downloadICSFile(plan.slots, `dinnerroll-plan-${plan.startDate}.ics`);
    appState.showToast('Downloaded calendar (.ics) file.', 'success');
  }

  function handleDownloadPDF() {
    if (!plan) return;
    const groceryData = generateGroceryList(plan.slots, appState.meals, appState.recipes);
    downloadPlanPDF({
      startDate: plan.startDate,
      endDate: plan.endDate,
      slots: plan.slots,
      groceries: groceryData.items
    }, `dinnerroll-plan-${plan.startDate}.pdf`);
    appState.showToast('Downloaded landscape PDF.', 'success');
  }

  async function handleShareImage() {
    if (!plan) return;
    appState.showToast('Preparing shareable image...', 'info');
    await shareOrDownloadPlanImage({
      startDate: plan.startDate,
      endDate: plan.endDate,
      slots: plan.slots
    });
  }

  async function handleCopyTextSchedule() {
    if (!plan) return;
    let text = `DinnerRoll Schedule: ${formatHumanDate(plan.startDate)} - ${formatHumanDate(plan.endDate)}\n`;
    text += '===============================================\n\n';

    for (const slot of plan.slots) {
      if (slot.isBlocked) {
        text += `${slot.date} (${slot.mealPeriod}): [Blocked]\n`;
      } else if (slot.mealName) {
        const lo = slot.isLeftover ? ' [Leftovers]' : '';
        text += `${slot.date} (${slot.mealPeriod}): ${slot.mealName}${lo}\n`;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      appState.showToast('Schedule copied to clipboard.', 'success');
    } catch {
      appState.showToast('Could not copy schedule.', 'error');
    }
  }
</script>

{#if plan}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <div class="header-tag">Accepted Plan</div>
          <h2 id="plan-modal-title" class="modal-title">
            {formatHumanDate(plan.startDate)} &ndash; {formatHumanDate(plan.endDate)}
          </h2>
        </div>
        <button
          type="button"
          class="modal-close"
          onclick={handleClose}
          aria-label="Close accepted plan modal"
        >
          <IconClose size={20} />
        </button>
      </div>

      <div class="modal-body">
        <div class="plan-summary-grid">
          {#each plan.slots as slot}
            <div class="summary-slot-card {slot.isBlocked ? 'blocked' : ''} {slot.isLeftover ? 'leftover' : ''}">
              <div class="slot-date-label">
                <span>{formatHumanDate(slot.date)}</span>
                <span class="slot-period-tag">{slot.mealPeriod}</span>
              </div>

              {#if slot.isBlocked}
                <span class="slot-blocked-tag">Blocked</span>
              {:else if slot.mealName}
                <div class="slot-details">
                  {#if slot.isLeftover}
                    <span class="slot-leftover-indicator">
                      <IconLeftovers size={11} />
                      <span>Leftover</span>
                    </span>
                  {/if}
                  <h4 class="slot-meal-title">{slot.mealName}</h4>
                  {#if slot.calories}
                    <span class="slot-macro-line">{slot.calories} kcal &bull; {slot.protein || 0}g protein</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="modal-actions-bar">
        <div class="export-buttons-group">
          <button
            type="button"
            class="btn btn-primary"
            onclick={() => (isGroceryModalOpen = true)}
          >
            <IconGrocery size={17} />
            <span>Groceries</span>
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            onclick={handleDownloadICS}
          >
            <IconCalendar size={17} />
            <span>Add to Calendar (.ics)</span>
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            onclick={handleDownloadPDF}
          >
            <IconDownload size={17} />
            <span>PDF</span>
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            onclick={handleShareImage}
          >
            <IconExport size={17} />
            <span>Share Image</span>
          </button>

          <button
            type="button"
            class="btn btn-ghost"
            onclick={handleCopyTextSchedule}
            title="Copy text schedule"
          >
            <IconCopy size={17} />
          </button>
        </div>
      </div>
    </div>
  </div>

  <GroceryModal slots={plan.slots} bind:isOpen={isGroceryModalOpen} />
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
    z-index: 90;
    padding: 1rem;
  }

  .modal-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 820px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .header-tag {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-sage);
    margin-bottom: 0.2rem;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .modal-close {
    color: var(--text-tertiary);
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.15s ease;
  }

  .modal-close:hover {
    color: var(--text-primary);
  }

  .modal-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .plan-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.75rem;
  }

  .summary-slot-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .summary-slot-card.leftover {
    border-left: 3px solid var(--accent-amber);
    background-color: #FFFDF9;
  }

  .summary-slot-card.blocked {
    background-color: var(--bg-subtle);
    border-style: dashed;
    opacity: 0.7;
  }

  .slot-date-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .slot-period-tag {
    text-transform: uppercase;
    font-size: 0.68rem;
    color: var(--text-tertiary);
  }

  .slot-blocked-tag {
    font-size: 0.82rem;
    color: var(--text-tertiary);
    font-style: italic;
  }

  .slot-leftover-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent-amber);
    text-transform: uppercase;
  }

  .slot-meal-title {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .slot-macro-line {
    font-size: 0.72rem;
    color: var(--text-tertiary);
  }

  .modal-actions-bar {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-light);
    background-color: var(--bg-subtle);
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
  }

  .export-buttons-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
  }

  @media (max-width: 640px) {
    .export-buttons-group {
      flex-direction: column;
      align-items: stretch;
    }

    .export-buttons-group .btn {
      width: 100%;
    }
  }
</style>
