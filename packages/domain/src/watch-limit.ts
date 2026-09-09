export const FREE_WATCH_LIMIT = 10;

export type WatchPlan = "free" | "premium";

export function watchLimitForPlan(plan: WatchPlan = "free"): number {
  if (plan === "premium") return Number.POSITIVE_INFINITY;
  return FREE_WATCH_LIMIT;
}

export function atWatchLimit(count: number, plan: WatchPlan = "free"): boolean {
  const limit = watchLimitForPlan(plan);
  return Number.isFinite(limit) && count >= limit;
}
