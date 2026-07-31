"use client";

import { useTranslations } from "next-intl";
import { BackHeader } from "@/components/BackHeader";

export default function HelpPage() {
  const t = useTranslations("profileMenu");

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("helpTitle")} backHref="/profile" />
      <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">{t("comingSoon")}</p>
      </div>
    </main>
  );
}
