import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/absolute-url";
import { fetchPaypalSubscription, syncPaypalSubscription } from "@/lib/paypal-subscription";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  const subscriptionId = new URL(request.url).searchParams.get("subscription_id") ?? "";
  if (!session || !subscriptionId) {
    return NextResponse.redirect(absoluteUrl("/pricing?error=unavailable", request), 303);
  }

  try {
    const subscription = await fetchPaypalSubscription(subscriptionId);
    await syncPaypalSubscription(subscription, session.user.id);
    return NextResponse.redirect(absoluteUrl("/settings?plan=active", request), 303);
  } catch (error) {
    console.error(
      "paypal return failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.redirect(absoluteUrl("/pricing?error=unavailable", request), 303);
  }
}
