<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { createCompleteBackup, restoreCompleteBackup } from '../../import-export/json-backup';
  import { ALL_MEAL_PERIODS } from '../../domain/constants';
  import type { MealPeriod } from '../../domain/models';
  import {
    IconDownload,
    IconUpload,
    IconTrash,
    IconSettings,
    IconBreakfast,
    IconLunch,
    IconDinner
  } from '../../icons';

  let fileInput = $state<HTMLInputElement>();

  // Local settings bindings
  let timezone = $state(appState.settings.timezone);
  let defaultPlanDurationDays = $state(appState.settings.defaultPlanDurationDays);
  let defaultMealPeriods = $state<MealPeriod[]>([...appState.settings.defaultMealPeriods]);
  let breakfastServingsRequired = $state(appState.settings.breakfastServingsRequired);
  let lunchServingsRequired = $state(appState.settings.lunchServingsRequired);
  let dinnerServingsRequired = $state(appState.settings.dinnerServingsRequired);
  let defaultMinimumRepeatWeeks = $state(appState.settings.defaultMinimumRepeatWeeks);
  let maxFullPlanRerolls = $state(appState.settings.maxFullPlanRerolls);
  let maxIndividualSlotRerolls = $state(appState.settings.maxIndividualSlotRerolls);
  let reducedMotion = $state(appState.settings.reducedMotion);

  function toggleDefaultPeriod(p: MealPeriod) {
    if (defaultMealPeriods.includes(p)) {
      if (defaultMealPeriods.length > 1) {
        defaultMealPeriods = defaultMealPeriods.filter(item => item !== p);
      }
    } else {
      defaultMealPeriods = [...defaultMealPeriods, p];
    }
  }

  async function handleSaveSettings() {
    await appState.updateSettingsData({
      timezone,
      defaultPlanDurationDays: Number(defaultPlanDurationDays),
      defaultMealPeriods,
      breakfastServingsRequired: Number(breakfastServingsRequired),
      lunchServingsRequired: Number(lunchServingsRequired),
      dinnerServingsRequired: Number(dinnerServingsRequired),
      defaultMinimumRepeatWeeks: Number(defaultMinimumRepeatWeeks),
      maxFullPlanRerolls: Number(maxFullPlanRerolls),
      maxIndividualSlotRerolls: Number(maxIndividualSlotRerolls),
      reducedMotion
    });
  }

  async function handleExportBackup() {
    try {
      const backup = await createCompleteBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dinnerroll-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      appState.showToast('Complete backup exported successfully.', 'success');
    } catch {
      appState.showToast('Failed to create backup.', 'error');
    }
  }

  async function handleRestoreFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await restoreCompleteBackup(parsed);
      if (res.success) {
        await appState.init();
        appState.showToast(res.message, 'success');
      } else {
        appState.showToast(res.message, 'error');
      }
    } catch {
      appState.showToast('The selected file is not valid JSON.', 'error');
    }
  }

  async function handleResetAll() {
    if (confirm('Are you sure you want to reset all data? This will remove all meals, categories, history, and settings from your browser.')) {
      await appState.clearAllData();
    }
  }
</script>

