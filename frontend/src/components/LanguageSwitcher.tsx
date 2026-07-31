"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locales";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("common");

  function setLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLocale(locale === "en" ? "hi" : "en")}
        aria-label="Switch language"
        className="flex h-9 items-center justify-center rounded-full px-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
      >
        {locale === "en" ? "हिं" : "EN"}
      </button>
    );
  }

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Select language"
      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700"
    >
      <option value="en">{t("english")}</option>
      <option value="hi">{t("hindi")}</option>
    </select>
  );
}
