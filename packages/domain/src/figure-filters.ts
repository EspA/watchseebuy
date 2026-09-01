/**
 * Action figure facets. Category IDs are the official eBay US Taxonomy
 * subtree under Action Figures & Accessories (246). Category is a Browse
 * category_ids value and is never added to keywords.
 */

export type FigureFilterOption = { value: string; label: string };

export type FigureCategoryGroup = "Action Figures" | "Supplies & Storage";

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
];

export const FIGURE_CATEGORY_GROUPS: FigureCategoryGroup[] = [
  "Action Figures",
  "Supplies & Storage",
];

const ANY = "any";

function findOption(
  options: readonly FigureFilterOption[],
  value: string | undefined,
): FigureFilterOption | undefined {
  if (!value || value === ANY) return undefined;
  return options.find((option) => option.value === value);
}

export function parseFigureCategory(raw: string | undefined): string | undefined {
  return findOption(FIGURE_CATEGORY_FILTERS, raw)?.value;
}

export function figureCategoryLabel(
  value: string | undefined,
): string | undefined {
  return findOption(FIGURE_CATEGORY_FILTERS, value)?.label;
}

export function figureCategoryIds(value: string | undefined): string | undefined {
  return parseFigureCategory(value);
}
