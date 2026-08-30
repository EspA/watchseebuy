import { AutoSelect } from "@/components/auto-search";
import type { PriceSort } from "@/lib/search-sort";

export function SearchSort({ value }: { value: PriceSort }) {
  return (
    <label className="search-sort">
      Sort
      <AutoSelect
        form="search-form"
        name="sort"
        defaultValue={value}
      >
        <option value="price">Total price: low to high</option>
        <option value="price-desc">Total price: high to low</option>
      </AutoSelect>
    </label>
  );
}
