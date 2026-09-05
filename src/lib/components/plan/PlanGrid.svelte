<script lang="ts">
  import { appState } from '../../stores/app-state.svelte';
  import { getDayOfWeekName, formatHumanDate } from '../../scheduler/date-utils';
  import { IconReroll, IconBlocked, IconLeftovers } from '../../icons';
  import type { ScheduledSlot } from '../../domain/models';

  // Group slots by date
  let groupedDays = $derived.by(() => {
    const map = new Map<string, ScheduledSlot[]>();
    for (const slot of appState.planSlots) {
      if (!map.has(slot.date)) {
        map.set(slot.date, []);
      }
      map.get(slot.date)!.push(slot);
    }
    return Array.from(map.entries()).map(([date, slots]) => ({
      date,
      dayName: getDayOfWeekName(date),
      humanDate: formatHumanDate(date),
      slots
    }));
  });

  // Calculate desktop grid columns count
  let desktopColumns = $derived.by(() => {
    const count = groupedDays.length;
    if (count <= 7) return count || 7;
    if (count <= 14) return Math.ceil(count / 2);
    if (count <= 21) return Math.ceil(count / 3);
    return Math.ceil(count / 4);
  });
</script>

<div class="calendar-scroll-wrapper">
  <div
    class="plan-grid"
    style="--desktop-cols: {desktopColumns};"
    role="grid"
    aria-label="Meal Plan Schedule Grid"
  >
    {#each groupedDays as day, dayIndex}
      <div class="day-column" role="row">
        <div class="day-header">
          <span class="day-weekday">{day.dayName}</span>
          <span class="day-date">{day.date.slice(5)}</span>
        </div>

        <div class="day-slots">
          {#each day.slots as slot, slotIndex}
            {@const isSlotSpinning = appState.isSpinning}
            {@const animDelay = (dayIndex * 60 + slotIndex * 30) + 'ms'}
            
            <div
              class="slot-card {slot.isBlocked ? 'blocked' : ''} {slot.isLeftover ? 'leftover' : ''} {!slot.mealName && !slot.isBlocked ? 'empty' : ''}"
              role="gridcell"
            >
              <div class="slot-top-bar">
                <div class="badges-row">
                  <span class="period-badge">{slot.mealPeriod}</span>
                  {#if slot.isLeftover}
                    <span class="leftover-pill" title="Prepared from previous day leftovers">
                      <IconLeftovers size={10} />
                      <span>Leftover</span>
                    </span>
                  {/if}
                </div>
                
                <button
                  type="button"
                  class="block-toggle-btn"
                  onclick={() => appState.toggleSlotBlocked(slot.id)}
                  title={slot.isBlocked ? 'Unblock this slot' : 'Block this slot from scheduling'}
                  aria-label={slot.isBlocked ? `Unblock ${slot.date} ${slot.mealPeriod}` : `Block ${slot.date} ${slot.mealPeriod}`}
                >
                  <IconBlocked size={14} class={slot.isBlocked ? 'blocked-active' : ''} />
                </button>
              </div>

              {#if slot.isBlocked}
                <div
                  class="slot-body blocked-body"
                  onclick={() => appState.toggleSlotBlocked(slot.id)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => e.key === 'Enter' && appState.toggleSlotBlocked(slot.id)}
                >
                  <span class="blocked-label">Blocked</span>
                  <span class="tap-hint">Tap to unblock</span>
                </div>
              {:else if slot.mealName}
                <div
                  class="slot-body filled-body {isSlotSpinning ? 'reel-spinning' : ''}"
                  style="animation-delay: {animDelay};"
                >
                  <h3 class="meal-name">{slot.mealName}</h3>

                  {#if slot.category}
                    <span class="category-tag">{slot.category}</span>
                  {/if}

                  {#if appState.settings.showNutritionInfo && slot.calories}
                    <div class="macros-summary">
                      <span>{slot.calories} kcal</span>
                      {#if slot.protein}<span>&bull; {slot.protein}g P</span>{/if}
                    </div>
                  {/if}

                  {#if appState.hasRolled && appState.individualSlotRerollsRemaining > 0}
                    <div class="slot-actions">
                      <button
                        type="button"
                        class="slot-reroll-btn"
                        onclick={() => appState.rerollSlot(slot.id)}
                        title="Reroll this meal ({appState.individualSlotRerollsRemaining} remaining)"
                        aria-label="Reroll this meal"
                      >
                        <IconReroll size={13} />
                        <span>Reroll</span>
                      </button>
                    </div>
                  {/if}
                </div>
              {:else}
                <div
                  class="slot-body unrolled-body"
                  onclick={() => appState.toggleSlotBlocked(slot.id)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => e.key === 'Enter' && appState.toggleSlotBlocked(slot.id)}
                >
                  <span class="unrolled-placeholder">Ready to roll</span>
                  <span class="tap-hint">Tap to block</span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .calendar-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.5rem;
  }

  .plan-grid {
    display: grid;
    grid-template-columns: repeat(var(--desktop-cols), minmax(135px, 1fr));
    gap: 0.65rem;
    min-width: 100%;
  }

  .day-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 135px;
  }

  .day-header {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.5rem;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    box-shadow: var(--shadow-sm);
  }

  .day-weekday {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .day-date {
    font-size: 0.78rem;
    color: var(--text-tertiary);
  }

  .day-slots {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .slot-card {
    background-color: var(--bg-surface);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    min-height: 155px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    overflow: hidden;
  }

  .slot-card:hover {
    border-color: var(--border-medium);
  }

  .slot-card.leftover {
    border-left: 3px solid var(--accent-amber);
    background: linear-gradient(180deg, #FFFDF8 0%, var(--bg-surface) 100%);
  }

  .slot-card.blocked {
    background: repeating-linear-gradient(
      -45deg,
      var(--bg-subtle),
      var(--bg-subtle) 10px,
      var(--bg-muted) 10px,
      var(--bg-muted) 11px
    );
    border-color: var(--border-medium);
    opacity: 0.75;
  }

  .slot-card.empty {
    border-style: dashed;
    border-color: var(--border-medium);
    background-color: #FAF9F6;
  }

  .slot-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.6rem 0.2rem 0.6rem;
  }

  .period-badge {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
  }

  .block-toggle-btn {
    color: var(--text-tertiary);
    padding: 0.2rem;
    border-radius: 4px;
    transition: color 0.15s ease;
    display: flex;
    align-items: center;
  }

  .block-toggle-btn:hover {
    color: var(--accent-terracotta);
  }

  :global(.blocked-active) {
    color: var(--accent-error);
  }

  .slot-body {
    padding: 0.4rem 0.6rem 0.6rem 0.6rem;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .blocked-body, .unrolled-body {
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    user-select: none;
  }

  .blocked-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .unrolled-placeholder {
    font-size: 0.82rem;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .tap-hint {
    font-size: 0.68rem;
    color: var(--text-tertiary);
    margin-top: 0.2rem;
  }

  .badges-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .meal-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    margin-bottom: 0.3rem;
  }

  .category-tag {
    font-size: 0.72rem;
    color: var(--text-secondary);
    margin-bottom: 0.4rem;
  }

  .macros-summary {
    font-size: 0.72rem;
    color: var(--text-tertiary);
    margin-top: auto;
    padding-top: 0.35rem;
  }

  .slot-actions {
    margin-top: 0.4rem;
    display: flex;
    justify-content: flex-end;
  }

  .slot-reroll-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    color: var(--text-secondary);
    padding: 0.2rem 0.45rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
    background-color: var(--bg-surface);
    transition: all 0.15s ease;
  }

  .slot-reroll-btn:hover {
    color: var(--accent-terracotta);
    border-color: var(--accent-terracotta);
    background-color: var(--accent-terracotta-light);
  }

  @media (max-width: 900px) {
    .plan-grid {
      grid-template-columns: repeat(var(--desktop-cols), minmax(130px, 1fr));
    }
  }
</style>
