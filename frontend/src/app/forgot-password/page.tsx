"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { saveAccessToken, saveUser, type AuthResponse } from "@/lib/auth-client";
import { AuthField } from "@/components/auth/AuthField";

const RESEND_COOLDOWN_SECONDS = 60;

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");

  // A reset email's link opens straight here with ?email=&code= prefilled — clicking it drops
  // the user directly onto the OTP step with the code already filled in, ready to confirm.
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpSentHint, setOtpSentHint] = useState(false);

  useEffect(() => {
    const linkEmail = searchParams.get("email");
    const linkCode = searchParams.get("code");
    if (linkEmail) {
      setEmail(linkEmail);
      if (linkCode) {
        setCode(linkCode);
        setStep("otp");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function sendOtp() {
    setError(null);
    setSending(true);
    try {
      await apiFetch("/otp/send", {
        method: "POST",
        body: JSON.stringify({ email, purpose: "reset" }),
      });
      setOtpSentHint(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setSending(false);
    }
  }

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    sendOtp();
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      await apiFetch("/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, code, purpose: "reset" }),
      });
      setStep("password");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setVerifying(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResetting(true);
    try {
      // The OTP is re-verified (and consumed) server-side at this step — see
      // auth.service.ts#resetPassword — so a code that already worked at the "otp" step but
      // then expired before this final submit still fails safely here.
      const res = await apiFetch<AuthResponse>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword }),
      });
      saveAccessToken(res.accessToken);
      saveUser(res.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setResetting(false);
    }
  }

  const titles: Record<Step, string> = {
    email: t("forgotPasswordTitle"),
    otp: t("verifyEmailTitle"),
    password: t("setNewPasswordTitle"),
  };
  const subtitles: Record<Step, string> = {
    email: t("forgotPasswordSubtitle"),
    otp: t("verifyEmailSubtitle", { email }),
    password: t("setNewPasswordSubtitle"),
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-orange-50 via-gray-50 to-gray-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-orange-600/20 ring-1 ring-orange-100">
            <Image src="/logo.png" alt="Event Saman" width={64} height={64} className="h-full w-full object-contain" priority />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{titles[step]}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitles[step]}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-7">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <AuthField
                label={t("email")}
                icon="mail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending && <Spinner />}
                {sending ? t("sendingOtp") : t("sendResetCode")}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t("otpCodeLabel")}</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-center text-lg font-semibold tracking-[0.5em] focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>

              {otpSentHint && !error && <p className="text-center text-xs text-gray-500">{t("otpSentHint")}</p>}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying && <Spinner />}
                {verifying ? t("verifyingOtp") : t("verifyOtpButton")}
              </button>

              <button
                type="button"
                onClick={sendOtp}
                disabled={cooldown > 0 || sending}
                className="text-center text-sm font-medium text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {sending
                  ? t("sendingOtp")
                  : cooldown > 0
                    ? t("resendOtpCooldown", { seconds: cooldown })
                    : t("resendOtp")}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {t("backToEdit")}
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <AuthField
                label={t("newPassword")}
                icon="lock"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                disabled={resetting || newPassword.length < 6}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resetting && <Spinner />}
                {resetting ? t("resettingPassword") : t("resetPasswordButton")}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
    </svg>
  );
}
