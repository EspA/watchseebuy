import {
  applyWatchOverrides,
  composeCatalogQuery,
  dollarsToCents,
  excludeWordsField,
  mergeExcludeKeywords,
  parseAvailableTo,
  parseBrickCategory,
  parseBrickStatus,
  parseBrickType,
  parseFigureCategory,
  DEFAULT_CARD_GRADE,
  parseCardCategory,
  parseCardGame,
  parseCardGrade,
  parseCardLine,
  cardCategoryLineOf,
  parseCardGrader,
  parseCardLanguage,
  parseCardPrinting,
  parseCardRarity,
  parseCardSet,
  parseConditionFilter,
  parseExcludeWords,
  parseItemLocation,
  parseMinConfidence,
  parseMinPriceScore,
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
  score?: string;
  listing?: string;
  exclude?: string;
  set?: string;
  rarity?: string;
  printing?: string;
  language?: string;
  grader?: string;
  grade?: string;
  cardLine?: string;
  cardCategory?: string;
  cardGame?: string;
  figureCategory?: string;
  brickCategory?: string;
  brickType?: string;
  brickStatus?: string;
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
  const scoreSpecified = query.score !== undefined;
  const minPriceScore = parseMinPriceScore(query.score);

  const overrides: Parameters<typeof applyWatchOverrides>[1] = {};
  if (query.condition !== undefined) {
    overrides.condition = parseConditionFilter(query.condition);
  }
  if (listing !== undefined) overrides.listingType = listing;
  if (located !== undefined) overrides.itemLocation = located;
  if (confidenceSpecified) {
    if (confidence !== undefined) overrides.minConfidence = confidence;
    else overrides.clearMinConfidence = true;
  }
  if (scoreSpecified) {
    if (minPriceScore !== undefined) overrides.minPriceScore = minPriceScore;
    else overrides.clearMinPriceScore = true;
  }
  if (availableTo !== "any") overrides.shipToCountry = availableTo;
  else if (zip) overrides.shipToCountry = "US";
  else if (query.to !== undefined) overrides.clearShipTo = true;
  if (zip) overrides.shipToPostal = zip;
  if (query.exclude !== undefined) {
    overrides.excludeKeywords = mergeExcludeKeywords(
      parseExcludeWords(query.exclude),
    );
  }
  if (query.set !== undefined) {
    const cardSet = parseCardSet(query.set);
    if (cardSet) overrides.cardSet = cardSet;
    else overrides.clearCardSet = true;
  }
  if (query.rarity !== undefined) {
    const rarity = parseCardRarity(query.rarity);
    if (rarity) overrides.rarity = rarity;
    else overrides.clearRarity = true;
  }
  if (query.printing !== undefined) {
    const printing = parseCardPrinting(query.printing);
    if (printing) overrides.printing = printing;
    else overrides.clearPrinting = true;
  }
  if (query.language !== undefined) {
    const language = parseCardLanguage(query.language);
    if (language) overrides.language = language;
    else overrides.clearLanguage = true;
  }
  if (query.grader !== undefined) {
    const grader = parseCardGrader(query.grader);
    if (grader) {
      overrides.grader = grader;
      overrides.cardGrade =
        parseCardGrade(query.grade) ?? DEFAULT_CARD_GRADE;
    } else {
      overrides.clearGrader = true;
      overrides.clearCardGrade = true;
    }
  } else if (query.grade !== undefined) {
    const cardGrade = parseCardGrade(query.grade);
    if (cardGrade) overrides.cardGrade = cardGrade;
    else overrides.clearCardGrade = true;
  }
  if (query.cardCategory !== undefined || query.cardLine !== undefined) {
    const cardCategory =
      parseCardCategory(query.cardCategory) ?? parseCardLine(query.cardLine);
    if (cardCategory) overrides.cardCategory = cardCategory;
    else overrides.clearCardCategory = true;
  }
  if (query.cardGame !== undefined) {
    const cardGame = parseCardGame(query.cardGame);
    if (cardGame) overrides.cardGame = cardGame;
    else overrides.clearCardGame = true;
  }
  if (query.figureCategory !== undefined) {
    const figureCategory = parseFigureCategory(query.figureCategory);
    if (figureCategory) overrides.figureCategory = figureCategory;
    else overrides.clearFigureCategory = true;
  }
  if (query.brickCategory !== undefined) {
    const brickCategory = parseBrickCategory(query.brickCategory);
    if (brickCategory) overrides.brickCategory = brickCategory;
    else overrides.clearBrickCategory = true;
  }
  if (query.brickType !== undefined) {
    const brickType = parseBrickType(query.brickType);
    if (brickType) overrides.brickType = brickType;
    else overrides.clearBrickType = true;
  }
  if (query.brickStatus !== undefined) {
    const brickStatus = parseBrickStatus(query.brickStatus);
    if (brickStatus) overrides.brickStatus = brickStatus;
    else overrides.clearBrickStatus = true;
  }

  const intent = applyWatchOverrides(parseSearchIntent(query.q), overrides);
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
  if (intent.figureCategory) params.set("figureCategory", intent.figureCategory);
  if (intent.brickCategory) params.set("brickCategory", intent.brickCategory);
  if (intent.brickType) params.set("brickType", intent.brickType);
  if (intent.brickStatus) params.set("brickStatus", intent.brickStatus);
  return params;
}

export function searchBarQuery(q: string, intent: WatchCriteria): string {
  return composeCatalogQuery(q.trim() ? intent.query || q : q, intent);
}
