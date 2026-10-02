import { detectSiteAndLocale, parseAppLocale, parseEbaySite } from "@watchseebuy/domain";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { clientMeta } from "@/lib/client-meta";
import {
  EBAY_SITE_COOKIE,
  LOCALE_COOKIE,
  preferenceCookieOptions,
} from "@/lib/locale";

const LEGACY_WEB_HOSTS = new Set(["waitseebuy.com", "www.waitseebuy.com"]);
const CANONICAL_WEB_ORIGIN = "https://watchseebuy.com";
const ACCOUNT_DELETION_PATH = "/api/ebay/account-deletion";

function requestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return host.split(":")[0] ?? "";
}

function redirectLegacyWebHost(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith(ACCOUNT_DELETION_PATH)) return null;
  if (!LEGACY_WEB_HOSTS.has(requestHost(request))) return null;
  const dest = new URL(`${pathname}${request.nextUrl.search}`, CANONICAL_WEB_ORIGIN);
  return NextResponse.redirect(dest, 301);
}

function isAppMiddlewarePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname === "/watches" ||
    pathname.startsWith("/watches/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/pricing" ||
    pathname.startsWith("/pricing/") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith(ACCOUNT_DELETION_PATH)
  );
}

function withDetectedCookies(request: NextRequest, response: NextResponse) {
  const hasSite = Boolean(request.cookies.get(EBAY_SITE_COOKIE)?.value);
  const hasLocale = Boolean(request.cookies.get(LOCALE_COOKIE)?.value);
  if (hasSite && hasLocale) return response;

  const detected = detectSiteAndLocale({
    country: clientMeta(request.headers).country,
    acceptLanguage: request.headers.get("accept-language"),
  });
  const site =
    parseEbaySite(request.cookies.get(EBAY_SITE_COOKIE)?.value) ?? detected.site;
  const locale =
    parseAppLocale(request.cookies.get(LOCALE_COOKIE)?.value) ?? detected.locale;
  const options = preferenceCookieOptions();
  if (!hasSite) response.cookies.set(EBAY_SITE_COOKIE, site, options);
  if (!hasLocale) response.cookies.set(LOCALE_COOKIE, locale, options);
  return response;
}

export function middleware(request: NextRequest) {
  const legacy = redirectLegacyWebHost(request);
  if (legacy) return legacy;

  const { pathname } = request.nextUrl;
  if (!isAppMiddlewarePath(pathname)) {
    return NextResponse.next();
  }
  if (pathname.startsWith(ACCOUNT_DELETION_PATH)) {
    return NextResponse.next();
  }

  if (process.env.COMING_SOON === "1") {
    if (pathname !== "/" && !pathname.startsWith("/out/")) {
      return withDetectedCookies(
        request,
        NextResponse.redirect(absoluteUrl("/", request)),
      );
    }
    return withDetectedCookies(request, NextResponse.next());
  }

  if (
    request.nextUrl.pathname.startsWith("/watches") ||
    request.nextUrl.pathname.startsWith("/settings")
  ) {
    const session = getSessionCookie(request);
    if (!session) {
      const signIn = absoluteUrl("/sign-in", request);
      signIn.searchParams.set("next", request.nextUrl.pathname);
      return withDetectedCookies(request, NextResponse.redirect(signIn));
    }
  }

  return withDetectedCookies(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|brand-mark.png).*)",
  ],
};
