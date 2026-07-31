"use client";

import { useTranslations } from "next-intl";
import { BackHeader } from "@/components/BackHeader";

export default function ChatsPage() {
  const t = useTranslations("navbar");
  const tCommon = useTranslations("profileMenu");

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("chats")} />
      <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
        <p className="text-sm text-gray-500">{tCommon("comingSoon")}</p>
      </div>
    </main>
  );
}
