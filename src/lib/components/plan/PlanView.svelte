<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import PlanSetup from './PlanSetup.svelte';
  import AdvancedConstraints from './AdvancedConstraints.svelte';
  import PlanGrid from './PlanGrid.svelte';
  import RollControls from './RollControls.svelte';
  import AcceptedPlanModal from './AcceptedPlanModal.svelte';
</script>

<div class="plan-view-container">
  <div class="plan-view-header">
    <h1 class="view-title">Schedule Meals</h1>
    <p class="view-subtitle">Select dates, toggle any days to block, and roll your schedule.</p>
  </div>

  <PlanSetup />

  <AdvancedConstraints />

  <PlanGrid />

  <RollControls />

  <AcceptedPlanModal bind:plan={appState.viewingAcceptedPlan} />
</div>

<style>
  .plan-view-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 1280px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem 1.25rem;
  }

  .plan-view-header {
    margin-bottom: 0.75rem;
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
</style>