<div class="settings-view-container">
  <div class="view-header">
    <h1 class="view-title">Household Settings</h1>
    <p class="view-subtitle">Configure household portion sizes, scheduling limits, and data backups.</p>
  </div>

  <div class="settings-grid">
    <!-- Servings Section -->
    <div class="settings-card">
      <h2 class="card-title">Household Serving Requirements</h2>
      <p class="card-desc">
        Portions consumed per meal period. Fresh recipes will scale to cook at least this much, and leftover batches will allocate based on these requirements.
      </p>

      <div class="form-grid-3">
        <div class="form-group">
          <label for="s-breakfast-servings" class="form-label">
            <IconBreakfast size={14} />
            <span>Breakfast</span>
          </label>
          <input
            id="s-breakfast-servings"
            type="number"
            class="input"
            bind:value={breakfastServingsRequired}
            min="1"
            max="12"
            onchange={handleSaveSettings}
          />
        </div>

        <div class="form-group">
          <label for="s-lunch-servings" class="form-label">
            <IconLunch size={14} />
            <span>Lunch</span>
          </label>
          <input
            id="s-lunch-servings"
            type="number"
            class="input"
            bind:value={lunchServingsRequired}
            min="1"
            max="12"
            onchange={handleSaveSettings}
          />
        </div>

        <div class="form-group">
          <label for="s-dinner-servings" class="form-label">
            <IconDinner size={14} />
            <span>Dinner</span>
          </label>
          <input
            id="s-dinner-servings"
            type="number"
            class="input"
            bind:value={dinnerServingsRequired}
            min="1"
            max="12"
            onchange={handleSaveSettings}
          />
        </div>
      </div>
    </div>

    <!-- Scheduling Policy Section -->
    <div class="settings-card">
      <h2 class="card-title">Scheduling Policy &amp; Rerolls</h2>
      <p class="card-desc">Default constraints applied during scheduling sessions.</p>

      <div class="form-grid-2">
        <div class="form-group">
          <label for="s-repeat-weeks" class="form-label">Default Minimum Repeat</label>
          <div class="input-with-unit">
            <input
              id="s-repeat-weeks"
              type="number"
              class="input"
              bind:value={defaultMinimumRepeatWeeks}
              min="1"
              max="26"
              onchange={handleSaveSettings}
            />
            <span class="unit-text">weeks</span>
          </div>
          <span class="field-hint">Time before a dish can repeat</span>
        </div>

        <div class="form-group">
          <label for="s-duration" class="form-label">Default Plan Duration</label>
          <div class="input-with-unit">
            <input
              id="s-duration"
              type="number"
              class="input"
              bind:value={defaultPlanDurationDays}
              min="1"
              max="28"
              onchange={handleSaveSettings}
            />
            <span class="unit-text">days</span>
          </div>
        </div>

        <div class="form-group">
          <label for="s-max-full-rerolls" class="form-label">Full-Plan Rerolls per Session</label>
          <input
            id="s-max-full-rerolls"
            type="number"
            class="input"
            bind:value={maxFullPlanRerolls}
            min="0"
            max="10"
            onchange={handleSaveSettings}
          />
        </div>

        <div class="form-group">
          <label for="s-max-slot-rerolls" class="form-label">Single-Slot Rerolls per Session</label>
          <input
            id="s-max-slot-rerolls"
            type="number"
            class="input"
            bind:value={maxIndividualSlotRerolls}
            min="0"
            max="20"
            onchange={handleSaveSettings}
          />
        </div>
      </div>

      <div class="form-group period-select-group">
        <span class="form-label">Default Meal Periods</span>
        <div class="period-toggle-group">
          {#each ALL_MEAL_PERIODS as p}
            {@const isSelected = defaultMealPeriods.includes(p)}
            <button
              type="button"
              class="period-chip {isSelected ? 'active' : ''}"
              onclick={() => { toggleDefaultPeriod(p); handleSaveSettings(); }}
            >
              <span>{p}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Preferences Section -->
    <div class="settings-card">
      <h2 class="card-title">Device &amp; Accessibility Preferences</h2>

      <div class="form-grid-2">
        <div class="form-group">
          <label for="s-timezone" class="form-label">Timezone</label>
          <input
            id="s-timezone"
            type="text"
            class="input"
            bind:value={timezone}
            onchange={handleSaveSettings}
          />
          <span class="field-hint">IANA format (e.g. Australia/Brisbane)</span>
        </div>

        <div class="form-group checkbox-group">
          <span class="form-label">Motion Preferences</span>
          <label class="checkbox-label">
            <input
              type="checkbox"
              bind:checked={reducedMotion}
              onchange={handleSaveSettings}
            />
            <span>Reduce motion / disable reel spin animations</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Data Management Section -->
    <div class="settings-card">
      <h2 class="card-title">Local Backup &amp; Restore</h2>
      <p class="card-desc">
        DinnerRoll is 100% local-first. Export a JSON backup to transfer to another device or save a restore point.
      </p>

      <div class="backup-actions">
        <button type="button" class="btn btn-secondary" onclick={handleExportBackup}>
          <IconDownload size={16} />
          <span>Export Complete Backup (JSON)</span>
        </button>

        <button type="button" class="btn btn-secondary" onclick={() => fileInput?.click()}>
          <IconUpload size={16} />
          <span>Restore Backup (JSON)</span>
        </button>

        <input
          type="file"
          accept=".json"
          bind:this={fileInput}
          onchange={handleRestoreFile}
          style="display: none;"
        />

        <button type="button" class="btn btn-ghost" onclick={() => appState.loadSampleData()}>
          <span>Reload Sample Household Data (30 meals)</span>
        </button>

        <button type="button" class="btn btn-ghost danger-btn" onclick={handleResetAll}>
          <IconTrash size={16} />
          <span>Clear All Local Data</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-view-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .view-header {
    margin-bottom: 0.5rem;
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

  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .settings-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1.25rem 1.5rem;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.45;
  }

  .form-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .field-hint {
    font-size: 0.72rem;
    color: var(--text-tertiary);
  }

  .input-with-unit {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .unit-text {
    font-size: 0.85rem;
    color: var(--text-tertiary);
  }

  .period-select-group {
    margin-top: 0.5rem;
  }

  .period-toggle-group {
    display: flex;
    gap: 0.4rem;
  }

  .period-chip {
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    font-size: 0.85rem;
    transition: all 0.15s ease;
  }

  .period-chip.active {
    background-color: var(--accent-terracotta-light);
    border-color: var(--accent-terracotta);
    color: var(--accent-terracotta);
    font-weight: 600;
  }

  .checkbox-group {
    justify-content: flex-end;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    margin-top: 0.35rem;
    cursor: pointer;
  }

  .backup-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }

  .danger-btn:hover {
    color: var(--accent-error);
  }

  @media (max-width: 640px) {
    .form-grid-3, .form-grid-2 {
      grid-template-columns: 1fr;
    }

    .backup-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .backup-actions .btn {
      width: 100%;
    }
  }
</style>
