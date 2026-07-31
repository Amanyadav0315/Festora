"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { saveAccessToken, saveUser, type AuthResponse } from "@/lib/auth-client";

export default function OnboardingAuthPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tOnboarding = useTranslations("onboarding");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "vendor">("buyer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await apiFetch<AuthResponse>("/auth/login", {
              method: "POST",
              body: JSON.stringify({ identifier, password }),
            })
          : await apiFetch<AuthResponse>("/auth/signup", {
              method: "POST",
              body: JSON.stringify({ name, phone, email: email || undefined, password, role }),
            });
      saveAccessToken(res.accessToken);
      saveUser(res.user);
      router.push("/onboarding/language");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold sm:text-2xl">{tOnboarding("authTitle")}</h1>
      <p className="mt-1 text-sm text-gray-500">{tOnboarding("authSubtitle")}</p>

      <div className="mt-6 flex rounded-md border border-gray-300 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded py-1.5 font-medium ${mode === "login" ? "bg-orange-600 text-white" : "text-gray-600"}`}
        >
          {t("login")}
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded py-1.5 font-medium ${mode === "signup" ? "bg-orange-600 text-white" : "text-gray-600"}`}
        >
          {t("signup")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        {mode === "signup" ? (
          <>
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder={t("phone")}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        ) : (
          <input
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder={t("identifier")}
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        )}
        <input
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder={t("password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "signup" ? 6 : undefined}
        />
        {mode === "signup" && (
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as "buyer" | "vendor")}
          >
            <option value="buyer">{t("buyerRole")}</option>
            <option value="vendor">{t("vendorRole")}</option>
          </select>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? (mode === "login" ? t("loggingIn") : t("signingUp")) : mode === "login" ? t("login") : t("signup")}
        </button>

        <button
          type="button"
          onClick={() => router.push("/onboarding/language")}
          className="text-sm text-gray-500 hover:text-orange-600"
        >
          {tOnboarding("skip")}
        </button>
      </form>
    </main>
  );
}
