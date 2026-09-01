import { landedCostCents } from "./pricing";
import {
  listingMatchesPriceScore,
  type PriceScore,
} from "./price-score";
import type {
  ConditionDescriptor,
  ProductIdentity,
  TypedNameValue,
} from "./product-identity";
import { listingMatchesConfidence } from "./seller-confidence";
import {
  listingMatchesCondition,
  listingMatchesListingType,
  listingPassesExcludeKeywords,
  type WatchCriteria,
} from "./watch-criteria";

export type CandidateListing = {
  ebayItemId: string;
  restItemId?: string;
  title: string;
  itemCents: number;
  shippingCents: number;
  importEstimateCents?: number;
  listingType: "bin" | "auction";
  buyingOptions?: string[];
  sellerFeedbackScore?: number;
  sellerFeedbackPercentage?: number;
  currentBidCents?: number;
  imageUrl?: string;
  condition?: string;
  conditionId?: string;
  webUrl?: string;
  description?: string;
  epid?: string;
  gtin?: string;
  brand?: string;
  mpn?: string;
  localizedAspects?: TypedNameValue[];
  conditionDescriptors?: ConditionDescriptor[];
  identity?: ProductIdentity;
  priceScore?: PriceScore;
};

export type MatchDecision = {
  matches: boolean;
  landedCents: number;
  reasons: string[];
};

export function matchListing(
  listing: CandidateListing,
  watch: WatchCriteria,
): MatchDecision {
  const reasons: string[] = [];
  const haystack = listing.title.toLowerCase();
  const landedCents = landedCostCents({
    itemCents: listing.itemCents,
    shippingCents: listing.shippingCents,
    ...(listing.importEstimateCents !== undefined
      ? { importEstimateCents: listing.importEstimateCents }
      : {}),
  });

  if (!listingPassesExcludeKeywords(listing, watch.excludeKeywords)) {
    return { matches: false, landedCents, reasons: ["excluded word"] };
  }

  const tokens = watch.query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  const missing = tokens.filter((t) => !haystack.includes(t));
  if (missing.length > 0) {
    return {
      matches: false,
      landedCents,
      reasons: [`missing tokens: ${missing.join(", ")}`],
    };
  }

  if (
    watch.minLandedCents !== undefined &&
    landedCents < watch.minLandedCents
  ) {
    return { matches: false, landedCents, reasons: ["under min price"] };
  }
  if (
    watch.maxLandedCents !== undefined &&
    landedCents > watch.maxLandedCents
  ) {
    return { matches: false, landedCents, reasons: ["over max price"] };
  }

  if (!listingMatchesCondition(listing, watch.condition)) {
    return { matches: false, landedCents, reasons: ["condition"] };
  }

  if (!listingMatchesListingType(listing, watch.listingType)) {
    return { matches: false, landedCents, reasons: ["listing type"] };
  }
  if (!listingMatchesConfidence(listing, watch.minConfidence)) {
    return { matches: false, landedCents, reasons: ["seller confidence"] };
  }
  if (!listingMatchesPriceScore(listing, watch.minPriceScore)) {
    return { matches: false, landedCents, reasons: ["price score"] };
  }
  if (
    watch.listingType === "auction_below" &&
    watch.auctionMaxCents !== undefined &&
    (listing.currentBidCents ?? listing.itemCents) > watch.auctionMaxCents
  ) {
    return { matches: false, landedCents, reasons: ["auction over cap"] };
  }

  reasons.push("title tokens");
  if (
    watch.minLandedCents !== undefined ||
    watch.maxLandedCents !== undefined
  ) {
    reasons.push("within price range");
  }
  return { matches: true, landedCents, reasons };
}
