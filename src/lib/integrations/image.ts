import type { ScheduledSlot } from '../domain/models';
import { formatHumanDate } from '../scheduler/date-utils';

export interface PlanImageOptions {
  startDate: string;
  endDate: string;
  slots: ScheduledSlot[];
}

export async function generatePlanImageBlob(options: PlanImageOptions): Promise<Blob | null> {
  const { startDate, endDate, slots } = options;

  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1440;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, width, height);

  // Top header banner
  ctx.fillStyle = '#2D2A26';
  ctx.fillRect(40, 40, width - 80, 140);

  // Brand text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DinnerRoll', 80, 126);

  // Date range subtext
  ctx.fillStyle = '#D6D1CA';
  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const rangeText = `${formatHumanDate(startDate)} - ${formatHumanDate(endDate)}`;
  ctx.fillText(rangeText, width - 80 - ctx.measureText(rangeText).width, 126);

  // Distinct dates
  const dateMap = new Map<string, ScheduledSlot[]>();
  for (const slot of slots) {
    if (!dateMap.has(slot.date)) dateMap.set(slot.date, []);
    dateMap.get(slot.date)!.push(slot);
  }

  const distinctDates = Array.from(dateMap.keys()).sort();
  let currentY = 220;
  const itemHeight = Math.min(150, (height - currentY - 60) / (distinctDates.length || 1));

  for (const dateStr of distinctDates) {
    const daySlots = dateMap.get(dateStr) || [];

    // Card background
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E8E3DC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, currentY, width - 80, itemHeight - 14, 16);
    ctx.fill();
    ctx.stroke();

    // Date tag
    ctx.fillStyle = '#2D2A26';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(formatHumanDate(dateStr), 70, currentY + 44);

    // Slots
    let mealY = currentY + 84;
    for (const slot of daySlots) {
      if (slot.isBlocked) {
        ctx.fillStyle = '#A8A29E';
        ctx.font = 'italic 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`[${slot.mealPeriod}] Blocked`, 70, mealY);
      } else if (slot.mealName) {
        if (slot.isLeftover) {
          ctx.fillStyle = '#B45309'; // Amber
          ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('LEFTOVER', 70, mealY - 4);

          ctx.fillStyle = '#1C1917';
          ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(slot.mealName, 190, mealY - 4);
        } else {
          ctx.fillStyle = '#1C1917';
          ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(slot.mealName, 70, mealY - 4);
        }

        if (slot.calories) {
          ctx.fillStyle = '#78716C';
          ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const macroStr = `${slot.calories} kcal | ${slot.protein || 0}g protein`;
          ctx.fillText(macroStr, width - 90 - ctx.measureText(macroStr).width, mealY - 4);
        }
      }
      mealY += 34;
    }

    currentY += itemHeight;
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
