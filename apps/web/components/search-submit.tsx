"use client";

import { useTranslations } from "next-intl";
import { SearchIcon } from "@/components/icons";

export function SearchSubmit() {
  const t = useTranslations("search");
  return (
    <button className="search-submit" type="submit" aria-label={t("submit")}>
      <span className="search-submit-icon">
        <SearchIcon />
      </span>
      <span className="search-submit-label">{t("submit")}</span>
    </button>
  );
}
