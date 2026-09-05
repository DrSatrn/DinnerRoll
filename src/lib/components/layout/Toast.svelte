<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { IconClose, IconWarning, IconCheck } from '../../icons';
</script>

{#if appState.toast}
  <div class="toast-container" role="alert" aria-live="polite">
    <div class="toast-card toast-{appState.toast.type}">
      {#if appState.toast.type === 'error' || appState.toast.type === 'warning'}
        <IconWarning size={18} class="toast-icon" />
      {:else}
        <IconCheck size={18} class="toast-icon" />
      {/if}
      <span class="toast-text">{appState.toast.message}</span>
      <button
        type="button"
        class="toast-close"
        onclick={() => (appState.toast = null)}
        aria-label="Dismiss notification"
      >
        <IconClose size={15} />
      </button>
    </div>
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 100;
    max-width: 90vw;
  }

  .toast-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    font-size: 0.9rem;
    border: 1px solid var(--border-light);
    background-color: var(--bg-surface);
    color: var(--text-primary);
  }

  .toast-success {
    border-color: var(--accent-sage);
    background-color: var(--accent-sage-light);
    color: #1c3d2e;
  }

  .toast-warning {
    border-color: var(--accent-amber);
    background-color: var(--accent-amber-light);
    color: #78350f;
  }

  .toast-error {
    border-color: var(--accent-error);
    background-color: var(--accent-error-light);
    color: #7f1d1d;
  }

  .toast-close {
    padding: 0.2rem;
    color: inherit;
    opacity: 0.7;
    margin-left: 0.5rem;
  }

  .toast-close:hover {
    opacity: 1;
  }
</style>
