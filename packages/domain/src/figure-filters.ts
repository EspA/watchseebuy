/**
 * Figure facets. Category IDs are official eBay US Taxonomy values:
 * Action Figures & Accessories (246), Collectible Figures (Labubu / Pop Mart,
 * 149372), and Dolls (Barbie, 262346). Category is a Browse category_ids
 * value and is never added to keywords. Scale is a Browse aspect_filter.
 * Packaging, completeness, and punch inject keywords.
 */

export type FigureFilterOption = { value: string; label: string };

export type FigureCategoryGroup =
  | "Action Figures"
  | "Collectible Figures"
  | "Barbie"
  | "Supplies & Storage";

export type FigureCategoryOption = FigureFilterOption & {
  group?: FigureCategoryGroup;
};

export const FIGURE_CATEGORY_ROOT = "246";

export const FIGURE_CATEGORY_FILTERS: FigureCategoryOption[] = [
  { value: "246", label: "Action Figures & Accessories" },
  { value: "261068", label: "Action Figures", group: "Action Figures" },
  {
    value: "261069",
    label: "Action Figures Playsets",
    group: "Action Figures",
  },
  { value: "49018", label: "Mixed Lots", group: "Action Figures" },
  {
    value: "261070",
    label: "Action Figures Accessories",
    group: "Action Figures",
  },
  { value: "261071", label: "Action Figures Parts", group: "Action Figures" },
  {
    value: "263076",
    label: "Collectible Figures & Supplies",
    group: "Collectible Figures",
  },
  {
    value: "149372",
    label: "Collectible Figures & Bobbleheads",
    group: "Collectible Figures",
  },
  {
    value: "263077",
    label: "Sealed Blind Packs",
    group: "Collectible Figures",
  },
  {
    value: "263083",
    label: "Pieces & Parts",
    group: "Collectible Figures",
  },
  { value: "263082", label: "Mixed Lots", group: "Collectible Figures" },
  {
    value: "238",
    label: "Dolls, Clothing & Accessories",
    group: "Barbie",
  },
  { value: "262346", label: "Dolls & Doll Playsets", group: "Barbie" },
  {
    value: "262347",
    label: "Doll Clothes & Accessories",
    group: "Barbie",
  },
  {
    value: "261943",
    label: "Action Figures Supplies & Storage",
    group: "Supplies & Storage",
  },
  { value: "261944", label: "Box Protectors", group: "Supplies & Storage" },
  { value: "261945", label: "Carrying Cases", group: "Supplies & Storage" },
  {
    value: "261946",
    label: "Display Cases & Stands",
    group: "Supplies & Storage",
  },
  {
    value: "263078",
    label: "Collectible Figures Supplies & Storage",
    group: "Supplies & Storage",
  },
  {
    value: "263079",
    label: "Collectible Display Cases & Stands",
    group: "Supplies & Storage",
  },
  { value: "263081", label: "Protectors", group: "Supplies & Storage" },
];

export const FIGURE_CATEGORY_GROUPS: FigureCategoryGroup[] = [
  "Action Figures",
  "Collectible Figures",
  "Barbie",
  "Supplies & Storage",
];

export const FIGURE_SCALE_CATEGORY_IDS = new Set([
  "246",
  "261068",
  "261069",
  "49018",
  "238",
  "262346",
]);

export type FigureScaleOption = FigureFilterOption & { aspect: string };

export const FIGURE_SCALE_FILTERS: FigureScaleOption[] = [
  { value: "3-75", label: "3.75\"", aspect: "3.75\"" },
  { value: "6-in", label: "6\"", aspect: "6\"" },
  { value: "1-12", label: "1:12", aspect: "1:12" },
  { value: "1-6", label: "1:6", aspect: "1:6" },
];

export type FigurePackaging = "carded" | "loose";

export const FIGURE_PACKAGING_FILTERS: (FigureFilterOption & {
  value: FigurePackaging;
  queryTerm: string;
})[] = [
  { value: "carded", label: "Carded", queryTerm: "carded" },
  { value: "loose", label: "Loose", queryTerm: "loose" },
];

export type FigureCompleteness = "complete" | "incomplete";

export const FIGURE_COMPLETENESS_FILTERS: (FigureFilterOption & {
  value: FigureCompleteness;
  queryTerm: string;
})[] = [
  { value: "complete", label: "Complete", queryTerm: "complete" },
  { value: "incomplete", label: "Incomplete", queryTerm: "incomplete" },
];

export type FigurePunch = "unpunched" | "punched";

export const FIGURE_PUNCH_FILTERS: (FigureFilterOption & {
  value: FigurePunch;
  queryTerm: string;
})[] = [
  { value: "unpunched", label: "Unpunched", queryTerm: "unpunched" },
  { value: "punched", label: "Punched", queryTerm: "punched" },
];

export const FIGURE_CARDED_EXCLUDE_WORDS = ["uncarded"];
export const FIGURE_PUNCHED_EXCLUDE_WORDS = ["unpunched"];

export type FigureCatalogSelection = {
  figureCategory?: string;
  figureScale?: string;
  figurePackaging?: string;
  figureCompleteness?: string;
  figurePunch?: string;
};

