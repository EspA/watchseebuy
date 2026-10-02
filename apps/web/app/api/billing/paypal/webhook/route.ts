import { NextResponse } from "next/server";
import { paypalRequest, stringField } from "@/lib/paypal";
import {
  parseSubscription,
  syncPaypalSubscription,
} from "@/lib/paypal-subscription";

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    return NextResponse.json({ error: "PayPal webhook is not configured" }, { status: 503 });
  }

  const raw = await request.text();
  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const verified = await verifyWebhook(request.headers, webhookId, event);
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const type = stringField(event, "event_type");
  if (!type.startsWith("BILLING.SUBSCRIPTION.")) {
    return NextResponse.json({ ok: true });
  }

  const subscription = parseSubscription(record(event)?.resource);
  if (!subscription) return NextResponse.json({ ok: true });

  try {
    await syncPaypalSubscription(subscription);
  } catch (error) {
    console.error(
      "paypal webhook failed",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Could not apply subscription" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

async function verifyWebhook(headers: Headers, webhookId: string, event: unknown) {
  try {
    const result = await paypalRequest("POST", "/v1/notifications/verify-webhook-signature", {
      auth_algo: headers.get("paypal-auth-algo") ?? "",
      cert_url: headers.get("paypal-cert-url") ?? "",
      transmission_id: headers.get("paypal-transmission-id") ?? "",
      transmission_sig: headers.get("paypal-transmission-sig") ?? "",
      transmission_time: headers.get("paypal-transmission-time") ?? "",
      webhook_id: webhookId,
      webhook_event: event,
    });
    return stringField(result, "verification_status") === "SUCCESS";
  } catch (error) {
    console.error(
      "paypal webhook verify failed",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}
