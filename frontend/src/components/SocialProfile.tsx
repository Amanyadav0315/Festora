"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ListingDTO, PublicUserProfileDTO, ReviewDTO, UserDTO } from "@eventsaman/types";
import { apiFetch, apiUpload, ApiRequestError } from "@/lib/api";
import { getAccessToken, getUser, saveUser } from "@/lib/auth-client";
import { getOrCreateConversation } from "@/lib/chat-client";
import { ListingCard } from "@/components/ListingCard";
import { OwnListingCard } from "@/components/OwnListingCard";
import { UserAvatar } from "@/components/UserAvatar";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8h2.5l1.3-2h8.4l1.3 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"
      />
      <circle cx="12" cy="13.5" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
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

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-label="Verified seller">
      <path d="M12 2l2.4 1.9 3-.5 1 2.9 2.7 1.5-1 2.9 1 2.9-2.7 1.5-1 2.9-3-.5L12 22l-2.4-1.9-3 .5-1-2.9-2.7-1.5 1-2.9-1-2.9 2.7-1.5 1-2.9 3 .5L12 2z" />
      <path d="M9 12.5l2 2 4-4.5" stroke="white" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"
      />
    </svg>
  );
}

function StarRating({
  value,
  size = "sm",
  interactive,
  onChange,
}: {
  value: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  const cls = size === "md" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star`}
        >
          <StarIcon className={cls} filled={n <= Math.round(value)} />
        </button>
      ))}
    </div>
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
  const searchParams = useSearchParams();
  const t = useTranslations("socialProfile");
  const locale = useLocale();
  const SAFETY_TIPS = [t("safetyTip1"), t("safetyTip2"), t("safetyTip3"), t("safetyTip4"), t("safetyTip5")];
  const [profile, setProfile] = useState(initialProfile);
  const [ownListings, setOwnListings] = useState(listings);
  // Tracks which single listing card's "more options" menu is open, so opening one always closes
  // any other that was left open — cards no longer manage this independently.
  const [openMenuListingId, setOpenMenuListingId] = useState<string | null>(null);

  useEffect(() => {
    setOwnListings(listings);
  }, [listings]);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [draftRating, setDraftRating] = useState(profile.myRating ?? 5);
  const [draftComment, setDraftComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    apiFetch<{ reviews: ReviewDTO[] }>(`/reviews/${profile.id}`)
      .then((body) => setReviews(body.reviews))
      .catch(() => {})
      .finally(() => setReviewsLoaded(true));
  }, [profile.id]);

  async function submitReview() {
    if (!requireLogin()) return;
    setReviewBusy(true);
    setError(null);
    try {
      const token = getAccessToken() ?? undefined;
      const { review } = await apiFetch<{ review: ReviewDTO }>(`/reviews/${profile.id}`, {
        method: "PUT",
        accessToken: token,
        body: JSON.stringify({ rating: draftRating, comment: draftComment.trim() }),
      });
      setReviews((prev) => {
        const others = prev.filter((r) => r.reviewerId !== review.reviewerId);
        return [review, ...others];
      });
      const nonSelf = reviews.filter((r) => r.reviewerId !== review.reviewerId);
      const avg = [review, ...nonSelf].reduce((s, r) => s + r.rating, 0) / (nonSelf.length + 1);
      setProfile((p) => ({
        ...p,
        myRating: review.rating,
        ratingAvg: Math.round(avg * 10) / 10,
        ratingCount: nonSelf.length + 1,
      }));
      setRateOpen(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setReviewBusy(false);
    }
  }

  const [avatarPreview, setAvatarPreview] = useState<{ file: File; url: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Lets the "Upload/Change photo" row in the Edit Profile menu (/account/edit) deep-link
  // straight into the file picker instead of duplicating the upload trigger on this page.
  useEffect(() => {
    if (profile.isSelf && searchParams.get("openAvatarUpload") === "1") {
      avatarInputRef.current?.click();
      router.replace("/account");
    }
  }, [profile.isSelf, searchParams, router]);

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(false);
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Please choose a JPEG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image is too large — please choose one under 5 MB.");
      return;
    }
    setAvatarPreview({ file, url: URL.createObjectURL(file) });
  }

  function cancelAvatarPreview() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview.url);
    setAvatarPreview(null);
  }

  async function saveAvatar() {
    if (!avatarPreview) return;
    const token = getAccessToken();
    if (!token) return;

    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarPreview.file);
      const { user } = await apiUpload<{ user: UserDTO }>("/users/me/avatar", formData, {
        method: "PATCH",
        accessToken: token,
      });
      setProfile((p) => ({ ...p, avatarUrl: user.avatarUrl }));
      saveUser(user); // syncs localStorage + fires AUTH_CHANGED_EVENT so navbar/bottom nav update too
      setAvatarSuccess(true);
      cancelAvatarPreview();
    } catch (err) {
      setAvatarError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setAvatarUploading(false);
    }
  }

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
        <div className="shrink-0">
          {profile.isSelf ? (
            <>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label={profile.avatarUrl ? "Change profile photo" : "Upload profile photo"}
                className="group relative block rounded-full"
              >
                <UserAvatar name={profile.name} avatarUrl={profile.avatarUrl} size="lg" />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <CameraIcon className="h-6 w-6 text-white" />
                </span>
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-orange-600 text-white shadow-sm">
                  <CameraIcon className="h-3.5 w-3.5" />
                </span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept={ACCEPTED_AVATAR_TYPES.join(",")}
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </>
          ) : (
            <UserAvatar name={profile.name} avatarUrl={profile.avatarUrl} size="lg" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 truncate text-xl font-bold text-gray-900">
                {profile.name}
                {profile.isVerified && <VerifiedBadge className="h-4 w-4 shrink-0 text-sky-500" />}
              </h1>
              {profile.businessName && profile.businessName !== profile.name && (
                <p className="truncate text-sm font-medium text-orange-600">{profile.businessName}</p>
              )}
              {profile.ratingCount > 0 && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <StarRating value={profile.ratingAvg} />
                  <span className="text-xs text-gray-500">
                    {profile.ratingAvg.toFixed(1)} ({profile.ratingCount})
                  </span>
                </div>
              )}
            </div>
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

          {profile.phone && (
            <p className="mt-1 text-sm text-gray-600">
              <span className="text-gray-400">{t("phoneLabel")}: </span>
              {profile.phone}
            </p>
          )}

          {profile.about && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{profile.about}</p>}

          {profile.store && profile.store.unavailableDates.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Unavailable on: {profile.store.unavailableDates
                .filter((d) => d >= new Date().toISOString().slice(0, 10))
                .slice(0, 6)
                .map((d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }))
                .join(", ") || "—"}
              {" "}
              <span className="text-gray-400">(coordinate directly with the seller to confirm)</span>
            </p>
          )}

          <div className="mt-3 flex items-center gap-5 text-sm">
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{profile.postsCount}</span> {t("posts")}
            </span>
            {profile.isSelf ? (
              <>
                <Link href="/account/followers" className="text-gray-700 hover:underline">
                  <span className="font-semibold text-gray-900">{profile.followersCount}</span> {t("followers")}
                </Link>
                <Link href="/account/following" className="text-gray-700 hover:underline">
                  <span className="font-semibold text-gray-900">{profile.followingCount}</span> {t("following")}
                </Link>
              </>
            ) : (
              <>
                {/* Followers/following lists are private to the account owner — other
                    visitors only see the counts, not who's in them. */}
                <span className="text-gray-700">
                  <span className="font-semibold text-gray-900">{profile.followersCount}</span> {t("followers")}
                </span>
                <span className="text-gray-700">
                  <span className="font-semibold text-gray-900">{profile.followingCount}</span> {t("following")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {avatarSuccess && <p className="mt-3 text-sm text-green-600">Profile photo updated.</p>}
      {avatarError && !avatarPreview && <p className="mt-3 text-sm text-red-600">{avatarError}</p>}

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

      {!profile.isSelf && !profile.isBlocked && (
        <button
          type="button"
          onClick={() => {
            if (!requireLogin()) return;
            setDraftRating(profile.myRating ?? 5);
            setRateOpen(true);
          }}
          className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          {profile.myRating ? "Edit your rating" : "Rate this seller"}
        </button>
      )}

      {reviewsLoaded && reviews.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <h2 className="text-base font-bold text-gray-900">Reviews ({reviews.length})</h2>
          <div className="mt-3 space-y-4">
            {reviews.slice(0, 8).map((r) => (
              <div key={r.id} className="flex gap-3">
                <UserAvatar name={r.reviewerName} avatarUrl={r.reviewerAvatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-gray-900">{r.reviewerName}</span>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-0.5 text-sm text-gray-600">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  menuOpen={openMenuListingId === listing.id}
                  onMenuOpenChange={(open) => setOpenMenuListingId(open ? listing.id : null)}
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
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 pt-[15vh]"
          onClick={() => setMsgOpen(false)}
        >
          <div
            className="flex max-h-[75vh] w-full max-w-sm flex-col rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <h3 className="text-base font-bold text-gray-900">{t("safetyTitle")}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
                {SAFETY_TIPS.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 p-5 pt-0">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const token = getAccessToken();
                  if (!token) return;
                  setBusy(true);
                  try {
                    const conversationId = await getOrCreateConversation(profile.id, token);
                    setMsgOpen(false);
                    router.push(`/chats/${conversationId}`);
                  } catch (err) {
                    setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
                  } finally {
                    setBusy(false);
                  }
                }}
                className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
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
        </div>
      )}

      {reportOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 pt-[15vh]"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="flex max-h-[75vh] w-full max-w-sm flex-col rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <h3 className="text-base font-bold text-gray-900">{t("reportTitle", { name: profile.name })}</h3>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder={t("reportPlaceholder")}
                rows={4}
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
            <div className="shrink-0 p-5 pt-0">
              <button
                type="button"
                disabled={busy}
                onClick={submitReport}
                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
        </div>
      )}

      {rateOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setRateOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900">Rate {profile.name}</h3>
            <div className="mt-3 flex justify-center">
              <StarRating value={draftRating} size="md" interactive onChange={setDraftRating} />
            </div>
            <textarea
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              maxLength={500}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button
              type="button"
              disabled={reviewBusy}
              onClick={submitReview}
              className="mt-3 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {reviewBusy ? "Saving..." : "Submit rating"}
            </button>
            <button
              type="button"
              onClick={() => setRateOpen(false)}
              className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {avatarPreview && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <h3 className="text-base font-semibold text-gray-900">Update profile photo</h3>
            <div className="mt-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarPreview.url}
                alt="Preview"
                className="h-32 w-32 rounded-full border-2 border-orange-500 object-cover"
              />
            </div>
            {avatarError && <p className="mt-3 text-center text-sm text-red-600">{avatarError}</p>}
            <button
              type="button"
              disabled={avatarUploading}
              onClick={saveAvatar}
              className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {avatarUploading ? "Saving..." : "Save photo"}
            </button>
            <button
              type="button"
              disabled={avatarUploading}
              onClick={cancelAvatarPreview}
              className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-60"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
