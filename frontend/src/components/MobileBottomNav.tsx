"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { UserDTO } from "@festora/types";
import { AUTH_CHANGED_EVENT, clearSession, getUser } from "@/lib/auth-client";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v9.5a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
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

function WishlistIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19.3l-1.15-1.02C6.4 14.55 3.5 11.97 3.5 8.8 3.5 6.2 5.6 4.1 8.2 4.1c1.47 0 2.88.68 3.8 1.76a5.1 5.1 0 0 1 3.8-1.76c2.6 0 4.7 2.1 4.7 4.7 0 3.17-2.9 5.75-7.35 9.5L12 19.3z"
      />
    </svg>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20c1.4-3.5 4.4-5.5 7.5-5.5s6.1 2 7.5 5.5" />
    </svg>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
        active ? "text-orange-600" : "text-gray-500"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserDTO | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
    const onAuthChanged = () => setUser(getUser());
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);

  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  function handleSellClick(e: React.MouseEvent) {
    if (!user) {
      e.preventDefault();
      router.push("/login");
      return;
    }
    if (user.role !== "vendor") {
      e.preventDefault();
      router.push("/become-a-vendor");
    }
  }

  function handleLogout() {
    clearSession();
    setAccountOpen(false);
    router.push("/");
  }

  return (
    <>
      {accountOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setAccountOpen(false)}
          aria-hidden="true"
        />
      )}

      {accountOpen && user && (
        <div className="fixed inset-x-3 bottom-[4.25rem] z-40 rounded-xl border border-gray-200 bg-white p-4 shadow-lg lg:hidden">
          <p className="text-sm font-semibold text-gray-900">Hi, {user.name.split(" ")[0]}</p>
          <p className="text-xs text-gray-500">{user.role === "vendor" ? "Vendor account" : "Buyer account"}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <NavItem href="/" label="Home" icon={<HomeIcon className="h-5 w-5" />} active={pathname === "/"} />
        <NavItem
          href="/browse?type=rental"
          label="Rent"
          icon={<RentIcon className="h-5 w-5" />}
          active={pathname === "/browse"}
        />

        <Link
          href="/sell"
          onClick={handleSellClick}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium text-gray-500"
        >
          <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-md">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Sell
        </Link>

        <NavItem
          href="/wishlist"
          label="Wishlist"
          icon={<WishlistIcon className="h-5 w-5" active={pathname === "/wishlist"} />}
          active={pathname === "/wishlist"}
        />

        {user ? (
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
              accountOpen ? "text-orange-600" : "text-gray-500"
            }`}
          >
            <AccountIcon className="h-5 w-5" />
            Account
          </button>
        ) : (
          <NavItem
            href="/login"
            label="Account"
            icon={<AccountIcon className="h-5 w-5" />}
            active={pathname === "/login"}
          />
        )}
      </nav>
    </>
  );
}