export type FigureQuerySelection = {
  figurePackaging?: string;
  figureCompleteness?: string;
  figurePunch?: string;
};

const ANY = "any";

function findOption<T extends FigureFilterOption>(
  options: readonly T[],
  value: string | undefined,
): T | undefined {
  if (!value || value === ANY) return undefined;
  return options.find((option) => option.value === value);
}

export function parseFigureCategory(raw: string | undefined): string | undefined {
  return findOption(FIGURE_CATEGORY_FILTERS, raw)?.value;
}

export function parseFigureScale(raw: string | undefined): string | undefined {
  if (!raw || raw === ANY) return undefined;
  return FIGURE_SCALE_FILTERS.find(
    (option) => option.value === raw || option.aspect === raw,
  )?.value;
}

export function parseFigurePackaging(
  raw: string | undefined,
): FigurePackaging | undefined {
  return findOption(FIGURE_PACKAGING_FILTERS, raw)?.value;
}

export function parseFigureCompleteness(
  raw: string | undefined,
): FigureCompleteness | undefined {
  return findOption(FIGURE_COMPLETENESS_FILTERS, raw)?.value;
}

export function parseFigurePunch(raw: string | undefined): FigurePunch | undefined {
  return findOption(FIGURE_PUNCH_FILTERS, raw)?.value;
}

export function figureCategoryLabel(
  value: string | undefined,
): string | undefined {
  return findOption(FIGURE_CATEGORY_FILTERS, value)?.label;
}

export function figureScaleLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return FIGURE_SCALE_FILTERS.find(
    (option) => option.value === value || option.aspect === value,
  )?.label;
}

export function figureScaleAspect(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return FIGURE_SCALE_FILTERS.find(
    (option) => option.value === value || option.aspect === value,
  )?.aspect;
}

export function figurePackagingLabel(
  value: string | undefined,
): string | undefined {
  return findOption(FIGURE_PACKAGING_FILTERS, value)?.label;
}

export function figureCompletenessLabel(
  value: string | undefined,
): string | undefined {
  return findOption(FIGURE_COMPLETENESS_FILTERS, value)?.label;
}

export function figurePunchLabel(value: string | undefined): string | undefined {
  return findOption(FIGURE_PUNCH_FILTERS, value)?.label;
}

export function categorySupportsFigureScale(
  value: string | undefined,
): boolean {
  const parsed = parseFigureCategory(value);
  return Boolean(parsed && FIGURE_SCALE_CATEGORY_IDS.has(parsed));
}

export function figureCategoryIds(
  category: string | undefined,
  scale?: string,
): string | undefined {
  const parsed = parseFigureCategory(category);
  if (parsed) return parsed;
  if (parseFigureScale(scale)) return FIGURE_CATEGORY_ROOT;
  return undefined;
}

export function figureScaleAspectFilter(
  categoryId: string | undefined,
  scale: string | undefined,
): string | undefined {
  const aspect = figureScaleAspect(scale);
  if (!aspect) return undefined;
  const category = figureCategoryIds(categoryId, scale);
  if (!category || !categorySupportsFigureScale(category)) return undefined;
  return `categoryId:${category},Scale:{${aspect}}`;
}

export function figureQueryTerms(selection: FigureQuerySelection): string[] {
  const terms: string[] = [];
  const packaging = findOption(FIGURE_PACKAGING_FILTERS, selection.figurePackaging);
  const completeness = findOption(
    FIGURE_COMPLETENESS_FILTERS,
    selection.figureCompleteness,
  );
  const punch = findOption(FIGURE_PUNCH_FILTERS, selection.figurePunch);
  if (packaging?.queryTerm) terms.push(packaging.queryTerm);
  if (completeness?.queryTerm) terms.push(completeness.queryTerm);
  if (punch?.queryTerm) terms.push(punch.queryTerm);
  return terms;
}

/** Longest first so `unpunched` / `incomplete` win over shorter tokens. */
export function allFigureQueryTerms(): string[] {
  const terms = [
    ...FIGURE_PACKAGING_FILTERS.map((option) => option.queryTerm),
    ...FIGURE_COMPLETENESS_FILTERS.map((option) => option.queryTerm),
    ...FIGURE_PUNCH_FILTERS.map((option) => option.queryTerm),
  ];
  return [...new Set(terms)].sort((a, b) => b.length - a.length);
}

const FIGURE_RESERVED_EXCLUDES = [
  ...FIGURE_CARDED_EXCLUDE_WORDS,
  ...FIGURE_PUNCHED_EXCLUDE_WORDS,
].map((word) => word.toLowerCase());

export function isFigureExcludeWord(word: string): boolean {
  return FIGURE_RESERVED_EXCLUDES.includes(word.toLowerCase());
}

export function withoutFigureExcludeWords(words: string[]): string[] {
  return words.filter((word) => !isFigureExcludeWord(word));
}

export function figureExcludeWords(
  packaging: string | undefined,
  punch?: string,
): string[] {
  const words: string[] = [];
  if (packaging === "carded") words.push(...FIGURE_CARDED_EXCLUDE_WORDS);
  if (punch === "punched") words.push(...FIGURE_PUNCHED_EXCLUDE_WORDS);
  return words;
}
