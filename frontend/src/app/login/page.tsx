"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { saveAccessToken, saveUser, type AuthResponse } from "@/lib/auth-client";
import { AuthField } from "@/components/auth/AuthField";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      saveAccessToken(res.accessToken);
      saveUser(res.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-orange-50 via-gray-50 to-gray-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-orange-600/20 ring-1 ring-orange-100">
            <Image src="/logo.png" alt="Event Saman" width={64} height={64} className="h-full w-full object-contain" priority />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("welcomeBack")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("loginSubtitle")}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthField
              label={t("identifier")}
              icon="mail"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <AuthField
              label={t("password")}
              icon="lock"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showToggle
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
              required
            />

            <div className="-mt-2 text-right">
              <Link href="/forgot-password" className="text-xs font-medium text-orange-600 hover:text-orange-700">
                {t("forgotPassword")}
              </Link>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
                </svg>
              )}
              {loading ? t("loggingIn") : t("login")}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-orange-600 hover:text-orange-700">
            {t("signup")}
          </Link>
        </p>
      </div>
    </main>
  );
}
