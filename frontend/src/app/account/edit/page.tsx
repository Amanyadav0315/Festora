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
  photo: "M4 8h2.5l1.3-2h8.4l1.3 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  name: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.4-3.5 4.4-5.5 7.5-5.5s6.1 2 7.5 5.5",
  about: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8h.01M11 12h1v5h1",
  password:
    "M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 10V7a6 6 0 1 1 12 0v3M6 10h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z",
  availability: "M8 3v3M16 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
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

export default function EditProfileMenuPage() {
  const t = useTranslations("socialProfile");

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("editProfileTitle")} backHref="/account" />

      <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <MenuRow
          href="/account?openAvatarUpload=1"
          iconPath={ICON_PATHS.photo}
          label={t("uploadPhotoOption")}
        />
        <MenuRow href="/account/edit/name" iconPath={ICON_PATHS.name} label={t("editNameOption")} />
        <MenuRow href="/account/edit/about" iconPath={ICON_PATHS.about} label={t("aboutOption")} />
        <MenuRow href="/account/edit/password" iconPath={ICON_PATHS.password} label={t("changePasswordOption")} />
        <MenuRow href="/account/edit/availability" iconPath={ICON_PATHS.availability} label="Availability" />
      </div>
    </main>
  );
}
