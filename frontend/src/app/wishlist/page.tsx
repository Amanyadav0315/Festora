"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingDTO } from "@eventsaman/types";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { WISHLIST_CHANGED_EVENT } from "@/lib/wishlist-client";
import { BackHeader } from "@/components/BackHeader";
import { ListingCard } from "@/components/ListingCard";

export default function WishlistPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingDTO[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!getUser() || !token) {
      router.push("/login");
      return;
    }

    function load() {
      apiFetch<{ listings: ListingDTO[] }>("/wishlist", { accessToken: token! })
        .then((body) => setListings(body.listings))
        .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
    }

    load();
    window.addEventListener(WISHLIST_CHANGED_EVENT, load);
    return () => window.removeEventListener(WISHLIST_CHANGED_EVENT, load);
  }, [router]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 sm:pb-16">
      <BackHeader title="Wishlist" />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {listings === null && !error ? (
        <p className="mt-6 text-sm text-gray-500">Loading...</p>
      ) : listings && listings.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Nothing here yet — tap the heart on any listing to save it for later.
          </p>
        </div>
      ) : (
        listings && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )
      )}
    </main>
  );
}
