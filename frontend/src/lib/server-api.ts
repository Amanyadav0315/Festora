import { resolveApiUrl } from "./api-url";

const API_URL = resolveApiUrl();

export async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}
