import { getDb, getUserSubscription } from "@watchseebuy/db";
import {
  effectiveBillingPlan,
  isBillingInterval,
  type BillingInterval,
  type BillingPlan,
  type SubscriptionSnapshot,
} from "@watchseebuy/domain";

export type CurrentBilling = {
  plan: BillingPlan;
  interval: BillingInterval | null;
  status: "active" | "cancelled" | null;
  expiresAt: Date | null;
};

export async function currentBilling(userId: string): Promise<CurrentBilling> {
  const row = await getUserSubscription(getDb(), userId);
  const snapshot: SubscriptionSnapshot | null = row
    ? {
        plan: row.plan,
        status: row.status,
        expiresAt: row.expiresAt,
        billingInterval: row.billingInterval,
      }
    : null;
  const plan = effectiveBillingPlan(snapshot);
  const interval =
    plan !== "free" && snapshot?.billingInterval && isBillingInterval(snapshot.billingInterval)
      ? snapshot.billingInterval
      : null;
  const status =
    plan !== "free" && (snapshot?.status === "active" || snapshot?.status === "cancelled")
      ? snapshot.status
      : null;
  return {
    plan,
    interval,
    status,
    expiresAt: plan === "free" ? null : (snapshot?.expiresAt ?? null),
  };
}
