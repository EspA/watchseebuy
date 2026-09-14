"use client";

import type { ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { useTranslations } from "next-intl";
import { useFilterGroup } from "@/components/filter-accordion";
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
  const { open, onToggle } = useFilterGroup("bricks", hasSelection);
  const t = useTranslations("filters");
  const typeLabel: Record<string, string> = {
    set: t("setType"),
    minifigure: t("minifigure"),
    "instructions-manual": t("manual"),
    "original-box": t("box"),
  };
  const statusLabel: Record<string, string> = {
    "factory-sealed": t("sealed"),
    complete: t("complete"),
    incomplete: t("incomplete"),
  };

  return (
    <details className="filter-group" open={open} onToggle={onToggle}>
      <summary>{t("bricks")}</summary>
      <label>
        {t("category")}
        <select
          form={SEARCH_FORM}
          name="brickCategory"
          defaultValue={brickCategory ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
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
        {t("type")}
        <select
          form={SEARCH_FORM}
          name="brickType"
          defaultValue={brickType ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
          {BRICK_TYPE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {typeLabel[option.value] ?? option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("status")}
        <select
          form={SEARCH_FORM}
          name="brickStatus"
          defaultValue={brickStatus ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
          {BRICK_STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {statusLabel[option.value] ?? option.label}
            </option>
          ))}
        </select>
      </label>
    </details>
  );
}
