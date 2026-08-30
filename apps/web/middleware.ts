import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/watches/:path*"],
};
