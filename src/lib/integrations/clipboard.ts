import type { AcceptedPlan, ScheduledSlot } from '../domain/models';
import { formatHumanDate } from '../scheduler/date-utils';
import { getThemePalette } from '../themes';

export interface ClipboardFormatOptions {
  showNutrition?: boolean;
  themeId?: any;
}

/**
 * Formats a short, friendly day + date string that avoids iOS full ISO phone/date data detector linking.
 * E.g. "Sat, 5 Sep" or "Mon, 7 Sep"
 */
export function formatFriendlyShortDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

/**
 * Produces clean, well-spaced plain text without raw '===' banners or raw ISO timestamps.
 */
export function formatSchedulePlainText(
  plan: AcceptedPlan,
  options: ClipboardFormatOptions = {}
): string {
  const { showNutrition = true } = options;
  const startShort = formatFriendlyShortDate(plan.startDate);
  const endShort = formatFriendlyShortDate(plan.endDate);

  const lines: string[] = [];
  lines.push(`DinnerRoll Plan: ${startShort} – ${endShort}`);
  lines.push('----------------------------------------');

  // Group slots by date
  const dateMap = new Map<string, ScheduledSlot[]>();
  for (const slot of plan.slots) {
    if (!dateMap.has(slot.date)) dateMap.set(slot.date, []);
    dateMap.get(slot.date)!.push(slot);
  }

  const sortedDates = Array.from(dateMap.keys()).sort();

  for (const d of sortedDates) {
    const daySlots = dateMap.get(d) || [];
    const dateLabel = formatFriendlyShortDate(d);

    for (const slot of daySlots) {
      const periodPrefix = daySlots.length > 1 ? ` (${slot.mealPeriod})` : '';

      if (slot.isBlocked) {
        lines.push(`${dateLabel}${periodPrefix}: [Blocked]`);
      } else if (slot.mealName) {
        let mealDesc = slot.mealName;
        if (slot.isLeftover) {
          mealDesc += ' (Leftover)';
        }
        if (showNutrition && slot.calories) {
          mealDesc += ` · ${slot.calories} kcal`;
          if (slot.protein) mealDesc += `, ${slot.protein}g protein`;
        }
        lines.push(`${dateLabel}${periodPrefix}: ${mealDesc}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Produces an inline-styled HTML table suitable for rich clipboard pasting into Apple Mail, Notes, Word, Slack, etc.
 */
export function formatScheduleHtmlTable(
  plan: AcceptedPlan,
  options: ClipboardFormatOptions = {}
): string {
  const { showNutrition = true, themeId } = options;
  const theme = getThemePalette(themeId);
  const startShort = formatFriendlyShortDate(plan.startDate);
  const endShort = formatFriendlyShortDate(plan.endDate);

  // Group slots
  const dateMap = new Map<string, ScheduledSlot[]>();
  for (const slot of plan.slots) {
    if (!dateMap.has(slot.date)) dateMap.set(slot.date, []);
    dateMap.get(slot.date)!.push(slot);
  }

  const sortedDates = Array.from(dateMap.keys()).sort();

  let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; color: ${theme.colors.textPrimary};">`;
  
  html += `<table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid ${theme.colors.borderLight}; border-radius: 10px; overflow: hidden; background-color: ${theme.colors.bgSurface};">`;
  
  // Header
  html += `<thead><tr style="background-color: ${theme.colors.headerBg}; color: ${theme.colors.headerText};">`;
  html += `<th colspan="3" style="padding: 12px 16px; text-align: left; font-size: 15px; font-weight: 600; letter-spacing: -0.01em;">DinnerRoll Schedule &bull; ${startShort} – ${endShort}</th>`;
  html += `</tr></thead><tbody>`;

  let rowIndex = 0;
  for (const d of sortedDates) {
    const daySlots = dateMap.get(d) || [];
    const dateLabel = formatFriendlyShortDate(d);

    for (const slot of daySlots) {
      const bg = rowIndex % 2 === 0 ? theme.colors.bgSurface : theme.colors.bgSubtle;
      const borderBottom = rowIndex < plan.slots.length - 1 ? `border-bottom: 1px solid ${theme.colors.borderLight};` : '';

      html += `<tr style="background-color: ${bg}; ${borderBottom}">`;
      
      // Column 1: Date & Period
      html += `<td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: ${theme.colors.textPrimary}; white-space: nowrap; vertical-align: top; width: 110px;">`;
      html += `${dateLabel}`;
      if (daySlots.length > 1) {
        html += `<div style="font-size: 11px; font-weight: normal; color: ${theme.colors.textSecondary}; margin-top: 2px;">${slot.mealPeriod}</div>`;
      }
      html += `</td>`;

      // Column 2: Meal Name & details
      html += `<td style="padding: 10px 14px; font-size: 14px; color: ${theme.colors.textPrimary}; vertical-align: top;">`;
      if (slot.isBlocked) {
        html += `<span style="color: ${theme.colors.textTertiary}; font-style: italic;">[Blocked]</span>`;
      } else if (slot.mealName) {
        html += `<strong style="font-weight: 600;">${slot.mealName}</strong>`;
        if (slot.category) {
          html += `<span style="display: inline-block; margin-left: 8px; font-size: 11px; color: ${theme.colors.textSecondary}; background: ${theme.colors.borderLight}; padding: 1px 6px; border-radius: 4px;">${slot.category}</span>`;
        }
      }
      html += `</td>`;

      // Column 3: Tag (Leftover / Macros)
      html += `<td style="padding: 10px 14px; font-size: 12px; text-align: right; vertical-align: top; white-space: nowrap;">`;
      if (slot.isLeftover) {
        html += `<span style="display: inline-block; padding: 2px 7px; font-size: 11px; font-weight: 600; color: ${theme.colors.accentHighlight}; background-color: ${theme.colors.accentPrimaryLight}; border-radius: 12px; margin-bottom: 2px;">Leftover</span><br/>`;
      }
      if (showNutrition && slot.calories) {
        html += `<span style="font-size: 11px; color: ${theme.colors.textSecondary};">${slot.calories} kcal`;
        if (slot.protein) html += ` &bull; ${slot.protein}g P`;
        html += `</span>`;
      }
      html += `</td>`;

      html += `</tr>`;
      rowIndex++;
    }
  }

  html += `</tbody></table></div>`;
  return html;
}

/**
 * Copies the schedule to clipboard using multi-MIME rich text (HTML + plain text fallback).
 */
export async function copyScheduleToClipboard(
  plan: AcceptedPlan,
  options: ClipboardFormatOptions = {}
): Promise<boolean> {
  const plainText = formatSchedulePlainText(plan, options);
  const htmlTable = formatScheduleHtmlTable(plan, options);

  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
      const htmlBlob = new Blob([htmlTable], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      return true;
    }
  } catch (err) {
    // Fall back to plain writeText
  }

  try {
    await navigator.clipboard.writeText(plainText);
    return true;
  } catch {
    return false;
  }
}
