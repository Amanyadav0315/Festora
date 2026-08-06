"use client";

import { useEffect } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { clearSession, getAccessToken, getUser } from "@/lib/auth-client";

// Runs once on mount, app-wide. A cached user in localStorage only proves someone logged in
// at some point — it doesn't prove the account still exists (e.g. after a DB reset/switch).
// Validate against the server and clear the stale session if it's gone, so every component
// that trusts getUser() (Navbar, MobileBottomNav, ...) falls back to the logged-out UI via
// the AUTH_CHANGED_EVENT that clearSession() already dispatches.
export function SessionGuard() {
  useEffect(() => {
    const user = getUser();
    const token = getAccessToken();
    if (!user || !token) return;

    apiFetch("/users/me", { accessToken: token }).catch((err) => {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) {
        clearSession();
      }
    });
  }, []);

  return null;
}
