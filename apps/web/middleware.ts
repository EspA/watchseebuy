import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.COMING_SOON === "1") {
    const { pathname } = request.nextUrl;
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/watches")) {
    const session = getSessionCookie(request);
    if (!session) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/search/:path*", "/watches/:path*", "/sign-in/:path*"],
};
