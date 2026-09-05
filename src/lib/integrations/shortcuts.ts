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
  version: '1.0';
  timestamp: string;
  items: ShortcutItemPayload[];
}

export const DEFAULT_SHORTCUT_NAME = 'DinnerRoll Groceries';

export function createShortcutPayload(items: AggregatedGroceryItem[]): ShortcutPayload {
  return {
    source: 'DinnerRoll',
    version: '1.0',
    timestamp: new Date().toISOString(),
    items: items.map(item => {
      const qtyStr = item.quantity ? `${item.quantity} ${item.unit} ` : '';
      return {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        display: `${qtyStr}${item.name}`.trim(),
        section: item.category || 'General'
      };
    })
  };
}

/**
 * Builds the native iOS Apple Shortcuts URL for opening and running the companion Shortcut.
 * Format: shortcuts://run-shortcut?name=<NAME>&input=text&text=<ENCODED_JSON>
 */
export function buildShortcutUrl(
  items: AggregatedGroceryItem[],
  shortcutName = DEFAULT_SHORTCUT_NAME
): string {
  const payload = createShortcutPayload(items);
  const jsonStr = JSON.stringify(payload);
  const encodedName = encodeURIComponent(shortcutName);
  const encodedInput = encodeURIComponent(jsonStr);

  return `shortcuts://run-shortcut?name=${encodedName}&input=text&text=${encodedInput}`;
}

export async function invokeAppleShortcut(
  items: AggregatedGroceryItem[],
  shortcutName = DEFAULT_SHORTCUT_NAME
): Promise<{ success: boolean; url: string; fallbackText: string }> {
  const url = buildShortcutUrl(items, shortcutName);
  const payload = createShortcutPayload(items);
  const fallbackText = payload.items.map(i => i.display).join('\n');

  try {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
    return { success: true, url, fallbackText };
  } catch (err) {
    return { success: false, url, fallbackText };
  }
}
