import { dollarsToCents } from "./pricing.ts";
import { parseEbaySite } from "./ebay-sites.ts";
import { parseShipToPostal } from "./ship-to-postal.ts";
import { parseMinPriceScore } from "./price-score.ts";
import { parseMinConfidence } from "./seller-confidence.ts";
import {
  parseBrickCategory,
  parseBrickStatus,
  parseBrickType,
} from "./brick-filters.ts";
import {
  parseCardCategory,
  parseCardGame,
  parseCardGrade,
  parseCardGrader,
  parseCardLanguage,
  parseCardPrinting,
  parseCardRarity,
  parseCardSet,
} from "./card-filters.ts";
import {
  parseFigureCategory,
  parseFigureCompleteness,
  parseFigurePackaging,
  parseFigurePunch,
  parseFigureScale,
} from "./figure-filters.ts";
import {
  parseWheelsCategory,
  parseWheelsPackaging,
  parseWheelsScale,
} from "./wheel-filters.ts";
import { searchParamsFromIntent } from "./watch-search.ts";
import {
  applyWatchOverrides,
  mergeExcludeKeywords,
  parseAvailableTo,
  parseConditionFilter,
  parseExcludeWords,
  parseItemLocation,
  parseListingTypeFilter,
  parseSearchIntent,
  userExcludeWords,
  type ConditionClass,
  type ListingType,
  type WatchCriteria,
} from "./watch-criteria.ts";

const REPLY_MAX = 400;

export type AgentTurnInput = {
  ebaySite?: string;
  current?: WatchCriteria;
};

export type InterpretedAgentTurn =
  | { action: "out_of_scope" }
  | { action: "clarify"; reply: string; fresh: boolean }
  | {
      action: "search";
      reply: string;
      fresh: boolean;
      criteria: WatchCriteria;
      params: URLSearchParams;
    };

export function interpretAgentTurn(
  raw: unknown,
  input: AgentTurnInput = {},
): InterpretedAgentTurn {
  if (!isRecord(raw)) return { action: "out_of_scope" };
  const action = raw.action;
  if (action === "out_of_scope") return { action: "out_of_scope" };
  if (action !== "search" && action !== "clarify" && action !== undefined) {
    return { action: "out_of_scope" };
  }

  const reply = clampReply(raw.reply);
  const fresh = raw.fresh === true;
  if (action === "clarify") return { action: "clarify", reply, fresh };

  const criteria = criteriaFromAgent(
    raw,
    fresh
      ? input.ebaySite
        ? { ebaySite: input.ebaySite }
        : {}
      : input,
  );
  if (!criteria.query.trim()) return { action: "clarify", reply, fresh };

  return {
    action: "search",
    reply,
    fresh,
    criteria,
    params: searchParamsFromIntent(criteria.query, criteria),
  };
}

/** Short allow-list the model is asked to copy. Unknown ids are ignored. */
export function agentSearchGuide(): string {
  return [
    "query: keywords for the piece. Put the name here.",
    "minDollars, maxDollars: price to the door, as numbers.",
    "condition: any | 1000 (new) | 1500 | 1750 | 2750 | 3000 (used) | 4000 | 5000 | 6000 | 2990 | 3010 | graded.",
    "listing: all | bin | auction | best_offer.",
    "exclude: words to leave out, comma-separated.",
    "located: any, region:NORTH_AMERICA, region:EUROPEAN_UNION, region:UK_AND_IRELAND, region:ASIA, or country:XX.",
    "to: ship-to country code such as US, GB, DE, or any.",
    "zip: ship-to postal code.",
    "confidence, score: a minimum from 1 to 10, only when the collector names that number. Omit both when they only want the results sorted.",
    "grader: raw | psa | cgc | bgs | sgc. grade: 10 | 9.5 | 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1.",
    "language: english | japanese | french | german | spanish | italian.",
    "figurePackaging: carded | loose. figureCompleteness: complete | incomplete. figurePunch: unpunched | punched.",
    "brickType: set | minifigure | instructions-manual | original-box. brickStatus: factory-sealed | complete | incomplete.",
    "wheelsPackaging: carded | loose. wheelsScale: 1-64 | 1-43 | 1-18.",
    "unofficial: true excludes unofficial pieces.",
    "cardNoReprints, cardNoProxy: booleans.",
    "Omit a field to keep the current search. null clears that field.",
    "When fresh is true, nothing is kept: set the query and every filter the new search needs.",
    "Do not invent category ids.",
  ].join("\n");
}

