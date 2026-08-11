import { apiFetch } from "./api";

export const WISHLIST_CHANGED_EVENT = "eventsaman_wishlist_changed";

let cachedIds: Set<string> | null = null;
let loadPromise: Promise<Set<string>> | null = null;

function emitChanged() {
  window.dispatchEvent(new Event(WISHLIST_CHANGED_EVENT));
}

export async function loadWishlistIds(accessToken: string): Promise<Set<string>> {
  if (cachedIds) return cachedIds;
  if (!loadPromise) {
    loadPromise = apiFetch<{ listingIds: string[] }>("/wishlist/mine", { accessToken })
      .then((body) => {
        cachedIds = new Set(body.listingIds);
        return cachedIds;
      })
      .catch(() => new Set<string>())
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function isWishlisted(listingId: string): boolean {
  return cachedIds?.has(listingId) ?? false;
}

export function clearWishlistCache() {
  cachedIds = null;
}

export async function toggleWishlist(listingId: string, accessToken: string): Promise<boolean> {
  const wishlisted = isWishlisted(listingId);
  if (wishlisted) {
    await apiFetch(`/wishlist/${listingId}`, { method: "DELETE", accessToken });
    cachedIds?.delete(listingId);
  } else {
    await apiFetch(`/wishlist/${listingId}`, { method: "POST", accessToken });
    if (!cachedIds) cachedIds = new Set();
    cachedIds.add(listingId);
  }
  emitChanged();
  return !wishlisted;
}
