<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { generateGroceryList } from '../../integrations/groceries';
  import { invokeAppleShortcut, buildShortcutSetupUrl } from '../../integrations/shortcuts';
  import { IconClose, IconCopy, IconExport, IconDownload, IconCheck } from '../../icons';
  import type { ScheduledSlot } from '../../domain/models';

  let {
    slots,
    isOpen = $bindable(false)
  } = $props<{
    slots: ScheduledSlot[];
    isOpen: boolean;
  }>();

  let groceryResult = $derived(generateGroceryList(slots, appState.meals, appState.recipes));
  let hasCopied = $state(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(groceryResult.textSummary);
      hasCopied = true;
      appState.showToast('Grocery list copied to clipboard.', 'success');
      setTimeout(() => (hasCopied = false), 2000);
    } catch {
      appState.showToast('Could not copy to clipboard.', 'error');
    }
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'DinnerRoll Grocery List',
          text: groceryResult.textSummary
        });
      } catch {
        // User cancelled or share unavailable
      }
    } else {
      await handleCopy();
    }
  }

  async function handleAppleGroceries() {
    const listName = appState.settings.remindersListName || 'Groceries';
    const shortcutName = appState.settings.shortcutName || 'DinnerRoll Groceries';
    const res = await invokeAppleShortcut(groceryResult.items, shortcutName, listName);
    if (!res.success) {
      appState.showToast('Apple Shortcuts could not be opened directly. List copied to clipboard.', 'warning');
      await handleCopy();
    } else {
      appState.showToast(`Sending items to "${listName}" in Apple Reminders...`, 'info');
    }
  }

  function handleDownloadText() {
    const blob = new Blob([groceryResult.textSummary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dinnerroll-groceries.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="grocery-title">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h2 id="grocery-title" class="modal-title">Grocery List</h2>
          <span class="modal-subtitle">
            Scaled from scheduled fresh meals (leftovers excluded). {groceryResult.items.length} items total.
          </span>
        </div>
        <button
          type="button"
          class="modal-close"
          onclick={() => (isOpen = false)}
          aria-label="Close grocery modal"
        >
          <IconClose size={20} />
        </button>
      </div>

      <div class="modal-content">
        {#if groceryResult.items.length === 0}
          <div class="empty-state">
            <p>No ingredients found. Link recipes with ingredients to your scheduled meals to automatically generate grocery lists.</p>
          </div>
        {:else}
          <div class="categories-list">
            {#each Object.entries(groceryResult.itemsByCategory) as [category, items]}
              <div class="grocery-category-group">
                <h4 class="category-heading">{category}</h4>
                <ul class="items-list">
                  {#each items as item}
                    <li class="grocery-item">
                      <span class="item-name">{item.name}</span>
                      <span class="item-qty">
                        {item.quantity ? `${item.quantity} ${item.unit}` : item.unit}
                      </span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="modal-actions">
        <button
          type="button"
          class="btn btn-primary apple-btn"
          onclick={handleAppleGroceries}
          disabled={groceryResult.items.length === 0}
          title="Add items to Apple Reminders list: {appState.settings.remindersListName || 'Groceries'}"
        >
          <span>Add to Apple Groceries ({appState.settings.remindersListName || 'Groceries'})</span>
        </button>

        <a
          href={buildShortcutSetupUrl()}
          class="btn btn-ghost btn-sm shortcut-setup-link"
          title="Configure or create companion Shortcut in Apple Shortcuts app"
        >
          Setup Shortcut
        </a>

        <button
          type="button"
          class="btn btn-secondary"
          onclick={handleCopy}
          disabled={groceryResult.items.length === 0}
        >
          {#if hasCopied}
            <IconCheck size={16} />
            <span>Copied</span>
          {:else}
            <IconCopy size={16} />
            <span>Copy Text</span>
          {/if}
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          onclick={handleShare}
          disabled={groceryResult.items.length === 0}
        >
          <IconExport size={16} />
          <span>Share</span>
        </button>

        <button
          type="button"
          class="btn btn-ghost"
          onclick={handleDownloadText}
          disabled={groceryResult.items.length === 0}
          title="Download text file"
        >
          <IconDownload size={16} />
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
    z-index: 95;
    padding: 1rem;
  }

  .modal-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 600px;
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

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .modal-subtitle {
    font-size: 0.8rem;
    color: var(--text-secondary);
    display: block;
    margin-top: 0.15rem;
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

  .modal-content {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.92rem;
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .category-heading {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-terracotta);
    margin-bottom: 0.45rem;
    border-bottom: 1px solid var(--border-light);
    padding-bottom: 0.25rem;
  }

  .items-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .grocery-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.88rem;
    padding: 0.25rem 0;
  }

  .item-name {
    color: var(--text-primary);
  }

  .item-qty {
    font-weight: 600;
    color: var(--text-secondary);
    background-color: var(--bg-subtle);
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
  }

  .modal-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-light);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
    background-color: var(--bg-subtle);
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
  }

  .apple-btn {
    background-color: #1C1917;
  }

  .apple-btn:hover:not(:disabled) {
    background-color: #0C0A09;
  }

  @media (max-width: 640px) {
    .modal-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .modal-actions .btn {
      width: 100%;
    }
  }
</style>
