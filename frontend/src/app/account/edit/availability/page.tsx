"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// Sellers mark dates they know they're unavailable, so buyers browsing get an early signal
// before reaching out. This is purely informational — Event Saman does not confirm, hold, or
// guarantee any date; the buyer and seller still coordinate and finalize everything directly
// between themselves, same as any other part of a deal on this platform.
export default function EditAvailabilityPage() {
  const router = useRouter();
  const [store, setStore] = useState<StoreDTO | null | undefined>(undefined); // undefined = loading
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const token = getAccessToken();
    apiFetch<{ store: StoreDTO }>("/stores/me", { accessToken: token ?? undefined })
      .then((body) => {
        setStore(body.store);
        setSelected(new Set(body.store.unavailableDates));
      })
      .catch(() => setStore(null));
  }, [router]);

  function toggleDate(dateStr: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const token = getAccessToken() ?? undefined;
      await apiFetch("/stores/me/availability", {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ unavailableDates: Array.from(selected) }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (store === undefined) {
    return (
      <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
        <BackHeader title="Availability" backHref="/account/edit" />
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  if (store === null) {
    return (
      <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
        <BackHeader title="Availability" backHref="/account/edit" />
        <p className="mt-4 text-sm text-gray-500">
          Post your first listing to create a store — you can mark unavailable dates once you have one.
        </p>
      </main>
    );
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];
  const todayStr = toDateStr(today);

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title="Availability" backHref="/account/edit" />

      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        This just shows buyers which dates you're unavailable — it doesn't book or reserve
        anything. All bookings and payments are still arranged directly between you and the
        buyer, outside Event Saman.
      </p>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const m = viewMonth === 0 ? 11 : viewMonth - 1;
            setViewYear(viewMonth === 0 ? viewYear - 1 : viewYear);
            setViewMonth(m);
          }}
          className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-900">{monthLabel(viewYear, viewMonth)}</span>
        <button
          type="button"
          onClick={() => {
            const m = viewMonth === 11 ? 0 : viewMonth + 1;
            setViewYear(viewMonth === 11 ? viewYear + 1 : viewYear);
            setViewMonth(m);
          }}
          className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const dateStr = toDateStr(date);
          const isPast = dateStr < todayStr;
          const isMarked = selected.has(dateStr);
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => toggleDate(dateStr)}
              className={`aspect-square rounded-md text-xs font-medium ${
                isPast
                  ? "text-gray-300"
                  : isMarked
                    ? "bg-red-500 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">Tap a date to mark/unmark it as unavailable. Marked: {selected.size}</p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-600">Availability updated.</p>}

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </main>
  );
}
