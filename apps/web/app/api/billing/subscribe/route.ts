import { isBillingInterval, isPaidPlan } from "@watchseebuy/domain";
import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { currentBilling } from "@/lib/current-billing";
import { paypalConfigured } from "@/lib/paypal";
import { createApprovalUrl } from "@/lib/paypal-subscription";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    const signIn = absoluteUrl("/sign-in", request);
    signIn.searchParams.set("next", "/pricing");
    return NextResponse.redirect(signIn, 303);
  }

  const form = await request.formData();
  const plan = String(form.get("plan") ?? "");
  const interval = String(form.get("interval") ?? "");
  if (!isPaidPlan(plan) || !isBillingInterval(interval) || !paypalConfigured()) {
    return NextResponse.redirect(absoluteUrl("/pricing?error=unavailable", request), 303);
  }

  const billing = await currentBilling(session.user.id);
  if (billing.plan === plan && billing.interval === interval && billing.status === "active") {
    return NextResponse.redirect(absoluteUrl("/pricing", request), 303);
  }

  try {
    const href = await createApprovalUrl({
      userId: session.user.id,
      email: session.user.email,
      plan,
      interval,
      returnUrl: absoluteUrl("/api/billing/paypal/return", request).toString(),
      cancelUrl: absoluteUrl("/pricing?error=cancelled", request).toString(),
    });
    return NextResponse.redirect(href, 303);
  } catch (error) {
    console.error(
      "paypal subscribe failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.redirect(absoluteUrl("/pricing?error=unavailable", request), 303);
  }
}
