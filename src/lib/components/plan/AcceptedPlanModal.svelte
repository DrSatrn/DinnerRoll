<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { formatHumanDate } from '../../scheduler/date-utils';
  import { downloadICSFile } from '../../integrations/ics';
  import { downloadPlanPDF } from '../../integrations/pdf';
  import { shareOrDownloadPlanImage } from '../../integrations/image';
  import { generateGroceryList } from '../../integrations/groceries';
  import { copyScheduleToClipboard } from '../../integrations/clipboard';
  import { sendPlanAsEmail } from '../../integrations/email';
  import GroceryModal from '../groceries/GroceryModal.svelte';
  import {
    IconClose,
    IconCalendar,
    IconGrocery,
    IconDownload,
    IconExport,
    IconCopy,
    IconLeftovers,
    IconEmail
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
      groceries: groceryData.items,
      themeId: appState.settings.theme,
      showNutrition: appState.settings.showNutritionInfo
    }, `dinnerroll-plan-${plan.startDate}.pdf`);
    appState.showToast('Downloaded landscape PDF.', 'success');
  }

  async function handleShareImage() {
    if (!plan) return;
    appState.showToast('Preparing shareable image...', 'info');
    await shareOrDownloadPlanImage({
      startDate: plan.startDate,
      endDate: plan.endDate,
      slots: plan.slots,
      themeId: appState.settings.theme,
      showNutrition: appState.settings.showNutritionInfo
    });
  }

  async function handleCopyTextSchedule() {
    if (!plan) return;
    const success = await copyScheduleToClipboard(plan, {
      showNutrition: appState.settings.showNutritionInfo,
      themeId: appState.settings.theme
    });
    if (success) {
      appState.showToast('Schedule copied to clipboard (rich table ready to paste!).', 'success');
    } else {
      appState.showToast('Could not copy schedule.', 'error');
    }
  }

  async function handleSendEmail() {
    if (!plan) return;
    appState.showToast('Preparing email with calendar invite & PDF...', 'info');
    await sendPlanAsEmail({
      plan,
      settings: appState.settings,
      themeId: appState.settings.theme,
      showNutrition: appState.settings.showNutritionInfo
    });
    appState.showToast('Opening default email client.', 'success');
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
                    <span class="leftover-pill" title="Prepared from leftovers">
                      <IconLeftovers size={10} />
                      <span>Leftover</span>
                    </span>
                  {/if}
                  <h4 class="slot-meal-title">{slot.mealName}</h4>
                  {#if appState.settings.showNutritionInfo && slot.calories}
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
            onclick={handleSendEmail}
            title="Send formatted plan with .ics calendar invite and PDF via default email app"
          >
            <IconEmail size={17} />
            <span>Send Email</span>
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
            title="Copy rich table & clean text to clipboard"
            aria-label="Copy schedule to clipboard"
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
    background-color: rgba(24, 20, 16, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 50;
  }

  .modal-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-light);
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
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 0.75rem;
  }

  .summary-slot-card {
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .summary-slot-card.leftover {
    border-left: 3px solid var(--accent-amber);
    background: linear-gradient(180deg, #FFFDF8 0%, var(--bg-subtle) 100%);
  }

  .summary-slot-card.blocked {
    opacity: 0.65;
  }

  .slot-date-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .slot-period-tag {
    font-size: 0.68rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
  }

  .slot-blocked-tag {
    font-size: 0.82rem;
    font-style: italic;
    color: var(--text-tertiary);
    padding: 0.5rem 0;
  }

  .slot-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .slot-meal-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .slot-macro-line {
    font-size: 0.7rem;
    color: var(--text-tertiary);
  }

  .modal-actions-bar {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-light);
    background-color: var(--bg-subtle);
  }

  .export-buttons-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
  }

  @media (max-width: 640px) {
    .export-buttons-group {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
