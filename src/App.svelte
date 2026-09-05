<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from './lib/stores/app-state.svelte';
  import Header from './lib/components/layout/Header.svelte';
  import Toast from './lib/components/layout/Toast.svelte';
  import OnboardingModal from './lib/components/layout/OnboardingModal.svelte';
  import PlanView from './lib/components/plan/PlanView.svelte';
  import MealsView from './lib/components/meals/MealsView.svelte';
  import HistoryView from './lib/components/history/HistoryView.svelte';
  import SettingsView from './lib/components/settings/SettingsView.svelte';

  onMount(() => {
    appState.init();
  });
</script>

<div class="app-root">
  <Header />

  <main class="app-main">
    {#if appState.isLoading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your household meals...</p>
      </div>
    {:else}
      {#if appState.currentView === 'plan'}
        <PlanView />
      {:else if appState.currentView === 'meals'}
        <MealsView />
      {:else if appState.currentView === 'history'}
        <HistoryView />
      {:else if appState.currentView === 'settings'}
        <SettingsView />
      {/if}
    {/if}
  </main>

  <Toast />
  <OnboardingModal />
</div>

<style>
  .app-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-app);
  }

  .app-main {
    flex: 1;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 50vh;
    color: var(--text-secondary);
  }

  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-medium);
    border-top-color: var(--accent-terracotta);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
