"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { UserDTO } from "@eventsaman/types";
import { clearSession, getUser } from "@/lib/auth-client";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locales";
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
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.4-3.5 4.4-5.5 7.5-5.5s6.1 2 7.5 5.5",
  cart: "M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 8H6",
  wishlist:
    "M12 19.3l-1.15-1.02C6.4 14.55 3.5 11.97 3.5 8.8 3.5 6.2 5.6 4.1 8.2 4.1c1.47 0 2.88.68 3.8 1.76a5.1 5.1 0 0 1 3.8-1.76c2.6 0 4.7 2.1 4.7 4.7 0 3.17-2.9 5.75-7.35 9.5L12 19.3z",
  language: "M4 5h9M9 3v2m0 0c0 4-2 7-6 9m3-4c1.5 1.5 3.5 2.5 5 3M13 21l4-9 4 9m-6.5-3h5",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.63.7 1.11 1.51 1.11H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

function MenuRow({
  href,
  onClick,
  iconPath,
  label,
  danger,
  chevron = true,
  children,
}: {
  href?: string;
  onClick?: () => void;
  iconPath: string;
  label: string;
  danger?: boolean;
  chevron?: boolean;
  children?: React.ReactNode;
}) {
  const content = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          danger ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
        }`}
      >
        <MenuIcon className="h-5 w-5" path={iconPath} />
      </span>
      <span className={`flex-1 text-[15px] font-medium ${danger ? "text-red-600" : "text-gray-800"}`}>{label}</span>
      {chevron && <ChevronIcon className="h-4 w-4 shrink-0 text-gray-300" />}
      {children}
    </>
  );

  const rowClass = "flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100";

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {content}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("profileMenu");
  const [user, setUser] = useState<UserDTO | null>(null);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  function setLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  if (!user) return null;

  const initials = user.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <main className="mx-auto max-w-md px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("profileTitle")} backHref="/" />

      <div className="mt-2 flex items-center gap-3.5 rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-100 text-lg font-semibold text-orange-700">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-gray-900">{user.name}</p>
          <p className="truncate text-sm text-gray-500">{user.phone}</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <MenuRow href="/account" iconPath={ICON_PATHS.profile} label={t("viewProfile")} />
        <MenuRow href="/cart" iconPath={ICON_PATHS.cart} label={t("cart")} />
        <MenuRow href="/wishlist" iconPath={ICON_PATHS.wishlist} label={t("wishlist")} />

        <div>
          <MenuRow
            onClick={() => setLangOpen((v) => !v)}
            iconPath={ICON_PATHS.language}
            label={t("language")}
            chevron={false}
          >
            <ChevronIcon className={`h-4 w-4 shrink-0 text-gray-300 transition-transform ${langOpen ? "rotate-90" : ""}`} />
          </MenuRow>
          {langOpen && (
            <div className="flex flex-col gap-1 bg-gray-50 px-4 py-2 pl-[4.25rem]">
              <button
                onClick={() => setLocale("en")}
                className={`rounded-md px-3 py-2 text-left text-sm ${
                  locale === "en" ? "bg-orange-50 font-semibold text-orange-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLocale("hi")}
                className={`rounded-md px-3 py-2 text-left text-sm ${
                  locale === "hi" ? "bg-orange-50 font-semibold text-orange-600" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                हिन्दी
              </button>
            </div>
          )}
        </div>

        <MenuRow href="/settings" iconPath={ICON_PATHS.settings} label={t("settings")} />
        <MenuRow href="/help" iconPath={ICON_PATHS.help} label={t("help")} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <MenuRow onClick={handleLogout} iconPath={ICON_PATHS.logout} label={t("logout")} danger chevron={false} />
      </div>
    </main>
  );
}
