"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ListingDTO, PublicUserProfileDTO } from "@festora/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { ListingCard } from "@/components/ListingCard";
import { OwnListingCard } from "@/components/OwnListingCard";

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"
      />
    </svg>
  );
}

export function SocialProfile({
  profile: initialProfile,
  listings,
}: {
  profile: PublicUserProfileDTO;
  listings: ListingDTO[];
}) {
  const router = useRouter();
  const t = useTranslations("socialProfile");
  const locale = useLocale();
  const SAFETY_TIPS = [t("safetyTip1"), t("safetyTip2"), t("safetyTip3"), t("safetyTip4"), t("safetyTip5")];
  const [profile, setProfile] = useState(initialProfile);
  const [ownListings, setOwnListings] = useState(listings);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const initials = profile.name.trim().charAt(0).toUpperCase() || "U";

  function requireLogin() {
    if (!getUser()) {
      router.push("/login");
      return false;
    }
    return true;
  }

  async function toggleFollow() {
    if (!requireLogin()) return;
    setBusy(true);
    setError(null);
    try {
      const token = getAccessToken() ?? undefined;
      if (profile.isFollowing) {
        await apiFetch(`/social/follow/${profile.id}`, { method: "DELETE", accessToken: token });
        setProfile((p) => ({ ...p, isFollowing: false, followersCount: Math.max(0, p.followersCount - 1) }));
      } else {
        await apiFetch(`/social/follow/${profile.id}`, { method: "POST", accessToken: token });
        setProfile((p) => ({ ...p, isFollowing: true, followersCount: p.followersCount + 1 }));
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function handleBlock() {
    if (!requireLogin()) return;
    if (!window.confirm(t("blockConfirm", { name: profile.name }))) return;
    setBusy(true);
    try {
      const token = getAccessToken() ?? undefined;
      await apiFetch(`/social/block/${profile.id}`, { method: "POST", accessToken: token });
      setProfile((p) => ({ ...p, isBlocked: true, isFollowing: false }));
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function handleUnblock() {
    setBusy(true);
    try {
      const token = getAccessToken() ?? undefined;
      await apiFetch(`/social/block/${profile.id}`, { method: "DELETE", accessToken: token });
      setProfile((p) => ({ ...p, isBlocked: false }));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (!requireLogin()) return;
    if (reportReason.trim().length < 3) {
      setError(t("reportReasonTooShort"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = getAccessToken() ?? undefined;
      await apiFetch(`/social/report/${profile.id}`, {
        method: "POST",
        accessToken: token,
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      setReportOpen(false);
      setReportReason("");
      window.alert(t("reportThanks"));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title: profile.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      window.alert(t("linkCopied"));
    }
    setMenuOpen(false);
  }

  function openMessage() {
    if (!requireLogin()) return;
    setMsgOpen(true);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-12 sm:px-6 sm:pb-16">
      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-100 text-2xl font-semibold text-orange-700">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="truncate text-xl font-bold text-gray-900">{profile.name}</h1>
            {!profile.isSelf && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={t("moreOptions")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                >
                  <DotsIcon className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                    <button
                      onClick={handleShare}
                      className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t("shareProfile")}
                    </button>
                    <button
                      onClick={() => {
                        setReportOpen(true);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t("reportUser")}
                    </button>
                    {profile.isBlocked ? (
                      <button
                        onClick={handleUnblock}
                        className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {t("unblockUser")}
                      </button>
                    ) : (
                      <button onClick={handleBlock} className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                        {t("blockUser")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {t("memberSince", {
              date: new Date(profile.createdAt).toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {
                month: "long",
                year: "numeric",
              }),
            })}
          </p>

          <div className="mt-3 flex items-center gap-5 text-sm">
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{profile.postsCount}</span> {t("posts")}
            </span>
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{profile.followersCount}</span> {t("followers")}
            </span>
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{profile.followingCount}</span> {t("following")}
            </span>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex gap-3">
        {profile.isSelf ? (
          <Link
            href="/account/edit"
            className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-700 sm:flex-none sm:px-8"
          >
            {t("editProfile")}
          </Link>
        ) : profile.isBlocked ? (
          <p className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-600">{t("blockedNotice")}</p>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={toggleFollow}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold sm:flex-none sm:px-8 ${
                profile.isFollowing
                  ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {profile.isFollowing ? t("unfollow") : t("follow")}
            </button>
            <button
              type="button"
              onClick={openMessage}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:flex-none sm:px-8"
            >
              <MessageIcon className="h-4 w-4" />
              {t("message")}
            </button>
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-bold text-gray-900">
          {profile.isSelf ? t("yourListings") : t("usersListings", { name: profile.name })}
        </h2>
        {ownListings.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">{t("noListings")}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ownListings.map((listing) =>
              profile.isSelf ? (
                <OwnListingCard
                  key={listing.id}
                  listing={listing}
                  onDeleted={(id) => setOwnListings((prev) => prev.filter((l) => l.id !== id))}
                  onToggled={(updated) =>
                    setOwnListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
                  }
                />
              ) : (
                <ListingCard key={listing.id} listing={listing} />
              )
            )}
          </div>
        )}
      </div>

      {msgOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setMsgOpen(false)}
        >
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900">{t("safetyTitle")}</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
              {SAFETY_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setMsgOpen(false);
                router.push("/chats");
              }}
              className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              {t("continueToChat")}
            </button>
            <button
              type="button"
              onClick={() => setMsgOpen(false)}
              className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {reportOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setReportOpen(false)}
        >
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900">{t("reportTitle", { name: profile.name })}</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder={t("reportPlaceholder")}
              rows={4}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button
              type="button"
              disabled={busy}
              onClick={submitReport}
              className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {t("submitReport")}
            </button>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
