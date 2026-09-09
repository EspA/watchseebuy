import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = absoluteUrl("/sign-in", request);
    signIn.searchParams.set("next", "/settings");
    return NextResponse.redirect(signIn, 303);
  }

  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (password.length < 8) {
    return NextResponse.redirect(
      absoluteUrl("/settings?password=short", request),
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
      absoluteUrl("/settings?password=failed", request),
      303,
    );
  }

  return NextResponse.redirect(absoluteUrl("/settings?password=set", request), 303);
}
