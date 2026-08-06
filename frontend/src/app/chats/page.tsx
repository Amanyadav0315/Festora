"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ConversationDTO } from "@festora/types";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { BackHeader } from "@/components/BackHeader";

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

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const router = useRouter();
  const t = useTranslations("navbar");
  const [conversations, setConversations] = useState<ConversationDTO[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    const token = getAccessToken();
    if (!user || !token) {
      router.push("/login");
      return;
    }

    apiFetch<{ conversations: ConversationDTO[] }>("/chats", { accessToken: token })
      .then((body) => setConversations(body.conversations))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [router]);

  return (
    <main className="mx-auto max-w-lg px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("chats")} backHref="/" />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {conversations === null && !error ? (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-3 shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : conversations && conversations.length === 0 ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No conversations yet — message a seller from their profile to start one.
          </p>
        </div>
      ) : (
        conversations && (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-3 shadow-sm">
            {conversations.map((c) => {
              const initial = c.otherUser.name.trim().charAt(0).toUpperCase() || "U";
              return (
                <li key={c.id}>
                  <Link href={`/chats/${c.id}`} className="flex items-center gap-3 py-3 hover:bg-gray-50">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-base font-semibold text-white shadow-sm ${gradientFor(
                        c.otherUser.name
                      )}`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{c.otherUser.name}</p>
                        <span className="shrink-0 text-xs text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-gray-500">{c.lastMessageText || "Say hello 👋"}</p>
                        {c.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[11px] font-semibold text-white">
                            {c.unreadCount > 9 ? "9+" : c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      )}
    </main>
  );
}
