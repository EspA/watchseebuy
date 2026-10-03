import {
  DEFAULT_APP_LOCALE,
  DEFAULT_EBAY_SITE,
  ebaySiteLabel,
  parseEbaySite,
  storeLocaleOf,
  type AppLocale,
} from "./ebay-sites.ts";
import {
  localizeExcludeWords,
  reservedWordSet,
} from "./store-query-terms.ts";
import {
  brickExcludeWords,
  brickCategoryLabel,
  brickStatusLabel,
  brickTypeLabel,
  withoutSealedExcludeWords,
  withoutSetExcludeWords,
} from "./brick-filters.ts";
import {
  categorySupportsFigureScale,
  figureCategoryIds,
  figureCategoryLabel,
  figureCompletenessLabel,
  figureExcludeWords,
  figurePackagingLabel,
  figurePunchLabel,
  figureScaleAspectFilter,
  figureScaleLabel,
  withoutFigureExcludeWords,
} from "./figure-filters.ts";
import {
  cardCategoryIds,
  cardCategoryLabel,
  cardExcludeWords,
  cardGameAspectFilter,
  cardGameLabel,
  cardSkippedDefaultExcludes,
  categorySupportsCardGame,
  cardGraderDescribe,
  isSlabGrader,
  cardLanguageLabel,
  cardPrintingLabel,
  cardRarityLabel,
  cardSetLabel,
  composeCatalogQuery,
  isPokemonCardGame,
  withoutCardExcludeWords,
} from "./card-filters.ts";
import { parseCollectibleFromText } from "./product-identity.ts";
import {
  categorySupportsWheelsScale,
  wheelsCategoryIds,
  wheelsCategoryLabel,
  wheelsExcludeWords,
  wheelsPackagingLabel,
  wheelsScaleAspectFilter,
  wheelsScaleLabel,
  withoutCardedExcludeWords,
} from "./wheel-filters.ts";

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

/** Browse `itemLocationRegion` is ignored on many marketplaces; country codes are reliable. */
const REGION_COUNTRIES: Record<string, readonly string[]> = {
  NORTH_AMERICA: ["US", "CA", "MX"],
  UK_AND_IRELAND: ["GB", "IE"],
  EUROPEAN_UNION: [
    "AT",
    "BE",
    "BG",
    "CY",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FR",
    "GR",
    "HR",
    "HU",
    "IE",
    "IT",
    "LT",
    "LU",
    "LV",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SE",
    "SI",
    "SK",
  ],
  CONTINENTAL_EUROPE: [
    "AT",
    "BE",
    "BG",
    "CH",
    "CY",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FR",
    "GR",
    "HR",
    "HU",
    "IS",
    "IT",
    "LI",
    "LT",
    "LU",
    "LV",
    "MT",
    "NL",
    "NO",
    "PL",
    "PT",
    "RO",
    "SE",
    "SI",
    "SK",
  ],
  ASIA: [
    "CN",
    "HK",
    "ID",
    "IN",
    "JP",
    "KR",
    "MY",
    "PH",
    "SG",
    "TH",
    "TW",
    "VN",
  ],
};

export function itemLocationCountries(
  value: string | undefined,
): string[] | undefined {
  if (!value || value === "any" || value === "region:WORLDWIDE") {
    return undefined;
  }
  if (value.startsWith("country:")) {
    const code = value.slice("country:".length).toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? [code] : undefined;
  }
  if (value.startsWith("region:")) {
    const countries = REGION_COUNTRIES[value.slice("region:".length)];
    return countries ? [...countries] : undefined;
  }
  return undefined;
}

export function listingMatchesItemLocation(
  listing: { itemLocationCountry?: string },
  itemLocation: string | undefined,
): boolean {
  const allowed = itemLocationCountries(itemLocation);
  if (!allowed) return true;
  const country = listing.itemLocationCountry?.trim().toUpperCase();
  if (!country) return true;
  return allowed.includes(country);
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

export function describeListingLocation(
  countryCode: string | undefined,
): string | undefined {
  const code = countryCode?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return undefined;
  const named =
    AVAILABLE_TO_FILTERS.find((option) => option.value === code)?.label ??
    regionDisplayName(code) ??
    code;
  return `Located in ${named}`;
}

function regionDisplayName(code: string): string | undefined {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code);
  } catch {
    return undefined;
  }
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

