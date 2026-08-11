"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { getAccessToken, getUser, saveUser } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

const MAX_ABOUT_LENGTH = 200;

export default function EditAboutPage() {
  const router = useRouter();
  const t = useTranslations("socialProfile");
  const [about, setAbout] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setAbout(user.about ?? "");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = getAccessToken() ?? undefined;
      const { user } = await apiFetch<{ user: UserDTO }>("/users/me", {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ about: about.trim() }),
      });
      saveUser(user);
      router.push("/account/edit");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("aboutOption")} backHref="/account/edit" />

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">{t("aboutOption")}</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value.slice(0, MAX_ABOUT_LENGTH))}
            rows={5}
            maxLength={MAX_ABOUT_LENGTH}
            placeholder={t("aboutPlaceholder")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {t("aboutCharsLeft", { count: MAX_ABOUT_LENGTH - about.length })}
          </p>
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
    </main>
  );
}
