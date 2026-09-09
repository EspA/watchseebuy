import type { CandidateListing, PriceScore } from "@waitseebuy/domain";
import type { AlertEmailListing } from "./alert-email.ts";

export function listingFromPayload(
  payload: unknown,
  buyUrl: string,
): AlertEmailListing | null {
  if (!payload || typeof payload !== "object") return null;
  const row = payload as Partial<CandidateListing> & { title?: unknown };
  if (typeof row.title !== "string" || typeof row.ebayItemId !== "string") {
    return null;
  }
  if (
    typeof row.itemCents !== "number" ||
    typeof row.shippingCents !== "number" ||
    (row.listingType !== "bin" && row.listingType !== "auction")
  ) {
    return null;
  }

  const listing: AlertEmailListing = {
    ebayItemId: row.ebayItemId,
    title: row.title,
    itemCents: row.itemCents,
    shippingCents: row.shippingCents,
    listingType: row.listingType,
    buyUrl,
  };
  if (typeof row.restItemId === "string") listing.restItemId = row.restItemId;
  if (typeof row.importEstimateCents === "number") {
    listing.importEstimateCents = row.importEstimateCents;
  }
  if (Array.isArray(row.buyingOptions)) listing.buyingOptions = row.buyingOptions;
  if (typeof row.sellerFeedbackScore === "number") {
    listing.sellerFeedbackScore = row.sellerFeedbackScore;
  }
  if (typeof row.sellerFeedbackPercentage === "number") {
    listing.sellerFeedbackPercentage = row.sellerFeedbackPercentage;
  }
  if (typeof row.imageUrl === "string") listing.imageUrl = row.imageUrl;
  if (typeof row.condition === "string") listing.condition = row.condition;
  if (typeof row.itemLocationCountry === "string") {
    listing.itemLocationCountry = row.itemLocationCountry;
  }
  if (typeof row.webUrl === "string") listing.webUrl = row.webUrl;
  if (row.identity) listing.identity = row.identity;
  if (isPriceScore(row.priceScore)) listing.priceScore = row.priceScore;
  return listing;
}

function isPriceScore(value: unknown): value is PriceScore {
  if (!value || typeof value !== "object") return false;
  const score = value as PriceScore;
  return (
    (score.score === null || typeof score.score === "number") &&
    (score.tone === "high" || score.tone === "mid" || score.tone === "low")
  );
}
