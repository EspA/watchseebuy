"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

const MoreFiltersContext = createContext<{
  open: boolean;
  toggle: () => void;
} | null>(null);

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
  const toggle = () => setOpen((value) => !value);

  return (
    <MoreFiltersContext.Provider value={{ open, toggle }}>
      <div className={open ? "filter-chrome is-open" : "filter-chrome"}>
        {children}
        <div className="filter-extras">{extras}</div>
      </div>
    </MoreFiltersContext.Provider>
  );
}

export function FiltersToggle() {
  const state = useContext(MoreFiltersContext);
  const t = useTranslations("search");
  if (!state) return null;

  return (
    <button
      type="button"
      className="more-filters-toggle is-inline"
      aria-expanded={state.open}
      onClick={state.toggle}
    >
      {state.open ? t("fewerFilters") : t("moreFilters")}
    </button>
  );
}
