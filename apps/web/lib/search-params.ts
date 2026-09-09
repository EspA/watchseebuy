import {
  applyWatchOverrides,
  composeCatalogQuery,
  dollarsToCents,
  mergeExcludeKeywords,
  parseAvailableTo,
  parseBrickCategory,
  parseBrickStatus,
  parseBrickType,
  parseFigureCategory,
  parseFigureCompleteness,
  parseFigurePackaging,
  parseFigurePunch,
  parseFigureScale,
  parseWheelsCategory,
  parseWheelsPackaging,
  parseWheelsScale,
  DEFAULT_CARD_GRADE,
  parseCardCategory,
  parseCardGame,
  parseCardGrade,
  parseCardLine,
  parseCardGrader,
  parseCardLanguage,
  parseCardPrinting,
  parseCardRarity,
  parseCardSet,
  parseConditionFilter,
  parseExcludeWords,
  parseItemLocation,
  parseMinConfidence,
  parseEbaySite,
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
  cardNoReprints?: string;
  cardNoProxy?: string;
  unofficial?: string;
  figureCategory?: string;
  figureScale?: string;
  figurePackaging?: string;
  figureCompleteness?: string;
  figurePunch?: string;
  brickCategory?: string;
  brickType?: string;
  brickStatus?: string;
  wheelsCategory?: string;
  wheelsScale?: string;
  wheelsPackaging?: string;
  site?: string;
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
  if (query.site !== undefined) {
    const ebaySite = parseEbaySite(query.site);
    if (ebaySite) overrides.ebaySite = ebaySite;
  }
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
  if (query.cardNoReprints !== undefined) {
    overrides.cardNoReprints = query.cardNoReprints !== "0";
  }
  if (query.cardNoProxy !== undefined) {
    overrides.cardNoProxy = query.cardNoProxy !== "0";
  }
  if (query.unofficial !== undefined) {
    overrides.excludeUnofficial = query.unofficial !== "0";
  }
  if (query.figureCategory !== undefined) {
    const figureCategory = parseFigureCategory(query.figureCategory);
    if (figureCategory) overrides.figureCategory = figureCategory;
    else overrides.clearFigureCategory = true;
  }
  if (query.figureScale !== undefined) {
    const figureScale = parseFigureScale(query.figureScale);
    if (figureScale) overrides.figureScale = figureScale;
    else overrides.clearFigureScale = true;
  }
  if (query.figurePackaging !== undefined) {
    const figurePackaging = parseFigurePackaging(query.figurePackaging);
    if (figurePackaging) overrides.figurePackaging = figurePackaging;
    else overrides.clearFigurePackaging = true;
  }
  if (query.figureCompleteness !== undefined) {
    const figureCompleteness = parseFigureCompleteness(query.figureCompleteness);
    if (figureCompleteness) overrides.figureCompleteness = figureCompleteness;
    else overrides.clearFigureCompleteness = true;
  }
  if (query.figurePunch !== undefined) {
    const figurePunch = parseFigurePunch(query.figurePunch);
    if (figurePunch) overrides.figurePunch = figurePunch;
    else overrides.clearFigurePunch = true;
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
  if (query.wheelsCategory !== undefined) {
    const wheelsCategory = parseWheelsCategory(query.wheelsCategory);
    if (wheelsCategory) overrides.wheelsCategory = wheelsCategory;
    else overrides.clearWheelsCategory = true;
  }
  if (query.wheelsScale !== undefined) {
    const wheelsScale = parseWheelsScale(query.wheelsScale);
    if (wheelsScale) overrides.wheelsScale = wheelsScale;
    else overrides.clearWheelsScale = true;
  }
  if (query.wheelsPackaging !== undefined) {
    const wheelsPackaging = parseWheelsPackaging(query.wheelsPackaging);
    if (wheelsPackaging) overrides.wheelsPackaging = wheelsPackaging;
    else overrides.clearWheelsPackaging = true;
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

export { dollarsField, searchParamsFromIntent } from "@waitseebuy/domain";

export function searchBarQuery(q: string, intent: WatchCriteria): string {
  return composeCatalogQuery(q.trim() ? intent.query || q : q, intent);
}
