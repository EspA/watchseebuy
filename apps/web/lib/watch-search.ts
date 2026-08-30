import type { WatchCriteria } from "@waitseebuy/domain";
import { searchParamsFromIntent } from "@/lib/search-params";

export function searchHrefForWatch(input: {
  label: string;
  criteria: WatchCriteria | null;
  watchId: string;
}): string {
  const q = queryForWatch(input.label, input.criteria);
  if (!input.criteria) {
    const params = new URLSearchParams();
    params.set("q", q);
    params.set("watch", input.watchId);
    return `/search?${params.toString()}`;
  }
  return `/search?${searchParamsFromIntent(q, input.criteria, input.watchId)}`;
}

function prettyDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? String(dollars) : dollars.toFixed(2);
}

function queryForWatch(label: string, criteria: WatchCriteria | null): string {
  let q = label.trim();
  if (
    criteria?.minLandedCents !== undefined &&
    !/\b(?:over|above|from)\s+\$?\s*\d/i.test(q)
  ) {
    q = `${q} over $${prettyDollars(criteria.minLandedCents)}`;
  }
  if (
    criteria?.maxLandedCents !== undefined &&
    !/\bunder\s+\$?\s*\d/i.test(q)
  ) {
    q = `${q} under $${prettyDollars(criteria.maxLandedCents)}`;
  }
  return q;
}
