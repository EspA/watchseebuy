import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { cancelUserSubscription } from "@/lib/paypal-subscription";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = absoluteUrl("/sign-in", request);
    signIn.searchParams.set("next", "/settings");
    return NextResponse.redirect(signIn, 303);
  }

  try {
    const result = await cancelUserSubscription(session.user.id);
    const next =
      result === "cancelled" ? "/settings?plan=cancelled" : "/settings";
    return NextResponse.redirect(absoluteUrl(next, request), 303);
  } catch (error) {
    console.error(
      "paypal cancel failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.redirect(
      absoluteUrl("/settings?plan=cancel_failed", request),
      303,
    );
  }
}
