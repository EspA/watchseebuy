import { detectSiteAndLocale, parseAppLocale, parseEbaySite } from "@waitseebuy/domain";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { clientMeta } from "@/lib/client-meta";
import {
  EBAY_SITE_COOKIE,
  LOCALE_COOKIE,
  preferenceCookieOptions,
} from "@/lib/locale";

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
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/ebay/account-deletion")) {
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
    "/",
    "/search/:path*",
    "/watches",
    "/watches/:path*",
    "/settings",
    "/settings/:path*",
    "/sign-in/:path*",
    "/api/ebay/account-deletion",
  ],
};
