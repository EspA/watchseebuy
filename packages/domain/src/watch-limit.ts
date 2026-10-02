import { PLAN_ENTITLEMENTS, type BillingPlan } from "./billing.ts";

export const FREE_WATCH_LIMIT = PLAN_ENTITLEMENTS.free.maxWatches;

export type WatchPlan = BillingPlan;

export function watchLimitForPlan(plan: WatchPlan = "free"): number {
  return PLAN_ENTITLEMENTS[plan].maxWatches;
}

export function atWatchLimit(count: number, plan: WatchPlan = "free"): boolean {
  const limit = watchLimitForPlan(plan);
  return Number.isFinite(limit) && count >= limit;
}
