<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { parseMealsCSV, type CSVParseResult } from '../../import-export/csv-importer';
  import { IconClose, IconUpload, IconWarning, IconCheck } from '../../icons';
  import type { Meal } from '../../domain/models';

  let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();

  let csvText = $state('');
  let parseResult = $state<CSVParseResult | null>(null);
  let fileInput = $state<HTMLInputElement>();

  function handleParse() {
    if (!csvText.trim()) {
      parseResult = null;
      return;
    }
    parseResult = parseMealsCSV(csvText);
  }

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    csvText = await file.text();
    handleParse();
  }

  async function handleImport() {
    if (!parseResult || parseResult.meals.length === 0) return;

    for (const meal of parseResult.meals) {
      await appState.saveMeal(meal);
    }

    appState.showToast(`Successfully imported ${parseResult.meals.length} meals.`, 'success');
    isOpen = false;
    csvText = '';
    parseResult = null;
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="csv-modal-title">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h2 id="csv-modal-title" class="modal-title">Import Meals from CSV</h2>
          <span class="modal-subtitle">Paste CSV text or upload a .csv file.</span>
        </div>
        <button type="button" class="modal-close" onclick={() => (isOpen = false)} aria-label="Close modal">
          <IconClose size={20} />
        </button>
      </div>

      <div class="modal-body">
        <div class="upload-bar">
          <button type="button" class="btn btn-secondary" onclick={() => fileInput?.click()}>
            <IconUpload size={16} />
            <span>Select CSV File</span>
          </button>
          <input
            type="file"
            accept=".csv,text/csv"
            bind:this={fileInput}
            onchange={handleFileSelect}
            style="display: none;"
          />
          <span class="hint-text">or paste CSV content below</span>
        </div>

        <div class="form-group">
          <textarea
            class="textarea csv-textarea"
            rows="8"
            placeholder="Name,Category,Servings,UseByDays,MealTypes..."
            bind:value={csvText}
            oninput={handleParse}
          ></textarea>
        </div>

        {#if parseResult}
          <div class="parse-summary">
            {#if parseResult.errors.length > 0}
              <div class="alert-box alert-warning">
                <IconWarning size={16} />
                <div>
                  <span class="alert-title">{parseResult.errors.length} issue(s) detected:</span>
                  <ul class="error-list">
                    {#each parseResult.errors as err}
                      <li>{err}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            {/if}

            {#if parseResult.meals.length > 0}
              <div class="alert-box alert-success">
                <IconCheck size={16} />
                <span>Ready to import {parseResult.meals.length} valid meal(s).</span>
              </div>

              <div class="preview-list">
                <span class="preview-title">Preview:</span>
                <div class="meals-chips">
                  {#each parseResult.meals.slice(0, 10) as m}
                    <span class="meal-chip">{m.name} ({m.category})</span>
                  {/each}
                  {#if parseResult.meals.length > 10}
                    <span class="more-chip">+{parseResult.meals.length - 10} more</span>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick={() => (isOpen = false)}>
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleImport}
          disabled={!parseResult || parseResult.meals.length === 0}
        >
          Import {parseResult?.meals.length || 0} Meals
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
    justify-content: space-between;
    align-items: flex-start;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .modal-subtitle {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .modal-close {
    color: var(--text-tertiary);
    padding: 0.25rem;
  }

  .modal-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
  }

  .upload-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .hint-text {
    font-size: 0.82rem;
    color: var(--text-tertiary);
  }

  .csv-textarea {
    font-family: monospace;
    font-size: 0.82rem;
    resize: vertical;
  }

  .parse-summary {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .alert-box {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
  }

  .alert-warning {
    background-color: var(--accent-amber-light);
    border: 1px solid #FCD34D;
    color: #78350F;
  }

  .alert-success {
    background-color: var(--accent-sage-light);
    border: 1px solid #A7F3D0;
    color: #065F46;
  }

  .alert-title {
    font-weight: 600;
  }

  .error-list {
    margin-top: 0.25rem;
    padding-left: 1.25rem;
    font-size: 0.8rem;
  }

  .preview-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .preview-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .meals-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .meal-chip {
    font-size: 0.78rem;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-light);
  }

  .more-chip {
    font-size: 0.78rem;
    color: var(--text-tertiary);
    padding: 0.2rem 0.5rem;
  }

  .modal-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-light);
    background-color: var(--bg-subtle);
    display: flex;
    justify-content: flex-end;
    gap: 0.65rem;
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
  }
</style>
