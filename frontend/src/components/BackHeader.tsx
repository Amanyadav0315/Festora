"use client";

import { useRouter } from "next/navigation";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function BackHeader({ title, backHref }: { title: string; backHref?: string }) {
  const router = useRouter();

  return (
    <div
      className="sticky top-0 z-10 -mx-4 mb-6 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3.5 backdrop-blur sm:-mx-6 sm:px-6"
      // Same status-bar-overlap fix as the main Navbar — see Navbar.tsx for why this only
      // has an effect inside the Android WebView app.
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        aria-label="Go back"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200"
      >
        <BackIcon className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h1>
    </div>
  );
}
