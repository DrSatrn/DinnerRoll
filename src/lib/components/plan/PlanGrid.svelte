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

  interface ReelFacetDish {
    name: string;
    category: string;
    calories?: number;
    protein?: number;
  }

  // Generate 10 drum facets: 9 candidate dishes sampled from household data, ending with the target dish at facet 9
  function getReelFacets(slot: ScheduledSlot): ReelFacetDish[] {
    const meals = appState.meals;
    const facets: ReelFacetDish[] = [];

    if (!meals || meals.length === 0) {
      for (let i = 0; i < 9; i++) {
        facets.push({ name: 'Selecting Dish...', category: 'Dinner' });
      }
    } else {
      let hash = 0;
      for (let i = 0; i < slot.id.length; i++) {
        hash = (hash << 5) - hash + slot.id.charCodeAt(i);
        hash |= 0;
      }
      const startIndex = Math.abs(hash) % meals.length;

      for (let i = 0; i < 9; i++) {
        const m = meals[(startIndex + i * 3) % meals.length];
        facets.push({
          name: m.name,
          category: m.category || '',
          calories: m.caloriesPerServing,
          protein: m.proteinGramsPerServing
        });
      }
    }

    // 10th facet (index 9) is the selected target dish
    facets.push({
      name: slot.mealName || 'Dinner',
      category: slot.category || '',
      calories: slot.calories,
      protein: slot.protein
    });

    return facets;
  }
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
            {@const isSpinningThisSlot = (appState.isSpinning || appState.spinningSlotId === slot.id) && !slot.isBlocked}
            {@const colDelay = (dayIndex % desktopColumns) * 110}
            {@const reelFacets = isSpinningThisSlot ? getReelFacets(slot) : []}
            
            <div
              class="slot-card {slot.isBlocked ? 'blocked' : ''} {slot.isLeftover ? 'leftover' : ''} {!slot.mealName && !slot.isBlocked ? 'empty' : ''} {isSpinningThisSlot ? 'card-spinning' : ''}"
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
                  onclick={() => !appState.isSpinning && appState.toggleSlotBlocked(slot.id)}
                  title={slot.isBlocked ? 'Unblock this slot' : 'Block this slot from scheduling'}
                  aria-label={slot.isBlocked ? `Unblock ${slot.date} ${slot.mealPeriod}` : `Block ${slot.date} ${slot.mealPeriod}`}
                  disabled={appState.isSpinning}
                >
                  <IconBlocked size={14} class={slot.isBlocked ? 'blocked-active' : ''} />
                </button>
              </div>

              <div class="reel-aperture">
                {#if slot.isBlocked}
                  <div
                    class="slot-body blocked-body"
                    onclick={() => !appState.isSpinning && appState.toggleSlotBlocked(slot.id)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && !appState.isSpinning && appState.toggleSlotBlocked(slot.id)}
                  >
                    <span class="blocked-label">Blocked</span>
                    <span class="tap-hint">Tap to unblock</span>
                  </div>
                {:else if isSpinningThisSlot}
                  <!-- 3D Pokies Drum Cylinder -->
                  <div
                    class="pokies-cylinder"
                    style="animation-delay: {colDelay}ms;"
                  >
                    {#each reelFacets as dish, facetIdx}
                      <div
                        class="reel-facet {facetIdx === 9 && slot.isLeftover ? 'facet-leftover' : ''}"
                        style="transform: rotateX({facetIdx * 36}deg) translateZ(234px);"
                      >
                        <span class="drum-dish-name">{dish.name}</span>

                        <div class="drum-category-wrapper">
                          {#if dish.category}
                            <span class="drum-category-tag">{dish.category}</span>
                          {/if}
                        </div>

                        <div class="drum-macros-wrapper">
                          {#if appState.settings.showNutritionInfo && dish.calories}
                            <div class="drum-macros-summary">
                              <span>{dish.calories} kcal</span>
                              {#if dish.protein}<span>&bull; {dish.protein}g P</span>{/if}
                            </div>
                          {/if}
                        </div>

                        <div class="slot-actions">
                          <button
                            type="button"
                            class="drum-reroll-btn"
                            disabled
                            tabindex="-1"
                            aria-hidden="true"
                          >
                            <IconReroll size={13} />
                            <span>Reroll</span>
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else if slot.mealName}
                  <div class="slot-body filled-body">
                    <h3 class="meal-name">{slot.mealName}</h3>

                    <div class="category-wrapper">
                          {#if slot.category}
                            <span class="category-tag">{slot.category}</span>
                          {/if}
                    </div>

                    <div class="macros-wrapper">
                      {#if appState.settings.showNutritionInfo && slot.calories}
                        <div class="macros-summary">
                          <span>{slot.calories} kcal</span>
                          {#if slot.protein}<span>&bull; {slot.protein}g P</span>{/if}
                        </div>
                      {/if}
                    </div>

                    {#if appState.hasRolled && appState.individualSlotRerollsRemaining > 0}
                      <div class="slot-actions">
                        <button
                          type="button"
                          class="slot-reroll-btn"
                          onclick={() => appState.rerollSlot(slot.id)}
                          title="Reroll this meal ({appState.individualSlotRerollsRemaining} remaining)"
                          aria-label="Reroll this meal"
                          disabled={appState.isSpinning}
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
                    onclick={() => !appState.isSpinning && appState.toggleSlotBlocked(slot.id)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && !appState.isSpinning && appState.toggleSlotBlocked(slot.id)}
                  >
                    <span class="unrolled-placeholder">Ready to roll</span>
                    <span class="tap-hint">Tap to block</span>
                  </div>
                {/if}
              </div>
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
    grid-auto-rows: 1fr;
    gap: 0.65rem;
    min-width: 100%;
    align-items: stretch;
  }

  .day-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 135px;
    height: 100%;
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
    flex-shrink: 0;
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
    height: 180px;
    min-height: 180px;
    max-height: 180px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
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
    padding: 0.25rem 0.45rem;
    height: 28px;
    min-height: 28px;
    max-height: 28px;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    flex-shrink: 0;
  }

  .badges-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: nowrap;
    min-width: 0;
    overflow: hidden;
  }

  .period-badge {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .leftover-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.15rem;
    padding: 1px 4px;
    font-size: 0.58rem;
    font-weight: 700;
    border-radius: var(--radius-full);
    background-color: var(--accent-amber-light);
    color: var(--accent-amber);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    line-height: 1;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .block-toggle-btn {
    color: var(--text-tertiary);
    padding: 0.2rem;
    border-radius: 4px;
    transition: color 0.15s ease;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .block-toggle-btn:hover:not(:disabled) {
    color: var(--accent-terracotta);
  }

  :global(.blocked-active) {
    color: var(--accent-error);
  }

  /* Reel Aperture & 3D Pokies Drum */
  .reel-aperture {
    height: 152px;
    min-height: 152px;
    max-height: 152px;
    position: relative;
    overflow: hidden;
    perspective: 600px;
    perspective-origin: 50% 50%;
    transform-style: preserve-3d;
    box-sizing: border-box;
  }

  .card-spinning .reel-aperture::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 34px;
    background: linear-gradient(180deg, rgba(25, 18, 12, 0.36) 0%, rgba(25, 18, 12, 0.12) 65%, transparent 100%);
    pointer-events: none;
    z-index: 10;
  }

  .card-spinning .reel-aperture::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 34px;
    background: linear-gradient(0deg, rgba(25, 18, 12, 0.36) 0%, rgba(25, 18, 12, 0.12) 65%, transparent 100%);
    pointer-events: none;
    z-index: 10;
  }

  .pokies-cylinder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 152px;
    transform-style: preserve-3d;
    transform-origin: 50% 50% 0;
    will-change: transform, filter;
    animation: pokiesDrumRoll 1.5s cubic-bezier(0.12, 0.85, 0.2, 1.04) forwards;
  }

  .reel-facet {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 152px;
    min-height: 152px;
    max-height: 152px;
    padding: 0.5rem 0.6rem 0.55rem 0.6rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    background-color: var(--bg-surface);
    transform-style: preserve-3d;
  }

  .reel-facet.facet-leftover {
    border-left: 3px solid var(--accent-amber);
    background: linear-gradient(180deg, #FFFDF8 0%, var(--bg-surface) 100%);
  }

  @keyframes pokiesDrumRoll {
    0% {
      transform: translateZ(-234px) rotateX(0deg);
      filter: blur(0px);
    }
    12% {
      transform: translateZ(-234px) rotateX(-280deg);
      filter: blur(2px);
    }
    35% {
      transform: translateZ(-234px) rotateX(-720deg);
      filter: blur(2.5px);
    }
    60% {
      transform: translateZ(-234px) rotateX(-1080deg);
      filter: blur(1.2px);
    }
    78% {
      transform: translateZ(-234px) rotateX(-1280deg);
      filter: blur(0.4px);
    }
    90% {
      transform: translateZ(-234px) rotateX(-1375deg);
      filter: blur(0px);
    }
    96% {
      /* Ratchet mechanical overshoot */
      transform: translateZ(-234px) rotateX(-1408deg);
      filter: blur(0px);
    }
    100% {
      /* Snaps crisply into the pawl notch at exactly -1404deg */
      transform: translateZ(-234px) rotateX(-1404deg);
      filter: blur(0px);
    }
  }

  .slot-body {
    padding: 0.5rem 0.6rem 0.55rem 0.6rem;
    display: flex;
    flex-direction: column;
    height: 152px;
    min-height: 152px;
    max-height: 152px;
    box-sizing: border-box;
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

  .meal-name, .drum-dish-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.25;
    margin-bottom: 0.25rem;
    min-height: 2.25rem;
    max-height: 2.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .category-wrapper, .drum-category-wrapper {
    min-height: 1.15rem;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
  }

  .category-tag, .drum-category-tag {
    font-size: 0.72rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .macros-wrapper, .drum-macros-wrapper {
    min-height: 1.15rem;
    display: flex;
    align-items: center;
  }

  .macros-summary, .drum-macros-summary {
    font-size: 0.72rem;
    color: var(--text-tertiary);
    white-space: nowrap;
  }

  .slot-actions {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
    padding-top: 0.35rem;
  }

  .slot-reroll-btn, .drum-reroll-btn {
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

  .slot-reroll-btn:hover:not(:disabled) {
    color: var(--accent-terracotta);
    border-color: var(--accent-terracotta);
    background-color: var(--accent-terracotta-light);
  }

  @media (prefers-reduced-motion: reduce) {
    .pokies-cylinder {
      animation: none !important;
      transform: translateZ(-234px) rotateX(-1404deg) !important;
      filter: none !important;
    }
  }

  @media (max-width: 900px) {
    .plan-grid {
      grid-template-columns: repeat(var(--desktop-cols), minmax(130px, 1fr));
    }
  }
</style>
