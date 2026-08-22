"use client";

import { useEffect, useState } from "react";
import type { DeletedUserDTO, DeletedPostDTO, SelfDeletedUserDTO, DeletedAccountLogDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError, ASSET_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

function imgSrc(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Tab = "users" | "self-deleted" | "posts" | "log";

const SOURCE_LABEL: Record<DeletedAccountLogDTO["source"], string> = {
  "grace-period-expired": "Grace period expired",
  "admin-forced": "Force-deleted by admin",
  "admin-direct": "Deleted by admin",
};

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function DateFilters({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-1.5 text-gray-600">
        From
        <input
          type="date"
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-1.5 text-gray-600">
        To
        <input
          type="date"
          value={to}
          onChange={(e) => onTo(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>
      {(from || to) && (
        <button
          onClick={() => {
            onFrom("");
            onTo("");
          }}
          className="text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}

const PAGE_SIZE = 20;

function DeletedUsersTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<DeletedUserDTO[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<DeletedUserDTO | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<DeletedUserDTO | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [bulkPurgeOpen, setBulkPurgeOpen] = useState(false);

  useEffect(() => setPage(1), [debouncedSearch, from, to]);

  function reload() {
    const token = getAccessToken();
    setUsers(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiFetch<{ users: DeletedUserDTO[]; total: number }>(`/admin/deleted-users?${params}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => {
        setUsers(body.users);
        setTotal(body.total);
        setSelected(new Set());
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }

  useEffect(reload, [page, debouncedSearch, from, to]);

  async function restore() {
    if (!restoreTarget) return;
    const token = getAccessToken();
    setBusyId(restoreTarget.id);
    try {
      await apiFetch(`/admin/users/${restoreTarget.id}/restore`, { method: "PATCH", accessToken: token ?? undefined });
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== restoreTarget.id) : prev));
      setRestoreTarget(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function purge() {
    if (!purgeTarget) return;
    const token = getAccessToken();
    setBusyId(purgeTarget.id);
    try {
      await apiFetch(`/admin/users/${purgeTarget.id}/permanent`, { method: "DELETE", accessToken: token ?? undefined });
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== purgeTarget.id) : prev));
      setPurgeTarget(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = (users ?? []).length > 0 && (users ?? []).every((u) => selected.has(u.id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set((users ?? []).map((u) => u.id)));
  }

  async function bulkRestore() {
    if (selected.size === 0 || bulkBusy) return;
    const token = getAccessToken();
    setBulkBusy(true);
    try {
      await apiFetch("/admin/users/bulk-restore", {
        method: "PATCH",
        accessToken: token ?? undefined,
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setBulkRestoreOpen(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkPurge() {
    if (selected.size === 0 || bulkBusy) return;
    const token = getAccessToken();
    setBulkBusy(true);
    try {
      await apiFetch("/admin/users/bulk-permanent", {
        method: "DELETE",
        accessToken: token ?? undefined,
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setBulkPurgeOpen(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBulkBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, business, phone, or email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-72"
        />
        <DateFilters from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {users && users.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5 text-gray-600">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300" />
            Select all
          </label>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5">
              <span className="font-medium text-orange-800">{selected.size} selected</span>
              <button
                onClick={() => setBulkRestoreOpen(true)}
                disabled={bulkBusy}
                className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                Restore
              </button>
              <button
                onClick={() => setBulkPurgeOpen(true)}
                disabled={bulkBusy}
                className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Delete permanently
              </button>
            </div>
          )}
        </div>
      )}

      {users === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No deleted users.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggleOne(u.id)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-sm text-orange-600">{u.businessName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      📞 {u.phone} {u.email ? `· ✉️ ${u.email}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Deleted {formatDate(u.deletedAt)}</p>
                    {u.deletedByName && <p>by {u.deletedByName}</p>}
                  </div>
                </div>
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-500">Reason: </span>
                  {u.deletedReason || "—"}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setRestoreTarget(u)}
                    disabled={busyId === u.id}
                    className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setPurgeTarget(u)}
                    disabled={busyId === u.id}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            Page {page} of {totalPages} · {total} deleted users
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

      {restoreTarget && (
        <ConfirmModal
          title={`Restore ${restoreTarget.name}?`}
          description="Their account and any posts hidden along with it will become active again."
          confirmLabel="Restore"
          danger={false}
          busy={busyId === restoreTarget.id}
          onCancel={() => setRestoreTarget(null)}
          onConfirm={restore}
        />
      )}

      {purgeTarget && (
        <ConfirmModal
          title={`Permanently delete ${purgeTarget.name}?`}
          description="This cannot be undone. Their account, store, and all posts will be erased for good."
          confirmLabel="Delete permanently"
          busy={busyId === purgeTarget.id}
          onCancel={() => setPurgeTarget(null)}
          onConfirm={purge}
        />
      )}

      {bulkRestoreOpen && (
        <ConfirmModal
          title={`Restore ${selected.size} user${selected.size > 1 ? "s" : ""}?`}
          description="Their accounts and any posts hidden along with them will become active again."
          confirmLabel="Restore"
          danger={false}
          busy={bulkBusy}
          onCancel={() => setBulkRestoreOpen(false)}
          onConfirm={bulkRestore}
        />
      )}

      {bulkPurgeOpen && (
        <ConfirmModal
          title={`Permanently delete ${selected.size} user${selected.size > 1 ? "s" : ""}?`}
          description="This cannot be undone. Their accounts, stores, and all posts will be erased for good."
          confirmLabel="Delete permanently"
          busy={bulkBusy}
          onCancel={() => setBulkPurgeOpen(false)}
          onConfirm={bulkPurge}
        />
      )}
    </>
  );
}

function SelfDeletedUsersTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<SelfDeletedUserDTO[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<SelfDeletedUserDTO | null>(null);

  useEffect(() => setPage(1), [debouncedSearch, from, to]);

  function reload() {
    const token = getAccessToken();
    setUsers(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiFetch<{ users: SelfDeletedUserDTO[]; total: number }>(`/admin/self-deleted-users?${params}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => {
        setUsers(body.users);
        setTotal(body.total);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }

  useEffect(reload, [page, debouncedSearch, from, to]);

  async function purge(reason?: string) {
    if (!purgeTarget || !reason) return;
    const token = getAccessToken();
    setBusyId(purgeTarget.id);
    try {
      await apiFetch(`/admin/self-deleted-users/${purgeTarget.id}/permanent`, {
        method: "DELETE",
        accessToken: token ?? undefined,
        body: JSON.stringify({ reason }),
      });
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== purgeTarget.id) : prev));
      setPurgeTarget(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <p className="mb-4 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
        These users deleted their own accounts. Each is kept for 60 days from the date shown (auto-restored if they
        log back in during that window) before being purged automatically. An admin can purge one early below —
        that action is irreversible and requires a reason.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, business, phone, or email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-72"
        />
        <DateFilters from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {users === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No self-deleted accounts pending.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <p className="text-sm text-orange-600">{u.businessName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      📞 {u.phone} {u.email ? `· ✉️ ${u.email}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Requested {formatDate(u.deletionRequestedAt)}</p>
                    <p>Auto-purges {formatDate(u.purgeAt)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => setPurgeTarget(u)}
                    disabled={busyId === u.id}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            Page {page} of {totalPages} · {total} self-deleted accounts
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

      {purgeTarget && (
        <ConfirmModal
          title={`Permanently delete ${purgeTarget.name}?`}
          description="This cannot be undone. Their account, store, and all posts will be erased for good, ahead of the automatic 60-day purge."
          confirmLabel="Delete permanently"
          requireReason
          busy={busyId === purgeTarget.id}
          onCancel={() => setPurgeTarget(null)}
          onConfirm={purge}
        />
      )}
    </>
  );
}

function DeletedAccountLogTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<DeletedAccountLogDTO[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [debouncedSearch, from, to]);

  function reload() {
    const token = getAccessToken();
    setEntries(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiFetch<{ entries: DeletedAccountLogDTO[]; total: number }>(`/admin/deleted-account-log?${params}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => {
        setEntries(body.entries);
        setTotal(body.total);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }

  useEffect(reload, [page, debouncedSearch, from, to]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Permanent record of every account that has actually been purged from the database — whether by the
        automatic 60-day sweep, an admin's direct permanent delete, or an admin force-purging a self-deletion
        early. Nothing here can be restored.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, business, phone, or email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-72"
        />
        <DateFilters from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {entries === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No permanently deleted accounts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.id} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{e.name}</p>
                    {e.businessName && <p className="text-sm text-orange-600">{e.businessName}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                      📞 {e.phone} {e.email ? `· ✉️ ${e.email}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Purged {formatDate(e.deletedAt)}</p>
                    {e.deletedByName && <p>by {e.deletedByName}</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {SOURCE_LABEL[e.source]}
                  </span>
                  {e.reason && (
                    <p className="rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                      <span className="font-medium text-gray-500">Reason: </span>
                      {e.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
  );
}

function DeletedPostsTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<DeletedPostDTO[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<DeletedPostDTO | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<DeletedPostDTO | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [bulkPurgeOpen, setBulkPurgeOpen] = useState(false);

  useEffect(() => setPage(1), [debouncedSearch, from, to]);

  function reload() {
    const token = getAccessToken();
    setPosts(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiFetch<{ posts: DeletedPostDTO[]; total: number }>(`/admin/deleted-posts?${params}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => {
        setPosts(body.posts);
        setTotal(body.total);
        setSelected(new Set());
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }

  useEffect(reload, [page, debouncedSearch, from, to]);

  async function restore() {
    if (!restoreTarget) return;
    const token = getAccessToken();
    setBusyId(restoreTarget.id);
    try {
      await apiFetch(`/admin/posts/${restoreTarget.id}/restore`, { method: "PATCH", accessToken: token ?? undefined });
      setPosts((prev) => (prev ? prev.filter((p) => p.id !== restoreTarget.id) : prev));
      setRestoreTarget(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function purge() {
    if (!purgeTarget) return;
    const token = getAccessToken();
    setBusyId(purgeTarget.id);
    try {
      await apiFetch(`/admin/posts/${purgeTarget.id}/permanent`, { method: "DELETE", accessToken: token ?? undefined });
      setPosts((prev) => (prev ? prev.filter((p) => p.id !== purgeTarget.id) : prev));
      setPurgeTarget(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = (posts ?? []).length > 0 && (posts ?? []).every((p) => selected.has(p.id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set((posts ?? []).map((p) => p.id)));
  }

  async function bulkRestore() {
    if (selected.size === 0 || bulkBusy) return;
    const token = getAccessToken();
    setBulkBusy(true);
    try {
      await apiFetch("/admin/posts/bulk-restore", {
        method: "PATCH",
        accessToken: token ?? undefined,
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setBulkRestoreOpen(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkPurge() {
    if (selected.size === 0 || bulkBusy) return;
    const token = getAccessToken();
    setBulkBusy(true);
    try {
      await apiFetch("/admin/posts/bulk-permanent", {
        method: "DELETE",
        accessToken: token ?? undefined,
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setBulkPurgeOpen(false);
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBulkBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by owner's email or phone"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-72"
        />
        <DateFilters from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {posts && posts.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5 text-gray-600">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300" />
            Select all
          </label>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5">
              <span className="font-medium text-orange-800">{selected.size} selected</span>
              <button
                onClick={() => setBulkRestoreOpen(true)}
                disabled={bulkBusy}
                className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                Restore
              </button>
              <button
                onClick={() => setBulkPurgeOpen(true)}
                disabled={bulkBusy}
                className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                Delete permanently
              </button>
            </div>
          )}
        </div>
      )}

      {posts === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No deleted posts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggleOne(p.id)}
                className="h-4 w-4 shrink-0 self-start rounded border-gray-300 sm:mt-1"
              />
              <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-36">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgSrc(p.images[0])} alt={p.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      Owner: {p.ownerName || "Unknown"} ({p.ownerBusinessName || "—"}) · 📞 {p.ownerPhone || "—"}
                      {p.ownerEmail ? ` · ✉️ ${p.ownerEmail}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Deleted {formatDate(p.deletedAt)}</p>
                    {p.deletedByName && <p>by {p.deletedByName}</p>}
                  </div>
                </div>
                <p className="mt-2 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-700">
                  <span className="font-medium text-gray-500">Reason: </span>
                  {p.deletedReason || "—"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setRestoreTarget(p)}
                    disabled={busyId === p.id}
                    className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setPurgeTarget(p)}
                    disabled={busyId === p.id}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            Page {page} of {totalPages} · {total} deleted posts
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

      {restoreTarget && (
        <ConfirmModal
          title={`Restore "${restoreTarget.title}"?`}
          description="This post will become active and visible again (unless its owner's account is still deleted)."
          confirmLabel="Restore"
          danger={false}
          busy={busyId === restoreTarget.id}
          onCancel={() => setRestoreTarget(null)}
          onConfirm={restore}
        />
      )}

      {purgeTarget && (
        <ConfirmModal
          title={`Permanently delete "${purgeTarget.title}"?`}
          description="This cannot be undone."
          confirmLabel="Delete permanently"
          busy={busyId === purgeTarget.id}
          onCancel={() => setPurgeTarget(null)}
          onConfirm={purge}
        />
      )}

      {bulkRestoreOpen && (
        <ConfirmModal
          title={`Restore ${selected.size} post${selected.size > 1 ? "s" : ""}?`}
          description="These will become active and visible again (unless their owner's account is still deleted)."
          confirmLabel="Restore"
          danger={false}
          busy={bulkBusy}
          onCancel={() => setBulkRestoreOpen(false)}
          onConfirm={bulkRestore}
        />
      )}

      {bulkPurgeOpen && (
        <ConfirmModal
          title={`Permanently delete ${selected.size} post${selected.size > 1 ? "s" : ""}?`}
          description="This cannot be undone."
          confirmLabel="Delete permanently"
          busy={bulkBusy}
          onCancel={() => setBulkPurgeOpen(false)}
          onConfirm={bulkPurge}
        />
      )}
    </>
  );
}

export default function DeletedItemsPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Deleted Items</h1>
        <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm">
          <button
            onClick={() => setTab("users")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              tab === "users" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Deleted by admin
          </button>
          <button
            onClick={() => setTab("self-deleted")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              tab === "self-deleted" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Self-deleted
          </button>
          <button
            onClick={() => setTab("posts")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              tab === "posts" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setTab("log")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              tab === "log" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Deletion log
          </button>
        </div>
      </div>

      {tab === "users" && <DeletedUsersTab />}
      {tab === "self-deleted" && <SelfDeletedUsersTab />}
      {tab === "posts" && <DeletedPostsTab />}
      {tab === "log" && <DeletedAccountLogTab />}
    </div>
  );
}
