"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserDTO } from "@festora/types";
import { AUTH_CHANGED_EVENT, getUser } from "@/lib/auth-client";
import { INDIA_CITIES } from "@/lib/cities";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BrowseDropdown } from "@/components/BrowseDropdown";
import { isChatThreadPath } from "@/lib/chatRoute";

const LOCATION_KEY = "festora_location";
const HIDDEN_PREFIXES = ["/welcome", "/onboarding"];

function WishlistIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19.3l-1.15-1.02C6.4 14.55 3.5 11.97 3.5 8.8 3.5 6.2 5.6 4.1 8.2 4.1c1.47 0 2.88.68 3.8 1.76a5.1 5.1 0 0 1 3.8-1.76c2.6 0 4.7 2.1 4.7 4.7 0 3.17-2.9 5.75-7.35 9.5L12 19.3z"
      />
    </svg>
  );
}

function RentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11h18" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4.5 4V16H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"
      />
    </svg>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("navbar");
  const tCommon = useTranslations("common");
  const [user, setUser] = useState<UserDTO | null>(null);
  const [location, setLocation] = useState<string>("All India");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setUser(getUser());
    setLocation(localStorage.getItem(LOCATION_KEY) ?? "All India");

    const onAuthChanged = () => setUser(getUser());
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);

  function handleLocationChange(value: string) {
    setLocation(value);
    localStorage.setItem(LOCATION_KEY, value);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (location && location !== "All India") params.set("city", location);
    router.push(`/browse?${params.toString()}`);
  }

  function handleSellClick(e: React.MouseEvent) {
    if (!user) {
      e.preventDefault();
      router.push("/login");
    }
  }

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || isChatThreadPath(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="hidden shrink-0 text-xl font-extrabold text-orange-600 lg:block">
          {tCommon("brand")}
        </Link>

        <select
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="hidden shrink-0 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 lg:block"
          aria-label="Select location"
        >
          {INDIA_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="hidden flex-1 items-center lg:flex">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="rounded-r-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            aria-label="Search"
          >
            {t("search")}
          </button>
        </form>

        <nav className="hidden shrink-0 items-center gap-4 text-sm lg:flex">
          <LanguageSwitcher />

          <BrowseDropdown />

          <Link
            href="/browse?purpose=rent"
            className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 font-semibold text-orange-700 hover:border-orange-300 hover:bg-orange-100"
          >
            <RentIcon className="h-4 w-4" />
            {t("rent")}
          </Link>

          <Link
            href="/chats"
            aria-label={t("chats")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ChatIcon className="h-5 w-5" />
          </Link>

          <Link
            href="/wishlist"
            aria-label={t("wishlist")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <WishlistIcon className="h-5 w-5" />
          </Link>

          {user ? (
            <ProfileMenu user={user} size="sm" />
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-orange-600">
              {t("login")}
            </Link>
          )}

          <Link
            href="/sell"
            onClick={handleSellClick}
            className="flex items-center gap-1 rounded-full bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            {t("sell")}
          </Link>
        </nav>

        {/* Mobile / tablet app-style header */}
        <div className="flex w-full flex-col gap-2.5 lg:hidden">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0 text-lg font-extrabold text-orange-600">
              {tCommon("brand")}
            </Link>

            <div className="relative shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <select
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="appearance-none rounded-full border-none bg-gray-100 py-1.5 pl-7 pr-6 text-xs font-medium text-gray-700"
                aria-label="Select location"
              >
                {INDIA_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1">
              <BrowseDropdown compact />
              <LanguageSwitcher compact />

              <Link
                href="/chats"
                aria-label={t("chats")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              >
                <ChatIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative w-full">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4-4" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search "Wedding DJ"'
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
