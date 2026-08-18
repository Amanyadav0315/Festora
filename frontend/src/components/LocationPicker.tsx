"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { INDIA_CITIES } from "@/lib/cities";

// Rendering all ~700 locations on every keystroke is wasteful and not noticeably more useful
// than a capped list — this keeps filtering instant on low-end mobile devices.
const MAX_RESULTS = 40;

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface LocationPickerProps {
  value: string;
  onChange: (city: string) => void;
  compact?: boolean;
  className?: string;
}

// Drop-in replacement for the plain <select> that used to drive location selection — same
// value/onChange contract, same INDIA_CITIES data, same "All India" default. This just adds a
// search box on top of the existing list instead of introducing a separate location system.
export function LocationPicker({ value, onChange, compact = false, className }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Let the panel render before focusing so it doesn't jump on open.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDIA_CITIES.slice(0, MAX_RESULTS);
    return INDIA_CITIES.filter((c) => c.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [query]);

  function select(city: string) {
    onChange(city);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select location"
        aria-expanded={open}
        className={
          compact
            ? "flex items-center gap-1 rounded-full bg-gray-100 py-1.5 pl-2.5 pr-2 text-xs font-medium text-gray-700"
            : "flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
        }
      >
        <PinIcon className={compact ? "h-3.5 w-3.5 shrink-0 text-gray-500" : "h-4 w-4 shrink-0 text-gray-500"} />
        <span className="max-w-[9rem] truncate">{value}</span>
        <ChevronIcon className={compact ? "h-3 w-3 shrink-0 text-gray-500" : "h-3.5 w-3.5 shrink-0 text-gray-500"} />
      </button>

      {open && compact && (
        // On mobile the pill trigger sits near the left edge of a narrow header, so an
        // absolutely-positioned dropdown either gets clipped or has to stretch almost the full
        // screen width to fit the city list — both read as broken. A bottom sheet (same pattern
        // as ShareSheet/ProfileQrCode) keeps it anchored to the viewport instead of the trigger.
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[75vh] w-full flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
              <h3 className="text-sm font-bold text-gray-900">Select location</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <CloseIcon className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="shrink-0 border-b border-gray-100 px-4 pb-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search location"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto py-1" role="listbox">
              {results.length === 0 ? (
                <li className="px-4 py-2 text-sm text-gray-400">No matching location</li>
              ) : (
                results.map((city) => (
                  <li key={city}>
                    <button
                      type="button"
                      onClick={() => select(city)}
                      className={`flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-orange-50 ${
                        city === value ? "font-semibold text-orange-600" : "text-gray-700"
                      }`}
                    >
                      {city}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {open && !compact && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-72 max-w-[85vw] rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search location"
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
            {results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No matching location</li>
            ) : (
              results.map((city) => (
                <li key={city}>
                  <button
                    type="button"
                    onClick={() => select(city)}
                    className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-orange-50 ${
                      city === value ? "font-semibold text-orange-600" : "text-gray-700"
                    }`}
                  >
                    {city}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
