"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { clearSession, getAccessToken } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations("profileMenu");
  // Two-step flow: a plain "are you sure?" confirmation first, then the password step that
  // actually performs the delete. Keeps the destructive action behind two deliberate taps.
  const [step, setStep] = useState<"closed" | "confirm" | "password">("closed");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function closeModal() {
    setStep("closed");
    setPassword("");
    setError(null);
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDeleting(true);
    try {
      const token = getAccessToken() ?? undefined;
      await apiFetch("/users/me", {
        method: "DELETE",
        accessToken: token,
        body: JSON.stringify({ password }),
      });
      clearSession();
      router.push("/");
    } catch (err) {
      const SAFE_TO_SHOW_STATUSES = [400, 404, 429];
      setError(
        err instanceof ApiRequestError && SAFE_TO_SHOW_STATUSES.includes(err.status)
          ? err.message
          : t("somethingWrong")
      );
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("settingsTitle")} backHref="/profile" />

      <div className="mt-4 overflow-hidden rounded-xl border border-red-100 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setStep("confirm")}
          className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-red-50 active:bg-red-100"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-7 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7H6z"
              />
            </svg>
          </span>
          <span className="flex-1 text-[15px] font-medium text-red-600">{t("deleteAccountOption")}</span>
        </button>
      </div>

      {step === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">{t("deleteAccountTitle")}</h2>
            <p className="mt-2 text-sm text-gray-600">{t("deleteAccountExplain")}</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t("deleteAccountCancel")}
              </button>
              <button
                type="button"
                onClick={() => setStep("password")}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t("deleteAccountConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "password" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">{t("deleteAccountTitle")}</h2>
            <p className="mt-2 text-sm text-gray-600">{t("deleteAccountExplain")}</p>

            <form onSubmit={handleDelete} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">{t("deleteAccountPasswordLabel")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t("deleteAccountCancel")}
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? t("deleteAccountDeleting") : t("deleteAccountConfirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
