// Compare-listings is a local, client-only feature — no backend persistence needed since it's
// just a scratch list of listing IDs the visitor is currently weighing against each other.
const STORAGE_KEY = "eventsaman_compare";
export const MAX_COMPARE_ITEMS = 4;
export const COMPARE_CHANGED_EVENT = "eventsaman_compare_changed";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(COMPARE_CHANGED_EVENT));
}

export function getCompareIds(): string[] {
  return readIds();
}

export function isComparing(listingId: string): boolean {
  return readIds().includes(listingId);
}

// Returns whether the id ended up in the list, and an optional reason it couldn't be added.
export function toggleCompare(listingId: string): { added: boolean; limitReached?: boolean } {
  const ids = readIds();
  const idx = ids.indexOf(listingId);
  if (idx >= 0) {
    ids.splice(idx, 1);
    writeIds(ids);
    return { added: false };
  }
  if (ids.length >= MAX_COMPARE_ITEMS) {
    return { added: false, limitReached: true };
  }
  ids.push(listingId);
  writeIds(ids);
  return { added: true };
}

export function removeFromCompare(listingId: string) {
  writeIds(readIds().filter((id) => id !== listingId));
}

export function clearCompare() {
  writeIds([]);
}
