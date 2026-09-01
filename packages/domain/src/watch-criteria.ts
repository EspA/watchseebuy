import {
  brickExcludeWords,
  brickCategoryLabel,
  brickStatusLabel,
  brickTypeLabel,
  withoutSetExcludeWords,
} from "./brick-filters.ts";
import {
  figureCategoryIds,
  figureCategoryLabel,
} from "./figure-filters.ts";
import {
  cardCategoryIds,
  cardCategoryLabel,
  cardGameAspectFilter,
  cardGameLabel,
  categorySupportsCardGame,
  cardGraderQueryTerm,
  cardLanguageLabel,
  cardPrintingLabel,
  cardRarityLabel,
  cardSetLabel,
  composeCatalogQuery,
} from "./card-filters.ts";

export type ListingType = "all" | "bin" | "auction" | "auction_below" | "best_offer";

export const LISTING_TYPE_FILTERS: { value: ListingType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "bin", label: "Buy It Now" },
  { value: "auction", label: "Auction" },
  { value: "best_offer", label: "Best Offer" },
];

export type LocationGroup = "Region" | "Country";

export const ITEM_LOCATION_FILTERS: {
  value: string;
  label: string;
  group?: LocationGroup;
}[] = [
  { value: "any", label: "Any" },
  { value: "region:WORLDWIDE", label: "Worldwide", group: "Region" },
  { value: "region:NORTH_AMERICA", label: "North America", group: "Region" },
  { value: "region:EUROPEAN_UNION", label: "European Union", group: "Region" },
  { value: "region:CONTINENTAL_EUROPE", label: "Continental Europe", group: "Region" },
  { value: "region:UK_AND_IRELAND", label: "UK & Ireland", group: "Region" },
  { value: "region:ASIA", label: "Asia", group: "Region" },
  { value: "country:US", label: "United States", group: "Country" },
  { value: "country:CA", label: "Canada", group: "Country" },
  { value: "country:MX", label: "Mexico", group: "Country" },
  { value: "country:GB", label: "United Kingdom", group: "Country" },
  { value: "country:IE", label: "Ireland", group: "Country" },
  { value: "country:DE", label: "Germany", group: "Country" },
  { value: "country:FR", label: "France", group: "Country" },
  { value: "country:IT", label: "Italy", group: "Country" },
  { value: "country:ES", label: "Spain", group: "Country" },
  { value: "country:NL", label: "Netherlands", group: "Country" },
  { value: "country:BE", label: "Belgium", group: "Country" },
  { value: "country:AT", label: "Austria", group: "Country" },
  { value: "country:CH", label: "Switzerland", group: "Country" },
  { value: "country:PL", label: "Poland", group: "Country" },
  { value: "country:AU", label: "Australia", group: "Country" },
  { value: "country:NZ", label: "New Zealand", group: "Country" },
  { value: "country:JP", label: "Japan", group: "Country" },
  { value: "country:CN", label: "China", group: "Country" },
  { value: "country:HK", label: "Hong Kong", group: "Country" },
  { value: "country:SG", label: "Singapore", group: "Country" },
  { value: "country:KR", label: "South Korea", group: "Country" },
];

export const AVAILABLE_TO_FILTERS: { value: string; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  { value: "GB", label: "United Kingdom" },
  { value: "IE", label: "Ireland" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "AT", label: "Austria" },
  { value: "CH", label: "Switzerland" },
  { value: "PL", label: "Poland" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "HK", label: "Hong Kong" },
  { value: "SG", label: "Singapore" },
  { value: "KR", label: "South Korea" },
];

export const LOCATION_GROUPS: LocationGroup[] = ["Region", "Country"];

/** eBay Item Condition IDs (Browse filter conditionIds). */
export type EbayConditionId =
  | "1000"
  | "1500"
  | "1750"
  | "2000"
  | "2010"
  | "2020"
  | "2030"
  | "2500"
  | "2750"
  | "2990"
  | "3000"
  | "3010"
  | "4000"
  | "5000"
  | "6000"
  | "7000";

