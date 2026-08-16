"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { getOrCreateConversation } from "@/lib/chat-client";
import { ApiRequestError } from "@/lib/api";

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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// Starts (or reopens) a chat with the listing owner, tagged with this listing so the
// conversation opens with a "regarding this post" card attached to the first message — the
// recipient can see exactly which post they were contacted about.
export function MessageSellerButton({
  ownerId,
  listingId,
  className,
}: {
  ownerId: string;
  listingId: string;
  className?: string;
}) {
  const router = useRouter();
  const t = useTranslations("socialProfile");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SAFETY_TIPS = [t("safetyTip1"), t("safetyTip2"), t("safetyTip3"), t("safetyTip4"), t("safetyTip5")];

  function start() {
    if (!getUser() || !getAccessToken()) {
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  async function proceed() {
    const token = getAccessToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const conversationId = await getOrCreateConversation(ownerId, token);
      setOpen(false);
      router.push(`/chats/${conversationId}?listingId=${listingId}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={
          className ??
          "flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        }
      >
        <MessageIcon className="h-4 w-4" />
        {t("messageSeller")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4 pt-[15vh]"
          onClick={() => setOpen(false)}
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
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
            <div className="shrink-0 p-5 pt-0">
              <button
                type="button"
                disabled={busy}
                onClick={proceed}
                className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {t("continueToChat")}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
