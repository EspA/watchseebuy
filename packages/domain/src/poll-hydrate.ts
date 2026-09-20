import { matchListing, type CandidateListing } from "./matcher.ts";
import type { WatchCriteria } from "./watch-criteria.ts";

/** Hard cap so one broad coverage query cannot spend the daily Browse budget. */
export const DEFAULT_WORKER_GET_ITEM_LIMIT = 8;

/**
 * getItem (PRODUCT) is only useful when search + our listing cache still lack a
 * catalog key. Title identity is enough to match; this is for better price scores.
 */
export function needsProductHydration(listing: CandidateListing): boolean {
  if (!listing.restItemId) return false;
  if (listing.epid || listing.gtin) return false;
  if (listing.brand && listing.mpn) return false;
  if (listing.localizedAspects && listing.localizedAspects.length > 0) {
    return false;
  }
  return true;
}

/**
 * Cheap prefilter: ignore minPriceScore so a listing that only needs PRODUCT
 * identity to score can still be hydrated once.
 */
export function watchForHydratePrefetch(watch: WatchCriteria): WatchCriteria {
  if (watch.minPriceScore === undefined) return watch;
  const next = { ...watch };
  delete next.minPriceScore;
  return next;
}

export function listingsNeedingProductHydration(
  listings: CandidateListing[],
  watches: WatchCriteria[],
  limit = DEFAULT_WORKER_GET_ITEM_LIMIT,
): CandidateListing[] {
  if (watches.length === 0 || limit <= 0) return [];
  const prefetch = watches.map(watchForHydratePrefetch);
  const needed = listings.filter((listing) => {
    if (!needsProductHydration(listing)) return false;
    return prefetch.some((watch) => matchListing(listing, watch).matches);
  });
  return needed.slice(0, limit);
}

export function listingFromStoredPayload(
  payload: unknown,
): CandidateListing | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const row = payload as Record<string, unknown>;
  if (typeof row.ebayItemId !== "string" || !row.ebayItemId) return null;
  if (typeof row.title !== "string" || !row.title) return null;
  if (typeof row.itemCents !== "number" || typeof row.shippingCents !== "number") {
    return null;
  }
  if (row.listingType !== "bin" && row.listingType !== "auction") return null;

  const listing: CandidateListing = {
    ebayItemId: row.ebayItemId,
    title: row.title,
    itemCents: row.itemCents,
    shippingCents: row.shippingCents,
    listingType: row.listingType,
  };
  if (typeof row.restItemId === "string" && row.restItemId) {
    listing.restItemId = row.restItemId;
  }
  if (typeof row.epid === "string" && row.epid) listing.epid = row.epid;
  if (typeof row.gtin === "string" && row.gtin) listing.gtin = row.gtin;
  if (typeof row.brand === "string" && row.brand) listing.brand = row.brand;
  if (typeof row.mpn === "string" && row.mpn) listing.mpn = row.mpn;
  if (typeof row.itemLocationCountry === "string" && row.itemLocationCountry) {
    listing.itemLocationCountry = row.itemLocationCountry;
  }
  if (typeof row.sellerUsername === "string" && row.sellerUsername) {
    listing.sellerUsername = row.sellerUsername;
  }
  if (Array.isArray(row.categoryIds)) {
    const categoryIds = row.categoryIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    if (categoryIds.length > 0) listing.categoryIds = categoryIds;
  }
  if (Array.isArray(row.localizedAspects) && row.localizedAspects.length > 0) {
    listing.localizedAspects = row.localizedAspects;
  }
  if (
    Array.isArray(row.conditionDescriptors) &&
    row.conditionDescriptors.length > 0
  ) {
    listing.conditionDescriptors = row.conditionDescriptors;
  }
  return listing;
}
