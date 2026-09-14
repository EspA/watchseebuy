"use client";

import { useTranslations } from "next-intl";
import { AutoSelect } from "@/components/auto-search";
import type { SearchSort } from "@/lib/search-sort";

export function SearchSort({ value }: { value: SearchSort }) {
  const t = useTranslations("search");
  return (
    <label className="search-sort">
      <span className="search-sort-label">{t("sort")}</span>
      <AutoSelect
        form="search-form"
        name="sort"
        defaultValue={value}
      >
        <option value="price">{t("sortPriceAsc")}</option>
        <option value="price-desc">{t("sortPriceDesc")}</option>
        <option value="price-score">{t("sortScoreDesc")}</option>
        <option value="price-score-asc">{t("sortScoreAsc")}</option>
        <option value="seller-score">{t("sortSellerDesc")}</option>
        <option value="seller-score-asc">{t("sortSellerAsc")}</option>
      </AutoSelect>
    </label>
  );
}
