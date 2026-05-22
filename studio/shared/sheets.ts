export type SheetTab = 'Spiral' | 'Letters' | 'Tree';

export interface SheetEntry {
  rowIndex: number;
  name: string;
  timestamp: string;
  data: string;
}

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbyXhxlnewbftEuGhSUp5XtnIphvEkzLU5I-0UGfWJqJZWk1GPJfA3I40CFeQaeVt2MO/exec';

export async function saveEntry(
  tab: SheetTab,
  name: string,
  data: unknown
): Promise<void> {
  await fetch(SHEETS_API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheet: tab,
      name,
      timestamp: new Date().toISOString(),
      data: JSON.stringify(data),
    }),
  });
}

export async function loadEntries(tab: SheetTab): Promise<SheetEntry[]> {
  try {
    const response = await fetch(`${SHEETS_API_URL}?sheet=${encodeURIComponent(tab)}`);
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) return result.data;
    return [];
  } catch {
    return [];
  }
}
