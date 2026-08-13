"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ListingDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";
import { ImageCarousel } from "@/components/ImageCarousel";

function formatPrice(price: number, priceUnit?: string) {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
  return priceUnit ? `${formatted} / ${priceUnit.replace(/^per /, "")}` : formatted;
}

export function OwnListingCard({
  listing,
  onDeleted,
  onToggled,
  menuOpen,
  onMenuOpenChange,
}: {
  listing: ListingDTO;
  onDeleted: (id: string) => void;
  onToggled: (listing: ListingDTO) => void;
  // Menu-open state is controlled by the parent grid so opening one card's menu closes any other
  // card's menu that was left open, instead of each card tracking its own state independently.
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const t = useTranslations("socialProfile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setBusy(true);
    setError("");
    try {
      const token = getAccessToken() ?? undefined;
      const { listing: updated } = await apiFetch<{ listing: ListingDTO }>(`/listings/${listing.id}`, {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ isActive: !listing.isActive }),
      });
      onToggled(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
      onMenuOpenChange(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t("deleteListingConfirm"))) return;
    setBusy(true);
    setError("");
    try {
      const token = getAccessToken() ?? undefined;
      await apiFetch(`/listings/${listing.id}`, { method: "DELETE", accessToken: token });
      onDeleted(listing.id);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="w-full overflow-hidden bg-gray-100">
          <ImageCarousel images={listing.images} alt={listing.title} />
        </div>
        <div className="p-2 sm:p-3">
          <p className="text-sm font-semibold text-gray-900 sm:text-base">
            {formatPrice(listing.price, listing.priceUnit)}
          </p>
          <p className="mt-1 truncate text-xs text-gray-700 sm:text-sm">{listing.title}</p>
          <span className="mt-1 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
            {listing.purpose === "rent" ? "For rent" : "For sale"}
          </span>
          {listing.city && <p className="mt-1 text-xs text-gray-400">{listing.city}</p>}
        </div>
      </Link>

      {!listing.isActive && (
        <span className="absolute left-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
          {t("paused")}
        </span>
      )}

      <div className="absolute right-2 top-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onMenuOpenChange(!menuOpen);
          }}
          aria-label={t("moreOptions")}
          disabled={busy}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 text-left shadow-lg"
            onClick={(e) => e.preventDefault()}
          >
            <button
              onClick={() => router.push(`/sell?edit=${listing.id}`)}
              className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              {t("editListing")}
            </button>
            <button
              onClick={() => router.push(`/sell?duplicate=${listing.id}`)}
              className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              {t("duplicateListing")}
            </button>
            <button
              onClick={handleToggle}
              disabled={busy}
              className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              {listing.isActive ? t("pauseListing") : t("activateListing")}
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
            >
              {t("deleteListing")}
            </button>
          </div>
        )}
      </div>

      {error && <p className="px-2 pb-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
