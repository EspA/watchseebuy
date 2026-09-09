/**
 * Building Toys facets. Category IDs are the official eBay US Taxonomy
 * subtree under Building Toys (183446). Type and status have no Browse
 * filter — selected values inject keywords (or exclude words for Set
 * and Factory Sealed).
 */

export type BrickFilterOption = { value: string; label: string };

export type BrickCategoryGroup = "LEGO Building Toys" | "Building Toys & Blocks";

export type BrickCategoryOption = BrickFilterOption & {
  group?: BrickCategoryGroup;
};

export const BRICK_CATEGORY_ROOT = "183446";

export const BRICK_CATEGORY_FILTERS: BrickCategoryOption[] = [
  { value: "183446", label: "Building Toys" },
  { value: "183447", label: "LEGO Building Toys", group: "LEGO Building Toys" },
  {
    value: "19006",
    label: "LEGO Complete Sets & Packs",
    group: "LEGO Building Toys",
  },
  {
    value: "183448",
    label: "LEGO Bricks, Pieces & Parts",
    group: "LEGO Building Toys",
  },
  {
    value: "183449",
    label: "LEGO Instruction Manuals & Catalogs",
    group: "LEGO Building Toys",
  },
  { value: "263011", label: "LEGO Power Elements", group: "LEGO Building Toys" },
  { value: "263012", label: "LEGO Minifigures", group: "LEGO Building Toys" },
  {
    value: "263015",
    label: "LEGO Storage & Display",
    group: "LEGO Building Toys",
  },
  {
    value: "263016",
    label: "Building Toys & Blocks",
    group: "Building Toys & Blocks",
  },
  {
    value: "180023",
    label: "Building Toy Accessories",
    group: "Building Toys & Blocks",
  },
  {
    value: "258040",
    label: "Building Toy Complete Sets & Packs",
    group: "Building Toys & Blocks",
  },
  {
    value: "258041",
    label: "Building Toy Pieces & Parts",
    group: "Building Toys & Blocks",
  },
  {
    value: "263018",
    label: "Building Toy Storage & Display",
    group: "Building Toys & Blocks",
  },
];

export const BRICK_CATEGORY_GROUPS: BrickCategoryGroup[] = [
  "LEGO Building Toys",
  "Building Toys & Blocks",
];

export type BrickType = "set" | "minifigure" | "instructions-manual" | "original-box";

export const BRICK_TYPE_FILTERS: (BrickFilterOption & {
  value: BrickType;
  queryTerm?: string;
})[] = [
  { value: "set", label: "Set" },
  { value: "minifigure", label: "Minifigure", queryTerm: "minifigure" },
  {
    value: "instructions-manual",
    label: "Instructions Manual",
    queryTerm: "manual",
  },
  { value: "original-box", label: "Original Box", queryTerm: "box" },
];

export type BrickStatus = "factory-sealed" | "complete" | "incomplete";

export const BRICK_STATUS_FILTERS: (BrickFilterOption & {
  value: BrickStatus;
  queryTerm: string;
})[] = [
  { value: "factory-sealed", label: "Factory Sealed", queryTerm: "sealed" },
  { value: "complete", label: "Complete", queryTerm: "complete" },
  { value: "incomplete", label: "Incomplete", queryTerm: "incomplete" },
];

/** Added to Exclude words when Type is Set. Not injected into `q`. */
export const SET_EXCLUDE_WORDS = [
  "Minifigure",
  "Minifigures",
  "Minifig",
  "Minifigs",
  "Manual",
  "torso",
  "head",
  "part",
  "plate",
  "brick",
  "panel",
  "tile",
  "slope",
  "case",
  "display",
  "sticker",
  "stickers",
  "incomplete",
  "led",
  "displaycase",
  "protector",
];

export type BrickCatalogSelection = {
  brickCategory?: string;
  brickType?: string;
  brickStatus?: string;
};

export type BrickQuerySelection = {
  brickType?: string;
  brickStatus?: string;
};

const ANY = "any";

function findOption<T extends BrickFilterOption>(
  options: readonly T[],
  value: string | undefined,
): T | undefined {
  if (!value || value === ANY) return undefined;
  return options.find((option) => option.value === value);
}

export function parseBrickCategory(raw: string | undefined): string | undefined {
  return findOption(BRICK_CATEGORY_FILTERS, raw)?.value;
}

export function parseBrickType(raw: string | undefined): BrickType | undefined {
  return findOption(BRICK_TYPE_FILTERS, raw)?.value;
}

export function parseBrickStatus(raw: string | undefined): BrickStatus | undefined {
  return findOption(BRICK_STATUS_FILTERS, raw)?.value;
}

export function brickCategoryLabel(value: string | undefined): string | undefined {
  return findOption(BRICK_CATEGORY_FILTERS, value)?.label;
}

export function brickTypeLabel(value: string | undefined): string | undefined {
  return findOption(BRICK_TYPE_FILTERS, value)?.label;
}

export function brickStatusLabel(value: string | undefined): string | undefined {
  return findOption(BRICK_STATUS_FILTERS, value)?.label;
}

export function brickTypeQueryTerm(value: string | undefined): string | undefined {
  return findOption(BRICK_TYPE_FILTERS, value)?.queryTerm;
}

export function brickStatusQueryTerm(value: string | undefined): string | undefined {
  return findOption(BRICK_STATUS_FILTERS, value)?.queryTerm;
}

export function brickQueryTerms(selection: BrickQuerySelection): string[] {
  const terms: string[] = [];
  const typeTerm = brickTypeQueryTerm(selection.brickType);
  const statusTerm = brickStatusQueryTerm(selection.brickStatus);
  if (typeTerm) terms.push(typeTerm);
  if (statusTerm) terms.push(statusTerm);
  return terms;
}

/** Longest first so `incomplete` is not treated as `complete`. */
export function allBrickQueryTerms(): string[] {
  const terms = [
    ...BRICK_TYPE_FILTERS.map((option) => option.queryTerm),
    ...BRICK_STATUS_FILTERS.map((option) => option.queryTerm),
  ].filter((term): term is string => Boolean(term));
  return [...new Set(terms)].sort((a, b) => b.length - a.length);
}

export function isSetExcludeWord(word: string): boolean {
  const key = word.toLowerCase();
  return SET_EXCLUDE_WORDS.some((reserved) => reserved.toLowerCase() === key);
}

export function withoutSetExcludeWords(words: string[]): string[] {
  return words.filter((word) => !isSetExcludeWord(word));
}

/** Added to Exclude words when Status is Factory Sealed. */
export const SEALED_EXCLUDE_WORDS = ["incomplete", "missing"];

export function isSealedExcludeWord(word: string): boolean {
  const key = word.toLowerCase();
  return SEALED_EXCLUDE_WORDS.some((reserved) => reserved.toLowerCase() === key);
}

export function withoutSealedExcludeWords(words: string[]): string[] {
  return words.filter((word) => !isSealedExcludeWord(word));
}

export function brickExcludeWords(
  brickType: string | undefined,
  brickStatus?: string,
): string[] {
  return [
    ...(brickType === "set" ? SET_EXCLUDE_WORDS : []),
    ...(brickStatus === "factory-sealed" ? SEALED_EXCLUDE_WORDS : []),
  ];
}
