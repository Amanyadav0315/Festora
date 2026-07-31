const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
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

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiRequestError(res.status, messageFromBody(body), body.errors);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
