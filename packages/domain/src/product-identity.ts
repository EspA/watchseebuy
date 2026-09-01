import {
  CARD_LANGUAGE_FILTERS,
  CARD_PRINTING_FILTERS,
  CARD_SET_FILTERS,
} from "./card-filters.ts";

export type IdentitySource = "epid" | "gtin" | "mpn" | "aspects" | "title";
export type IdentityConfidence = "high" | "medium" | "low";

export type TypedNameValue = {
  name?: string;
  value?: string;
};

export type ConditionDescriptor = {
  name?: string;
  values?: string[];
  additionalInfo?: string;
};

export type ProductSignals = {
  title: string;
  description?: string;
  epid?: string;
  gtin?: string;
  brand?: string;
  mpn?: string;
  localizedAspects?: TypedNameValue[];
  conditionDescriptors?: ConditionDescriptor[];
};

export type ProductIdentity = {
  itemKey: string;
  confidence: IdentityConfidence;
  source: IdentitySource;
  label: string;
};

export type CardKeyParts = {
  company?: string;
  set?: string;
  subject?: string;
  cardNumber?: string;
  language?: string;
  variation?: string;
  grade?: string;
  year?: string;
};

const EMPTY = "_";

const GRADER_RE =
  /\b(psa|bgs|sgc|cgc|tag|hga|ace|csg|bvg)\s*(\d+(?:\.\d+)?)\b/i;
const GRADER_ONLY_RE = /\b(psa|bgs|sgc|cgc|tag|hga|ace|csg|bvg)\b/i;
const HASH_NUM_RE = /#\s*(\d{1,4}[a-z]?(?:\/\d{1,4})?)/i;
const FRACTION_NUM_RE = /\b(\d{1,3})\s*\/\s*(\d{2,4})\b/;
const YEAR_RE = /\b((?:19|20)\d{2})\b/;
const CERT_RE = /\bcert(?:ification)?(?:\s+(?:no|number|#))?\s*#?\s*\d{6,}\b/i;
const LEGO_RE = /\blego\b/i;
const LEGO_SET_RE = /\b(\d{4,5})\b/;
const SEALED_RE = /\b(?:sealed|nisb|new in (?:sealed )?box)\b/i;
const OPENED_RE = /\b(?:opened|used|incomplete|no box)\b/i;

const SPORT_SETS = [
  "upper deck",
  "topps chrome",
  "topps",
  "fleer",
  "donruss",
  "panini",
  "bowman",
  "score",
] as const;

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "or",
  "of",
  "for",
  "from",
  "with",
  "to",
  "in",
  "on",
  "card",
  "cards",
  "graded",
  "ungraded",
  "gem",
  "mint",
  "authentic",
  "pokemon",
  "pokémon",
  "tcg",
  "yugioh",
  "yu-gi-oh",
  "magic",
  "mtg",
  "holo",
  "holofoil",
  "rare",
  "nm",
  "lp",
  "mp",
  "english",
  "japanese",
  "new",
  "box",
  "pack",
  "fresh",
]);

const ASPECT_FIELD: Record<string, keyof CardKeyParts> = {
  set: "set",
  "set name": "set",
  "card set": "set",
  "set name-subtitle": "set",
  character: "subject",
  player: "subject",
  "player/athlete": "subject",
  "card name": "subject",
  name: "subject",
  subject: "subject",
  "card number": "cardNumber",
  "card no": "cardNumber",
  number: "cardNumber",
  language: "language",
  feature: "variation",
  features: "variation",
  variation: "variation",
  variety: "variation",
  finish: "variation",
  "special features": "variation",
  parallel: "variation",
  year: "year",
};

const GRADER_IDS: Record<string, string> = {
  "275010": "psa",
  "275013": "bgs",
  "275015": "sgc",
  "275014": "cgc",
};

export function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cardItemKey(parts: CardKeyParts): string {
  const set = [parts.year, parts.set].filter(Boolean).join(" ");
  return [
    "card",
    slug(set) || EMPTY,
    slug(parts.subject ?? "") || EMPTY,
    slug(parts.cardNumber ?? "") || EMPTY,
    slug(parts.language ?? "") || EMPTY,
    slug(parts.variation ?? "") || EMPTY,
    (parts.company ?? "raw").toLowerCase(),
    parts.grade ?? "ungraded",
  ].join("|");
}

