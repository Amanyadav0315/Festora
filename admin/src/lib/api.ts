import { resolveApiUrl } from "./api-url";

const API_URL = resolveApiUrl();
export const ASSET_BASE_URL = API_URL.replace(/\/api$/, "");

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Decodes the JWT payload's `exp` claim without verification — good enough for a client-side
// "is this worth sending" check; the server is still the source of truth on every request.
export function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// The admin app has no refresh-token flow (unlike the public frontend) — an expired or
// rejected token means the session is over. Clear it and bounce to /login instead of leaving
// the dashboard rendered with a dead token that fails every action silently until noticed.
function handleSessionExpired() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("eventsaman_admin_access_token");
  localStorage.removeItem("eventsaman_admin_user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  if (accessToken && isExpired(accessToken)) {
    handleSessionExpired();
    throw new ApiRequestError(401, "Session expired");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401) {
    handleSessionExpired();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiRequestError(res.status, body.message ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: "POST" | "PATCH"; accessToken?: string } = {}
): Promise<T> {
  if (options.accessToken && isExpired(options.accessToken)) {
    handleSessionExpired();
    throw new ApiRequestError(401, "Session expired");
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "POST",
    credentials: "include",
    headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined,
    body: formData,
  });

  if (res.status === 401) {
    handleSessionExpired();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiRequestError(res.status, body.message ?? "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}