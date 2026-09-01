import { landedCostCents } from "./pricing.ts";
import {
  type IdentityConfidence,
  type ProductIdentity,
} from "./product-identity.ts";
import { percentVsMedian } from "./comps.ts";

export const PRICE_SCORE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Any" },
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
];

export type PriceScore = {
  score: number | null;
  tone: "high" | "mid" | "low";
  deltaPct: number | null;
  sampleSize: number;
  reason: string;
};

export function parseMinPriceScore(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 10) return undefined;
  return n;
}

export function listingMatchesPriceScore(
  listing: { priceScore?: PriceScore },
  minPriceScore: number | undefined,
): boolean {
  if (minPriceScore === undefined) return true;
  const score = listing.priceScore?.score;
  return score !== null && score !== undefined && score >= minPriceScore;
}

export type ScoredListing = {
  ebayItemId: string;
  itemCents: number;
  shippingCents: number;
  importEstimateCents?: number;
  identity?: ProductIdentity;
};

const MIN_SAMPLE = 2;
const STRONG_SCORE = 8;

export function priceScoreTone(
  score: number | null,
): "high" | "mid" | "low" {
  if (score === null) return "low";
  if (score >= 8) return "high";
  if (score >= 5) return "mid";
  return "low";
}

export function medianCents(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const left = sorted[mid - 1];
  const right = sorted[mid];
  if (sorted.length === 0 || right === undefined) return 0;
  if (sorted.length % 2 === 1) return right;
  if (left === undefined) return right;
  return Math.round((left + right) / 2);
}

export function scoreVersusMedian(
  landedCents: number,
  peers: number[],
  confidence: IdentityConfidence,
): PriceScore {
  const sampleSize = peers.length;
  if (confidence === "low") {
    return {
      score: null,
      tone: "low",
      deltaPct: null,
      sampleSize,
      reason: "Could not identify this product confidently",
    };
  }
  if (sampleSize < MIN_SAMPLE) {
    return {
      score: null,
      tone: "low",
      deltaPct: null,
      sampleSize,
      reason: "Need at least 2 similar listings to score",
    };
  }

  const median = medianCents(peers);
  const deltaPct = percentVsMedian(landedCents, median);
  if (deltaPct === null) {
    return {
      score: null,
      tone: "low",
      deltaPct: null,
      sampleSize,
      reason: "Need at least 2 similar listings to score",
    };
  }

  let score = Math.max(0, Math.min(10, Math.round(5 - deltaPct / 5)));
  if (confidence === "medium" && score >= STRONG_SCORE && sampleSize < 3) {
    score = 7;
  }

  return {
    score,
    tone: priceScoreTone(score),
    deltaPct,
    sampleSize,
    reason: describeDelta(deltaPct, sampleSize),
  };
}

export function attachPriceScores<T extends ScoredListing>(
  listings: T[],
): Array<T & { priceScore: PriceScore }> {
  const groups = new Map<string, number[]>();
  const landedById = new Map<string, number>();

  for (const listing of listings) {
    const landed = landedOf(listing);
    landedById.set(listing.ebayItemId, landed);
    const key = listing.identity?.itemKey;
    if (!key || listing.identity?.confidence === "low") continue;
    const bucket = groups.get(key) ?? [];
    bucket.push(landed);
    groups.set(key, bucket);
  }

  return listings.map((listing) => {
    const identity = listing.identity;
    const landed = landedById.get(listing.ebayItemId) ?? landedOf(listing);
    const peers = identity ? (groups.get(identity.itemKey) ?? []) : [];
    return {
      ...listing,
      priceScore: identity
        ? scoreVersusMedian(landed, peers, identity.confidence)
        : {
            score: null,
            tone: "low" as const,
            deltaPct: null,
            sampleSize: 0,
            reason: "Could not identify this product confidently",
          },
    };
  });
}

export function describePriceScore(
  score: PriceScore,
  identity?: ProductIdentity,
): string {
  const match = identity?.label ? ` · ${identity.label}` : "";
  return `${score.reason}${match}`;
}

function landedOf(listing: ScoredListing): number {
  return landedCostCents({
    itemCents: listing.itemCents,
    shippingCents: listing.shippingCents,
    ...(listing.importEstimateCents !== undefined
      ? { importEstimateCents: listing.importEstimateCents }
      : {}),
  });
}

function describeDelta(deltaPct: number, sampleSize: number): string {
  const n = `${sampleSize} similar listing${sampleSize === 1 ? "" : "s"}`;
  if (deltaPct === 0) return `At the median of ${n}`;
  if (deltaPct < 0) return `${Math.abs(deltaPct)}% below the median of ${n}`;
  return `${deltaPct}% above the median of ${n}`;
}
