import { NextResponse, type NextRequest } from "next/server";

const ONBOARDED_COOKIE = "eventsaman_onboarded";
// /forgot-password and /signup/confirm are linked from the onboarding auth screen, which runs
// before the onboarded cookie exists — gating them sent new app users back to /welcome.
const BYPASS_PREFIXES = ["/welcome", "/onboarding", "/_next", "/api", "/forgot-password", "/signup/confirm"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isBypassed =
    BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || /\.[a-zA-Z0-9]+$/.test(pathname);

  if (isBypassed) {
    return NextResponse.next();
  }

  const onboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "1";
  if (!onboarded) {
    const url = request.nextUrl.clone();
    url.pathname = "/welcome";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
