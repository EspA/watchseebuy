import { CARD_CATEGORY_FILTERS } from "./card-filters.ts";
import { FIGURE_CATEGORY_FILTERS } from "./figure-filters.ts";
import { BRICK_CATEGORY_FILTERS } from "./brick-filters.ts";
import { WHEELS_CATEGORY_FILTERS } from "./wheel-filters.ts";

export type FilterGroupId = "cards" | "figures" | "vehicles" | "bricks";

const GROUP_ORDER: FilterGroupId[] = [
  "cards",
  "figures",
  "vehicles",
  "bricks",
];

const BY_CATEGORY_ID = new Map<string, FilterGroupId>([
  ...CARD_CATEGORY_FILTERS.map((option) => [option.value, "cards"] as const),
  ...FIGURE_CATEGORY_FILTERS.map((option) => [option.value, "figures"] as const),
  ...WHEELS_CATEGORY_FILTERS.map(
    (option) => [option.value, "vehicles"] as const,
  ),
  ...BRICK_CATEGORY_FILTERS.map((option) => [option.value, "bricks"] as const),
]);

export function filterGroupForCategoryId(
  categoryId: string | undefined,
): FilterGroupId | undefined {
  if (!categoryId?.trim()) return undefined;
  return BY_CATEGORY_ID.get(categoryId.trim());
}

export function filterGroupForListing(
  categoryIds: string[] | undefined,
): FilterGroupId | undefined {
  if (!categoryIds?.length) return undefined;
  for (const id of categoryIds) {
    const group = filterGroupForCategoryId(id);
    if (group) return group;
  }
  return undefined;
}

/** Most common mapped eBay category group. Ties keep catalog order. */
export function suggestFilterGroup(
  listings: Array<{ categoryIds?: string[] }>,
): FilterGroupId | undefined {
  const votes: Record<FilterGroupId, number> = {
    cards: 0,
    figures: 0,
    vehicles: 0,
    bricks: 0,
  };
  let any = false;
  for (const listing of listings) {
    const group = filterGroupForListing(listing.categoryIds);
    if (!group) continue;
    votes[group] += 1;
    any = true;
  }
  if (!any) return undefined;
  let winner: FilterGroupId | undefined;
  let best = 0;
  for (const group of GROUP_ORDER) {
    if (votes[group] > best) {
      winner = group;
      best = votes[group];
    }
  }
  return winner;
}
