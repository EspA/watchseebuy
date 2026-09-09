import {
  landedCostCents,
  sellerConfidence,
  type PriceScore,
} from "@waitseebuy/domain";

export type SearchSort =
  | "price"
  | "price-desc"
  | "price-score"
  | "price-score-asc"
  | "seller-score"
  | "seller-score-asc";

export function searchSortFromQuery(raw: string | undefined): SearchSort {
  if (
    raw === "price-desc" ||
    raw === "price-score" ||
    raw === "price-score-asc" ||
    raw === "seller-score" ||
    raw === "seller-score-asc"
  ) {
    return raw;
  }
  return "price";
}

export function compareSearchListings(
  a: {
    itemCents: number;
    shippingCents: number;
    sellerFeedbackScore?: number;
    sellerFeedbackPercentage?: number;
    priceScore?: PriceScore;
  },
  b: {
    itemCents: number;
    shippingCents: number;
    sellerFeedbackScore?: number;
    sellerFeedbackPercentage?: number;
    priceScore?: PriceScore;
  },
  sort: SearchSort,
): number {
  if (sort === "price-score" || sort === "price-score-asc") {
    const missing = sort === "price-score" ? -1 : 11;
    const left = a.priceScore?.score ?? missing;
    const right = b.priceScore?.score ?? missing;
    if (left !== right) {
      return sort === "price-score" ? right - left : left - right;
    }
  } else if (sort === "seller-score" || sort === "seller-score-asc") {
    const left = sellerConfidence(a);
    const right = sellerConfidence(b);
    if (left !== right) {
      return sort === "seller-score" ? right - left : left - right;
    }
  }

  const left = landedCostCents({
    itemCents: a.itemCents,
    shippingCents: a.shippingCents,
  });
  const right = landedCostCents({
    itemCents: b.itemCents,
    shippingCents: b.shippingCents,
  });
  return sort === "price-desc" ? right - left : left - right;
}
