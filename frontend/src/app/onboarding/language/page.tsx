"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locales";

const ONBOARDED_COOKIE = "eventsaman_onboarded";

export default function OnboardingLanguagePage() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");

  function chooseLocale(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000`;
    document.cookie = `${ONBOARDED_COOKIE}=1; path=/; max-age=31536000`;
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <h1 className="text-xl font-bold sm:text-2xl">{t("languageTitle")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("languageSubtitle")}</p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => chooseLocale("en")}
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 hover:border-orange-500 hover:text-orange-600"
        >
          {tCommon("english")}
        </button>
        <button
          type="button"
          onClick={() => chooseLocale("hi")}
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 hover:border-orange-500 hover:text-orange-600"
        >
          {tCommon("hindi")}
        </button>
      </div>
    </main>
  );
}