const DEFAULT_EXCLUDES = ["reprint", "reprints", "proxy", "for parts"];
const DEFAULT_EXCLUDE_KEYS = reservedWordSet(DEFAULT_EXCLUDES);

export function defaultExcludeWords(
  locale: AppLocale = DEFAULT_APP_LOCALE,
): string[] {
  return localizeExcludeWords(DEFAULT_EXCLUDES, locale);
}

export function userExcludeWords(
  excludeKeywords: string[] | undefined,
): string[] {
  return (excludeKeywords ?? []).filter(
    (word) => !DEFAULT_EXCLUDE_KEYS.has(word.toLowerCase()),
  );
}

export function mergeExcludeKeywords(
  userWords: string[],
  skipDefaults: string[] = [],
  locale: AppLocale = DEFAULT_APP_LOCALE,
): string[] {
  const skip = reservedWordSet(skipDefaults);
  const seen = new Set<string>();
  const words: string[] = [];
  for (const word of [...defaultExcludeWords(locale), ...userWords]) {
    const key = word.toLowerCase();
    if (!key || seen.has(key) || skip.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export function excludeWordsField(
  excludeKeywords: string[] | undefined,
): string {
  return userExcludeWords(excludeKeywords).join(", ");
}

/**
 * Title-only. A minus term in the Browse `q` string turns off eBay's loose
 * match and can drop every listing. Descriptions stay out of this check:
 * "loose copy" is a real figure, "Custom" in the title is not.
 */
export function listingMatchesExcludeWords(
  listing: { title?: string },
  excludeKeywords: string[] | undefined,
): boolean {
  const title = listing.title ?? "";
  for (const word of userExcludeWords(excludeKeywords)) {
    if (titleIncludesTerm(title, word)) return false;
  }
  return true;
}

function titleIncludesTerm(title: string, term: string): boolean {
  const clean = term.trim();
  if (!clean) return false;
  const escaped = clean
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(
    `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,
    "iu",
  ).test(title);
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
  cardNoReprints?: boolean;
  cardNoProxy?: boolean;
  excludeUnofficial?: boolean;
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
  ebaySite: string;
};

export function asWatchCriteria(value: unknown): WatchCriteria | null {
  if (!value || typeof value !== "object") return null;
  if (!("query" in value) || typeof (value as { query?: unknown }).query !== "string") {
    return null;
  }
  const raw = value as Partial<WatchCriteria> & { query: string };
  return {
    ...raw,
    query: raw.query,
    condition: raw.condition ?? "any",
    excludeKeywords: Array.isArray(raw.excludeKeywords)
      ? raw.excludeKeywords
      : [],
    listingType: raw.listingType ?? "all",
    ebaySite: raw.ebaySite ?? DEFAULT_SITE,
  };
}

export type CoverageQuery = {
  key: string;
  keywords: string;
  condition: ConditionClass;
  ebaySite: string;
  listingType: ListingType;
  itemLocation?: string;
  deliveryCountry?: string;
  deliveryPostal?: string;
  categoryIds?: string;
  aspectFilter?: string;
};

const DEFAULT_SITE = DEFAULT_EBAY_SITE;

/** Added when Exclude unofficial pieces is on (default). */
export const UNOFFICIAL_EXCLUDE_WORDS = [
  "custom",
  "moc",
  "mock",
  "replica",
  "fake",
  "compatible",
  "copy",
  "generic",
  "unofficial",
  "reproduction",
  "imitation",
  "dummy",
  "duplicate",
  "counterpart",
  "unbranded",
  "unlicensed",
  "re-creation",
];

const UNOFFICIAL_RESERVED = reservedWordSet(UNOFFICIAL_EXCLUDE_WORDS);

export function unofficialExcludeWords(
  excludeUnofficial?: boolean,
  locale: AppLocale = DEFAULT_APP_LOCALE,
): string[] {
  return excludeUnofficial === false
    ? []
    : localizeExcludeWords(UNOFFICIAL_EXCLUDE_WORDS, locale);
}

export function isUnofficialExcludeWord(word: string): boolean {
  return UNOFFICIAL_RESERVED.has(word.toLowerCase());
}

export function withoutUnofficialExcludeWords(words: string[]): string[] {
  return words.filter((word) => !isUnofficialExcludeWord(word));
}

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
    excludeKeywords: mergeExcludeKeywords([...UNOFFICIAL_EXCLUDE_WORDS]),
    excludeUnofficial: true,
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
    cardNoReprints?: boolean;
    cardNoProxy?: boolean;
    excludeUnofficial?: boolean;
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
    ebaySite?: string;
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
    clearCardNoReprints?: boolean;
    clearCardNoProxy?: boolean;
    clearExcludeUnofficial?: boolean;
    clearFigureCategory?: boolean;
    clearFigureScale?: boolean;
    clearFigurePackaging?: boolean;
    clearFigureCompleteness?: boolean;
    clearFigurePunch?: boolean;
    clearBrickCategory?: boolean;
    clearBrickType?: boolean;
    clearBrickStatus?: boolean;
    clearWheelsCategory?: boolean;
    clearWheelsScale?: boolean;
    clearWheelsPackaging?: boolean;
  },
): WatchCriteria {
  const next: WatchCriteria = { ...criteria };
  if (overrides.ebaySite !== undefined) {
    next.ebaySite = parseEbaySite(overrides.ebaySite) ?? DEFAULT_SITE;
  }
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
  if (
    overrides.clearCardGrade ||
    overrides.clearGrader ||
    next.grader === "raw"
  ) {
    delete next.cardGrade;
  } else if (overrides.cardGrade !== undefined) {
    next.cardGrade = overrides.cardGrade;
  }
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
  if (next.cardGame && !isPokemonCardGame(next.cardGame)) {
    delete next.cardSet;
    delete next.rarity;
  }
  if (overrides.clearCardNoReprints) delete next.cardNoReprints;
  else if (overrides.cardNoReprints !== undefined) {
    next.cardNoReprints = overrides.cardNoReprints;
  }
  if (overrides.clearCardNoProxy) delete next.cardNoProxy;
  else if (overrides.cardNoProxy !== undefined) {
    next.cardNoProxy = overrides.cardNoProxy;
  }
  if (overrides.clearExcludeUnofficial) delete next.excludeUnofficial;
  else if (overrides.excludeUnofficial !== undefined) {
    next.excludeUnofficial = overrides.excludeUnofficial;
  }
  if (overrides.clearFigureCategory) delete next.figureCategory;
  else if (overrides.figureCategory !== undefined) {
    next.figureCategory = overrides.figureCategory;
  }
  if (overrides.clearFigureScale) delete next.figureScale;
  else if (overrides.figureScale !== undefined) {
    next.figureScale = overrides.figureScale;
  }
  if (next.figureScale) {
    const scaleCategory = figureCategoryIds(
      next.figureCategory,
      next.figureScale,
    );
    if (!scaleCategory || !categorySupportsFigureScale(scaleCategory)) {
      delete next.figureScale;
    }
  }
  if (overrides.clearFigurePackaging) delete next.figurePackaging;
  else if (overrides.figurePackaging !== undefined) {
    next.figurePackaging = overrides.figurePackaging;
  }
  if (overrides.clearFigureCompleteness) delete next.figureCompleteness;
  else if (overrides.figureCompleteness !== undefined) {
    next.figureCompleteness = overrides.figureCompleteness;
  }
  if (overrides.clearFigurePunch) delete next.figurePunch;
  else if (overrides.figurePunch !== undefined) {
    next.figurePunch = overrides.figurePunch;
  }
  if (next.figurePackaging !== "loose") delete next.figureCompleteness;
  if (next.figurePackaging !== "carded") delete next.figurePunch;
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
  if (overrides.clearWheelsCategory) delete next.wheelsCategory;
  else if (overrides.wheelsCategory !== undefined) {
    next.wheelsCategory = overrides.wheelsCategory;
  }
  if (overrides.clearWheelsScale) delete next.wheelsScale;
  else if (overrides.wheelsScale !== undefined) {
    next.wheelsScale = overrides.wheelsScale;
  }
  if (next.wheelsScale) {
    const scaleCategory = wheelsCategoryIds(
      next.wheelsCategory,
      next.wheelsScale,
    );
    if (!scaleCategory || !categorySupportsWheelsScale(scaleCategory)) {
      delete next.wheelsScale;
    }
  }
  if (overrides.clearWheelsPackaging) delete next.wheelsPackaging;
  else if (overrides.wheelsPackaging !== undefined) {
    next.wheelsPackaging = overrides.wheelsPackaging;
  }
  const storeLocale = storeLocaleOf(next.ebaySite);
  next.excludeKeywords = mergeExcludeKeywords(
    [
      ...withoutCardExcludeWords(
        withoutFigureExcludeWords(
          withoutCardedExcludeWords(
            withoutUnofficialExcludeWords(
              withoutSealedExcludeWords(
                withoutSetExcludeWords(userExcludeWords(next.excludeKeywords)),
              ),
            ),
          ),
        ),
      ),
      ...unofficialExcludeWords(next.excludeUnofficial, storeLocale),
      ...brickExcludeWords(next.brickType, next.brickStatus, storeLocale),
      ...wheelsExcludeWords(next.wheelsPackaging, storeLocale),
      ...figureExcludeWords(next.figurePackaging, next.figurePunch, storeLocale),
      ...cardExcludeWords(next, storeLocale),
    ],
    cardSkippedDefaultExcludes(next),
    storeLocale,
  );
  return next;
}

/** Coarser eBay search many watches can share. Never poll once per user. */
export function toCoverageQuery(criteria: WatchCriteria): CoverageQuery {
  const storeLocale = storeLocaleOf(criteria.ebaySite);
  const keywords = normalizeQuery(
    composeCatalogQuery(criteria.query, criteria, storeLocale),
  );
  const listingType =
    criteria.listingType === "auction_below" ? "auction" : criteria.listingType;
  const itemLocation =
    criteria.itemLocation && criteria.itemLocation !== "any"
      ? criteria.itemLocation
      : undefined;
  const deliveryCountry = criteria.shipToCountry?.trim() || undefined;
  const deliveryPostal = criteria.shipToPostal?.trim() || undefined;
  const categoryIds =
    cardCategoryIds(criteria.cardCategory, criteria.cardGame) ||
    figureCategoryIds(criteria.figureCategory, criteria.figureScale) ||
    criteria.brickCategory?.trim() ||
    wheelsCategoryIds(criteria.wheelsCategory, criteria.wheelsScale) ||
    undefined;
  const cardAspect = cardGameAspectFilter(
    criteria.cardCategory,
    criteria.cardGame,
  );
  const figureAspect = figureScaleAspectFilter(
    criteria.figureCategory,
    criteria.figureScale,
  );
  const wheelsAspect = wheelsScaleAspectFilter(
    criteria.wheelsCategory,
    criteria.wheelsScale,
  );
  const aspectFilter = cardAspect || figureAspect || wheelsAspect;
  const key = [
    criteria.ebaySite,
    criteria.condition,
    listingType,
    itemLocation ?? "any",
    deliveryCountry ? `to:${deliveryCountry}` : "to:any",
    deliveryPostal ? `zip:${deliveryPostal}` : "zip:",
    categoryIds ? `cat:${categoryIds}` : "cat:",
    aspectFilter ? `asp:${aspectFilter}` : "asp:",
    coverageKeywords(composeCatalogQuery(criteria.query, criteria, storeLocale)),
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
    ...(categoryIds ? { categoryIds } : {}),
    ...(aspectFilter ? { aspectFilter } : {}),
  };
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function describeWatch(criteria: WatchCriteria): string {
  const bits = [criteria.query];
  if (criteria.ebaySite && criteria.ebaySite !== DEFAULT_SITE) {
    bits.push(ebaySiteLabel(criteria.ebaySite));
  }
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
  const grader = cardGraderDescribe(criteria);
  if (grader) bits.push(grader);
  const cardCategory = cardCategoryLabel(criteria.cardCategory);
  if (cardCategory) bits.push(cardCategory);
  const cardGame = cardGameLabel(criteria.cardGame);
  if (cardGame) bits.push(cardGame);
  const figureCategory = figureCategoryLabel(criteria.figureCategory);
  if (figureCategory) bits.push(figureCategory);
  const figureScale = figureScaleLabel(criteria.figureScale);
  if (figureScale) bits.push(figureScale);
  const figurePackaging = figurePackagingLabel(criteria.figurePackaging);
  if (figurePackaging) bits.push(figurePackaging);
  const figureCompleteness = figureCompletenessLabel(
    criteria.figureCompleteness,
  );
  if (figureCompleteness) bits.push(figureCompleteness);
  const figurePunch = figurePunchLabel(criteria.figurePunch);
  if (figurePunch) bits.push(figurePunch);
  const brickCategory = brickCategoryLabel(criteria.brickCategory);
  if (brickCategory) bits.push(brickCategory);
  const brickType = brickTypeLabel(criteria.brickType);
  if (brickType) bits.push(brickType);
  const brickStatus = brickStatusLabel(criteria.brickStatus);
  if (brickStatus) bits.push(brickStatus);
  const wheelsCategory = wheelsCategoryLabel(criteria.wheelsCategory);
  if (wheelsCategory) bits.push(wheelsCategory);
  const wheelsScale = wheelsScaleLabel(criteria.wheelsScale);
  if (wheelsScale) bits.push(wheelsScale);
  const wheelsPackaging = wheelsPackagingLabel(criteria.wheelsPackaging);
  if (wheelsPackaging) bits.push(wheelsPackaging);
  const excluded = userExcludeWords(criteria.excludeKeywords);
  if (excluded.length > 0) {
    bits.push(`excluding ${excluded.join(", ")}`);
  }
  return bits.join(" · ");
}

function putFilter(
  filters: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value === undefined || value === null || value === "" || value === false) {
    return;
  }
  if (Array.isArray(value) && value.length === 0) return;
  filters[key] = value;
}

/** Browse and page filters actually applied to a search, skipping defaults. */
export function compactSearchFilters(
  intent: WatchCriteria,
  coverage?: CoverageQuery,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  putFilter(filters, "minCents", intent.minLandedCents);
  putFilter(filters, "maxCents", intent.maxLandedCents);
  if (intent.condition !== "any") putFilter(filters, "condition", intent.condition);
  if (intent.listingType !== "all") putFilter(filters, "listing", intent.listingType);
  if (intent.itemLocation && intent.itemLocation !== "any") {
    putFilter(filters, "located", intent.itemLocation);
  }
  putFilter(filters, "to", intent.shipToCountry);
  putFilter(filters, "zip", intent.shipToPostal);
  putFilter(filters, "confidence", intent.minConfidence);
  putFilter(filters, "score", intent.minPriceScore);
  if (intent.excludeKeywords.length > 0) {
    putFilter(filters, "exclude", intent.excludeKeywords.slice(0, 20));
  }
  putFilter(filters, "set", intent.cardSet);
  putFilter(filters, "rarity", intent.rarity);
  putFilter(filters, "printing", intent.printing);
  putFilter(filters, "language", intent.language);
  putFilter(filters, "grader", intent.grader);
  putFilter(filters, "grade", intent.cardGrade);
  putFilter(filters, "cardCategory", intent.cardCategory);
  putFilter(filters, "cardGame", intent.cardGame);
  putFilter(filters, "noReprints", intent.cardNoReprints);
  putFilter(filters, "noProxy", intent.cardNoProxy);
  if (intent.excludeUnofficial === false) putFilter(filters, "unofficial", true);
  putFilter(filters, "figureCategory", intent.figureCategory);
  putFilter(filters, "figureScale", intent.figureScale);
  putFilter(filters, "figurePackaging", intent.figurePackaging);
  putFilter(filters, "figureCompleteness", intent.figureCompleteness);
  putFilter(filters, "figurePunch", intent.figurePunch);
  putFilter(filters, "brickCategory", intent.brickCategory);
  putFilter(filters, "brickType", intent.brickType);
  putFilter(filters, "brickStatus", intent.brickStatus);
  putFilter(filters, "wheelsCategory", intent.wheelsCategory);
  putFilter(filters, "wheelsScale", intent.wheelsScale);
  putFilter(filters, "wheelsPackaging", intent.wheelsPackaging);
  if (coverage) {
    putFilter(filters, "categoryIds", coverage.categoryIds);
    putFilter(filters, "aspectFilter", coverage.aspectFilter);
    if (coverage.keywords && coverage.keywords !== intent.query) {
      putFilter(filters, "browseQ", coverage.keywords.slice(0, 200));
    }
  }
  return filters;
}

export function listingMatchesGrader(
  listing: { title?: string },
  grader?: string,
  minGrade?: string,
): boolean {
  if (!isSlabGrader(grader) || !grader) return true;
  const hay = listing.title ?? "";
  const parsed = parseCollectibleFromText(hay);
  const wanted = grader.toLowerCase();
  const company = parsed.company?.toLowerCase();
  const mentions =
    company === wanted || new RegExp(`\\b${wanted}\\b`, "i").test(hay);
  if (!mentions) return false;
  const min = Number(minGrade);
  if (!Number.isFinite(min) || min <= 1) return true;
  if (!parsed.grade) return true;
  const grade = Number(parsed.grade);
  return Number.isFinite(grade) && grade >= min;
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
  const countries = itemLocationCountries(value);
  if (!countries?.length) return undefined;
  return `itemLocationCountry:{${countries.join("|")}}`;
}
