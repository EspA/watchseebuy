"use client";

import type { ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { syncCatalogSearchForm } from "@/components/catalog-search-sync";
import {
  BRICK_CATEGORY_FILTERS,
  BRICK_CATEGORY_GROUPS,
  BRICK_STATUS_FILTERS,
  BRICK_TYPE_FILTERS,
} from "@waitseebuy/domain";

const SEARCH_FORM = "search-form";

function onFilterChange(event: ChangeEvent<HTMLSelectElement>) {
  const form = event.currentTarget.form;
  if (!form) return;
  syncCatalogSearchForm(form, event.currentTarget.name);
  submitSearchForm(form);
}

export function BuildingBricksFilters({
  brickCategory,
  brickType,
  brickStatus,
}: {
  brickCategory?: string;
  brickType?: string;
  brickStatus?: string;
}) {
  const hasSelection = Boolean(brickCategory || brickType || brickStatus);

  return (
    <details className="filter-group" {...(hasSelection ? { open: true } : {})}>
      <summary>Building Toys filters</summary>
      <label>
        Category
        <select
          form={SEARCH_FORM}
          name="brickCategory"
          defaultValue={brickCategory ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {BRICK_CATEGORY_FILTERS.filter((option) => !option.group).map(
            (option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
          {BRICK_CATEGORY_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {BRICK_CATEGORY_FILTERS.filter(
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
      <label>
        Type
        <select
          form={SEARCH_FORM}
          name="brickType"
          defaultValue={brickType ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {BRICK_TYPE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select
          form={SEARCH_FORM}
          name="brickStatus"
          defaultValue={brickStatus ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {BRICK_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </details>
  );
}
