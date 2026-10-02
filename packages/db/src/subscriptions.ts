import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { paypalCatalog, subscriptions } from "./schema";

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
