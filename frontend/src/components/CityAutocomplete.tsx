"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { INDIA_CITIES } from "@/lib/cities";

// Rendering all ~700 cities on every keystroke is wasteful — same cap the navbar's
// LocationPicker uses, keeps filtering instant on low-end mobile devices.
const MAX_RESULTS = 40;

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

// Searchable city field for the listing form — same INDIA_CITIES data and filtering behavior as
// the navbar's LocationPicker, but shaped as a plain text input (with a "—" clear option) since
// this sits inside a form instead of a header button.
export function CityAutocomplete({ value, onChange, placeholder, className }: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, value]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cities = INDIA_CITIES.filter((c) => c !== "All India");
    if (!q) return cities.slice(0, MAX_RESULTS);
    return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [query]);

  function select(city: string) {
    onChange(city);
    setQuery(city);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Search city"}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
      />

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-full max-w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => select("")}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-400 hover:bg-orange-50"
                >
                  Clear
                </button>
              </li>
            )}
            {results.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No matching city</li>
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
