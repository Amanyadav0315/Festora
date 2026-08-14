"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminUserDetailDTO, ListingDTO } from "@eventsaman/types";
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

type RangeFilter = "24h" | "week" | "month" | "year" | "all";
const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "year", label: "Last year" },
  { value: "all", label: "All time" },
];

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUserDetailDTO | null>(null);
  const [listings, setListings] = useState<ListingDTO[] | null>(null);
  const [range, setRange] = useState<RangeFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deletePostTarget, setDeletePostTarget] = useState<ListingDTO | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    apiFetch<{ user: AdminUserDetailDTO }>(`/admin/users/${params.id}`, { accessToken: token ?? undefined })
      .then((body) => setUser(body.user))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [params.id]);

  useEffect(() => {
    const token = getAccessToken();
    setListings(null);
    apiFetch<{ listings: ListingDTO[] }>(`/admin/users/${params.id}/listings?range=${range}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => setListings(body.listings))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [params.id, range]);

  async function handleDeleteUser(reason?: string) {
    const token = getAccessToken();
    setBusy(true);
    try {
      await apiFetch(`/admin/users/${params.id}`, {
        method: "DELETE",
        accessToken: token ?? undefined,
        body: JSON.stringify({ reason }),
      });
      router.push("/users");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
      setDeleteUserOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePost(reason?: string) {
    if (!deletePostTarget) return;
    const token = getAccessToken();
    setBusy(true);
    try {
      await apiFetch(`/admin/posts/${deletePostTarget.id}`, {
        method: "DELETE",
        accessToken: token ?? undefined,
        body: JSON.stringify({ reason }),
      });
      setListings((prev) => (prev ? prev.filter((l) => l.id !== deletePostTarget.id) : prev));
      setDeletePostTarget(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (error && !user) {
    return (
      <div>
        <Link href="/users" className="text-sm font-medium text-orange-600 hover:text-orange-700">
          ← Back to users
        </Link>
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div>
      <Link href="/users" className="text-sm font-medium text-orange-600 hover:text-orange-700">
        ← Back to users
      </Link>

      <div className="mt-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgSrc(user.avatarUrl)} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {user.name}
                {user.role === "admin" && (
                  <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                    ADMIN
                  </span>
                )}
              </h1>
              <p className="text-sm text-orange-600">{user.businessName}</p>
              <p className="mt-0.5 text-xs text-gray-400">Joined {formatDate(user.createdAt)}</p>
            </div>
          </div>

          {user.role !== "admin" && (
            <button
              onClick={() => setDeleteUserOpen(true)}
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Delete user
            </button>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Phone</dt>
            <dd className="mt-0.5 text-sm text-gray-800">
              {user.phone}
              {user.showPhonePublicly && (
                <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Public
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Email</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{user.email || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">City</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{user.city || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Total posts</dt>
            <dd className="mt-0.5 text-sm text-gray-800">{user.postsCount}</dd>
          </div>
          {user.about && (
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">About</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">{user.about}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900">Posts</h2>
          <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  range === opt.value ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {listings === null ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
            <p className="text-sm text-gray-500">No posts in this time range.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <div key={l.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="aspect-[4/3] w-full bg-gray-100">
                  {l.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgSrc(l.images[0])} alt={l.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-gray-900">{l.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    ₹{l.price.toLocaleString("en-IN")}
                    {l.priceUnit ? ` / ${l.priceUnit}` : ""} · {l.purpose === "rent" ? "Rent" : "Sale"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDate(l.createdAt)}</p>
                  <button
                    onClick={() => setDeletePostTarget(l)}
                    className="mt-2 w-full rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteUserOpen && (
        <ConfirmModal
          title={`Delete ${user.name}'s account?`}
          description="The account and all their posts will be hidden immediately and moved to Deleted Items, where they can be restored or permanently removed."
          confirmLabel="Delete user"
          requireReason
          busy={busy}
          onCancel={() => setDeleteUserOpen(false)}
          onConfirm={handleDeleteUser}
        />
      )}

      {deletePostTarget && (
        <ConfirmModal
          title={`Delete "${deletePostTarget.title}"?`}
          description="This post will be hidden immediately and moved to Deleted Items, where it can be restored or permanently removed."
          confirmLabel="Delete post"
          requireReason
          busy={busy}
          onCancel={() => setDeletePostTarget(null)}
          onConfirm={handleDeletePost}
        />
      )}
    </div>
  );
}
