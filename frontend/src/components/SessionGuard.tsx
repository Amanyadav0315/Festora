"use client";

import { useEffect } from "react";
import type { UserDTO } from "@eventsaman/types";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { clearSession, getAccessToken, getUser, saveUser } from "@/lib/auth-client";

// Runs once on mount, app-wide. A cached user in localStorage only proves someone logged in
// at some point — it doesn't prove the account still exists (e.g. after a DB reset/switch),
// and it can also be stale (e.g. the profile photo was changed from a different device/app —
// localStorage on this browser has no way to know that on its own). Validate against the
// server, clear the session if it's gone, and otherwise re-sync the fresh user into
// localStorage so every component that trusts getUser() (Navbar, MobileBottomNav, ...) picks
// up the latest name/avatar/etc. via the AUTH_CHANGED_EVENT that saveUser()/clearSession()
// already dispatch.
export function SessionGuard() {
  useEffect(() => {
    const user = getUser();
    const token = getAccessToken();
    if (!user || !token) return;

    apiFetch<{ user: UserDTO }>("/users/me", { accessToken: token })
      .then((body) => saveUser(body.user))
      .catch((err) => {
        if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) {
          clearSession();
        }
      });
  }, []);

  return null;
}
