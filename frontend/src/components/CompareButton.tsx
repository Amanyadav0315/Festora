"use client";

import { useEffect, useState } from "react";
import {
  COMPARE_CHANGED_EVENT,
  isComparing,
  MAX_COMPARE_ITEMS,
  toggleCompare,
} from "@/lib/compare-client";

function ScaleIcon({ className, filled }: { className?: string; filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        d="M6 4v16M18 4v16M3 8l3-4 3 4M15 8l3-4 3 4M3 8a3 3 0 006 0M15 8a3 3 0 006 0"
      />
    </svg>
  );
}

export function CompareButton({ listingId, className }: { listingId: string; className?: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isComparing(listingId));
    const onChanged = () => setActive(isComparing(listingId));
    window.addEventListener(COMPARE_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(COMPARE_CHANGED_EVENT, onChanged);
  }, [listingId]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(listingId);
    if (result.limitReached) {
      alert(`You can compare up to ${MAX_COMPARE_ITEMS} listings at a time. Remove one to add another.`);
      return;
    }
    setActive(result.added);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      aria-pressed={active}
      className={
        className ??
        `flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors ${
          active ? "text-orange-600" : "text-gray-500 hover:text-orange-600"
        }`
      }
    >
      <ScaleIcon className="h-4 w-4" filled={active} />
    </button>
  );
}
