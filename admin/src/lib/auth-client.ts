"use client";

import type { UserDTO } from "@festora/types";

const ACCESS_TOKEN_KEY = "festora_admin_access_token";
const USER_KEY = "festora_admin_user";

export function saveAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveUser(user: UserDTO) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): UserDTO | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserDTO) : null;
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
}