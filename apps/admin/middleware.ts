import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_PREFIX } from "./lib/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/sign-in")) {
    return NextResponse.next();
  }

  const session = getSessionCookie(request, {
    cookiePrefix: ADMIN_COOKIE_PREFIX,
  });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand-mark.png).*)"],
};
