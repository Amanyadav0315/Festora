"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthField } from "@/components/auth/AuthField";

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    // The account isn't created yet — the actual /auth/signup call happens only after the
    // user accepts both the Privacy Policy and Terms & Conditions on the next step. Stash
    // the collected fields in sessionStorage (not localStorage — this is transient) so the
    // confirm page can pick them up; the password never touches localStorage this way.
    try {
      sessionStorage.setItem(
        "eventsaman_pending_signup",
        JSON.stringify({ name, businessName, phone, email: email || undefined, password })
      );
    } catch {
      // sessionStorage unavailable (e.g. private mode) — fall through, confirm page will
      // detect the missing data and send the user back here.
    }
    router.push("/signup/confirm");
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-orange-50 via-gray-50 to-gray-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-orange-600/20 ring-1 ring-orange-100">
            <Image src="/logo.png" alt="Event Saman" width={64} height={64} className="h-full w-full object-contain" priority />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("createAccount")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("signupSubtitle")}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthField
              label={t("name")}
              icon="user"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div>
              <AuthField
                label={`${t("businessName")} *`}
                icon="user"
                autoComplete="organization"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">{t("businessNameHint")}</p>
            </div>
            <AuthField
              label={`${t("phone")} *`}
              icon="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <AuthField
              label={t("email")}
              icon="mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AuthField
              label={t("password")}
              icon="lock"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showToggle
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
              required
              minLength={6}
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("continue")}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            {t("login")}
          </Link>
        </p>
      </div>
    </main>
  );
}