function criteriaFromAgent(
  raw: Record<string, unknown>,
  input: AgentTurnInput,
): WatchCriteria {
  let next: WatchCriteria = input.current
    ? { ...input.current, excludeKeywords: [...input.current.excludeKeywords] }
    : blankCriteria(input.ebaySite);

  const query = optionalText(raw.query);
  if (has(raw, "query") && raw.query === null) {
    next = { ...next, query: "" };
  } else if (query) {
    next = applyQueryText(next, query);
  }

  const overrides: Parameters<typeof applyWatchOverrides>[1] = {};
  const site = input.ebaySite
    ? parseEbaySite(input.ebaySite)
    : optionalText(raw.site)
      ? parseEbaySite(optionalText(raw.site))
      : undefined;
  if (site) overrides.ebaySite = site;

  const condition = conditionOverride(raw.condition);
  if (condition === "clear") overrides.condition = "any";
  else if (condition) overrides.condition = condition;

  const listing = listingOverride(raw.listing);
  if (listing === "clear") overrides.listingType = "all";
  else if (listing) overrides.listingType = listing;

  const located = locationOverride(raw.located);
  if (located === "clear") overrides.itemLocation = "any";
  else if (located) overrides.itemLocation = located;

  const available = availableOverride(raw.to);
  if (available === "clear") overrides.clearShipTo = true;
  else if (available) overrides.shipToCountry = available;

  const confidence = scoreOverride(raw.confidence, parseMinConfidence);
  if (confidence === "clear") overrides.clearMinConfidence = true;
  else if (confidence !== undefined) overrides.minConfidence = confidence;

  const score = scoreOverride(raw.score, parseMinPriceScore);
  if (score === "clear") overrides.clearMinPriceScore = true;
  else if (score !== undefined) overrides.minPriceScore = score;

  if (has(raw, "exclude") && raw.exclude === null) {
    overrides.excludeKeywords = mergeExcludeKeywords([]);
  } else {
    const exclude = excludeOverride(raw.exclude);
    if (exclude) overrides.excludeKeywords = mergeExcludeKeywords(exclude);
  }

  assignCatalog(overrides, "cardSet", "clearCardSet", raw.set, parseCardSet);
  assignCatalog(overrides, "rarity", "clearRarity", raw.rarity, parseCardRarity);
  assignCatalog(
    overrides,
    "printing",
    "clearPrinting",
    raw.printing,
    parseCardPrinting,
  );
  assignCatalog(
    overrides,
    "language",
    "clearLanguage",
    raw.language,
    parseCardLanguage,
  );
  assignCatalog(overrides, "grader", "clearGrader", raw.grader, parseCardGrader);
  assignCatalog(
    overrides,
    "cardGrade",
    "clearCardGrade",
    raw.grade,
    parseCardGrade,
  );
  assignCatalog(
    overrides,
    "cardCategory",
    "clearCardCategory",
    raw.cardCategory,
    parseCardCategory,
  );
  assignCatalog(
    overrides,
    "cardGame",
    "clearCardGame",
    raw.cardGame,
    parseCardGame,
  );
  assignCatalog(
    overrides,
    "figureCategory",
    "clearFigureCategory",
    raw.figureCategory,
    parseFigureCategory,
  );
  assignCatalog(
    overrides,
    "figureScale",
    "clearFigureScale",
    raw.figureScale,
    parseFigureScale,
  );
  assignCatalog(
    overrides,
    "figurePackaging",
    "clearFigurePackaging",
    raw.figurePackaging,
    parseFigurePackaging,
  );
  assignCatalog(
    overrides,
    "figureCompleteness",
    "clearFigureCompleteness",
    raw.figureCompleteness,
    parseFigureCompleteness,
  );
  assignCatalog(
    overrides,
    "figurePunch",
    "clearFigurePunch",
    raw.figurePunch,
    parseFigurePunch,
  );
  assignCatalog(
    overrides,
    "brickCategory",
    "clearBrickCategory",
    raw.brickCategory,
    parseBrickCategory,
  );
  assignCatalog(
    overrides,
    "brickType",
    "clearBrickType",
    raw.brickType,
    parseBrickType,
  );
  assignCatalog(
    overrides,
    "brickStatus",
    "clearBrickStatus",
    raw.brickStatus,
    parseBrickStatus,
  );
  assignCatalog(
    overrides,
    "wheelsCategory",
    "clearWheelsCategory",
    raw.wheelsCategory,
    parseWheelsCategory,
  );
  assignCatalog(
    overrides,
    "wheelsScale",
    "clearWheelsScale",
    raw.wheelsScale,
    parseWheelsScale,
  );
  assignCatalog(
    overrides,
    "wheelsPackaging",
    "clearWheelsPackaging",
    raw.wheelsPackaging,
    parseWheelsPackaging,
  );

  const reprints = boolOverride(raw.cardNoReprints);
  if (reprints === "clear") overrides.clearCardNoReprints = true;
  else if (reprints !== undefined) overrides.cardNoReprints = reprints;

  const proxy = boolOverride(raw.cardNoProxy);
  if (proxy === "clear") overrides.clearCardNoProxy = true;
  else if (proxy !== undefined) overrides.cardNoProxy = proxy;

  const unofficial = boolOverride(raw.unofficial);
  if (unofficial === "clear") overrides.clearExcludeUnofficial = true;
  else if (unofficial !== undefined) overrides.excludeUnofficial = unofficial;

  const min = moneyOverride(has(raw, "minDollars") ? raw.minDollars : undefined);
  const max = moneyOverride(has(raw, "maxDollars") ? raw.maxDollars : undefined);
  if (typeof min === "number") overrides.minLandedCents = min;
  if (typeof max === "number") overrides.maxLandedCents = max;

  const zip = has(raw, "zip") ? zipOverride(raw.zip) : undefined;
  if (typeof zip === "string") overrides.shipToPostal = zip;

  next = applyWatchOverrides(next, overrides);

  if (min === "clear") delete next.minLandedCents;
  if (max === "clear") delete next.maxLandedCents;
  if (zip === "clear") delete next.shipToPostal;
  if (
    next.minLandedCents !== undefined &&
    next.maxLandedCents !== undefined &&
    next.minLandedCents > next.maxLandedCents
  ) {
    const swapped = next.minLandedCents;
    next.minLandedCents = next.maxLandedCents;
    next.maxLandedCents = swapped;
  }
  return next;
}

