<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import PlanSetup from './PlanSetup.svelte';
  import AdvancedConstraints from './AdvancedConstraints.svelte';
  import PlanGrid from './PlanGrid.svelte';
  import RollControls from './RollControls.svelte';
  import AcceptedPlanModal from './AcceptedPlanModal.svelte';
</script>

<div class="plan-view-container">
  <!-- Scheduling Machine Console -->
  <div class="scheduling-machine {appState.isSpinning ? 'machine-active-spin' : ''}">
    <!-- Machine Console Top Bezel -->
    <div class="machine-header-bezel">
      <div class="machine-brand-plate">
        <span class="screw screw-tl"></span>
        <span class="machine-plate-title">DINNER&bull;O&bull;MATIC</span>
        <span class="screw screw-tr"></span>
      </div>

      <!-- Center Dynamic Marquee -->
      <div class="machine-ticker {appState.isSpinning ? 'spinning' : appState.hasRolled ? 'locked' : 'ready'}">
        <span class="ticker-led"></span>
        <span class="ticker-label">
          {#if appState.isSpinning}
            ROLLING REELS &bull; RANDOMIZING DISHES...
          {:else if !appState.hasRolled}
            MACHINE READY &bull; SET DATES &amp; PULL LEVER
          {:else}
            SCHEDULE LOCKED &bull; ACCEPT OR REROLL
          {/if}
        </span>
      </div>

      <!-- Right Mechanical Odometer Counters -->
      <div class="machine-counters">
        <div class="odometer-pod" title="Full-plan rerolls remaining in this session">
          <span class="odometer-label">ROLLS</span>
          <span class="odometer-value">{appState.fullPlanRerollsRemaining}</span>
        </div>
        <div class="odometer-pod" title="Single-slot rerolls remaining in this session">
          <span class="odometer-label">SLOTS</span>
          <span class="odometer-value">{appState.individualSlotRerollsRemaining}</span>
        </div>
      </div>
    </div>

    <!-- Machine Control Switchboard -->
    <div class="machine-deck machine-control-deck">
      <PlanSetup />
      <AdvancedConstraints />
    </div>

    <!-- Reel Viewing Aperture (Grid Housing) -->
    <div class="reel-viewing-aperture">
      <div class="reels-glass-housing">
        <PlanGrid />
      </div>
    </div>

    <!-- Machine Action Deck (Roll Lever & Stepper) -->
    <div class="machine-deck machine-action-deck">
      <RollControls />
    </div>
  </div>

  <AcceptedPlanModal bind:plan={appState.viewingAcceptedPlan} />
</div>

<style>
  .plan-view-container {
    max-width: 1320px;
    margin: 0 auto;
    padding: 1.25rem 1rem 3.5rem 1rem;
  }

  /* Scheduling Machine Frame */
  .scheduling-machine {
    background-color: var(--chassis-bg);
    border: 2px solid var(--chassis-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-tactile), var(--shadow-md);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    position: relative;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .scheduling-machine.machine-active-spin {
    box-shadow: 0 6px 28px var(--chassis-glow), var(--shadow-tactile);
    border-color: var(--accent-terracotta);
  }

  /* Top Bezel */
  .machine-header-bezel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 0.85rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .machine-brand-plate {
    position: relative;
    padding: 0.35rem 0.9rem;
    background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-muted) 100%);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    user-select: none;
  }

  .machine-plate-title {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: var(--chassis-metal);
    text-transform: uppercase;
  }

  .screw {
    width: 4px;
    height: 4px;
    background-color: var(--border-dark);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .screw-tl { left: 4px; }
  .screw-tr { right: 4px; }

  /* Machine Ticker Marquee */
  .machine-ticker {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0.85rem;
    border-radius: var(--radius-sm);
    background-color: var(--bg-app);
    border: 1px solid var(--border-light);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
  }

  .ticker-led {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--accent-sage);
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
  }

  .machine-ticker.spinning .ticker-led {
    background-color: var(--accent-terracotta);
    box-shadow: 0 0 8px var(--accent-terracotta);
    animation: blinkLed 0.3s infinite alternate;
  }

  .machine-ticker.spinning .ticker-label {
    color: var(--accent-terracotta);
  }

  .machine-ticker.ready .ticker-led {
    background-color: var(--accent-sage);
    box-shadow: 0 0 6px rgba(56, 97, 80, 0.4);
  }

  .machine-ticker.locked .ticker-led {
    background-color: var(--accent-amber);
    box-shadow: 0 0 6px rgba(180, 83, 9, 0.4);
  }

  @keyframes blinkLed {
    0% { opacity: 0.3; }
    100% { opacity: 1; }
  }

  /* Odometer Pods */
  .machine-counters {
    display: flex;
    gap: 0.45rem;
  }

  .odometer-pod {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background-color: var(--bg-app);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    padding: 0.25rem 0.55rem;
  }

  .odometer-label {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
  }

  .odometer-value {
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  /* Decks */
  .machine-deck {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  /* Sunken Reel Viewing Aperture */
  .reel-viewing-aperture {
    background-color: var(--chassis-inner);
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .reels-glass-housing {
    position: relative;
  }

  @media (max-width: 640px) {
    .plan-view-container {
      padding: 0.75rem 0.5rem 3rem 0.5rem;
    }

    .scheduling-machine {
      padding: 0.65rem;
      border-radius: var(--radius-md);
    }

    .machine-header-bezel {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .machine-brand-plate {
      justify-content: center;
    }

    .machine-ticker {
      justify-content: center;
      text-align: center;
    }

    .machine-counters {
      justify-content: center;
    }

    .reel-viewing-aperture {
      padding: 0.35rem;
    }
  }
</style>
