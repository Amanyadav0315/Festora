"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ListingDTO } from "@eventsaman/types";
import { apiFetch } from "@/lib/api";
import { ASSET_BASE_URL } from "@/lib/api";
import { COMPARE_CHANGED_EVENT, getCompareIds, removeFromCompare } from "@/lib/compare-client";
import { BackHeader } from "@/components/BackHeader";

function formatPrice(price: number, priceUnit?: string) {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
  return priceUnit ? `${formatted} / ${priceUnit.replace(/^per /, "")}` : formatted;
}

function imgSrc(path: string) {
  return path.startsWith("http") ? path : `${ASSET_BASE_URL}${path}`;
}

export default function ComparePage() {
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = getCompareIds();
      setLoading(true);
      const results = await Promise.all(
        ids.map((id) =>
          apiFetch<{ listing: ListingDTO }>(`/listings/${id}`)
            .then((body) => body.listing)
            .catch(() => null)
        )
      );
      if (!cancelled) {
        setListings(results.filter((l): l is ListingDTO => l !== null));
        setLoading(false);
      }
    }

    load();
    window.addEventListener(COMPARE_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(COMPARE_CHANGED_EVENT, load);
    };
  }, []);

  const rows: { label: string; render: (l: ListingDTO) => React.ReactNode }[] = [
    { label: "Price", render: (l) => formatPrice(l.price, l.priceUnit) },
    { label: "Condition", render: (l) => (l.condition === "new" ? "New" : "Used") },
    { label: "Purpose", render: (l) => (l.purpose === "rent" ? "For rent" : "For sale") },
    { label: "City", render: (l) => l.city ?? "—" },
    { label: "Seller", render: (l) => l.storeName },
    { label: "Status", render: (l) => (l.isActive ? "Active" : "Inactive") },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 sm:pb-16">
      <BackHeader title="Compare listings" />

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading...</p>
      ) : listings.length < 2 ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Add at least 2 listings to compare — tap the scale icon on any listing card.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-32 border-b border-gray-100 p-3 text-left align-bottom text-xs font-medium uppercase text-gray-400">
                  &nbsp;
                </th>
                {listings.map((l) => (
                  <th key={l.id} className="border-b border-gray-100 p-3 text-left align-top">
                    <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg bg-gray-100">
                      {l.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc(l.images[0])} alt={l.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <Link href={`/listings/${l.id}`} className="line-clamp-2 font-semibold text-gray-900 hover:text-orange-600">
                      {l.title}
                    </Link>
                    <button
                      onClick={() => removeFromCompare(l.id)}
                      className="mt-1 block text-xs text-gray-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="border-b border-gray-50 p-3 text-xs font-medium uppercase text-gray-400">{row.label}</td>
                  {listings.map((l) => (
                    <td key={l.id} className="border-b border-gray-50 p-3 text-gray-700">
                      {row.render(l)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
