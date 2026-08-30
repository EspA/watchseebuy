export type PriceSort = "price" | "price-desc";

export function priceSortFromQuery(raw: string | undefined): PriceSort {
  return raw === "price-desc" ? "price-desc" : "price";
}
