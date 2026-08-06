"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { BackHeader } from "@/components/BackHeader";

interface UserSummary {
  id: string;
  name: string;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );
}

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="8" r="3.2" />
      <path strokeLinecap="round" d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

const AVATAR_GRADIENTS = [
  "from-orange-400 to-rose-400",
  "from-sky-400 to-indigo-400",
  "from-emerald-400 to-teal-400",
  "from-fuchsia-400 to-purple-400",
  "from-amber-400 to-orange-500",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[Math.abs(hash)];
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-200" />
      <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

// Shared by /account/followers and /account/following — this list is always the signed-in
// user's own, fetched with their own id, so there's no way to view anyone else's.
export function UserListPage({ kind, title }: { kind: "followers" | "following"; title: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    const token = getAccessToken() ?? undefined;
    if (!currentUser) {
      router.push("/login");
      return;
    }

    apiFetch<{ users: UserSummary[] }>(`/social/${kind}/${currentUser.id}`, { accessToken: token })
      .then((body) => setUsers(body.users))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [kind, router]);

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, query]);

  async function handleAction(u: UserSummary) {
    const token = getAccessToken() ?? undefined;
    if (!token) return;

    const confirmed = window.confirm(
      kind === "following" ? `Unfollow ${u.name}?` : `Remove ${u.name} from your followers?`
    );
    if (!confirmed) return;

    setBusyId(u.id);
    setError("");
    try {
      const path = kind === "following" ? `/social/follow/${u.id}` : `/social/followers/${u.id}`;
      await apiFetch(path, { method: "DELETE", accessToken: token });
      setUsers((prev) => prev && prev.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-12 sm:px-6">
      <BackHeader title={title} />

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {users !== null && (
            <>
              <span className="font-semibold text-gray-900">{users.length}</span>{" "}
              {kind === "followers" ? (users.length === 1 ? "follower" : "followers") : "following"}
            </>
          )}
        </p>
      </div>

      {users !== null && users.length > 0 && (
        <div className="relative mb-3">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      )}

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {users === null && !error ? (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-3 shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : users && users.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <EmptyIcon className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {kind === "followers" ? "No followers yet" : "Not following anyone yet"}
          </p>
          <p className="max-w-xs text-xs text-gray-500">
            {kind === "followers"
              ? "When people follow you, they'll show up here."
              : "Follow sellers you like to see them here."}
          </p>
        </div>
      ) : filtered && filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">No matches for "{query}"</p>
      ) : (
        filtered && (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-3 shadow-sm">
            {filtered.map((u) => {
              const initial = u.name.trim().charAt(0).toUpperCase() || "U";
              const busy = busyId === u.id;
              return (
                <li key={u.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/u/${u.id}`} className="group flex min-w-0 flex-1 items-center gap-3 py-0.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white shadow-sm ${gradientFor(
                        u.name
                      )}`}
                    >
                      {initial}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{u.name}</span>
                    <ChevronIcon className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAction(u)}
                    className="shrink-0 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {busy ? "..." : kind === "following" ? "Unfollow" : "Remove"}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}
    </main>
  );
}
