import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/ebay/account-deletion")) {
    return NextResponse.next();
  }

  if (process.env.COMING_SOON === "1") {
    if (pathname !== "/" && !pathname.startsWith("/out/")) {
      return NextResponse.redirect(absoluteUrl("/", request));
    }
    return NextResponse.next();
  }

  if (
    request.nextUrl.pathname.startsWith("/watches") ||
    request.nextUrl.pathname.startsWith("/settings")
  ) {
    const session = getSessionCookie(request);
    if (!session) {
      const signIn = absoluteUrl("/sign-in", request);
      signIn.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/search/:path*",
    "/watches",
    "/watches/:path*",
    "/settings",
    "/settings/:path*",
    "/sign-in/:path*",
    "/api/ebay/account-deletion",
  ],
};
