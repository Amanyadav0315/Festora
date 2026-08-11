import { ACCESS_TOKEN_KEY } from "./auth-client";
import { resolveApiUrl } from "./api-url";

const API_URL = resolveApiUrl();
export const ASSET_BASE_URL = API_URL.replace(/\/api$/, "");

export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string>;
  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function messageFromBody(body: { message?: string; errors?: Record<string, string> }): string {
  if (body.errors) {
    const first = Object.values(body.errors)[0];
    if (first) return first;
  }
  return body.message ?? "Request failed";
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = await res.json();
        return body.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  async function doFetch(token?: string) {
    return fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  }

  let effectiveToken = accessToken;
  if (effectiveToken && isExpired(effectiveToken)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      saveRefreshedToken(refreshed);
      effectiveToken = refreshed;
    }
  }

  let res = await doFetch(effectiveToken);

  if (res.status === 401 && effectiveToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      saveRefreshedToken(newToken);
      res = await doFetch(newToken);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiRequestError(res.status, messageFromBody(body), body.errors);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function saveRefreshedToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: "POST" | "PATCH"; accessToken?: string } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "POST",
    credentials: "include",
    headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiRequestError(res.status, messageFromBody(body), body.errors);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