export function resolveProductIdentity(signals: ProductSignals): ProductIdentity {
  const fromText = parseCollectibleFromText(
    [signals.title, signals.description].filter(Boolean).join(" "),
  );
  const fromAspects = partsFromAspects(signals.localizedAspects);
  const fromDescriptors = partsFromDescriptors(signals.conditionDescriptors);
  const parsed = mergeCardParts(fromText, fromAspects, fromDescriptors);
  const catalog = catalogStem(signals);
  if (catalog) {
    const suffix = conditionSuffix(parsed);
    return {
      itemKey: suffix ? `${catalog.stem}|${suffix}` : catalog.stem,
      confidence: "high",
      source: catalog.source,
      label: identityLabel(catalog.stem, parsed, catalog.source),
    };
  }

  const aspectCard = mergeCardParts(fromAspects, fromDescriptors);
  if (hasStructuredCard(aspectCard, "aspects")) {
    return {
      itemKey: cardItemKey(parsed),
      confidence: cardConfidence(parsed, "aspects"),
      source: "aspects",
      label: identityLabel(undefined, parsed, "aspects"),
    };
  }

  const lego = legoKey(signals.title, signals.description);
  if (lego) return lego;

  if (hasStructuredCard(parsed, "title")) {
    return {
      itemKey: cardItemKey(parsed),
      confidence: cardConfidence(parsed, "title"),
      source: "title",
      label: identityLabel(undefined, parsed, "title"),
    };
  }

  const fallback = fallbackTitleKey(signals.title);
  return {
    itemKey: fallback,
    confidence: "low",
    source: "title",
    label: signals.title.trim() || "Unknown item",
  };
}

export function parseCollectibleSignals(signals: ProductSignals): CardKeyParts {
  return mergeCardParts(
    parseCollectibleFromText(
      [signals.title, signals.description].filter(Boolean).join(" "),
    ),
    partsFromAspects(signals.localizedAspects),
    partsFromDescriptors(signals.conditionDescriptors),
  );
}

function mergeCardParts(...layers: CardKeyParts[]): CardKeyParts {
  const merged: CardKeyParts = {};
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer) as Array<
      [keyof CardKeyParts, string | undefined]
    >) {
      if (value) merged[key] = value;
    }
  }
  return merged;
}

