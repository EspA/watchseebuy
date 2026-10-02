import {
  adminGrantExpiresAt,
  COMPLIMENTARY_INTERVAL,
  fallbackPeriodEnd,
  isBillingInterval,
  type AdminBillingInterval,
  type BillingPlan,
} from "@watchseebuy/domain";
import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { paypalCatalog, subscriptions } from "./schema";
import { isUnauthenticatedUserId } from "./telemetry";

export type UserSubscription = {
  userId: string;
  plan: string;
  billingInterval: string | null;
  status: string;
  expiresAt: Date | null;
  paypalSubscriptionId: string | null;
};

export async function getUserSubscription(
  db: Database,
  userId: string,
): Promise<UserSubscription | null> {
  const [row] = await db
    .select({
      userId: subscriptions.userId,
      plan: subscriptions.plan,
      billingInterval: subscriptions.billingInterval,
      status: subscriptions.status,
      expiresAt: subscriptions.expiresAt,
      paypalSubscriptionId: subscriptions.paypalSubscriptionId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getSubscriptionByPaypalId(
  db: Database,
  paypalSubscriptionId: string,
): Promise<UserSubscription | null> {
  const [row] = await db
    .select({
      userId: subscriptions.userId,
      plan: subscriptions.plan,
      billingInterval: subscriptions.billingInterval,
      status: subscriptions.status,
      expiresAt: subscriptions.expiresAt,
      paypalSubscriptionId: subscriptions.paypalSubscriptionId,
    })
    .from(subscriptions)
    .where(eq(subscriptions.paypalSubscriptionId, paypalSubscriptionId))
    .limit(1);
  return row ?? null;
}

export async function setAdminUserPlan(
  db: Database,
  userId: string,
  grant: { plan: BillingPlan; interval: AdminBillingInterval | null },
) {
  if (isUnauthenticatedUserId(userId)) {
    throw new Error("Cannot change plan for unauthenticated guests");
  }
  const now = new Date();
  if (grant.plan === "free") {
    await upsertUserSubscription(db, {
      userId,
      plan: "free",
      billingInterval: null,
      status: "expired",
      expiresAt: now,
      paypalSubscriptionId: null,
    });
    return;
  }
  if (grant.interval === COMPLIMENTARY_INTERVAL) {
    await upsertUserSubscription(db, {
      userId,
      plan: grant.plan,
      billingInterval: COMPLIMENTARY_INTERVAL,
      status: "active",
      expiresAt: adminGrantExpiresAt(now),
      paypalSubscriptionId: null,
    });
    return;
  }
  if (!grant.interval || !isBillingInterval(grant.interval)) {
    throw new Error("Paid admin grants need a billing interval");
  }
  await upsertUserSubscription(db, {
    userId,
    plan: grant.plan,
    billingInterval: grant.interval,
    status: "active",
    expiresAt: fallbackPeriodEnd(grant.interval, now),
    paypalSubscriptionId: null,
  });
}

export async function upsertUserSubscription(
  db: Database,
  input: UserSubscription,
) {
  await db
    .insert(subscriptions)
    .values({ ...input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan: input.plan,
        billingInterval: input.billingInterval,
        status: input.status,
        expiresAt: input.expiresAt,
        paypalSubscriptionId: input.paypalSubscriptionId,
        updatedAt: new Date(),
      },
    });
}

export async function getPaypalCatalogId(
  db: Database,
  key: string,
): Promise<string | null> {
  const [row] = await db
    .select({ paypalId: paypalCatalog.paypalId })
    .from(paypalCatalog)
    .where(eq(paypalCatalog.key, key))
    .limit(1);
  return row?.paypalId ?? null;
}

export async function paypalCatalogKeyForId(
  db: Database,
  paypalId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ key: paypalCatalog.key })
    .from(paypalCatalog)
    .where(eq(paypalCatalog.paypalId, paypalId))
    .limit(1);
  return row?.key ?? null;
}

export async function savePaypalCatalogId(
  db: Database,
  key: string,
  paypalId: string,
) {
  await db
    .insert(paypalCatalog)
    .values({ key, paypalId })
    .onConflictDoUpdate({
      target: paypalCatalog.key,
      set: { paypalId },
    });
}
