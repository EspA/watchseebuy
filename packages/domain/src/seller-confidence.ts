export const CONFIDENCE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Any" },
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
];

const QUALITY_FLOOR = 90;
const QUALITY_SPAN = 10;
const QUALITY_POWER = 1.5;
const FULL_CERTAINTY_COUNT = 500;

export type SellerFeedback = {
  sellerFeedbackScore?: number;
  sellerFeedbackPercentage?: number;
};

export function parseMinConfidence(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 10) return undefined;
  return n;
}

export function sellerConfidence(listing: SellerFeedback): number {
  const count = listing.sellerFeedbackScore;
  const pct = listing.sellerFeedbackPercentage;
  if (count === undefined || pct === undefined) return 0;
  if (!Number.isFinite(count) || !Number.isFinite(pct) || count < 0) return 0;

  const quality = Math.pow(
    Math.max(0, (Math.min(pct, 100) - QUALITY_FLOOR) / QUALITY_SPAN),
    QUALITY_POWER,
  );
  const certainty = Math.min(
    1,
    Math.log10(count + 1) / Math.log10(FULL_CERTAINTY_COUNT + 1),
  );
  return Math.max(0, Math.min(10, Math.round(10 * quality * certainty)));
}

export function sellerConfidenceTone(
  score: number,
): "high" | "mid" | "low" {
  if (score >= 8) return "high";
  if (score >= 5) return "mid";
  return "low";
}

export function describeSellerFeedback(listing: SellerFeedback): string {
  const count = listing.sellerFeedbackScore;
  const pct = listing.sellerFeedbackPercentage;
  if (count === undefined || pct === undefined) {
    return "Seller feedback unavailable";
  }
  return `${formatFeedbackPct(pct)} · ${count.toLocaleString("en-US")} feedback`;
}

export function listingMatchesConfidence(
  listing: SellerFeedback,
  minConfidence: number | undefined,
): boolean {
  if (minConfidence === undefined) return true;
  return sellerConfidence(listing) >= minConfidence;
}

function formatFeedbackPct(pct: number): string {
  const rounded = Math.round(pct * 10) / 10;
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)}%`;
}
