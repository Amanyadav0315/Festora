"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserDTO } from "@eventsaman/types";
import { AUTH_CHANGED_EVENT, getUser } from "@/lib/auth-client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ProfileMenu } from "@/components/ProfileMenu";
import { BrowseDropdown } from "@/components/BrowseDropdown";
import { LocationPicker } from "@/components/LocationPicker";
import { isChatThreadPath } from "@/lib/chatRoute";
import { useUnreadChatCount } from "@/lib/useUnreadChatCount";
import { useUnreadNotifCount } from "@/lib/useUnreadNotifCount";

const LOCATION_KEY = "eventsaman_location";
// Mirrors LOCATION_KEY into a cookie (readable by server components like the homepage) and
// broadcasts a same-tab event (localStorage's "storage" event only fires in OTHER tabs) so any
// already-mounted client component can react to a location change immediately.
export const LOCATION_CHANGED_EVENT = "eventsaman:location-changed";
const HIDDEN_PREFIXES = ["/welcome", "/onboarding"];
// The full search/location/chats header is only meant for the Home page and the Rent/Browse
// page — every other page (profile, account, chats, etc.) should not show it.
const VISIBLE_PREFIXES = ["/", "/browse"];

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

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
      />
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
  const unreadChatCount = useUnreadChatCount();
  const unreadNotifCount = useUnreadNotifCount();

  useEffect(() => {
    setUser(getUser());
    const stored = localStorage.getItem(LOCATION_KEY) ?? "All India";
    setLocation(stored);
    // Backfills the cookie for sessions that saved a location before this cookie existed, so
    // server-rendered pages (homepage) pick it up on the very next request.
    if (!document.cookie.includes(`${LOCATION_KEY}=`)) {
      document.cookie = `${LOCATION_KEY}=${encodeURIComponent(stored)};path=/;max-age=31536000`;
    }

    const onAuthChanged = () => setUser(getUser());
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);

  function handleLocationChange(value: string) {
    setLocation(value);
    localStorage.setItem(LOCATION_KEY, value);
    // 1 year, readable site-wide so server components (e.g. the homepage) can filter by it too.
    document.cookie = `${LOCATION_KEY}=${encodeURIComponent(value)};path=/;max-age=31536000`;
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGED_EVENT, { detail: value }));

    // If the user is already viewing search/browse results, apply the new location immediately
    // instead of leaving them on stale results until they search again.
    if (pathname === "/browse") {
      const params = new URLSearchParams(window.location.search);
      if (value === "All India") params.delete("city");
      else params.set("city", value);
      router.push(`/browse?${params.toString()}`);
    }
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

  const isVisiblePage = pathname === "/" || VISIBLE_PREFIXES.some((prefix) => prefix !== "/" && pathname.startsWith(prefix));

  // Onboarding/welcome and chat-thread screens are full-screen layouts that never show this
  // header — unmount entirely there, same as before.
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || isChatThreadPath(pathname)) {
    return null;
  }

  // Everywhere else, keep the header mounted and just toggle its visibility with `hidden` instead
  // of unmounting it (returning null). Mounting/unmounting this element on every route change was
  // causing mobile browsers to recompute the layout viewport mid-navigation, which showed up as
  // the page snapping to a zoomed-in state when coming back to Home/Rent from another page.
  return (
    <header className={`sticky top-0 z-30 border-b border-gray-200 bg-white ${isVisiblePage ? "" : "hidden"}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="hidden shrink-0 text-xl font-extrabold text-orange-600 lg:block">
          {tCommon("brand")}
        </Link>

        <LocationPicker value={location} onChange={handleLocationChange} className="hidden shrink-0 lg:block" />

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
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <ChatIcon className="h-5 w-5" />
            {/* Always mounted (never conditionally added/removed) — toggling only `invisible`
                keeps the sticky header's DOM stable once the async unread count resolves, so it
                doesn't retrigger the mobile layout-viewport/zoom glitch on refresh. */}
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold text-white ${
                unreadChatCount > 0 ? "" : "invisible"
              }`}
            >
              {unreadChatCount > 9 ? "9+" : unreadChatCount}
            </span>
          </Link>

          <Link
            href="/wishlist"
            aria-label={t("wishlist")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <WishlistIcon className="h-5 w-5" />
          </Link>

          {user && (
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            >
              <BellIcon className="h-5 w-5" />
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold text-white ${
                  unreadNotifCount > 0 ? "" : "invisible"
                }`}
              >
                {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
              </span>
            </Link>
          )}

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

        {/* Mobile / tablet app-style header — wider, OLX-inspired layout: a top identity row
            (brand + location + quick controls), then a full-width search bar with the wishlist
            and chat actions built directly into that same row instead of living in a separate,
            visually disconnected icon strip. */}
        <div className="-mx-4 w-full bg-orange-600 px-4 py-2.5 lg:hidden">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0 text-xl font-extrabold tracking-tight text-white">
              {tCommon("brand")}
            </Link>

            <LocationPicker value={location} onChange={handleLocationChange} compact className="shrink-0" />

            <div className="ml-auto flex shrink-0 items-center gap-1">
              <BrowseDropdown compact />
              <LanguageSwitcher compact />
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-2.5 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
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
                className="w-full rounded-lg border-0 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <Link
              href="/wishlist"
              aria-label={t("wishlist")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:bg-orange-50"
            >
              <WishlistIcon className="h-5 w-5" />
            </Link>

            <Link
              href="/chats"
              aria-label={t("chats")}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:bg-orange-50"
            >
              <ChatIcon className="h-5 w-5" />
              <span
                className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white ${
                  unreadChatCount > 0 ? "" : "invisible"
                }`}
              >
                {unreadChatCount > 9 ? "9+" : unreadChatCount}
              </span>
            </Link>

            {user && (
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:bg-orange-50"
              >
                <BellIcon className="h-5 w-5" />
                <span
                  className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold text-white ring-2 ring-white ${
                    unreadNotifCount > 0 ? "" : "invisible"
                  }`}
                >
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </span>
              </Link>
            )}
          </form>
        </div>
      </div>
    </header>
  );
}
