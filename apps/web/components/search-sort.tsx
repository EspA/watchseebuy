import { AutoSelect } from "@/components/auto-search";
import type { SearchSort } from "@/lib/search-sort";

export function SearchSort({ value }: { value: SearchSort }) {
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
        <option value="price-score">Price score: high to low</option>
        <option value="price-score-asc">Price score: low to high</option>
        <option value="seller-score">Seller score: high to low</option>
        <option value="seller-score-asc">Seller score: low to high</option>
      </AutoSelect>
    </label>
  );
}
