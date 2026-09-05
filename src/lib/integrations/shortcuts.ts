import type { AggregatedGroceryItem } from './groceries';

export interface ShortcutItemPayload {
  name: string;
  quantity?: number;
  unit?: string;
  display: string;
  section: string;
}

export interface ShortcutPayload {
  source: 'DinnerRoll';
  version: '2.0';
  timestamp: string;
  listName: string;
  items: string[];
  detailedItems: ShortcutItemPayload[];
  plainText: string;
}

export const DEFAULT_SHORTCUT_NAME = 'DinnerRoll Groceries';
export const DEFAULT_REMINDERS_LIST = 'Groceries';

export function createShortcutPayload(
  items: AggregatedGroceryItem[],
  listName = DEFAULT_REMINDERS_LIST
): ShortcutPayload {
  const detailedItems: ShortcutItemPayload[] = items.map(item => {
    const qtyStr = item.quantity ? `${item.quantity} ${item.unit} ` : '';
    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      display: `${qtyStr}${item.name}`.trim(),
      section: item.category || 'General'
    };
  });

  const formattedStrings = detailedItems.map(i => i.display);

  return {
    source: 'DinnerRoll',
    version: '2.0',
    timestamp: new Date().toISOString(),
    listName,
    items: formattedStrings,
    detailedItems,
    plainText: formattedStrings.join('\n')
  };
}

/**
 * Builds the native iOS Apple Shortcuts URL for opening and running the companion Shortcut.
 * Format: shortcuts://run-shortcut?name=<NAME>&input=text&text=<ENCODED_JSON>
 */
export function buildShortcutUrl(
  items: AggregatedGroceryItem[],
  shortcutName = DEFAULT_SHORTCUT_NAME,
  listName = DEFAULT_REMINDERS_LIST
): string {
  const payload = createShortcutPayload(items, listName);
  const jsonStr = JSON.stringify(payload);
  const encodedName = encodeURIComponent(shortcutName);
  const encodedInput = encodeURIComponent(jsonStr);

  return `shortcuts://run-shortcut?name=${encodedName}&input=text&text=${encodedInput}`;
}

/**
 * URL scheme to open Apple Shortcuts app directly to create a new shortcut.
 */
export function buildShortcutSetupUrl(): string {
  return 'shortcuts://create-shortcut';
}

/**
 * URL scheme to open a specific existing shortcut in Apple Shortcuts.
 */
export function buildShortcutOpenUrl(shortcutName = DEFAULT_SHORTCUT_NAME): string {
  return `shortcuts://open-shortcut?name=${encodeURIComponent(shortcutName)}`;
}

export async function invokeAppleShortcut(
  items: AggregatedGroceryItem[],
  shortcutName = DEFAULT_SHORTCUT_NAME,
  listName = DEFAULT_REMINDERS_LIST
): Promise<{ success: boolean; url: string; fallbackText: string }> {
  const url = buildShortcutUrl(items, shortcutName, listName);
  const payload = createShortcutPayload(items, listName);
  const fallbackText = payload.plainText;

  try {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
    return { success: true, url, fallbackText };
  } catch (err) {
    return { success: false, url, fallbackText };
  }
}
