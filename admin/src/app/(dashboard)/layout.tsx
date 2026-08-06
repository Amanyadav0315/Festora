"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserDTO } from "@festora/types";
import { clearSession, getAccessToken, getUser } from "@/lib/auth-client";
import { isExpired } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/categories", label: "Categories" },
  { href: "/reports", label: "Reports" },
];

function SidebarLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              active ? "bg-orange-50 text-orange-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "ok">("checking");
  const [user, setUser] = useState<UserDTO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const current = getUser();
    const token = getAccessToken();
    // Presence alone isn't enough — the admin app has no refresh flow, so a token that has
    // simply expired since yesterday must send the admin back to /login on page load, not
    // silently render a dashboard where every action will fail.
    if (!current || !token || isExpired(token)) {
      clearSession();
      router.replace("/login");
      return;
    }
    if (current.role !== "admin") {
      router.replace("/login");
      return;
    }
    setUser(current);
    setStatus("ok");
  }, [router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  if (status === "checking") {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-extrabold text-orange-600">Festora Admin</span>
        <button onClick={handleLogout} className="ml-auto text-sm font-medium text-gray-500 hover:text-orange-600">
          Log out
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[80%] bg-white p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-extrabold text-orange-600">Festora Admin</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white px-4 py-6 lg:block">
          <div className="mb-6 flex flex-col gap-1">
            <span className="text-xl font-extrabold text-orange-600">Festora Admin</span>
            {user && <span className="text-xs text-gray-500">{user.name}</span>}
          </div>
          <SidebarLinks pathname={pathname} />
          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}