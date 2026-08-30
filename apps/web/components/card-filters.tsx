"use client";

import type { ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import {
  CARD_LANGUAGE_FILTERS,
  CARD_PRINTING_FILTERS,
  CARD_RARITY_FILTERS,
  CARD_SET_FILTERS,
  CARD_SET_GROUPS,
  composeCatalogQuery,
  parseCardLanguage,
  parseCardPrinting,
  parseCardRarity,
  parseCardSet,
  stripAllCatalogLabels,
  type CardCatalogSelection,
} from "@waitseebuy/domain";

const SEARCH_FORM = "search-form";

function selectValue(form: HTMLFormElement, name: string): string | undefined {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLSelectElement)) return undefined;
  return field.value;
}

function readSelection(form: HTMLFormElement): CardCatalogSelection {
  const selection: CardCatalogSelection = {};
  const cardSet = parseCardSet(selectValue(form, "set"));
  const rarity = parseCardRarity(selectValue(form, "rarity"));
  const printing = parseCardPrinting(selectValue(form, "printing"));
  const language = parseCardLanguage(selectValue(form, "language"));
  if (cardSet) selection.cardSet = cardSet;
  if (rarity) selection.rarity = rarity;
  if (printing) selection.printing = printing;
  if (language) selection.language = language;
  return selection;
}

function injectIntoSearchBar(form: HTMLFormElement) {
  const input = form.elements.namedItem("q");
  if (!(input instanceof HTMLInputElement)) return;
  input.value = composeCatalogQuery(
    stripAllCatalogLabels(input.value),
    readSelection(form),
  );
}

function onFilterChange(event: ChangeEvent<HTMLSelectElement>) {
  const form = event.currentTarget.form;
  if (!form) return;
  injectIntoSearchBar(form);
  submitSearchForm(form);
}

export function CardFilters({
  cardSet,
  rarity,
  printing,
  language,
}: {
  cardSet?: string;
  rarity?: string;
  printing?: string;
  language?: string;
}) {
  const hasSelection = Boolean(cardSet || rarity || printing || language);

  return (
    <details className="filter-group" {...(hasSelection ? { open: true } : {})}>
      <summary>Card Filters</summary>
      <label>
        Set
        <select
          form={SEARCH_FORM}
          name="set"
          defaultValue={cardSet ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {CARD_SET_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {CARD_SET_FILTERS.filter((option) => option.group === group).map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ),
              )}
            </optgroup>
          ))}
        </select>
      </label>
      <label>
        Rarity
        <select
          form={SEARCH_FORM}
          name="rarity"
          defaultValue={rarity ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {CARD_RARITY_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Printing
        <select
          form={SEARCH_FORM}
          name="printing"
          defaultValue={printing ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {CARD_PRINTING_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Language
        <select
          form={SEARCH_FORM}
          name="language"
          defaultValue={language ?? "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          {CARD_LANGUAGE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </details>
  );
}
