"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { saveAccessToken, saveUser, type AuthResponse } from "@/lib/auth-client";

const STORAGE_KEY = "eventsaman_pending_signup";

type PendingSignup = {
  name: string;
  businessName: string;
  phone: string;
  email?: string;
  password: string;
};

export default function SignupConfirmPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setPending(JSON.parse(raw));
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    // No pending signup data (direct nav, refresh in a way that cleared it, expired tab) —
    // there's nothing to confirm, so send the user back to fill the form again.
    if (ready && !pending) {
      router.replace("/signup");
    }
  }, [ready, pending, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ ...pending, acceptedTerms: true }),
      });
      sessionStorage.removeItem(STORAGE_KEY);
      saveAccessToken(res.accessToken);
      saveUser(res.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !pending) return null;

  const bothChecked = checkedPrivacy && checkedTerms;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-orange-50 via-gray-50 to-gray-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-2xl font-bold text-white shadow-lg shadow-orange-600/20">
            F
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("agreementTitle")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("agreementSubtitle")}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex items-start gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={checkedPrivacy}
                onChange={(e) => setCheckedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span>
                {t("agreePrivacyPrefix")}{" "}
                <Link href="/help/privacy" target="_blank" className="font-semibold text-orange-600 hover:text-orange-700">
                  {t("privacyPolicyLink")}
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={checkedTerms}
                onChange={(e) => setCheckedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span>
                {t("agreeTermsPrefix")}{" "}
                <Link href="/help/terms" target="_blank" className="font-semibold text-orange-600 hover:text-orange-700">
                  {t("termsLink")}
                </Link>
              </span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!bothChecked || loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                </svg>
              )}
              {loading ? t("signingUp") : t("createAccountButton")}
            </button>

            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              {t("backToEdit")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
