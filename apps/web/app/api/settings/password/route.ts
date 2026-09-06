import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", "/settings");
    return NextResponse.redirect(signIn, 303);
  }

  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (password.length < 8) {
    return NextResponse.redirect(
      new URL("/settings?password=short", request.url),
      303,
    );
  }

  try {
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: await headers(),
    });
  } catch {
    return NextResponse.redirect(
      new URL("/settings?password=failed", request.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/settings?password=set", request.url), 303);
}
