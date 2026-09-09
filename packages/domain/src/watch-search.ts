import { excludeWordsField, type WatchCriteria } from "./watch-criteria.ts";
import { cardCategoryLineOf } from "./card-filters.ts";

export function dollarsField(cents: number | undefined): string {
  if (cents === undefined) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export function searchPathForWatch(input: {
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

function prettyDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? String(dollars) : dollars.toFixed(2);
}

export function searchParamsFromIntent(
  q: string,
  intent: WatchCriteria,
  watchId?: string,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("q", q);
  if (watchId) params.set("watch", watchId);
  if (intent.ebaySite && intent.ebaySite !== "EBAY_US") {
    params.set("site", intent.ebaySite);
  }
  if (intent.minLandedCents !== undefined) {
    params.set("min", dollarsField(intent.minLandedCents));
  }
  if (intent.maxLandedCents !== undefined) {
    params.set("max", dollarsField(intent.maxLandedCents));
  }
  if (intent.shipToPostal) params.set("zip", intent.shipToPostal);
  if (intent.condition !== "any" && intent.condition !== "graded") {
    params.set("condition", intent.condition);
  }
  if (intent.itemLocation && intent.itemLocation !== "any") {
    params.set("located", intent.itemLocation);
  }
  if (intent.shipToCountry) params.set("to", intent.shipToCountry);
  if (intent.minConfidence !== undefined) {
    params.set("confidence", String(intent.minConfidence));
  }
  if (intent.minPriceScore !== undefined) {
    params.set("score", String(intent.minPriceScore));
  }
  if (intent.listingType !== "all") {
    params.set(
      "listing",
      intent.listingType === "auction_below" ? "auction" : intent.listingType,
    );
  }
  const excluded = excludeWordsField(intent.excludeKeywords);
  if (excluded) params.set("exclude", excluded);
  if (intent.cardSet) params.set("set", intent.cardSet);
  if (intent.rarity) params.set("rarity", intent.rarity);
  if (intent.printing) params.set("printing", intent.printing);
  if (intent.language) params.set("language", intent.language);
  if (intent.grader) params.set("grader", intent.grader);
  if (intent.grader && intent.cardGrade) params.set("grade", intent.cardGrade);
  if (intent.cardCategory) {
    const line = cardCategoryLineOf(intent.cardCategory);
    if (line) params.set("cardLine", line);
    params.set("cardCategory", intent.cardCategory);
  }
  if (intent.cardGame) params.set("cardGame", intent.cardGame);
  if (intent.cardNoReprints === false) params.set("cardNoReprints", "0");
  if (intent.cardNoProxy === false) params.set("cardNoProxy", "0");
  if (intent.excludeUnofficial === false) params.set("unofficial", "0");
  if (intent.figureCategory) params.set("figureCategory", intent.figureCategory);
  if (intent.figureScale) params.set("figureScale", intent.figureScale);
  if (intent.figurePackaging) {
    params.set("figurePackaging", intent.figurePackaging);
  }
  if (intent.figureCompleteness) {
    params.set("figureCompleteness", intent.figureCompleteness);
  }
  if (intent.figurePunch) params.set("figurePunch", intent.figurePunch);
  if (intent.brickCategory) params.set("brickCategory", intent.brickCategory);
  if (intent.brickType) params.set("brickType", intent.brickType);
  if (intent.brickStatus) params.set("brickStatus", intent.brickStatus);
  if (intent.wheelsCategory) params.set("wheelsCategory", intent.wheelsCategory);
  if (intent.wheelsScale) params.set("wheelsScale", intent.wheelsScale);
  if (intent.wheelsPackaging) {
    params.set("wheelsPackaging", intent.wheelsPackaging);
  }
  return params;
}
