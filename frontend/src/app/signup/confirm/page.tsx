"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { saveAccessToken, saveUser, type AuthResponse } from "@/lib/auth-client";

const STORAGE_KEY = "eventsaman_pending_signup";
// Set by /onboarding/auth when a signup is started from the first-run onboarding flow, so this
// page knows to send the user back into onboarding (language step) instead of home once done.
const ONBOARDING_FLAG_KEY = "eventsaman_onboarding_flow";
const RESEND_COOLDOWN_SECONDS = 60;

// AWS SES production-access request is still pending, so sending real OTP emails isn't
// reliable yet — skip straight to the agreement step until it's approved. Flip this back to
// true (the whole OTP UI/flow below is otherwise untouched) once SES is ready.
const SIGNUP_EMAIL_OTP_ENABLED = false;

type PendingSignup = {
  name: string;
  businessName: string;
  phone: string;
  email: string;
  password: string;
};

export default function SignupConfirmPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [pending, setPending] = useState<PendingSignup | null>(null);
  const [ready, setReady] = useState(false);

  // Step 1: verify the email address with a 6-digit code before anything is agreed to or
  // actually created — this proves the email is real and reachable, not just typed correctly.
  const [step, setStep] = useState<"otp" | "agree">(SIGNUP_EMAIL_OTP_ENABLED ? "otp" : "agree");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const sentOnceRef = useRef(false);

  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function sendOtp() {
    if (!pending) return;
    setOtpError(null);
    setOtpSending(true);
    try {
      await apiFetch("/otp/send", {
        method: "POST",
        body: JSON.stringify({ email: pending.email, purpose: "signup" }),
      });
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setOtpError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setOtpSending(false);
    }
  }

  // Send the first code automatically once the pending signup data is available — only once,
  // even though effects can re-run in strict mode.
  useEffect(() => {
    if (SIGNUP_EMAIL_OTP_ENABLED && pending && !sentOnceRef.current) {
      sentOnceRef.current = true;
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setOtpError(null);
    setOtpVerifying(true);
    try {
      await apiFetch("/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email: pending.email, code, purpose: "signup" }),
      });
      setStep("agree");
    } catch (err) {
      setOtpError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setOtpVerifying(false);
    }
  }

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
      const fromOnboarding = sessionStorage.getItem(ONBOARDING_FLAG_KEY) === "1";
      sessionStorage.removeItem(ONBOARDING_FLAG_KEY);
      saveAccessToken(res.accessToken);
      saveUser(res.user);
      router.push(fromOnboarding ? "/onboarding/language" : "/");
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
          <span className="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-orange-600/20 ring-1 ring-orange-100">
            <Image src="/logo.png" alt="Event Saman" width={64} height={64} className="h-full w-full object-contain" priority />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {step === "otp" ? t("verifyEmailTitle") : t("agreementTitle")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === "otp" ? t("verifyEmailSubtitle", { email: pending.email }) : t("agreementSubtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-7">
          {step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
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

              {otpSent && !otpError && (
                <p className="text-center text-xs text-gray-500">{t("otpSentHint")}</p>
              )}
              {otpError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {otpError}
                </p>
              )}

              <button
                type="submit"
                disabled={otpVerifying || code.length !== 6}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {otpVerifying && <Spinner />}
                {otpVerifying ? t("verifyingOtp") : t("verifyOtpButton")}
              </button>

              <button
                type="button"
                onClick={sendOtp}
                disabled={cooldown > 0 || otpSending}
                className="text-center text-sm font-medium text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {otpSending
                  ? t("sendingOtp")
                  : cooldown > 0
                    ? t("resendOtpCooldown", { seconds: cooldown })
                    : t("resendOtp")}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(sessionStorage.getItem(ONBOARDING_FLAG_KEY) === "1" ? "/onboarding/auth" : "/signup")
                }
                className="text-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {t("backToEdit")}
              </button>
            </form>
          ) : (
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
                {loading && <Spinner />}
                {loading ? t("signingUp") : t("createAccountButton")}
              </button>

              <button
                type="button"
                onClick={() => setStep("otp")}
                className="text-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {t("backToEdit")}
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
