"use client";

import { useState, type ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { MenuSelect } from "@/components/menu-select";
import { useTranslations } from "next-intl";
import { useFilterGroup } from "@/components/filter-accordion";
import { syncCatalogSearchForm } from "@/components/catalog-search-sync";
import {
  FIGURE_CATEGORY_FILTERS,
  FIGURE_CATEGORY_GROUPS,
  FIGURE_COMPLETENESS_FILTERS,
  FIGURE_PACKAGING_FILTERS,
  FIGURE_PUNCH_FILTERS,
  FIGURE_SCALE_FILTERS,
  categorySupportsFigureScale,
} from "@watchseebuy/domain";

const SEARCH_FORM = "search-form";

function onFilterChange(event: ChangeEvent<HTMLSelectElement>) {
  const form = event.currentTarget.form;
  if (!form) return;
  syncCatalogSearchForm(form, event.currentTarget.name);
  submitSearchForm(form);
}

function setSelectValue(
  form: HTMLFormElement | null,
  name: string,
  value: string,
) {
  const field = form?.elements.namedItem(name);
  if (field instanceof HTMLSelectElement) field.value = value;
}

export function FiguresFilters({
  figureCategory,
  figureScale,
  figurePackaging,
  figureCompleteness,
  figurePunch,
}: {
  figureCategory?: string;
  figureScale?: string;
  figurePackaging?: string;
  figureCompleteness?: string;
  figurePunch?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState(
    figureCategory ?? "any",
  );
  const [selectedPackaging, setSelectedPackaging] = useState(
    figurePackaging ?? "any",
  );
  const showScale =
    selectedCategory === "any" || categorySupportsFigureScale(selectedCategory);
  const showCompleteness = selectedPackaging === "loose";
  const showPunch = selectedPackaging === "carded";
  const hasSelection = Boolean(
    figureCategory ||
      figureScale ||
      figurePackaging ||
      figureCompleteness ||
      figurePunch,
  );

  const { open, onSummaryClick } = useFilterGroup("figures", hasSelection);
  const t = useTranslations("filters");
  const packagingLabel = {
    carded: t("carded"),
    loose: t("loose"),
  };
  const completenessLabel = {
    complete: t("complete"),
    incomplete: t("incomplete"),
  };
  const punchLabel = {
    unpunched: t("unpunched"),
    punched: t("punched"),
  };

  return (
    <details className="filter-group" open={open}>
      <summary onClick={onSummaryClick}>{t("figures")}</summary>
      <label>
        {t("category")}
        <MenuSelect
          form={SEARCH_FORM}
          name="figureCategory"
          defaultValue={figureCategory ?? "any"}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setSelectedCategory(next);
            if (next !== "any" && !categorySupportsFigureScale(next)) {
              setSelectValue(event.currentTarget.form, "figureScale", "any");
            }
            onFilterChange(event);
          }}
        >
          <option value="any">{t("any")}</option>
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
        </MenuSelect>
      </label>
      <label hidden={!showScale}>
        {t("scale")}
        <MenuSelect
          form={SEARCH_FORM}
          name="figureScale"
          defaultValue={showScale ? (figureScale ?? "any") : "any"}
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
          {FIGURE_SCALE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </MenuSelect>
      </label>
      <label>
        {t("packaging")}
        <MenuSelect
          form={SEARCH_FORM}
          name="figurePackaging"
          defaultValue={figurePackaging ?? "any"}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setSelectedPackaging(next);
            const form = event.currentTarget.form;
            if (next !== "loose") {
              setSelectValue(form, "figureCompleteness", "any");
            }
            if (next !== "carded") {
              setSelectValue(form, "figurePunch", "any");
            }
            onFilterChange(event);
          }}
        >
          <option value="any">{t("any")}</option>
          {FIGURE_PACKAGING_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {packagingLabel[option.value]}
            </option>
          ))}
        </MenuSelect>
      </label>
      <label hidden={!showCompleteness}>
        {t("completeness")}
        <MenuSelect
          form={SEARCH_FORM}
          name="figureCompleteness"
          defaultValue={
            showCompleteness ? (figureCompleteness ?? "any") : "any"
          }
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
          {FIGURE_COMPLETENESS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {completenessLabel[option.value]}
            </option>
          ))}
        </MenuSelect>
      </label>
      <label hidden={!showPunch}>
        {t("cardPunch")}
        <MenuSelect
          form={SEARCH_FORM}
          name="figurePunch"
          defaultValue={showPunch ? (figurePunch ?? "any") : "any"}
          onChange={onFilterChange}
        >
          <option value="any">{t("any")}</option>
          {FIGURE_PUNCH_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {punchLabel[option.value]}
            </option>
          ))}
        </MenuSelect>
      </label>
    </details>
  );
}
