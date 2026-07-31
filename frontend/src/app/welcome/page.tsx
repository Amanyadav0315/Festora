import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function WelcomePage() {
  const t = await getTranslations("onboarding");
  const tCommon = await getTranslations("common");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <h1 className="text-2xl font-extrabold text-orange-600 sm:text-3xl">{tCommon("brand")}</h1>
      <h2 className="mt-4 text-xl font-bold text-gray-900">{t("welcomeTitle")}</h2>
      <p className="mt-2 text-sm text-gray-500">{t("welcomeSubtitle")}</p>

      <Link
        href="/onboarding/auth"
        className="mt-8 w-full rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
      >
        {t("startNow")}
      </Link>
    </main>
  );
}
