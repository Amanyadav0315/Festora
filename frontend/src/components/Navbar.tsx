"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserDTO } from "@festora/types";
import { AUTH_CHANGED_EVENT, clearSession, getUser } from "@/lib/auth-client";
import { INDIA_CITIES } from "@/lib/cities";

const LOCATION_KEY = "festora_location";

export function Navbar() {
  const router = useRouter();
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

  function handleLogout() {
    clearSession();
    router.push("/");
  }

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

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-xl font-extrabold text-orange-600">
          Festora
        </Link>

        <select
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="shrink-0 rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700"
          aria-label="Select location"
        >
          {INDIA_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="flex flex-1 items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search "Wedding DJ"'
            className="w-full rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="rounded-r-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            aria-label="Search"
          >
            Search
          </button>
        </form>

        <nav className="flex shrink-0 items-center gap-4 text-sm">
          <Link href="/wishlist" className="text-gray-700 hover:text-orange-600">
            Wishlist
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-700">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-orange-600">
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-orange-600">
              Login
            </Link>
          )}

          <Link
            href="/sell"
            onClick={handleSellClick}
            className="flex items-center gap-1 rounded-full bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          >
            + Sell
          </Link>
        </nav>
      </div>
    </header>
  );
}
