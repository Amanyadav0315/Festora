"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCompare, COMPARE_CHANGED_EVENT, getCompareIds } from "@/lib/compare-client";

// A slim floating bar, mounted globally, that appears whenever the visitor has 2+ listings
// queued up to compare — lets them jump to the comparison table from anywhere on the site.
export function CompareBar() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getCompareIds().length);
    const onChanged = () => setCount(getCompareIds().length);
    window.addEventListener(COMPARE_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(COMPARE_CHANGED_EVENT, onChanged);
  }, []);

  if (count < 2) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4 lg:bottom-4">
      <div className="flex items-center gap-3 rounded-full bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
        <span>{count} listing{count > 1 ? "s" : ""} to compare</span>
        <button
          onClick={() => router.push("/compare")}
          className="rounded-full bg-orange-600 px-3 py-1 font-semibold hover:bg-orange-700"
        >
          Compare
        </button>
        <button onClick={() => clearCompare()} aria-label="Clear compare list" className="text-gray-300 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
