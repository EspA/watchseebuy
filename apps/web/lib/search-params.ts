import {
  applyWatchOverrides,
  composeCatalogQuery,
  dollarsToCents,
  excludeWordsField,
  mergeExcludeKeywords,
  parseAvailableTo,
  parseCardLanguage,
  parseCardPrinting,
  parseCardRarity,
  parseCardSet,
  parseConditionFilter,
  parseExcludeWords,
  parseItemLocation,
  parseMinConfidence,
  parseListingTypeFilter,
  parseSearchIntent,
  stripCatalogTerms,
  type WatchCriteria,
} from "@waitseebuy/domain";

export type SearchQuery = {
  q: string;
  watch?: string;
  min?: string;
  max?: string;
  zip?: string;
  condition?: string;
  located?: string;
  to?: string;
  confidence?: string;
  listing?: string;
  exclude?: string;
  set?: string;
  rarity?: string;
  printing?: string;
  language?: string;
};

export function intentFromSearchQuery(query: SearchQuery): WatchCriteria {
  const zip = query.zip?.trim() ?? "";
  const availableTo = parseAvailableTo(query.to);
  const listing =
    query.listing !== undefined
      ? parseListingTypeFilter(query.listing)
      : undefined;
  const located =
    query.located !== undefined
      ? parseItemLocation(query.located)
      : undefined;
  const confidenceSpecified = query.confidence !== undefined;
  const confidence = parseMinConfidence(query.confidence);

  const cardSet = parseCardSet(query.set);
  const rarity = parseCardRarity(query.rarity);
  const printing = parseCardPrinting(query.printing);
  const language = parseCardLanguage(query.language);

  const intent = applyWatchOverrides(parseSearchIntent(query.q), {
    ...(query.condition !== undefined
      ? { condition: parseConditionFilter(query.condition) }
      : {}),
    ...(listing !== undefined ? { listingType: listing } : {}),
    ...(located !== undefined ? { itemLocation: located } : {}),
    ...(confidenceSpecified
      ? confidence !== undefined
        ? { minConfidence: confidence }
        : { clearMinConfidence: true }
      : {}),
    ...(availableTo !== "any"
      ? { shipToCountry: availableTo }
      : zip
        ? { shipToCountry: "US" }
        : query.to !== undefined
          ? { clearShipTo: true }
          : {}),
    ...(zip ? { shipToPostal: zip } : {}),
    ...(query.exclude !== undefined
      ? { excludeKeywords: mergeExcludeKeywords(parseExcludeWords(query.exclude)) }
      : {}),
    ...(query.set !== undefined
      ? cardSet
        ? { cardSet }
        : { clearCardSet: true }
      : {}),
    ...(query.rarity !== undefined
      ? rarity
        ? { rarity }
        : { clearRarity: true }
      : {}),
    ...(query.printing !== undefined
      ? printing
        ? { printing }
        : { clearPrinting: true }
      : {}),
    ...(query.language !== undefined
      ? language
        ? { language }
        : { clearLanguage: true }
      : {}),
  });
  intent.query = stripCatalogTerms(intent.query, intent);

  if (query.zip !== undefined && !zip) {
    delete intent.shipToPostal;
    if (availableTo === "any") delete intent.shipToCountry;
  }

  if (query.min !== undefined) {
    const min = dollarsToCents(query.min);
    if (min !== undefined) intent.minLandedCents = min;
    else delete intent.minLandedCents;
  }
  if (query.max !== undefined) {
    const max = dollarsToCents(query.max);
    if (max !== undefined) intent.maxLandedCents = max;
    else delete intent.maxLandedCents;
  }

  if (
    intent.minLandedCents !== undefined &&
    intent.maxLandedCents !== undefined &&
    intent.minLandedCents > intent.maxLandedCents
  ) {
    const swapped = intent.minLandedCents;
    intent.minLandedCents = intent.maxLandedCents;
    intent.maxLandedCents = swapped;
  }

  return intent;
}

export function dollarsField(cents: number | undefined): string {
  if (cents === undefined) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export function searchParamsFromIntent(
  q: string,
  intent: WatchCriteria,
  watchId?: string,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("q", q);
  if (watchId) params.set("watch", watchId);
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
  return params;
}

export function searchBarQuery(q: string, intent: WatchCriteria): string {
  return composeCatalogQuery(q.trim() ? intent.query || q : q, intent);
}
