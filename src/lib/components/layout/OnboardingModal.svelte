<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { DinnerRollLogo, IconUpload, IconPlus } from '../../icons';
  import { restoreCompleteBackup } from '../../import-export/json-backup';

  let fileInput = $state<HTMLInputElement>();

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await restoreCompleteBackup(parsed);
      if (res.success) {
        await appState.init();
        appState.showOnboarding = false;
        appState.showToast(res.message, 'success');
      } else {
        appState.showToast(res.message, 'error');
      }
    } catch {
      appState.showToast('Invalid JSON backup file.', 'error');
    }
  }
</script>

{#if appState.showOnboarding}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <div class="modal-card">
      <div class="logo-wrap">
        <DinnerRollLogo size={48} class="onboarding-logo" />
      </div>

      <h1 id="onboarding-title" class="onboarding-title">Welcome to DinnerRoll</h1>
      <p class="onboarding-desc">
        DinnerRoll is your local-first household meal scheduler. All data stays strictly on your device.
        Choose how you would like to begin:
      </p>

      <div class="options-grid">
        <button
          type="button"
          class="option-card primary-option"
          onclick={() => appState.loadSampleData()}
        >
          <div class="option-header">
            <span class="option-badge">Recommended</span>
            <span class="option-title">Load Sample Household Data</span>
          </div>
          <p class="option-detail">
            Explore with a rich dataset of 30 neutral fictional meals, recipes, leftovers, and nutritional information.
          </p>
        </button>

        <button
          type="button"
          class="option-card"
          onclick={() => fileInput?.click()}
        >
          <div class="option-header">
            <IconUpload size={20} />
            <span class="option-title">Restore Existing Backup</span>
          </div>
          <p class="option-detail">
            Import a previously exported DinnerRoll JSON backup file.
          </p>
        </button>

        <input
          type="file"
          accept=".json"
          bind:this={fileInput}
          onchange={handleFileSelect}
          style="display: none;"
        />

        <button
          type="button"
          class="option-card"
          onclick={() => (appState.showOnboarding = false)}
        >
          <div class="option-header">
            <IconPlus size={20} />
            <span class="option-title">Start Blank</span>
          </div>
          <p class="option-detail">
            Begin with an empty library and add your household's favourite meals manually or via CSV.
          </p>
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
    z-index: 90;
    padding: 1rem;
  }

  .modal-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 540px;
    width: 100%;
    padding: 2.25rem 2rem;
    text-align: center;
  }

  .logo-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  :global(.onboarding-logo) {
    color: var(--accent-terracotta);
  }

  .onboarding-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }

  .onboarding-desc {
    font-size: 0.92rem;
    color: var(--text-secondary);
    margin-bottom: 1.75rem;
    line-height: 1.5;
  }

  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: left;
  }

  .option-card {
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1rem 1.15rem;
    background-color: var(--bg-surface);
    transition: all 0.15s ease;
    width: 100%;
  }

  .option-card:hover {
    border-color: var(--border-medium);
    background-color: var(--bg-subtle);
  }

  .primary-option {
    border-color: var(--accent-terracotta);
    background-color: var(--accent-terracotta-light);
  }

  .primary-option:hover {
    background-color: #F8E6DB;
  }

  .option-header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 0.25rem;
  }

  .option-badge {
    background-color: var(--accent-terracotta);
    color: var(--text-on-accent);
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .option-title {
    font-weight: 600;
    font-size: 0.98rem;
    color: var(--text-primary);
  }

  .option-detail {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }
</style>
