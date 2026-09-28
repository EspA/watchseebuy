"use client";

import { useState, type ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { useTranslations } from "next-intl";
import { useFilterGroup } from "@/components/filter-accordion";
import { syncCatalogSearchForm } from "@/components/catalog-search-sync";
import {
  WHEELS_CATEGORY_FILTERS,
  WHEELS_CATEGORY_GROUPS,
  WHEELS_PACKAGING_FILTERS,
  WHEELS_SCALE_FILTERS,
  categorySupportsWheelsScale,
} from "@watchseebuy/domain";

const SEARCH_FORM = "search-form";

function onFilterChange(event: ChangeEvent<HTMLSelectElement>) {
  const form = event.currentTarget.form;
  if (!form) return;
  syncCatalogSearchForm(form, event.currentTarget.name);
  submitSearchForm(form);
}

export function HotWheelsFilters({
  wheelsCategory,
  wheelsScale,
  wheelsPackaging,
}: {
  wheelsCategory?: string;
  wheelsScale?: string;
  wheelsPackaging?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState(
    wheelsCategory ?? "any",
  );
  const showScale =
    selectedCategory === "any" || categorySupportsWheelsScale(selectedCategory);
  const hasSelection = Boolean(
    wheelsCategory || wheelsScale || wheelsPackaging,
  );

  const { open, onToggle } = useFilterGroup("vehicles", hasSelection);
  const t = useTranslations("filters");
  const packagingLabel = {
    carded: t("carded"),
    loose: t("loose"),
  };

  return (
    <details className="filter-group" open={open} onToggle={onToggle}>
      <summary>{t("vehicles")}</summary>
      <label>
        {t("category")}
        <select
          form={SEARCH_FORM}
          name="wheelsCategory"
          defaultValue={wheelsCategory ?? "any"}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setSelectedCategory(next);
            if (
              next !== "any" &&
              !categorySupportsWheelsScale(next)
            ) {
              const scaleField = event.currentTarget.form?.elements.namedItem(
                "wheelsScale",
              );
              if (scaleField instanceof HTMLSelectElement) {
                scaleField.value = "any";
              }
            }
            onFilterChange(event);
          }}
        >
          <option value="any">{t("any")}</option>
          {WHEELS_CATEGORY_FILTERS.filter((option) => !option.group).map(
            (option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
          {WHEELS_CATEGORY_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {WHEELS_CATEGORY_FILTERS.filter(
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
      <label hidden={!showScale}>
        {t("scale")}
        <select
          form={SEARCH_FORM}
          name="wheelsScale"
          defaultValue={showScale ? (wheelsScale ?? "any") : "any"}
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
          {WHEELS_SCALE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("packaging")}
        <select
          form={SEARCH_FORM}
          name="wheelsPackaging"
          defaultValue={wheelsPackaging ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
          {WHEELS_PACKAGING_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {packagingLabel[option.value]}
            </option>
          ))}
        </select>
      </label>
    </details>
  );
}