export type ConditionClass = "any" | "graded" | EbayConditionId;

export type ConditionGroup = "New" | "Used";

export const CONDITION_FILTERS: {
  value: ConditionClass;
  label: string;
  group?: ConditionGroup;
}[] = [
  { value: "any", label: "Any" },
  { value: "1000", label: "New", group: "New" },
  { value: "1500", label: "New other (see details)", group: "New" },
  { value: "1750", label: "New with defects", group: "New" },
  { value: "2750", label: "Like New", group: "New" },
  { value: "3000", label: "Used", group: "Used" },
  { value: "4000", label: "Very Good", group: "Used" },
  { value: "5000", label: "Good", group: "Used" },
  { value: "6000", label: "Acceptable", group: "Used" },
  { value: "2990", label: "Pre-owned — Excellent", group: "Used" },
  { value: "3010", label: "Pre-owned — Fair", group: "Used" },
];

export const CONDITION_GROUPS: ConditionGroup[] = ["New", "Used"];

const LEGACY_CONDITION: Record<string, ConditionClass> = {
  new: "1000",
  open_box: "1500",
  used: "3000",
};

export function parseConditionFilter(raw: string | undefined): ConditionClass {
  if (!raw) return "any";
  if (raw === "any" || raw === "graded") return raw;
  if (LEGACY_CONDITION[raw]) return LEGACY_CONDITION[raw];
  if (CONDITION_FILTERS.some((c) => c.value === raw)) {
    return raw as ConditionClass;
  }
  return "any";
}

export function conditionLabel(condition: ConditionClass): string {
  return CONDITION_FILTERS.find((c) => c.value === condition)?.label ?? condition;
}

export function isEbayConditionId(
  condition: ConditionClass,
): condition is EbayConditionId {
  return condition !== "any" && condition !== "graded";
}

export function parseListingTypeFilter(raw: string | undefined): ListingType {
  if (!raw) return "all";
  if (LISTING_TYPE_FILTERS.some((option) => option.value === raw)) {
    return raw as ListingType;
  }
  if (raw === "auction_below") return "auction_below";
  return "all";
}

export function listingTypeLabel(listingType: ListingType): string {
  return (
    LISTING_TYPE_FILTERS.find((option) => option.value === listingType)?.label ??
    listingType
  );
}

export function parseItemLocation(raw: string | undefined): string {
  if (!raw) return "any";
  return ITEM_LOCATION_FILTERS.some((option) => option.value === raw)
    ? raw
    : "any";
}

export function itemLocationLabel(value: string | undefined): string {
  if (!value || value === "any") return "Any";
  return (
    ITEM_LOCATION_FILTERS.find((option) => option.value === value)?.label ??
    value
  );
}

export function parseAvailableTo(raw: string | undefined): string {
  if (!raw) return "any";
  return AVAILABLE_TO_FILTERS.some((option) => option.value === raw)
    ? raw
    : "any";
}

export function availableToLabel(country: string | undefined): string {
  if (!country) return "Any";
  return (
    AVAILABLE_TO_FILTERS.find((option) => option.value === country)?.label ??
    country
  );
}

