"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BackHeader } from "@/components/BackHeader";

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );
}

function MenuIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const ICON_PATHS = {
  report: "M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z",
  privacy: "M12 2l8 3.5v5c0 5-3.4 8.9-8 10.5-4.6-1.6-8-5.5-8-10.5v-5L12 2z",
  terms: "M9 12h6m-6 4h6M9 8h1M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
};

function MenuRow({ href, iconPath, label }: { href: string; iconPath: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
        <MenuIcon className="h-5 w-5" path={iconPath} />
      </span>
      <span className="flex-1 text-[15px] font-medium text-gray-800">{label}</span>
      <ChevronIcon className="h-4 w-4 shrink-0 text-gray-300" />
    </Link>
  );
}

export default function HelpPage() {
  const t = useTranslations("profileMenu");

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("helpTitle")} backHref="/profile" />

      <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <MenuRow href="/help/report" iconPath={ICON_PATHS.report} label={t("reportIssue")} />
        <MenuRow href="/help/privacy" iconPath={ICON_PATHS.privacy} label={t("privacyPolicy")} />
        <MenuRow href="/help/terms" iconPath={ICON_PATHS.terms} label={t("termsConditions")} />
      </div>
    </main>
  );
}
