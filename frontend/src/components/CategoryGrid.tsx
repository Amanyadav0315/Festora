"use client";

import { useState } from "react";
import Link from "next/link";
import type { SubcategoryDTO } from "@festora/types";
import { CategoryImage } from "@/components/CategoryImage";

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

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-6 lg:grid-cols-8">
        {items.map((sub) => (
          <Link
            key={sub.id}
            href={`/browse?subcategory=${sub.slug}`}
            className="flex flex-col items-center gap-2 rounded-xl p-2 text-center transition-colors hover:bg-gray-100 sm:p-3"
          >
            <span className="block w-full overflow-hidden rounded-2xl shadow-sm">
              <CategoryImage slug={sub.slug} name={sub.name} className="aspect-square w-full" />
            </span>
            <span className="text-xs font-medium text-gray-700">{sub.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
