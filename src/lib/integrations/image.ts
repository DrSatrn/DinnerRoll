import type { ScheduledSlot, AppTheme } from '../domain/models';
import { formatHumanDate } from '../scheduler/date-utils';
import { formatFriendlyShortDate } from './clipboard';
import { getThemePalette } from '../themes';

export interface PlanImageOptions {
  startDate: string;
  endDate: string;
  slots: ScheduledSlot[];
  showNutrition?: boolean;
  themeId?: AppTheme;
}

export async function generatePlanImageBlob(options: PlanImageOptions): Promise<Blob | null> {
  const { startDate, endDate, slots, showNutrition = true, themeId } = options;

  if (typeof document === 'undefined') return null;

  const theme = getThemePalette(themeId);

  // Group slots by date
  const dateMap = new Map<string, ScheduledSlot[]>();
  for (const slot of slots) {
    if (!dateMap.has(slot.date)) dateMap.set(slot.date, []);
    dateMap.get(slot.date)!.push(slot);
  }
  const distinctDates = Array.from(dateMap.keys()).sort();

  // Calculate dynamic card heights so text is never cramped or overlapping
  const cardMetrics = distinctDates.map(dateStr => {
    const daySlots = dateMap.get(dateStr) || [];
    const slotCount = Math.max(1, daySlots.length);
    const slotRowHeight = showNutrition ? 48 : 38;
    const cardHeight = 52 + (slotCount * slotRowHeight) + 12;
    return { dateStr, daySlots, cardHeight };
  });

  const width = 1080;
  const headerHeight = 160;
  const topMargin = 40;
  const bottomMargin = 50;
  const cardGap = 16;
  const totalCardsHeight = cardMetrics.reduce((sum, c) => sum + c.cardHeight + cardGap, 0);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.max(1200, topMargin + headerHeight + 30 + totalCardsHeight + bottomMargin);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = theme.colors.bgApp;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header banner
  ctx.fillStyle = theme.colors.headerBg;
  ctx.beginPath();
  ctx.roundRect(40, topMargin, width - 80, headerHeight, 20);
  ctx.fill();

  // Brand title
  ctx.fillStyle = theme.colors.headerText;
  ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DinnerRoll', 80, topMargin + 75);

  // Subtitle / Date range
  ctx.fillStyle = theme.colors.textSecondary === '#A6ADC8' ? '#A6ADC8' : '#D6D1CA';
  ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const rangeText = `${formatFriendlyShortDate(startDate)} – ${formatFriendlyShortDate(endDate)}`;
  ctx.fillText(rangeText, 80, topMargin + 120);

  // Render cards
  let currentY = topMargin + headerHeight + 28;

  for (const item of cardMetrics) {
    const { dateStr, daySlots, cardHeight } = item;

    // Card box
    ctx.fillStyle = theme.colors.cardBg;
    ctx.strokeStyle = theme.colors.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(40, currentY, width - 80, cardHeight, 14);
    ctx.fill();
    ctx.stroke();

    // Date header line
    ctx.fillStyle = theme.colors.textPrimary;
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(formatFriendlyShortDate(dateStr), 68, currentY + 38);

    // Subtle divider under date
    ctx.strokeStyle = theme.colors.borderLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(68, currentY + 50);
    ctx.lineTo(width - 68, currentY + 50);
    ctx.stroke();

    // Slots
    let mealY = currentY + 84;
    for (const slot of daySlots) {
      if (slot.isBlocked) {
        ctx.fillStyle = theme.colors.textTertiary;
        ctx.font = 'italic 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const periodTxt = daySlots.length > 1 ? `[${slot.mealPeriod}] ` : '';
        ctx.fillText(`${periodTxt}Blocked / Dining Out`, 68, mealY);
      } else if (slot.mealName) {
        let textX = 68;

        // Period badge if multiple periods
        if (daySlots.length > 1) {
          ctx.fillStyle = theme.colors.textSecondary;
          ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(`[${slot.mealPeriod}]`, textX, mealY);
          textX += ctx.measureText(`[${slot.mealPeriod}]`).width + 12;
        }

        // Leftover badge
        if (slot.isLeftover) {
          ctx.fillStyle = theme.colors.accentHighlight;
          ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const loBadge = 'LEFTOVER';
          const loWidth = ctx.measureText(loBadge).width + 14;

          // Draw small rounded pill background
          ctx.fillStyle = theme.colors.accentPrimaryLight;
          ctx.beginPath();
          ctx.roundRect(textX, mealY - 20, loWidth, 26, 6);
          ctx.fill();

          ctx.fillStyle = theme.colors.accentHighlight;
          ctx.fillText(loBadge, textX + 7, mealY - 1);
          textX += loWidth + 12;
        }

        // Meal Name
        ctx.fillStyle = theme.colors.textPrimary;
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(slot.mealName, textX, mealY);

        // Nutrition (right aligned)
        if (showNutrition && slot.calories) {
          ctx.fillStyle = theme.colors.textSecondary;
          ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const macroStr = `${slot.calories} kcal${slot.protein ? ` · ${slot.protein}g protein` : ''}`;
          const macroWidth = ctx.measureText(macroStr).width;
          ctx.fillText(macroStr, width - 68 - macroWidth, mealY);
        }
      }

      mealY += showNutrition ? 46 : 38;
    }

    currentY += cardHeight + cardGap;
  }

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

export async function shareOrDownloadPlanImage(options: PlanImageOptions): Promise<boolean> {
  const blob = await generatePlanImageBlob(options);
  if (!blob) return false;

  const file = new File([blob], 'dinnerroll-plan.png', { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'DinnerRoll Meal Plan',
        text: `Meal plan from ${options.startDate} to ${options.endDate}`
      });
      return true;
    } catch {
      // Fallback to download
    }
  }

  // Fallback download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dinnerroll-plan.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