function applyQueryText(criteria: WatchCriteria, query: string): WatchCriteria {
  const parsed = parseSearchIntent(query);
  const next: WatchCriteria = { ...criteria, query: parsed.query };
  if (parsed.maxLandedCents !== undefined) {
    next.maxLandedCents = parsed.maxLandedCents;
  }
  if (parsed.minLandedCents !== undefined) {
    next.minLandedCents = parsed.minLandedCents;
  }
  if (parsed.listingType !== "all") next.listingType = parsed.listingType;
  if (parsed.condition !== "any") next.condition = parsed.condition;
  if (parsed.gradeCompany) {
    next.gradeCompany = parsed.gradeCompany;
    if (parsed.minGrade !== undefined) next.minGrade = parsed.minGrade;
  }
  return next;
}

function blankCriteria(ebaySite: string | undefined): WatchCriteria {
  const criteria = parseSearchIntent("");
  const site = ebaySite ? parseEbaySite(ebaySite) : undefined;
  if (site) criteria.ebaySite = site;
  return criteria;
}

function assignCatalog(
  overrides: Parameters<typeof applyWatchOverrides>[1],
  field: CatalogField,
  clear: CatalogClear,
  value: unknown,
  parse: (raw: string | undefined) => string | undefined,
) {
  if (value === undefined) return;
  const parsed = catalogOverride(value, parse);
  if (parsed === "clear") overrides[clear] = true;
  else if (parsed) overrides[field] = parsed;
}

