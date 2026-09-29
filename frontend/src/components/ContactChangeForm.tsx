"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken, getUser, saveUser } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400";

// Two-step verified change of email or phone. Email: code goes to the new address. Phone: no SMS
// provider, so the code goes to the account's current email (server enforces this).
export function ContactChangeForm({ kind }: { kind: "email" | "phone" }) {
  const router = useRouter();
  const t = useTranslations("socialProfile");
  const [current, setCurrent] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setAccountEmail(user.email ?? "");
    setCurrent((kind === "email" ? user.email : user.phone) ?? "");
  }, [router, kind]);

  const body = kind === "email" ? { newEmail: value.trim() } : { newPhone: value.trim() };
  const codeTarget = kind === "email" ? value.trim() : accountEmail;

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await apiFetch(`/users/me/${kind}/request`, {
        method: "POST",
        accessToken: getAccessToken() ?? undefined,
        body: JSON.stringify({ ...body, password }),
      });
      setCodeSent(true);
    });
  }

  function handleVerify(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const { user } = await apiFetch<{ user: UserDTO }>(`/users/me/${kind}`, {
        method: "PATCH",
        accessToken: getAccessToken() ?? undefined,
        body: JSON.stringify({ ...body, code }),
      });
      saveUser(user);
      setDone(true);
      setTimeout(() => router.push("/account/edit"), 1200);
    });
  }

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t(kind === "email" ? "changeEmailOption" : "changePhoneOption")} backHref="/account/edit" />

      {done ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">{t(kind === "email" ? "emailChangeDone" : "phoneChangeDone")}</p>
        </div>
      ) : (
        <form onSubmit={codeSent ? handleVerify : handleSend} className="mt-4 space-y-4">
          {current && <p className="text-xs text-gray-500">{current}</p>}

          <div>
            <label className="text-xs font-medium text-gray-500">{t(kind === "email" ? "newEmail" : "newPhone")}</label>
            <input
              type={kind === "email" ? "email" : "tel"}
              inputMode={kind === "email" ? "email" : "numeric"}
              value={value}
              onChange={(e) => setValue(kind === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value)}
              disabled={codeSent}
              required
              className={INPUT_CLASS}
            />
          </div>

          {!codeSent ? (
            <div>
              <label className="text-xs font-medium text-gray-500">{t("currentPasswordConfirm")}</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-500">{t("otpLabel")}</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                required
                className={`${INPUT_CLASS} text-center text-lg font-semibold tracking-[0.5em]`}
              />
              <p className="mt-2 text-xs text-gray-500">{t("emailCodeSentTo", { target: codeTarget })}</p>
              {kind === "phone" && <p className="mt-1 text-xs text-gray-500">{t("phoneCodeHint")}</p>}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy || (codeSent && code.length !== 6)}
            className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {busy ? t("sendingCode") : t(codeSent ? "verifyAndSave" : "sendCode")}
          </button>

          {codeSent && (
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setError(null);
              }}
              className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              {t("changeDetails")}
            </button>
          )}
        </form>
      )}
    </main>
  );
}
