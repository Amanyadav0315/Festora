"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { clearSession, getAccessToken, getUser, saveUser } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations("profileMenu");
  const [user, setUser] = useState<UserDTO | null>(null);
  const [phoneVisSaving, setPhoneVisSaving] = useState(false);
  const [phoneVisError, setPhoneVisError] = useState<string | null>(null);
  // Two-step flow: a plain "are you sure?" confirmation first, then the password step that
  // actually performs the delete. Keeps the destructive action behind two deliberate taps.
  const [step, setStep] = useState<"closed" | "confirm" | "password">("closed");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  async function togglePhoneVisibility() {
    if (!user) return;
    const next = !user.showPhonePublicly;
    setPhoneVisError(null);
    setPhoneVisSaving(true);
    try {
      const token = getAccessToken() ?? undefined;
      const res = await apiFetch<{ user: UserDTO }>("/users/me/phone-visibility", {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ showPhonePublicly: next }),
      });
      setUser(res.user);
      saveUser(res.user);
    } catch (err) {
      setPhoneVisError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setPhoneVisSaving(false);
    }
  }

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

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3.5 px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
              />
            </svg>
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-medium text-gray-800">{t("showPhoneOption")}</p>
            <p className="mt-0.5 text-xs text-gray-500">{t("showPhoneHint")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(user?.showPhonePublicly)}
            onClick={togglePhoneVisibility}
            disabled={!user || phoneVisSaving}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
              user?.showPhonePublicly ? "bg-orange-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                user?.showPhonePublicly ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {phoneVisError && <p className="px-4 pb-3 text-xs text-red-600">{phoneVisError}</p>}
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
