"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "priceLow", label: "Price: low to high" },
  { value: "priceHigh", label: "Price: high to low" },
];

// Client-side filter bar for /browse — updates the URL's query params, which the server
// component re-reads on navigation. Kept separate from the (server) page so only this small
// bar needs to be interactive.
export function BrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const sort = searchParams.get("sort") ?? "newest";

  function applyPriceRange() {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    router.push(`${pathname}?${params.toString()}`);
  }

  function changeSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onBlur={applyPriceRange}
          onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
          placeholder="Min ₹"
          className="w-24 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
        <span className="text-gray-400">–</span>
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onBlur={applyPriceRange}
          onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
          placeholder="Max ₹"
          className="w-24 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
      </div>
      <select
        value={sort}
        onChange={(e) => changeSort(e.target.value)}
        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
