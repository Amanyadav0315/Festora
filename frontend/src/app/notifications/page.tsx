"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { NotificationDTO } from "@eventsaman/types";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { NOTIFICATIONS_READ_EVENT } from "@/lib/useUnreadNotifCount";
import { BackHeader } from "@/components/BackHeader";

function timeAgo(iso: string, t: ReturnType<typeof useTranslations>): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("daysAgo", { count: days });
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function NotifIcon({ type }: { type: NotificationDTO["type"] }) {
  const common = "h-5 w-5";
  switch (type) {
    case "price_drop":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-5-5m5 5l5-5" />
        </svg>
      );
    case "listing_available":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "new_review":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="M12 2l2.9 6.26L21.5 9l-4.8 4.4L17.8 21 12 17.5 6.2 21l1.1-7.6L2.5 9l6.6-.74L12 2z" />
        </svg>
      );
    case "verified_badge":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "admin_message":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5L6 9H3v6h3l5 4V5zM16.5 8.5a5 5 0 010 7"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>
      );
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<NotificationDTO[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!getUser() || !token) {
      router.push("/login");
      return;
    }

    apiFetch<{ notifications: NotificationDTO[] }>("/notifications", { accessToken: token })
      .then((body) => setNotifications(body.notifications))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : t("error")));
  }, [router, t]);

  async function markAllRead() {
    const token = getAccessToken();
    if (!token) return;
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH", accessToken: token });
      setNotifications((prev) => prev && prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
    } catch {
      // Non-critical — ignore.
    }
  }

  async function markRead(n: NotificationDTO) {
    if (n.read) return;
    const token = getAccessToken();
    if (!token) return;
    setNotifications((prev) => prev && prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
    try {
      await apiFetch(`/notifications/${n.id}/read`, { method: "PATCH", accessToken: token });
    } catch {
      // Non-critical — ignore.
    }
  }

  const hasUnread = notifications?.some((n) => !n.read) ?? false;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 sm:pb-16">
      <BackHeader title={t("title")} />

      {hasUnread && (
        <div className="mt-3 flex justify-end">
          <button onClick={markAllRead} className="text-sm font-medium text-orange-600 hover:text-orange-700">
            {t("markAllRead")}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {notifications === null && !error ? (
        <p className="mt-6 text-sm text-gray-500">{t("loading")}</p>
      ) : notifications && notifications.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">{t("empty")}</p>
        </div>
      ) : (
        notifications && (
          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm">
            {notifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      n.read ? "bg-gray-100 text-gray-500" : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    <NotifIcon type={n.type} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.read ? "text-gray-600" : "font-medium text-gray-900"}`}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt, t)}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-600" />}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.listingId ? (
                    <Link href={`/listings/${n.listingId}`} onClick={() => markRead(n)} className="block hover:bg-gray-50">
                      {inner}
                    </Link>
                  ) : (
                    <button onClick={() => markRead(n)} className="block w-full text-left hover:bg-gray-50">
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )
      )}
    </main>
  );
}
