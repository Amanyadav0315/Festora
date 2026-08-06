"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { isWishlisted, loadWishlistIds, toggleWishlist, WISHLIST_CHANGED_EVENT } from "@/lib/wishlist-client";

function HeartIcon({ className, filled }: { className?: string; filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19.3l-1.15-1.02C6.4 14.55 3.5 11.97 3.5 8.8 3.5 6.2 5.6 4.1 8.2 4.1c1.47 0 2.88.68 3.8 1.76a5.1 5.1 0 0 1 3.8-1.76c2.6 0 4.7 2.1 4.7 4.7 0 3.17-2.9 5.75-7.35 9.5L12 19.3z"
      />
    </svg>
  );
}

export function WishlistButton({
  listingId,
  className,
}: {
  listingId: string;
  className?: string;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const user = getUser();
    const token = getAccessToken();
    if (!user || !token) return;

    loadWishlistIds(token).then(() => setWishlisted(isWishlisted(listingId)));

    const onChanged = () => setWishlisted(isWishlisted(listingId));
    window.addEventListener(WISHLIST_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(WISHLIST_CHANGED_EVENT, onChanged);
  }, [listingId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const token = getAccessToken();
    if (!getUser() || !token) {
      router.push("/login");
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      const next = await toggleWishlist(listingId, token);
      setWishlisted(next);
    } catch {
      // ignore transient failures — UI stays at its last known state
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      disabled={busy}
      className={
        className ??
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm backdrop-blur transition-colors hover:text-rose-600"
      }
    >
      <HeartIcon className={`h-4 w-4 ${wishlisted ? "text-rose-600" : ""}`} filled={wishlisted} />
    </button>
  );
}
