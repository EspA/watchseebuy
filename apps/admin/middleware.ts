import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "./lib/absolute-url";
import { ADMIN_COOKIE_PREFIX } from "./lib/cookies";

const LEGACY_ADMIN_HOSTS = new Set(["admin.waitseebuy.com"]);
const CANONICAL_ADMIN_ORIGIN = "https://admin.watchseebuy.com";

function requestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return host.split(":")[0] ?? "";
}

export function middleware(request: NextRequest) {
  if (LEGACY_ADMIN_HOSTS.has(requestHost(request))) {
    const dest = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      CANONICAL_ADMIN_ORIGIN,
    );
    return NextResponse.redirect(dest, 301);
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/sign-in")) {
    return NextResponse.next();
  }

  const session = getSessionCookie(request, {
    cookiePrefix: ADMIN_COOKIE_PREFIX,
  });
  if (!session) {
    return NextResponse.redirect(absoluteUrl("/sign-in", request));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand-mark.png).*)"],
};
