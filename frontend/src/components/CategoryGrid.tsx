"use client";

import { useState } from "react";
import Link from "next/link";
import type { SubcategoryDTO } from "@festora/types";

export function CategoryGrid({
  featured,
  all,
}: {
  featured: SubcategoryDTO[];
  all: SubcategoryDTO[];
}) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? all : featured;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Browse categories</h2>
        {all.length > featured.length && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            {expanded ? "Show less" : `View all categories (${all.length})`}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-8">
        {items.map((sub) => (
          <Link
            key={sub.id}
            href={`/browse?subcategory=${sub.slug}`}
            className="flex flex-col items-center gap-2 rounded-lg p-2 text-center hover:bg-gray-100 sm:p-3"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-2xl sm:h-16 sm:w-16 sm:text-3xl">
              {sub.icon ?? "🎉"}
            </span>
            <span className="text-xs font-medium text-gray-700">{sub.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
