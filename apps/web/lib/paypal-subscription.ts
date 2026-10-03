import {
  getDb,
  getPaypalCatalogId,
  getSubscriptionByPaypalId,
  getUserSubscription,
  paypalCatalogKeyForId,
  savePaypalCatalogId,
  upsertUserSubscription,
} from "@watchseebuy/db";
import {
  cancelledExpiresAt,
  fallbackPeriodEnd,
  isBillingInterval,
  isPaidPlan,
  paidPlanKey,
  parsePaidPlanKey,
  type BillingInterval,
  type PaidPlan,
} from "@watchseebuy/domain";
import {
  paypalProductKey,
  paypalRequest,
  planCharge,
  stringField,
} from "@/lib/paypal";
import { sendSubscriptionWelcome } from "@/lib/subscription-welcome";

export type PaypalSubscription = {
  id: string;
  status: string;
  planId: string;
  customId: string;
  nextBillingTime: Date | null;
};

export async function createApprovalUrl(input: {
  userId: string;
  email: string;
  plan: PaidPlan;
  interval: BillingInterval;
  returnUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const planId = await ensurePaypalPlan(input.plan, input.interval);
  const created = await paypalRequest("POST", "/v1/billing/subscriptions", {
    plan_id: planId,
    custom_id: input.userId,
    subscriber: { email_address: input.email },
    application_context: {
      brand_name: "WatchSeeBuy",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
    },
  });
  const links = Array.isArray(record(created)?.links) ? record(created)?.links : [];
  if (!Array.isArray(links)) throw new Error("PayPal approval link missing");
  for (const link of links) {
    if (stringField(link, "rel") === "approve") {
      const href = stringField(link, "href");
      if (href) return href;
    }
  }
  throw new Error("PayPal approval link missing");
}

export async function fetchPaypalSubscription(
  subscriptionId: string,
): Promise<PaypalSubscription> {
  const json = await paypalRequest(
    "GET",
    `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
  const parsed = parseSubscription(json);
  if (!parsed) throw new Error("PayPal subscription missing");
  if (parsed.status === "APPROVED") {
    await paypalRequest(
      "POST",
      `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/activate`,
      { reason: "Buyer approved the subscription" },
    );
    const again = await paypalRequest(
      "GET",
      `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`,
    );
    const active = parseSubscription(again);
    if (!active) throw new Error("PayPal subscription missing");
    return active;
  }
  return parsed;
}

export async function syncPaypalSubscription(
  subscription: PaypalSubscription,
  sessionUserId?: string,
) {
  const db = getDb();
  const byPaypal = await getSubscriptionByPaypalId(db, subscription.id);
  const userId = sessionUserId || subscription.customId || byPaypal?.userId || "";
  if (!userId) return;
  if (sessionUserId && subscription.customId && subscription.customId !== sessionUserId) {
    throw new Error("PayPal subscription belongs to another account");
  }

  const current = await getUserSubscription(db, userId);
  const replaced =
    current?.paypalSubscriptionId &&
    current.paypalSubscriptionId !== subscription.id;
  if (replaced && subscription.status !== "ACTIVE") return;

  const catalogKey = subscription.planId
    ? await paypalCatalogKeyForId(db, subscription.planId)
    : null;
  const parsed = catalogKey ? parsePaidPlanKey(catalogKey) : null;
  const plan = parsed?.plan ?? (current && isPaidPlan(current.plan) ? current.plan : null);
  const interval =
    parsed?.interval ??
    (current?.billingInterval && isBillingInterval(current.billingInterval)
      ? current.billingInterval
      : null);
  if (!plan || !interval) return;

  if (subscription.status === "EXPIRED" || subscription.status === "SUSPENDED") {
    await upsertUserSubscription(db, {
      userId,
      plan,
      billingInterval: interval,
      status: "cancelled",
      expiresAt: new Date(),
      paypalSubscriptionId: subscription.id,
    });
    return;
  }

  if (subscription.status === "CANCELLED") {
    await upsertUserSubscription(db, {
      userId,
      plan,
      billingInterval: interval,
      status: "cancelled",
      expiresAt: cancelledExpiresAt(current?.expiresAt ?? null, subscription.nextBillingTime),
      paypalSubscriptionId: subscription.id,
    });
    return;
  }

  if (subscription.status !== "ACTIVE") return;

  if (
    current?.paypalSubscriptionId === subscription.id &&
    current.status === "cancelled"
  ) {
    return;
  }

  if (current?.paypalSubscriptionId && current.paypalSubscriptionId !== subscription.id) {
    await cancelPaypalSubscription(current.paypalSubscriptionId);
  }
  const renewsAt = subscription.nextBillingTime ?? fallbackPeriodEnd(interval);
  const justActivated = !(
    current?.status === "active" && current.paypalSubscriptionId === subscription.id
  );
  await upsertUserSubscription(db, {
    userId,
    plan,
    billingInterval: interval,
    status: "active",
    expiresAt: renewsAt,
    paypalSubscriptionId: subscription.id,
  });
  if (!justActivated) return;
  try {
    await sendSubscriptionWelcome({
      userId,
      plan,
      interval,
      renewsAt,
      paypalSubscriptionId: subscription.id,
    });
  } catch (error) {
    console.error(
      "subscription welcome email failed",
      error instanceof Error ? error.message : error,
    );
  }
}

export function parseSubscription(value: unknown): PaypalSubscription | null {
  const id = stringField(value, "id");
  const status = stringField(value, "status");
  if (!id || !status) return null;
  const billing = record(value)?.billing_info;
  const next = stringField(billing, "next_billing_time");
  const expires = next ? new Date(next) : null;
  return {
    id,
    status,
    planId: stringField(value, "plan_id"),
    customId: stringField(value, "custom_id"),
    nextBillingTime: expires && !Number.isNaN(expires.getTime()) ? expires : null,
  };
}

async function ensurePaypalPlan(plan: PaidPlan, interval: BillingInterval) {
  const db = getDb();
  const key = paidPlanKey(plan, interval);
  const existing = await getPaypalCatalogId(db, key);
  if (existing) return existing;
  const productId = await ensureProduct();
  const charge = planCharge(plan, interval);
  const created = await paypalRequest("POST", "/v1/billing/plans", {
    product_id: productId,
    name: plan === "premium_plus" ? "WatchSeeBuy Premium+" : "WatchSeeBuy Premium",
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: charge.interval_unit, interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: charge.value, currency_code: charge.currency_code },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CANCEL",
      payment_failure_threshold: 1,
    },
  });
  const id = stringField(created, "id");
  if (!id) throw new Error("PayPal plan was not created");
  await savePaypalCatalogId(db, key, id);
  return id;
}

async function ensureProduct() {
  const db = getDb();
  const existing = await getPaypalCatalogId(db, paypalProductKey());
  if (existing) return existing;
  const created = await paypalRequest("POST", "/v1/catalogs/products", {
    name: "WatchSeeBuy",
    type: "SERVICE",
    category: "SOFTWARE",
  });
  const id = stringField(created, "id");
  if (!id) throw new Error("PayPal product was not created");
  await savePaypalCatalogId(db, paypalProductKey(), id);
  return id;
}

export async function cancelUserSubscription(
  userId: string,
): Promise<"cancelled" | "unchanged"> {
  const db = getDb();
  const current = await getUserSubscription(db, userId);
  if (
    !current?.paypalSubscriptionId ||
    current.status !== "active" ||
    !isPaidPlan(current.plan)
  ) {
    return "unchanged";
  }

  try {
    await paypalRequest(
      "POST",
      `/v1/billing/subscriptions/${encodeURIComponent(current.paypalSubscriptionId)}/cancel`,
      { reason: "Cancelled in WatchSeeBuy settings" },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("(422)")) throw error;
  }

  let remote: PaypalSubscription | null = null;
  try {
    remote = await fetchPaypalSubscription(current.paypalSubscriptionId);
  } catch (error) {
    console.error(
      "paypal subscription refresh after cancel failed",
      error instanceof Error ? error.message : error,
    );
  }

  if (remote?.status === "CANCELLED") {
    await syncPaypalSubscription(remote, userId);
    return "cancelled";
  }

  await upsertUserSubscription(db, {
    userId,
    plan: current.plan,
    billingInterval: current.billingInterval,
    status: "cancelled",
    expiresAt: current.expiresAt,
    paypalSubscriptionId: current.paypalSubscriptionId,
  });
  return "cancelled";
}

async function cancelPaypalSubscription(subscriptionId: string) {
  try {
    await paypalRequest(
      "POST",
      `/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
      { reason: "Replaced by a new WatchSeeBuy subscription" },
    );
  } catch (error) {
    console.error(
      "paypal cancel failed",
      error instanceof Error ? error.message : error,
    );
  }
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}
