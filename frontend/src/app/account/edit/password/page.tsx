"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

export default function ChangePasswordPage() {
  const router = useRouter();
  const t = useTranslations("socialProfile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSaving(true);
    try {
      const token = getAccessToken() ?? undefined;
      await apiFetch("/users/me/password", {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setDone(true);
      setTimeout(() => router.push("/account/edit"), 1200);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("changePasswordOption")} backHref="/account/edit" />

      {done ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">{t("passwordUpdated")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">{t("currentPassword")}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">{t("newPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">{t("confirmPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
        </form>
      )}
    </main>
  );
}
