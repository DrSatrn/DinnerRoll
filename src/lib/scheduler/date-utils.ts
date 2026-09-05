/**
 * Utilities for manipulating calendar dates strictly as YYYY-MM-DD local strings
 * without UTC instant conversions or timezone skew.
 */

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // midday to prevent boundary crossing
}

export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function diffInDays(laterDateStr: string, earlierDateStr: string): number {
  const date1 = parseLocalDate(laterDateStr);
  const date2 = parseLocalDate(earlierDateStr);
  const diffTime = date1.getTime() - date2.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getDayOfWeekName(dateStr: string, locale = 'en-US'): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(locale, { weekday: 'short' });
}

export function formatHumanDate(dateStr: string, locale = 'en-US'): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getTodayLocalDate(): string {
  return formatLocalDate(new Date());
}
