export const BILLING_PLANS = ["free", "premium", "premium_plus"] as const;

export type BillingPlan = (typeof BILLING_PLANS)[number];
export type PaidPlan = Exclude<BillingPlan, "free">;
export type BillingInterval = "monthly" | "annual";

const HOUR_MS = 60 * 60 * 1000;

export const PLAN_ENTITLEMENTS: Record<
  BillingPlan,
  {
    maxWatches: number;
    onChangeIntervalMs: number;
    aiSearchesPerMonth: number | null;
  }
> = {
  free: {
    maxWatches: 10,
    onChangeIntervalMs: HOUR_MS,
    aiSearchesPerMonth: 100,
  },
  premium: {
    maxWatches: 100,
    onChangeIntervalMs: 15 * 60 * 1000,
    aiSearchesPerMonth: null,
  },
  premium_plus: {
    maxWatches: 300,
    onChangeIntervalMs: 5 * 60 * 1000,
    aiSearchesPerMonth: null,
  },
};

/** Annual is ten monthly payments: two months free. */
export const PAID_PRICE_CENTS: Record<PaidPlan, Record<BillingInterval, number>> = {
  premium: { monthly: 499, annual: 499 * 10 },
  premium_plus: { monthly: 999, annual: 999 * 10 },
};

export type SubscriptionSnapshot = {
  plan: string;
  status: string;
  expiresAt: Date | null;
  billingInterval: string | null;
};

export function isBillingPlan(value: string): value is BillingPlan {
  return (BILLING_PLANS as readonly string[]).includes(value);
}

export function isPaidPlan(value: string): value is PaidPlan {
  return value === "premium" || value === "premium_plus";
}

export function isBillingInterval(value: string): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export function paidPlanKey(plan: PaidPlan, interval: BillingInterval): string {
  return `${plan}_${interval}`;
}

export function parsePaidPlanKey(
  key: string,
): { plan: PaidPlan; interval: BillingInterval } | null {
  const match = /^(premium_plus|premium)_(monthly|annual)$/.exec(key);
  if (!match) return null;
  const plan = match[1];
  const interval = match[2];
  if (!plan || !interval || !isPaidPlan(plan) || !isBillingInterval(interval)) {
    return null;
  }
  return { plan, interval };
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function paypalAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function effectiveBillingPlan(
  snapshot: SubscriptionSnapshot | null,
  now = new Date(),
): BillingPlan {
  if (!snapshot || !isPaidPlan(snapshot.plan)) return "free";
  if (snapshot.status !== "active" && snapshot.status !== "cancelled") return "free";
  if (!snapshot.expiresAt || snapshot.expiresAt.getTime() <= now.getTime()) {
    return "free";
  }
  return snapshot.plan;
}

/** Keep the paid period when a subscription is cancelled before it ends. */
export function cancelledExpiresAt(
  stored: Date | null,
  nextBillingTime: Date | null,
  now = new Date(),
): Date {
  const candidates = [stored, nextBillingTime].filter(
    (date): date is Date =>
      date instanceof Date && !Number.isNaN(date.getTime()),
  );
  const future = candidates.filter((date) => date.getTime() > now.getTime());
  const pool = future.length > 0 ? future : candidates;
  if (pool.length === 0) return now;
  return pool.reduce((latest, date) =>
    date.getTime() > latest.getTime() ? date : latest,
  );
}

export function fallbackPeriodEnd(
  interval: BillingInterval,
  now = new Date(),
): Date {
  const next = new Date(now.getTime());
  if (interval === "annual") next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export function agentSearchMonthKey(userId: string, now = new Date()): string {
  return `user:${userId}:${now.toISOString().slice(0, 7)}`;
}

/** Shared coverage polls at the fastest on-change plan watching it. */
export function coveragePollIntervalMs(
  watches: { alertFrequency: string; plan: BillingPlan }[],
  defaultPollMs: number,
): number {
  let fastest = defaultPollMs;
  for (const watch of watches) {
    if (watch.alertFrequency !== "on_change") continue;
    fastest = Math.min(fastest, PLAN_ENTITLEMENTS[watch.plan].onChangeIntervalMs);
  }
  return fastest;
}
