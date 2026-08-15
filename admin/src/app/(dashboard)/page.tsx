"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";

interface Analytics {
  users: { total: number; new24h: number; new7d: number; deleted: number };
  listings: { total: number; new24h: number; new7d: number; active: number; deleted: number };
  pendingReports: number;
  listingsByCategory: { category: string; count: number }[];
  listingsByCity: { city: string; count: number }[];
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function BarList({ title, rows, labelKey }: { title: string; rows: { count: number; [k: string]: any }[]; labelKey: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">No data yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div key={r[labelKey]} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 truncate text-gray-600">{r[labelKey]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-orange-500" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right font-medium text-gray-700">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    apiFetch<Analytics>("/admin/analytics", { accessToken: token ?? undefined })
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Platform overview.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!data ? (
        <p className="mt-6 text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total users" value={data.users.total} hint={`+${data.users.new7d} in 7 days`} />
            <StatCard label="New users (24h)" value={data.users.new24h} />
            <StatCard label="Active listings" value={data.listings.active} hint={`${data.listings.total} total`} />
            <StatCard label="New listings (24h)" value={data.listings.new24h} hint={`+${data.listings.new7d} in 7 days`} />
            <StatCard label="Pending reports" value={data.pendingReports} />
            <StatCard label="Deleted users" value={data.users.deleted} />
            <StatCard label="Deleted posts" value={data.listings.deleted} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarList title="Listings by category" rows={data.listingsByCategory} labelKey="category" />
            <BarList title="Listings by city" rows={data.listingsByCity} labelKey="city" />
          </div>
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/categories"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-semibold text-gray-900">Categories</p>
          <p className="mt-1 text-xs text-gray-500">Add, edit, delete categories and their pictures</p>
        </Link>
        <Link
          href="/users"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-semibold text-gray-900">Users</p>
          <p className="mt-1 text-xs text-gray-500">View, verify, and moderate registered users</p>
        </Link>
        <Link
          href="/reports"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-semibold text-gray-900">Reports</p>
          <p className="mt-1 text-xs text-gray-500">Review user reports and app issues</p>
        </Link>
      </div>
    </div>
  );
}
