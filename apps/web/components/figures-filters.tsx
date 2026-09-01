"use client";

import type { ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { syncCatalogSearchForm } from "@/components/catalog-search-sync";
import {
  FIGURE_CATEGORY_FILTERS,
  FIGURE_CATEGORY_GROUPS,
} from "@waitseebuy/domain";

const SEARCH_FORM = "search-form";

function onFilterChange(event: ChangeEvent<HTMLSelectElement>) {
  const form = event.currentTarget.form;
  if (!form) return;
  syncCatalogSearchForm(form, event.currentTarget.name);
  submitSearchForm(form);
}

export function FiguresFilters({
  figureCategory,
}: {
  figureCategory?: string;
}) {
  const hasSelection = Boolean(figureCategory);

  return (
    <details className="filter-group" {...(hasSelection ? { open: true } : {})}>
      <summary>Figures Filters</summary>
      <label>
        Category
        <select
          form={SEARCH_FORM}
          name="figureCategory"
          defaultValue={figureCategory ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {FIGURE_CATEGORY_FILTERS.filter((option) => !option.group).map(
            (option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
          {FIGURE_CATEGORY_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {FIGURE_CATEGORY_FILTERS.filter(
                (option) => option.group === group,
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </details>
  );
}
