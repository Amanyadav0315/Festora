"use client";

import { useEffect, useState } from "react";
import type { AdminUserListItemDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";

// Debounces the search box so every keystroke doesn't fire a request.
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function NotifyPage() {
  const [target, setTarget] = useState<"all" | "one">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [results, setResults] = useState<AdminUserListItemDTO[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItemDTO | null>(null);
  const [message, setMessage] = useState("");
  const [listingId, setListingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (target !== "one" || selectedUser || !debouncedSearch.trim()) {
      setResults([]);
      return;
    }
    const token = getAccessToken();
    apiFetch<{ users: AdminUserListItemDTO[] }>(
      `/admin/users?${new URLSearchParams({ search: debouncedSearch.trim(), limit: "8" })}`,
      { accessToken: token ?? undefined }
    )
      .then((body) => setResults(body.users))
      .catch(() => setResults([]));
  }, [debouncedSearch, target, selectedUser]);

  async function send() {
    setError(null);
    setSuccess(null);
    if (message.trim().length < 3) {
      setError("Please write a message (min 3 characters).");
      return;
    }
    if (target === "one" && !selectedUser) {
      setError("Please select a user first.");
      return;
    }
    setBusy(true);
    try {
      const body = await apiFetch<{ sent: number }>("/admin/notifications/send", {
        method: "POST",
        accessToken: getAccessToken() ?? undefined,
        body: JSON.stringify({
          message: message.trim(),
          listingId: listingId.trim() || undefined,
          ...(target === "one" && selectedUser ? { userId: selectedUser.id } : {}),
        }),
      });
      setSuccess(
        target === "one" ? "Notification sent to the user." : `Notification sent to ${body.sent} users.`
      );
      setMessage("");
      setListingId("");
      setSelectedUser(null);
      setSearch("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900">Send notification</h1>
      <p className="mt-1 text-sm text-gray-500">
        Send a message to one user, or broadcast it to everyone on the platform. It appears in their
        in-app notification list and counts toward their unread badge.
      </p>

      <div className="mt-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTarget("all");
              setSelectedUser(null);
            }}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              target === "all"
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All users
          </button>
          <button
            type="button"
            onClick={() => setTarget("one")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              target === "one"
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Specific user
          </button>
        </div>

        {target === "one" && (
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-500">Search by name, phone or email</label>
            {selectedUser ? (
              <div className="mt-1.5 flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm">
                <span>
                  <span className="font-semibold text-gray-900">{selectedUser.name}</span>{" "}
                  <span className="text-gray-500">· {selectedUser.phone}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to search..."
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                {debouncedSearch.trim() && (
                  <div className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                    {results.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-400">No matching users</p>
                    ) : (
                      results.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{u.name}</span>
                          <span className="text-xs text-gray-500">{u.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Write the notification message..."
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{message.length}/500</p>
        </div>

        <div className="mt-2">
          <label className="text-xs font-medium text-gray-500">Link to listing (optional)</label>
          <input
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="Listing ID"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-emerald-600">{success}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={send}
          className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {busy ? "Sending..." : "Send notification"}
        </button>
      </div>
    </div>
  );
}
