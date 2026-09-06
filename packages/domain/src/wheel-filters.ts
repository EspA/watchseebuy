/**
 * Hot Wheels facets. Category IDs are the official eBay US Taxonomy
 * subtree under Diecast & Toy Vehicles (222). Category is a Browse
 * category_ids value and is never added to keywords. Scale is a Browse
 * aspect_filter. Packaging injects keywords (and excludes uncarded when
 * Carded).
 */

export type WheelFilterOption = { value: string; label: string };

export type WheelCategoryGroup =
  | "Cars, Trucks & Vans"
  | "Lots"
  | "Accessories";

export type WheelCategoryOption = WheelFilterOption & {
  group?: WheelCategoryGroup;
};

export const WHEELS_CATEGORY_ROOT = "222";

export const WHEELS_CATEGORY_FILTERS: WheelCategoryOption[] = [
  { value: "222", label: "Diecast & Toy Vehicles" },
  {
    value: "180273",
    label: "Cars, Trucks & Vans",
    group: "Cars, Trucks & Vans",
  },
  {
    value: "180506",
    label: "Contemporary Manufacture",
    group: "Cars, Trucks & Vans",
  },
  {
    value: "180507",
    label: "Vintage Manufacture",
    group: "Cars, Trucks & Vans",
  },
  { value: "73252", label: "Collections & Lots", group: "Lots" },
  {
    value: "180278",
    label: "Accessories, Parts & Display",
    group: "Accessories",
  },
  {
    value: "171135",
    label: "Display Cases & Stands",
    group: "Accessories",
  },
];

export const WHEELS_CATEGORY_GROUPS: WheelCategoryGroup[] = [
  "Cars, Trucks & Vans",
  "Lots",
  "Accessories",
];

/** Leaf-or-parent diecast categories that expose the official Scale aspect. */
export const WHEELS_SCALE_CATEGORY_IDS = new Set([
  "222",
  "180273",
  "180506",
  "180507",
  "73252",
]);

export type WheelScaleOption = WheelFilterOption & { aspect: string };

export const WHEELS_SCALE_FILTERS: WheelScaleOption[] = [
  { value: "1-64", label: "1:64", aspect: "1:64" },
  { value: "1-43", label: "1:43", aspect: "1:43" },
  { value: "1-18", label: "1:18", aspect: "1:18" },
];

export type WheelPackaging = "carded" | "loose";

export const WHEELS_PACKAGING_FILTERS: (WheelFilterOption & {
  value: WheelPackaging;
  queryTerm: string;
})[] = [
  { value: "carded", label: "Carded", queryTerm: "carded" },
  { value: "loose", label: "Loose", queryTerm: "loose" },
];

/** Added to Exclude words when Packaging is Carded. Not injected into `q`. */
export const CARDED_EXCLUDE_WORDS = ["uncarded"];

export type WheelsCatalogSelection = {
  wheelsCategory?: string;
  wheelsScale?: string;
  wheelsPackaging?: string;
};

export type WheelsQuerySelection = {
  wheelsPackaging?: string;
};

const ANY = "any";

function findOption<T extends WheelFilterOption>(
  options: readonly T[],
  value: string | undefined,
): T | undefined {
  if (!value || value === ANY) return undefined;
  return options.find((option) => option.value === value);
}

export function parseWheelsCategory(raw: string | undefined): string | undefined {
  return findOption(WHEELS_CATEGORY_FILTERS, raw)?.value;
}

export function parseWheelsScale(raw: string | undefined): string | undefined {
  if (!raw || raw === ANY) return undefined;
  return WHEELS_SCALE_FILTERS.find(
    (option) => option.value === raw || option.aspect === raw,
  )?.value;
}

export function parseWheelsPackaging(
  raw: string | undefined,
): WheelPackaging | undefined {
  return findOption(WHEELS_PACKAGING_FILTERS, raw)?.value;
}

export function wheelsCategoryLabel(
  value: string | undefined,
): string | undefined {
  return findOption(WHEELS_CATEGORY_FILTERS, value)?.label;
}

export function wheelsScaleLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return WHEELS_SCALE_FILTERS.find(
    (option) => option.value === value || option.aspect === value,
  )?.label;
}

export function wheelsScaleAspect(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return WHEELS_SCALE_FILTERS.find(
    (option) => option.value === value || option.aspect === value,
  )?.aspect;
}

export function wheelsPackagingLabel(
  value: string | undefined,
): string | undefined {
  return findOption(WHEELS_PACKAGING_FILTERS, value)?.label;
}

export function wheelsPackagingQueryTerm(
  value: string | undefined,
): string | undefined {
  return findOption(WHEELS_PACKAGING_FILTERS, value)?.queryTerm;
}

export function categorySupportsWheelsScale(
  value: string | undefined,
): boolean {
  const parsed = parseWheelsCategory(value);
  return Boolean(parsed && WHEELS_SCALE_CATEGORY_IDS.has(parsed));
}

export function wheelsCategoryIds(
  category: string | undefined,
  scale?: string,
): string | undefined {
  const parsed = parseWheelsCategory(category);
  if (parsed) return parsed;
  if (parseWheelsScale(scale)) return WHEELS_CATEGORY_ROOT;
  return undefined;
}

export function wheelsScaleAspectFilter(
  categoryId: string | undefined,
  scale: string | undefined,
): string | undefined {
  const aspect = wheelsScaleAspect(scale);
  if (!aspect) return undefined;
  const category = wheelsCategoryIds(categoryId, scale);
  if (!category || !categorySupportsWheelsScale(category)) return undefined;
  return `categoryId:${category},Scale:{${aspect}}`;
}

export function wheelsQueryTerms(selection: WheelsQuerySelection): string[] {
  const term = wheelsPackagingQueryTerm(selection.wheelsPackaging);
  return term ? [term] : [];
}

export function allWheelsQueryTerms(): string[] {
  return WHEELS_PACKAGING_FILTERS.map((option) => option.queryTerm).sort(
    (a, b) => b.length - a.length,
  );
}

export function isCardedExcludeWord(word: string): boolean {
  const key = word.toLowerCase();
  return CARDED_EXCLUDE_WORDS.some((reserved) => reserved.toLowerCase() === key);
}

export function withoutCardedExcludeWords(words: string[]): string[] {
  return words.filter((word) => !isCardedExcludeWord(word));
}

export function wheelsExcludeWords(
  packaging: string | undefined,
): string[] {
  return packaging === "carded" ? [...CARDED_EXCLUDE_WORDS] : [];
}