export function parseCollectibleFromText(text: string): CardKeyParts {
  const parts: CardKeyParts = {};
  const hay = text
    .replace(new RegExp(CERT_RE, "gi"), " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!hay) return parts;

  const graded = hay.match(GRADER_RE);
  if (graded?.[1] && graded[2]) {
    parts.company = graded[1].toLowerCase();
    parts.grade = graded[2];
  } else {
    const company = hay.match(GRADER_ONLY_RE);
    if (company?.[1]) parts.company = company[1].toLowerCase();
  }

  const hash = hay.match(HASH_NUM_RE);
  const fraction = hay.match(FRACTION_NUM_RE);
  if (hash?.[1]) parts.cardNumber = hash[1].replace(/\s+/g, "");
  else if (fraction?.[1] && fraction[2]) {
    parts.cardNumber = `${fraction[1]}/${fraction[2]}`;
  }

  const year = hay.match(YEAR_RE);
  if (year?.[1]) parts.year = year[1];

  const set = matchLongestLabel(hay, [
    ...CARD_SET_FILTERS.map((option) => option.label),
    ...SPORT_SETS,
  ]);
  if (set) parts.set = set;

  const language = matchLongestLabel(
    hay,
    CARD_LANGUAGE_FILTERS.map((option) => option.label),
  );
  if (language) parts.language = language;

  const variation = matchLongestLabel(
    hay,
    CARD_PRINTING_FILTERS.map((option) => option.label),
  );
  if (variation) parts.variation = variation;

  const subject = subjectFromText(hay, parts);
  if (subject) parts.subject = subject;
  return parts;
}

export function signalsFromListing(listing: {
  title: string;
  description?: string;
  epid?: string;
  gtin?: string;
  brand?: string;
  mpn?: string;
  localizedAspects?: TypedNameValue[];
  conditionDescriptors?: ConditionDescriptor[];
}): ProductSignals {
  const signals: ProductSignals = { title: listing.title };
  if (listing.description) signals.description = listing.description;
  if (listing.epid) signals.epid = listing.epid;
  if (listing.gtin) signals.gtin = listing.gtin;
  if (listing.brand) signals.brand = listing.brand;
  if (listing.mpn) signals.mpn = listing.mpn;
  if (listing.localizedAspects) {
    signals.localizedAspects = listing.localizedAspects;
  }
  if (listing.conditionDescriptors) {
    signals.conditionDescriptors = listing.conditionDescriptors;
  }
  return signals;
}

export function applyListingIdentity<T extends ProductSignals>(
  listing: T,
): T & { identity: ProductIdentity } {
  return { ...listing, identity: resolveProductIdentity(listing) };
}

function catalogStem(
  signals: ProductSignals,
): { stem: string; source: "epid" | "gtin" | "mpn" } | undefined {
  const epid = normalizeId(signals.epid);
  if (epid) return { stem: `epid|${epid}`, source: "epid" };
  const gtin = normalizeId(signals.gtin);
  if (gtin) return { stem: `gtin|${gtin}`, source: "gtin" };
  const brand = slug(signals.brand ?? "");
  const mpn = normalizeId(signals.mpn);
  if (brand && mpn) return { stem: `mpn|${brand}|${mpn}`, source: "mpn" };
  return undefined;
}

function conditionSuffix(parts: CardKeyParts): string | undefined {
  if (parts.company && parts.grade) {
    return `${parts.company}|${parts.grade}`;
  }
  if (parts.grade) return `raw|${parts.grade}`;
  return undefined;
}

function hasStructuredCard(
  parts: CardKeyParts,
  source: "aspects" | "title",
): boolean {
  if (!parts.subject) return false;
  if (source === "aspects") return Boolean(parts.set || parts.cardNumber);
  return Boolean(parts.set || parts.cardNumber || parts.company);
}

function cardConfidence(
  parts: CardKeyParts,
  source: "aspects" | "title",
): IdentityConfidence {
  const rich =
    Boolean(parts.set && parts.subject && parts.cardNumber) &&
    Boolean(parts.company && parts.grade);
  if (source === "aspects") return rich ? "high" : "medium";
  return rich ? "medium" : "low";
}

function legoKey(
  title: string,
  description?: string,
): ProductIdentity | undefined {
  const hay = `${title} ${description ?? ""}`;
  if (!LEGO_RE.test(hay)) return undefined;
  const numbers = [...hay.matchAll(new RegExp(LEGO_SET_RE, "g"))]
    .map((match) => match[1])
    .filter((value): value is string => {
      if (!value) return false;
      return !YEAR_RE.test(value);
    });
  const setNumber = numbers[0];
  if (!setNumber) return undefined;
  const state = SEALED_RE.test(hay)
    ? "sealed"
    : OPENED_RE.test(hay)
      ? "opened"
      : "any";
  return {
    itemKey: `lego|${setNumber}|${state}`,
    confidence: "medium",
    source: "title",
    label: `Lego ${setNumber}${state === "any" ? "" : ` ${state}`}`,
  };
}

function fallbackTitleKey(title: string): string {
  const tokens = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .slice(0, 6);
  return `title|${tokens.join("-") || "unknown"}`;
}

function partsFromAspects(
  aspects: TypedNameValue[] | undefined,
): CardKeyParts {
  const parts: CardKeyParts = {};
  for (const aspect of aspects ?? []) {
    const field = ASPECT_FIELD[normalizeAspectName(aspect.name)];
    const value = aspect.value?.trim();
    if (!field || !value) continue;
    parts[field] = value;
  }
  return parts;
}

function partsFromDescriptors(
  descriptors: ConditionDescriptor[] | undefined,
): CardKeyParts {
  const parts: CardKeyParts = {};
  for (const descriptor of descriptors ?? []) {
    const name = (descriptor.name ?? "").trim().toLowerCase();
    const raw = descriptor.values?.[0];
    if (name.includes("certif") || name === "27503") continue;
    if (name.includes("grader") || name === "27501") {
      const company = normalizeGrader(raw);
      if (company) parts.company = company;
      continue;
    }
    if (name.includes("grade") || name === "27502") {
      const grade = normalizeGrade(raw);
      if (grade) parts.grade = grade;
    }
  }
  return parts;
}

function normalizeGrader(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (GRADER_IDS[raw]) return GRADER_IDS[raw];
  const named = raw.match(GRADER_ONLY_RE);
  return named?.[1]?.toLowerCase();
}

function normalizeGrade(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  return match?.[1];
}

function normalizeAspectName(name: string | undefined): string {
  return (name ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
}

function normalizeId(value: string | undefined): string | undefined {
  const clean = value?.trim();
  return clean ? clean.toLowerCase() : undefined;
}

function matchLongestLabel(text: string, labels: string[]): string | undefined {
  const hay = text.toLowerCase();
  let best: string | undefined;
  for (const label of labels) {
    const needle = label.toLowerCase();
    if (hay.includes(needle) && needle.length > (best?.length ?? 0)) {
      best = label;
    }
  }
  return best;
}

function subjectFromText(text: string, parts: CardKeyParts): string | undefined {
  let rest = text;
  const drop: string[] = [
    parts.set,
    parts.language,
    parts.variation,
    parts.year,
    parts.cardNumber,
    parts.company,
    parts.grade,
    ...CARD_SET_FILTERS.map((option) => option.label),
    ...CARD_LANGUAGE_FILTERS.map((option) => option.label),
    ...CARD_PRINTING_FILTERS.map((option) => option.label),
    ...SPORT_SETS,
  ].filter((value): value is string => Boolean(value));
  for (const phrase of drop) {
    rest = rest.replace(new RegExp(escapeRegExp(phrase), "ig"), " ");
  }
  rest = rest
    .replace(GRADER_RE, " ")
    .replace(HASH_NUM_RE, " ")
    .replace(FRACTION_NUM_RE, " ")
    .replace(YEAR_RE, " ");
  const tokens = rest
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (token) =>
        token.length > 1 &&
        !STOPWORDS.has(token) &&
        !/^\d{6,}$/.test(token),
    );
  if (tokens.length === 0) return undefined;
  return tokens.slice(0, 4).join(" ");
}

function identityLabel(
  catalogStem: string | undefined,
  parts: CardKeyParts,
  source: IdentitySource,
): string {
  const bits = [
    parts.year,
    parts.set,
    parts.subject,
    parts.cardNumber ? `#${parts.cardNumber}` : undefined,
    parts.language,
    parts.variation,
    parts.company && parts.grade
      ? `${parts.company.toUpperCase()} ${parts.grade}`
      : parts.grade,
  ].filter(Boolean);
  if (bits.length > 0) return bits.join(" ");
  if (catalogStem) return catalogStem.replace(/\|/g, " ");
  return source;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
