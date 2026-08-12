"use client";

import { useEffect, useState } from "react";
import type { ConversationDTO } from "@eventsaman/types";
import { apiFetch } from "@/lib/api";
import { AUTH_CHANGED_EVENT, getAccessToken, getUser } from "@/lib/auth-client";

const POLL_MS = 20000;

// Number of conversations with at least one unread message — i.e. how many different people
// have messages waiting, not the total message count (matches the badge on the chats list).
export function useUnreadChatCount(): number {
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
        const { conversations } = await apiFetch<{ conversations: ConversationDTO[] }>("/chats", {
          accessToken: token,
        });
        if (!cancelled) setCount(conversations.filter((c) => c.unreadCount > 0).length);
      } catch {
        // Silently ignore — this is a background badge, not a critical fetch.
      }
    }

    refresh();
    const interval = setInterval(refresh, POLL_MS);
    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return count;
}