type CatalogField =
  | "cardSet"
  | "rarity"
  | "printing"
  | "language"
  | "grader"
  | "cardGrade"
  | "cardCategory"
  | "cardGame"
  | "figureCategory"
  | "figureScale"
  | "figurePackaging"
  | "figureCompleteness"
  | "figurePunch"
  | "brickCategory"
  | "brickType"
  | "brickStatus"
  | "wheelsCategory"
  | "wheelsScale"
  | "wheelsPackaging";

type CatalogClear =
  | "clearCardSet"
  | "clearRarity"
  | "clearPrinting"
  | "clearLanguage"
  | "clearGrader"
  | "clearCardGrade"
  | "clearCardCategory"
  | "clearCardGame"
  | "clearFigureCategory"
  | "clearFigureScale"
  | "clearFigurePackaging"
  | "clearFigureCompleteness"
  | "clearFigurePunch"
  | "clearBrickCategory"
  | "clearBrickType"
  | "clearBrickStatus"
  | "clearWheelsCategory"
  | "clearWheelsScale"
  | "clearWheelsPackaging";

function catalogOverride(
  value: unknown,
  parse: (raw: string | undefined) => string | undefined,
): string | "clear" | undefined {
  if (value === null) return "clear";
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed === "any") return "clear";
  return parse(trimmed);
}

function conditionOverride(
  value: unknown,
): ConditionClass | "clear" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "clear";
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed === "any") return "clear";
  const parsed = parseConditionFilter(trimmed);
  if (parsed === "any") return undefined;
  return parsed;
}

function listingOverride(value: unknown): ListingType | "clear" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "clear";
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed === "all") return "clear";
  const parsed = parseListingTypeFilter(trimmed);
  if (parsed === "all") return undefined;
  return parsed;
}

function locationOverride(value: unknown): string | "clear" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "clear";
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed === "any") return "clear";
  const parsed = parseItemLocation(trimmed);
  if (parsed === "any") return undefined;
  return parsed;
}

function availableOverride(value: unknown): string | "clear" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "clear";
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed === "any") return "clear";
  const parsed = parseAvailableTo(trimmed);
  if (parsed === "any") return undefined;
  return parsed;
}

function scoreOverride(
  value: unknown,
  parse: (raw: string | undefined) => number | undefined,
): number | "clear" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "clear";
  const raw =
    typeof value === "number" && Number.isFinite(value)
      ? String(Math.trunc(value))
      : typeof value === "string"
        ? value
        : undefined;
  if (raw === undefined) return undefined;
  if (!raw.trim()) return undefined;
  return parse(raw);
}

function moneyOverride(value: unknown): number | "clear" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "clear";
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return undefined;
    return Math.round(value * 100);
  }
  if (typeof value === "string") {
    if (!value.trim()) return undefined;
    return dollarsToCents(value);
  }
  return undefined;
}

function zipOverride(value: unknown): string | "clear" | undefined {
  if (value === null) return "clear";
  if (typeof value === "number" && Number.isFinite(value)) {
    return parseShipToPostal(String(value));
  }
  if (typeof value !== "string") return undefined;
  if (!value.trim()) return undefined;
  return parseShipToPostal(value);
}

function excludeOverride(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const words = value.filter((item) => typeof item === "string").join(", ");
    const parsed = userExcludeWords(parseExcludeWords(words));
    return parsed.length ? parsed : undefined;
  }
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = userExcludeWords(parseExcludeWords(value));
  return parsed.length ? parsed : undefined;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed || undefined;
}

function boolOverride(value: unknown): boolean | "clear" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "clear";
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

function clampReply(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, REPLY_MAX);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function has(raw: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(raw, key);
}
