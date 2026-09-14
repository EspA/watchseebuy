"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

export function MoreFilters({
  children,
  extras,
  defaultOpen = false,
}: {
  children: ReactNode;
  extras: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const t = useTranslations("search");

  return (
    <div className={open ? "filter-chrome is-open" : "filter-chrome"}>
      {children}
      <button
        type="button"
        className="more-filters-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t("fewerFilters") : t("moreFilters")}
      </button>
      <div className="filter-extras">{extras}</div>
    </div>
  );
}
