// Single source of truth for the backend base URL. Falls back to localhost only outside
// production, so a missing NEXT_PUBLIC_API_URL fails loudly at build time in prod instead of
// silently shipping a build that talks to localhost.
export function resolveApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url) return url;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Set it in the environment before building for production " +
        "(see admin/.env.production.example)."
    );
  }

  return "http://localhost:4000/api";
}
