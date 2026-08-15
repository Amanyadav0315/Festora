"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";

interface AuditEntry {
  time: string;
  method: string;
  path: string;
  status: number;
  userId: string | null;
  ip: string;
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const PAGE_SIZE = 50;
const METHODS = ["", "POST", "PATCH", "PUT", "DELETE"];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function methodColor(method: string) {
  if (method === "DELETE") return "bg-red-100 text-red-700";
  if (method === "POST") return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, method]);

  useEffect(() => {
    const token = getAccessToken();
    setEntries(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (method) params.set("method", method);
    apiFetch<{ entries: AuditEntry[]; total: number }>(`/admin/audit-log?${params}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => {
        setEntries(body.entries);
        setTotal(body.total);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [page, debouncedSearch, method]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
          <p className="mt-0.5 text-sm text-gray-500">Every create/update/delete action across the platform, newest first.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m || "All methods"}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search path, user ID, or IP"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 sm:w-64"
          />
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {entries === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No matching log entries.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Path</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">{formatTime(e.time)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${methodColor(e.method)}`}>{e.method}</span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-2.5 font-mono text-xs text-gray-700">{e.path}</td>
                    <td className={`px-4 py-2.5 font-medium ${e.status >= 400 ? "text-red-600" : "text-gray-700"}`}>{e.status}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{e.userId ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{e.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-gray-500">
                Page {page} of {totalPages} · {total} entries
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
