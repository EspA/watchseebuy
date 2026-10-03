import { landedCostCents } from "./pricing.ts";
import {
  listingMatchesPriceScore,
  type PriceScore,
} from "./price-score.ts";
import type {
  ConditionDescriptor,
  ProductIdentity,
  TypedNameValue,
} from "./product-identity.ts";
import { listingMatchesConfidence } from "./seller-confidence.ts";
import {
  listingMatchesCondition,
  listingMatchesExcludeWords,
  listingMatchesGrader,
  listingMatchesItemLocation,
  listingMatchesListingType,
  type WatchCriteria,
} from "./watch-criteria.ts";

export type CandidateListing = {
  ebayItemId: string;
  restItemId?: string;
  title: string;
  itemCents: number;
  shippingCents: number;
  importEstimateCents?: number;
  listingType: "bin" | "auction";
  buyingOptions?: string[];
  sellerUsername?: string;
  sellerFeedbackScore?: number;
  sellerFeedbackPercentage?: number;
  currentBidCents?: number;
  imageUrl?: string;
  condition?: string;
  conditionId?: string;
  categoryIds?: string[];
  itemLocationCountry?: string;
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
  const landedCents = landedCostCents({
    itemCents: listing.itemCents,
    shippingCents: listing.shippingCents,
    ...(listing.importEstimateCents !== undefined
      ? { importEstimateCents: listing.importEstimateCents }
      : {}),
  });

  // eBay already matched the coverage keywords, including loose titles
  // ("I Heart" for "I Love"). Requiring every word here dropped those listings.

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

  if (!listingMatchesExcludeWords(listing, watch.excludeKeywords)) {
    return { matches: false, landedCents, reasons: ["excluded words"] };
  }
  if (!listingMatchesCondition(listing, watch.condition)) {
    return { matches: false, landedCents, reasons: ["condition"] };
  }
  if (!listingMatchesGrader(listing, watch.grader, watch.cardGrade)) {
    return { matches: false, landedCents, reasons: ["grader"] };
  }

  if (!listingMatchesListingType(listing, watch.listingType)) {
    return { matches: false, landedCents, reasons: ["listing type"] };
  }
  if (!listingMatchesItemLocation(listing, watch.itemLocation)) {
    return { matches: false, landedCents, reasons: ["item location"] };
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

  reasons.push("ebay match");
  if (
    watch.minLandedCents !== undefined ||
    watch.maxLandedCents !== undefined
  ) {
    reasons.push("within price range");
  }
  return { matches: true, landedCents, reasons };
}
