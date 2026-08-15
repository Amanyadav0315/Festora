"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminUserListItemDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
}

// Debounces the search box so every keystroke doesn't fire a request.
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUserListItemDTO[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  function reload() {
    const token = getAccessToken();
    setUsers(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    apiFetch<{ users: AdminUserListItemDTO[]; total: number }>(`/admin/users?${params}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => {
        setUsers(body.users);
        setTotal(body.total);
        setSelected(new Set());
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }

  useEffect(reload, [page, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectableIds = (users ?? []).filter((u) => u.role !== "admin").map((u) => u.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkVerify(isVerified: boolean) {
    if (selected.size === 0 || busy) return;
    const token = getAccessToken();
    setBusy(true);
    try {
      await apiFetch("/admin/users/bulk-verify", {
        method: "PATCH",
        accessToken: token ?? undefined,
        body: JSON.stringify({ ids: Array.from(selected), isVerified }),
      });
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete(reason?: string) {
    if (selected.size === 0 || busy) return;
    const token = getAccessToken();
    setBusy(true);
    try {
      await apiFetch("/admin/users/bulk", {
        method: "DELETE",
        accessToken: token ?? undefined,
        body: JSON.stringify({ ids: Array.from(selected), reason }),
      });
      setBulkDeleteOpen(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <div className="relative w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, business, phone, or email"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
          </svg>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm">
          <span className="font-medium text-orange-800">{selected.size} selected</span>
          <button
            onClick={() => bulkVerify(true)}
            disabled={busy}
            className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            Verify
          </button>
          <button
            onClick={() => bulkVerify(false)}
            disabled={busy}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Unverify
          </button>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            disabled={busy}
            className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-orange-700 hover:underline">
            Clear
          </button>
        </div>
      )}

      {users === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No users found.</p>
        </div>
      ) : (
        <>
          {/* Table on wide screens */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-8 px-4 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Business name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">Posts</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {u.role !== "admin" && (
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleOne(u.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/users/${u.id}`} className="font-medium text-gray-900 hover:text-orange-600">
                        {u.name}
                      </Link>
                      {u.role === "admin" && (
                        <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                          ADMIN
                        </span>
                      )}
                      {u.isVerified && (
                        <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                          VERIFIED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.businessName}</td>
                    <td className="px-4 py-3 text-gray-700">{u.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{u.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{u.postsCount}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards on small screens */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="flex items-start gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-orange-200">
                {u.role !== "admin" && (
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggleOne(u.id)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
                  />
                )}
                <Link href={`/users/${u.id}`} className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {u.name}
                        {u.role === "admin" && (
                          <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                            ADMIN
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-orange-600">{u.businessName}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{formatDate(u.createdAt)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span>📞 {u.phone}</span>
                    <span>✉️ {u.email || "—"}</span>
                    <span>📍 {u.city || "—"}</span>
                    <span>🧾 {u.postsCount} posts</span>
                  </div>
                </Link>
              </div>
            ))}
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
                Page {page} of {totalPages} · {total} users
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

      {bulkDeleteOpen && (
        <ConfirmModal
          title={`Delete ${selected.size} user${selected.size > 1 ? "s" : ""}?`}
          description="Their accounts and posts will be hidden and can be restored later from Deleted Items."
          confirmLabel="Delete"
          requireReason
          busy={busy}
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={(reason) => bulkDelete(reason)}
        />
      )}
    </div>
  );
}
