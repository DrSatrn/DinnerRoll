<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { createCompleteBackup, restoreCompleteBackup } from '../../import-export/json-backup';
  import { ALL_MEAL_PERIODS } from '../../domain/constants';
  import { THEME_LIST } from '../../themes';
  import { buildShortcutSetupUrl } from '../../integrations/shortcuts';
  import type { MealPeriod, AppTheme } from '../../domain/models';
  import {
    IconDownload,
    IconUpload,
    IconTrash,
    IconBreakfast,
    IconLunch,
    IconDinner,
    IconCheck
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
  let showNutritionInfo = $state(appState.settings.showNutritionInfo !== false);
  let currentTheme = $state<AppTheme>(appState.settings.theme || 'warm-terracotta');
  let remindersListName = $state(appState.settings.remindersListName || 'Groceries');
  let shortcutName = $state(appState.settings.shortcutName || 'DinnerRoll Groceries');

  function toggleDefaultPeriod(p: MealPeriod) {
    if (defaultMealPeriods.includes(p)) {
      if (defaultMealPeriods.length > 1) {
        defaultMealPeriods = defaultMealPeriods.filter(item => item !== p);
      }
    } else {
      defaultMealPeriods = [...defaultMealPeriods, p];
    }
  }

  async function handleSelectTheme(themeId: AppTheme) {
    currentTheme = themeId;
    await appState.updateTheme(themeId);
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
      reducedMotion,
      showNutritionInfo,
      theme: currentTheme,
      remindersListName: remindersListName.trim() || 'Groceries',
      shortcutName: shortcutName.trim() || 'DinnerRoll Groceries'
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
    <p class="view-subtitle">Configure theme atmosphere, portion requirements, Apple Reminders, and local backups.</p>
  </div>

  <div class="settings-grid">
    <!-- Themes Section -->
    <div class="settings-card full-width-card">
      <h2 class="card-title">Theme &amp; Atmosphere</h2>
      <p class="card-desc">
        Sourced from open-source design systems. Dynamically changes the app styling, scheduling console, shared image cards, and PDF generator.
      </p>

      <div class="theme-grid">
        {#each THEME_LIST as theme}
          {@const isActive = currentTheme === theme.id}
          <button
            type="button"
            class="theme-card {isActive ? 'active' : ''}"
            onclick={() => handleSelectTheme(theme.id)}
            aria-pressed={isActive}
          >
            <div class="theme-preview-bar">
              <span class="preview-dot" style="background-color: {theme.previewColors.bg};"></span>
              <span class="preview-dot" style="background-color: {theme.previewColors.surface};"></span>
              <span class="preview-dot" style="background-color: {theme.previewColors.accent};"></span>
              <span class="preview-dot" style="background-color: {theme.previewColors.text};"></span>
            </div>
            <div class="theme-meta">
              <div class="theme-name-row">
                <span class="theme-name">{theme.name}</span>
                {#if isActive}
                  <span class="active-badge"><IconCheck size={14} /></span>
                {/if}
              </div>
              <span class="theme-sub">{theme.subtitle}</span>
              <span class="theme-source">{theme.source}</span>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Apple Shortcuts & Reminders Section -->
    <div class="settings-card full-width-card">
      <h2 class="card-title">Apple Reminders &amp; Shortcuts Integration</h2>
      <p class="card-desc">
        Configure how DinnerRoll groceries are added to your Apple Reminders app without cloud dependencies.
      </p>

      <div class="form-grid-2">
        <div class="form-group">
          <label for="s-reminders-list" class="form-label">Destination Reminders List Name</label>
          <input
            id="s-reminders-list"
            type="text"
            class="input"
            bind:value={remindersListName}
            placeholder="Groceries"
            oninput={(e) => {
              remindersListName = e.currentTarget.value;
              handleSaveSettings();
            }}
            onchange={(e) => {
              remindersListName = e.currentTarget.value;
              handleSaveSettings();
            }}
          />
          <span class="field-hint">The target list in Apple Reminders (e.g. "Family Shopping" or "Groceries")</span>
        </div>

        <div class="form-group">
          <label for="s-shortcut-name" class="form-label">Apple Shortcut Name</label>
          <input
            id="s-shortcut-name"
            type="text"
            class="input"
            bind:value={shortcutName}
            placeholder="DinnerRoll Groceries"
            oninput={(e) => {
              shortcutName = e.currentTarget.value;
              handleSaveSettings();
            }}
            onchange={(e) => {
              shortcutName = e.currentTarget.value;
              handleSaveSettings();
            }}
          />
          <span class="field-hint">Must match the shortcut name in your Apple Shortcuts app</span>
        </div>
      </div>

      <div class="shortcuts-setup-helper">
        <div class="helper-header">
          <h3 class="helper-title">Companion Shortcut Setup</h3>
          <a
            href={buildShortcutSetupUrl()}
            class="btn btn-secondary btn-sm"
            target="_blank"
            rel="noopener"
          >
            Launch Apple Shortcuts App
          </a>
        </div>
        <div class="shortcut-steps-grid">
          <div class="step-box">
            <span class="step-num">1</span>
            <div class="step-content">
              <strong>Receive Input</strong>
              <span>Shortcut Input (Text from DinnerRoll)</span>
            </div>
          </div>
          <div class="step-box">
            <span class="step-num">2</span>
            <div class="step-content">
              <strong>Get items Dictionary</strong>
              <span>Get Value for <code>items</code> from Input Dictionary</span>
            </div>
          </div>
          <div class="step-box">
            <span class="step-num">3</span>
            <div class="step-content">
              <strong>Repeat &amp; Add</strong>
              <span>Repeat with Each &rarr; Add <code>Repeat Item</code> to <strong>{remindersListName || 'Groceries'}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Display & Nutrition Section -->
    <div class="settings-card">
      <h2 class="card-title">Display &amp; Nutrition</h2>
      <p class="card-desc">Control visibility of calories and macronutrients.</p>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={showNutritionInfo}
            onchange={handleSaveSettings}
          />
          <span>Show calories &amp; protein macros across meal cards, meals list, and exports</span>
        </label>
        <span class="field-hint">Uncheck to cleanly hide all nutrition information everywhere</span>
      </div>

      <div class="form-group checkbox-group" style="margin-top: 1rem;">
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

    <!-- Servings Section -->
    <div class="settings-card">
      <h2 class="card-title">Household Serving Requirements</h2>
      <p class="card-desc">
        Portions consumed per meal period. Recipes scale to cook at least this much.
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
    max-width: 1080px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3.5rem 1.25rem;
  }

  .view-header {
    margin-bottom: 1.5rem;
  }

  .view-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .view-subtitle {
    font-size: 0.92rem;
    color: var(--text-secondary);
    margin-top: 0.2rem;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  .full-width-card {
    grid-column: 1 / -1;
  }

  .settings-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
  }

  .card-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.35rem;
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 1.25rem;
    line-height: 1.4;
  }

  /* Theme grid */
  .theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.85rem;
  }

  .theme-card {
    border: 2px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 0.85rem;
    background-color: var(--bg-surface);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    transition: all 0.15s ease;
  }

  .theme-card:hover {
    border-color: var(--border-medium);
    transform: translateY(-1px);
  }

  .theme-card.active {
    border-color: var(--accent-terracotta);
    box-shadow: 0 0 0 1px var(--accent-terracotta);
    background-color: var(--bg-subtle);
  }

  .theme-preview-bar {
    display: flex;
    gap: 0.35rem;
    padding: 0.35rem;
    background-color: var(--bg-muted);
    border-radius: var(--radius-sm);
    justify-content: center;
  }

  .preview-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.12);
  }

  .theme-meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .theme-name-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .theme-name {
    font-weight: 700;
    font-size: 0.92rem;
    color: var(--text-primary);
  }

  .active-badge {
    color: var(--accent-terracotta);
    display: flex;
    align-items: center;
  }

  .theme-sub {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .theme-source {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    margin-top: 0.15rem;
  }

  /* Shortcuts helper */
  .shortcuts-setup-helper {
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bg-subtle);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
  }

  .helper-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.85rem;
  }

  .helper-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .shortcut-steps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .step-box {
    display: flex;
    gap: 0.65rem;
    align-items: flex-start;
    background-color: var(--bg-surface);
    padding: 0.65rem 0.8rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
  }

  .step-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background-color: var(--accent-terracotta-light);
    color: var(--accent-terracotta);
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-content {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .step-content strong {
    color: var(--text-primary);
    font-size: 0.82rem;
  }

  .step-content code {
    font-size: 0.75rem;
    background-color: var(--bg-muted);
    padding: 1px 4px;
    border-radius: 3px;
  }

  /* Form Elements */
  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
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
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .field-hint {
    font-size: 0.72rem;
    color: var(--text-tertiary);
  }

  .input-with-unit {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-with-unit input {
    padding-right: 3.5rem;
  }

  .unit-text {
    position: absolute;
    right: 0.85rem;
    font-size: 0.85rem;
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .period-select-group {
    margin-top: 1rem;
  }

  .period-toggle-group {
    display: flex;
    gap: 0.4rem;
  }

  .period-chip {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    transition: all 0.15s ease;
  }

  .period-chip.active {
    background-color: var(--accent-terracotta-light);
    border-color: var(--accent-terracotta);
    color: var(--accent-terracotta);
    font-weight: 600;
  }

  .checkbox-group {
    flex-direction: column;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    color: var(--text-primary);
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 17px;
    height: 17px;
    cursor: pointer;
    accent-color: var(--accent-terracotta);
  }

  .backup-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .danger-btn {
    color: var(--accent-error);
    margin-top: 0.5rem;
  }

  .danger-btn:hover:not(:disabled) {
    background-color: var(--accent-error-light);
    color: var(--accent-error);
  }

  @media (max-width: 640px) {
    .form-grid-2, .form-grid-3 {
      grid-template-columns: 1fr;
    }
  }
</style>