export function parseExcludeWords(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();
  const chunks = trimmed.includes(",")
    ? trimmed.split(",").map((part) => part.trim())
    : trimmed.split(/\s+/);
  const seen = new Set<string>();
  const words: string[] = [];
  for (const chunk of chunks) {
    const word = chunk.replace(/\s+/g, " ").trim();
    const key = word.toLowerCase();
    if (!word || seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export function userExcludeWords(excludeKeywords: string[]): string[] {
  const defaults = new Set(DEFAULT_EXCLUDES.map((word) => word.toLowerCase()));
  return excludeKeywords.filter((word) => !defaults.has(word.toLowerCase()));
}

export function mergeExcludeKeywords(userWords: string[]): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const word of [...DEFAULT_EXCLUDES, ...userWords]) {
    const key = word.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export function excludeWordsField(excludeKeywords: string[]): string {
  return userExcludeWords(excludeKeywords).join(", ");
}

export function listingPassesExcludeKeywords(
  listing: { title?: string; description?: string },
  excludeKeywords: string[],
): boolean {
  const haystack = [listing.title, listing.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return !excludeKeywords.some(
    (word) => word && haystack.includes(word.toLowerCase()),
  );
}

export function ebaySearchQuery(
  keywords: string,
  excludeKeywords?: string[],
): string {
  if (!excludeKeywords?.length) return keywords;
  const clauses = excludeKeywords
    .map((word) => {
      const clean = word.replace(/"/g, "").trim();
      if (!clean) return "";
      return /\s/.test(clean) ? `-"${clean}"` : `-${clean}`;
    })
    .filter(Boolean);
  return [keywords, ...clauses].join(" ").trim();
}

export type GradeCompany = "psa" | "bgs" | "sgc" | "cgc";

export type WatchCriteria = {
  query: string;
  minLandedCents?: number;
  maxLandedCents?: number;
  condition: ConditionClass;
  gradeCompany?: GradeCompany;
  minGrade?: number;
  excludeKeywords: string[];
  listingType: ListingType;
  auctionMaxCents?: number;
  itemLocation?: string;
  minConfidence?: number;
  minPriceScore?: number;
  shipToCountry?: string;
  shipToPostal?: string;
  cardSet?: string;
  rarity?: string;
  printing?: string;
  language?: string;
  grader?: string;
  cardGrade?: string;
  cardCategory?: string;
  cardGame?: string;
  figureCategory?: string;
  brickCategory?: string;
  brickType?: string;
  brickStatus?: string;
  ebaySite: string;
};

export type CoverageQuery = {
  key: string;
  keywords: string;
  condition: ConditionClass;
  ebaySite: string;
  listingType: ListingType;
  itemLocation?: string;
  deliveryCountry?: string;
  deliveryPostal?: string;
  excludeKeywords?: string[];
  categoryIds?: string;
  aspectFilter?: string;
};

const DEFAULT_SITE = "EBAY_US";

const DEFAULT_EXCLUDES = ["reprint", "reprints", "proxy", "for parts"];

const GRADE_RE = /\b(psa|bgs|sgc|cgc)\s*(\d+(?:\.\d+)?)\b/i;
const MONEY_CAP = "(\\d[\\d,]*(?:\\.\\d{1,2})?)";
const UNDER_RE = new RegExp(`\\bunder\\s+\\$?\\s*${MONEY_CAP}\\b`, "i");
const OVER_RE = new RegExp(
  `\\b(?:over|above|from)\\s+\\$?\\s*${MONEY_CAP}\\b`,
  "i",
);
const AUCTION_BELOW_RE = new RegExp(
  `\\bauction(?:s)?\\s+(?:under|below)\\s+\\$?\\s*${MONEY_CAP}\\b`,
  "i",
);
const BIN_RE = /\b(?:bin only|buy[\s-]?it[\s-]?now|fixed price)\b/i;
const AUCTION_RE = /\bauction(?:s)?\b/i;

export function normalizeQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Stable keyword bag so word order does not mint a new poll. */
export function coverageKeywords(query: string): string {
  return normalizeQuery(query)
    .split(" ")
    .filter(Boolean)
    .sort()
    .join(" ");
}

function dollarsToCents(raw: string): number {
  return Math.round(Number(raw.replace(/,/g, "")) * 100);
}

function strip(text: string, re: RegExp): string {
  return text.replace(re, " ").replace(/\s+/g, " ").trim();
}

export function parseSearchIntent(raw: string): WatchCriteria {
  let rest = raw.trim();
  const criteria: WatchCriteria = {
    query: rest,
    condition: "any",
    excludeKeywords: [...DEFAULT_EXCLUDES],
    listingType: "all",
    ebaySite: DEFAULT_SITE,
  };

  const auctionBelow = rest.match(AUCTION_BELOW_RE);
  if (auctionBelow?.[1]) {
    criteria.listingType = "auction_below";
    criteria.auctionMaxCents = dollarsToCents(auctionBelow[1]);
    rest = strip(rest, AUCTION_BELOW_RE);
  } else if (BIN_RE.test(rest)) {
    criteria.listingType = "bin";
    rest = strip(rest, BIN_RE);
  } else if (AUCTION_RE.test(rest)) {
    criteria.listingType = "auction";
    rest = strip(rest, AUCTION_RE);
  }

  const under = rest.match(UNDER_RE);
  if (under?.[1]) {
    criteria.maxLandedCents = dollarsToCents(under[1]);
    rest = strip(rest, UNDER_RE);
  }

  const over = rest.match(OVER_RE);
  if (over?.[1]) {
    criteria.minLandedCents = dollarsToCents(over[1]);
    rest = strip(rest, OVER_RE);
  }

  const grade = rest.match(GRADE_RE);
  if (grade?.[1] && grade[2]) {
    criteria.condition = "graded";
    criteria.gradeCompany = grade[1].toLowerCase() as GradeCompany;
    criteria.minGrade = Number(grade[2]);
  }

  criteria.query = rest.replace(/\s+/g, " ").trim() || raw.trim();
  return criteria;
}

export function applyWatchOverrides(
  criteria: WatchCriteria,
  overrides: {
    minLandedCents?: number;
    maxLandedCents?: number;
    condition?: ConditionClass;
    listingType?: ListingType;
    itemLocation?: string;
    minConfidence?: number;
    minPriceScore?: number;
    excludeKeywords?: string[];
    shipToCountry?: string;
    shipToPostal?: string;
    cardSet?: string;
    rarity?: string;
    printing?: string;
    language?: string;
    grader?: string;
    cardGrade?: string;
    cardCategory?: string;
    cardGame?: string;
    figureCategory?: string;
    brickCategory?: string;
    brickType?: string;
    brickStatus?: string;
    clearMinConfidence?: boolean;
    clearMinPriceScore?: boolean;
    clearShipTo?: boolean;
    clearCardSet?: boolean;
    clearRarity?: boolean;
    clearPrinting?: boolean;
    clearLanguage?: boolean;
    clearGrader?: boolean;
    clearCardGrade?: boolean;
    clearCardCategory?: boolean;
    clearCardGame?: boolean;
    clearFigureCategory?: boolean;
    clearBrickCategory?: boolean;
    clearBrickType?: boolean;
    clearBrickStatus?: boolean;
  },
): WatchCriteria {
  const next: WatchCriteria = { ...criteria };
  if (overrides.minLandedCents !== undefined) {
    next.minLandedCents = overrides.minLandedCents;
  }
  if (overrides.maxLandedCents !== undefined) {
    next.maxLandedCents = overrides.maxLandedCents;
  }
  if (overrides.condition !== undefined) {
    next.condition = overrides.condition;
  }
  if (overrides.listingType !== undefined) {
    next.listingType =
      overrides.listingType === "auction" &&
      criteria.listingType === "auction_below"
        ? "auction_below"
        : overrides.listingType;
  }
  if (overrides.itemLocation !== undefined) {
    if (overrides.itemLocation === "any") delete next.itemLocation;
    else next.itemLocation = overrides.itemLocation;
  }
  if (overrides.clearMinConfidence) {
    delete next.minConfidence;
  } else if (overrides.minConfidence !== undefined) {
    next.minConfidence = overrides.minConfidence;
  }
  if (overrides.clearMinPriceScore) {
    delete next.minPriceScore;
  } else if (overrides.minPriceScore !== undefined) {
    next.minPriceScore = overrides.minPriceScore;
  }
  if (overrides.excludeKeywords !== undefined) {
    next.excludeKeywords = mergeExcludeKeywords(
      userExcludeWords(overrides.excludeKeywords),
    );
  }
  if (overrides.clearShipTo) {
    delete next.shipToCountry;
    delete next.shipToPostal;
  } else {
    if (overrides.shipToCountry !== undefined) {
      next.shipToCountry = overrides.shipToCountry;
    }
    if (overrides.shipToPostal !== undefined) {
      next.shipToPostal = overrides.shipToPostal;
    }
  }
  if (overrides.clearCardSet) delete next.cardSet;
  else if (overrides.cardSet !== undefined) next.cardSet = overrides.cardSet;
  if (overrides.clearRarity) delete next.rarity;
  else if (overrides.rarity !== undefined) next.rarity = overrides.rarity;
  if (overrides.clearPrinting) delete next.printing;
  else if (overrides.printing !== undefined) next.printing = overrides.printing;
  if (overrides.clearLanguage) delete next.language;
  else if (overrides.language !== undefined) next.language = overrides.language;
  if (overrides.clearGrader) delete next.grader;
  else if (overrides.grader !== undefined) next.grader = overrides.grader;
  if (overrides.clearCardGrade || overrides.clearGrader) delete next.cardGrade;
  else if (overrides.cardGrade !== undefined) next.cardGrade = overrides.cardGrade;
  if (overrides.clearCardCategory) delete next.cardCategory;
  else if (overrides.cardCategory !== undefined) {
    next.cardCategory = overrides.cardCategory;
  }
  if (overrides.clearCardGame || overrides.clearCardCategory) {
    delete next.cardGame;
  } else if (overrides.cardGame !== undefined) {
    next.cardGame = overrides.cardGame;
  }
  if (next.cardGame && !categorySupportsCardGame(next.cardCategory)) {
    delete next.cardGame;
  }
  if (overrides.clearFigureCategory) delete next.figureCategory;
  else if (overrides.figureCategory !== undefined) {
    next.figureCategory = overrides.figureCategory;
  }
  if (overrides.clearBrickCategory) delete next.brickCategory;
  else if (overrides.brickCategory !== undefined) {
    next.brickCategory = overrides.brickCategory;
  }
  if (overrides.clearBrickType) delete next.brickType;
  else if (overrides.brickType !== undefined) next.brickType = overrides.brickType;
  if (overrides.clearBrickStatus) delete next.brickStatus;
  else if (overrides.brickStatus !== undefined) {
    next.brickStatus = overrides.brickStatus;
  }
  if (
    overrides.clearBrickType ||
    overrides.brickType !== undefined ||
    next.brickType === "set"
  ) {
    next.excludeKeywords = mergeExcludeKeywords([
      ...withoutSetExcludeWords(userExcludeWords(next.excludeKeywords)),
      ...brickExcludeWords(next.brickType),
    ]);
  }
  return next;
}

/** Coarser eBay search many watches can share. Never poll once per user. */
export function toCoverageQuery(criteria: WatchCriteria): CoverageQuery {
  const keywords = normalizeQuery(composeCatalogQuery(criteria.query, criteria));
  const listingType =
    criteria.listingType === "auction_below" ? "auction" : criteria.listingType;
  const itemLocation =
    criteria.itemLocation && criteria.itemLocation !== "any"
      ? criteria.itemLocation
      : undefined;
  const deliveryCountry = criteria.shipToCountry?.trim() || undefined;
  const deliveryPostal = criteria.shipToPostal?.trim() || undefined;
  const excludeKeywords = userExcludeWords(criteria.excludeKeywords);
  const categoryIds =
    cardCategoryIds(criteria.cardCategory) ||
    figureCategoryIds(criteria.figureCategory) ||
    criteria.brickCategory?.trim() ||
    undefined;
  const aspectFilter = cardGameAspectFilter(
    criteria.cardCategory,
    criteria.cardGame,
  );
  const key = [
    criteria.ebaySite,
    criteria.condition,
    listingType,
    itemLocation ?? "any",
    deliveryCountry ? `to:${deliveryCountry}` : "to:any",
    deliveryPostal ? `zip:${deliveryPostal}` : "zip:",
    categoryIds ? `cat:${categoryIds}` : "cat:",
    aspectFilter ? `asp:${aspectFilter}` : "asp:",
    excludeKeywords.length
      ? `ex:${[...excludeKeywords].map((w) => w.toLowerCase()).sort().join(",")}`
      : "ex:",
    coverageKeywords(composeCatalogQuery(criteria.query, criteria)),
  ].join("|");

  return {
    key,
    keywords,
    condition: criteria.condition,
    ebaySite: criteria.ebaySite,
    listingType,
    ...(itemLocation ? { itemLocation } : {}),
    ...(deliveryCountry ? { deliveryCountry } : {}),
    ...(deliveryPostal ? { deliveryPostal } : {}),
    ...(excludeKeywords.length ? { excludeKeywords } : {}),
    ...(categoryIds ? { categoryIds } : {}),
    ...(aspectFilter ? { aspectFilter } : {}),
  };
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function describeWatch(criteria: WatchCriteria): string {
  const bits = [criteria.query];
  if (
    criteria.minLandedCents !== undefined &&
    criteria.maxLandedCents !== undefined
  ) {
    bits.push(
      `${formatUsd(criteria.minLandedCents)}–${formatUsd(criteria.maxLandedCents)}`,
    );
  } else if (criteria.maxLandedCents !== undefined) {
    bits.push(`up to ${formatUsd(criteria.maxLandedCents)}`);
  } else if (criteria.minLandedCents !== undefined) {
    bits.push(`from ${formatUsd(criteria.minLandedCents)}`);
  }
  if (criteria.condition !== "any") {
    bits.push(conditionLabel(criteria.condition));
  }
  if (
    criteria.gradeCompany &&
    criteria.minGrade !== undefined &&
    !criteria.grader
  ) {
    bits.push(`${criteria.gradeCompany.toUpperCase()} ${criteria.minGrade}+`);
  }
  if (criteria.listingType === "bin") bits.push("buy it now only");
  if (criteria.listingType === "auction") bits.push("auctions");
  if (criteria.listingType === "best_offer") bits.push("best offer");
  if (
    criteria.listingType === "auction_below" &&
    criteria.auctionMaxCents !== undefined
  ) {
    bits.push(`auctions under ${formatUsd(criteria.auctionMaxCents)}`);
  }
  if (criteria.itemLocation && criteria.itemLocation !== "any") {
    bits.push(`located in ${itemLocationLabel(criteria.itemLocation)}`);
  }
  if (criteria.shipToCountry) {
    bits.push(`available to ${availableToLabel(criteria.shipToCountry)}`);
  }
  if (criteria.shipToPostal) {
    bits.push(`ships to ${criteria.shipToPostal}`);
  }
  if (criteria.minConfidence !== undefined) {
    bits.push(`seller confidence ${criteria.minConfidence}+`);
  }
  if (criteria.minPriceScore !== undefined) {
    bits.push(`price score ${criteria.minPriceScore}+`);
  }
  const set = cardSetLabel(criteria.cardSet);
  if (set) bits.push(set);
  const rarity = cardRarityLabel(criteria.rarity);
  if (rarity) bits.push(rarity);
  const printing = cardPrintingLabel(criteria.printing);
  if (printing) bits.push(printing);
  const language = cardLanguageLabel(criteria.language);
  if (language) bits.push(language);
  const grader = cardGraderQueryTerm(criteria);
  if (grader) bits.push(grader);
  const cardCategory = cardCategoryLabel(criteria.cardCategory);
  if (cardCategory) bits.push(cardCategory);
  const cardGame = cardGameLabel(criteria.cardGame);
  if (cardGame) bits.push(cardGame);
  const figureCategory = figureCategoryLabel(criteria.figureCategory);
  if (figureCategory) bits.push(figureCategory);
  const brickCategory = brickCategoryLabel(criteria.brickCategory);
  if (brickCategory) bits.push(brickCategory);
  const brickType = brickTypeLabel(criteria.brickType);
  if (brickType) bits.push(brickType);
  const brickStatus = brickStatusLabel(criteria.brickStatus);
  if (brickStatus) bits.push(brickStatus);
  const excluded = userExcludeWords(criteria.excludeKeywords);
  if (excluded.length > 0) {
    bits.push(`excluding ${excluded.join(", ")}`);
  }
  return bits.join(" · ");
}

export function listingMatchesCondition(
  listing: { title?: string; condition?: string; conditionId?: string },
  condition: ConditionClass,
): boolean {
  if (condition === "any") return true;
  if (condition === "graded") {
    return /\b(psa|bgs|sgc|cgc)\b/i.test(listing.title ?? "");
  }

  const id = listing.conditionId?.trim();
  if (id) return id === condition;

  const label = conditionLabel(condition).toLowerCase();
  const text = (listing.condition ?? "").toLowerCase();
  return Boolean(text) && (text === label || text.includes(label));
}

export function listingMatchesListingType(
  listing: { listingType: "bin" | "auction"; buyingOptions?: string[] },
  listingType: ListingType,
): boolean {
  if (listingType === "all") return true;
  const options = listing.buyingOptions ?? [];
  if (listingType === "best_offer") {
    return options.includes("BEST_OFFER");
  }
  if (listingType === "bin") {
    return listing.listingType === "bin" || options.includes("FIXED_PRICE");
  }
  if (listingType === "auction" || listingType === "auction_below") {
    return listing.listingType === "auction" || options.includes("AUCTION");
  }
  return true;
}

export type BrowseFilterInput = {
  priceMaxCents?: number;
  condition?: ConditionClass;
  listingType?: ListingType;
  itemLocation?: string;
  deliveryCountry?: string;
  deliveryPostal?: string;
};

/** Browse `filter` clauses. Feedback score has no server-side Browse filter. */
export function browseFilterParts(input: BrowseFilterInput): string[] {
  const parts: string[] = [];
  if (input.priceMaxCents !== undefined) {
    parts.push(`price:[0..${(input.priceMaxCents / 100).toFixed(2)}]`);
    parts.push("priceCurrency:USD");
  }
  if (input.condition && isEbayConditionId(input.condition)) {
    parts.push(`conditionIds:{${input.condition}}`);
  }
  const buying = buyingOptionsFilter(input.listingType);
  if (buying) parts.push(buying);
  const located = itemLocationFilter(input.itemLocation);
  if (located) parts.push(located);
  const deliveryCountry =
    input.deliveryCountry ?? (input.deliveryPostal ? "US" : undefined);
  if (deliveryCountry) parts.push(`deliveryCountry:${deliveryCountry}`);
  if (input.deliveryPostal) {
    parts.push(`deliveryPostalCode:${input.deliveryPostal}`);
  }
  return parts;
}

function buyingOptionsFilter(listingType: ListingType | undefined): string | undefined {
  if (!listingType) return undefined;
  if (listingType === "bin") return "buyingOptions:{FIXED_PRICE}";
  if (listingType === "auction" || listingType === "auction_below") {
    return "buyingOptions:{AUCTION}";
  }
  if (listingType === "best_offer") return "buyingOptions:{BEST_OFFER}";
  // Browse defaults to FIXED_PRICE only; "all" must ask for the rest.
  return "buyingOptions:{FIXED_PRICE|AUCTION|BEST_OFFER}";
}

function itemLocationFilter(value: string | undefined): string | undefined {
  if (!value || value === "any") return undefined;
  if (value.startsWith("region:")) {
    return `itemLocationRegion:{${value.slice("region:".length)}}`;
  }
  if (value.startsWith("country:")) {
    return `itemLocationCountry:{${value.slice("country:".length)}}`;
  }
  return undefined;
}
