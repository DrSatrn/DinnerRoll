<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import {
    DinnerRollLogo,
    IconCalendar,
    IconMeals,
    IconHistory,
    IconSettings
  } from '../../icons';

  const navItems = [
    { id: 'plan' as const, label: 'Plan', icon: IconCalendar },
    { id: 'meals' as const, label: 'Meals', icon: IconMeals },
    { id: 'history' as const, label: 'History', icon: IconHistory },
    { id: 'settings' as const, label: 'Settings', icon: IconSettings }
  ];
</script>

<header class="app-header">
  <div class="header-container">
    <div class="brand" role="button" tabindex="0" onclick={() => (appState.currentView = 'plan')} onkeydown={(e) => e.key === 'Enter' && (appState.currentView = 'plan')}>
      <DinnerRollLogo size={32} class="brand-icon" />
      <div class="brand-text">
        <span class="brand-title">DinnerRoll</span>
        <span class="brand-tagline">Household Meal Scheduler</span>
      </div>
    </div>

    <nav class="nav-links" aria-label="Main Navigation">
      {#each navItems as item}
        {@const Icon = item.icon}
        <button
          type="button"
          class="nav-tab {appState.currentView === item.id ? 'active' : ''}"
          onclick={() => (appState.currentView = item.id)}
          aria-current={appState.currentView === item.id ? 'page' : undefined}
          aria-label={item.label}
        >
          <Icon size={18} />
          <span>{item.label}</span>
        </button>
      {/each}
    </nav>
  </div>
</header>

<style>
  .app-header {
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-light);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .header-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    user-select: none;
  }

  :global(.brand-icon) {
    color: var(--accent-terracotta);
    flex-shrink: 0;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  .brand-tagline {
    font-size: 0.72rem;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    transition: all 0.15s ease;
  }

  .nav-tab:hover {
    color: var(--text-primary);
    background-color: var(--bg-subtle);
  }

  .nav-tab.active {
    color: var(--accent-terracotta);
    background-color: var(--accent-terracotta-light);
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .header-container {
      padding: 0.6rem 0.85rem;
    }

    .brand-tagline {
      display: none;
    }

    .nav-tab span {
      display: none;
    }

    .nav-tab {
      padding: 0.5rem;
    }
  }
</style>
