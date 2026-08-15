"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AUTH_CHANGED_EVENT, getAccessToken, getUser } from "@/lib/auth-client";

const POLL_MS = 20000;

// Broadcast whenever notifications are marked read so any other mounted instance of the
// hook (e.g. the bell badge) can refresh immediately instead of waiting for the next poll.
export const NOTIFICATIONS_READ_EVENT = "eventsaman:notifications-read";

export function useUnreadNotifCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const token = getAccessToken();
      if (!getUser() || !token) {
        if (!cancelled) setCount(0);
        return;
      }
      try {
        const { count } = await apiFetch<{ count: number }>("/notifications/unread-count", {
          accessToken: token,
        });
        if (!cancelled) setCount(count);
      } catch {
        // Silently ignore — this is a background badge, not a critical fetch.
      }
    }

    refresh();
    const interval = setInterval(refresh, POLL_MS);
    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(NOTIFICATIONS_READ_EVENT, refresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, refresh);
    };
  }, []);

  return count;
}
