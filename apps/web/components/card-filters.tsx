"use client";

import { useState, type ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { syncCatalogSearchForm } from "@/components/catalog-search-sync";
import {
  CARD_CATEGORY_LINES,
  CARD_GAME_FILTERS,
  CARD_GAME_POPULAR,
  CARD_GRADE_FILTERS,
  CARD_GRADER_FILTERS,
  CARD_LANGUAGE_FILTERS,
  CARD_PRINTING_FILTERS,
  CARD_RARITY_FILTERS,
  CARD_SET_FILTERS,
  CARD_SET_GROUPS,
  DEFAULT_CARD_GRADE,
  cardCategoryChildren,
  cardCategoryLineOf,
  categorySupportsCardGame,
} from "@waitseebuy/domain";

const SEARCH_FORM = "search-form";

function onFilterChange(event: ChangeEvent<HTMLSelectElement>) {
  const form = event.currentTarget.form;
  if (!form) return;
  syncCatalogSearchForm(form, event.currentTarget.name);
  submitSearchForm(form);
}

export function CardFilters({
  cardCategory,
  cardGame,
  cardSet,
  rarity,
  printing,
  language,
  grader,
  cardGrade,
}: {
  cardCategory?: string;
  cardGame?: string;
  cardSet?: string;
  rarity?: string;
  printing?: string;
  language?: string;
  grader?: string;
  cardGrade?: string;
}) {
  const [selectedGrader, setSelectedGrader] = useState(grader ?? "any");
  const [selectedLine, setSelectedLine] = useState(
    cardCategoryLineOf(cardCategory) ?? "any",
  );
  const [selectedType, setSelectedType] = useState(cardCategory ?? "any");
  const hasSelection = Boolean(
    cardCategory ||
      cardGame ||
      cardSet ||
      rarity ||
      printing ||
      language ||
      grader,
  );
  const typeOptions = cardCategoryChildren(selectedLine);
  const typeValue =
    selectedType !== "any" &&
    (selectedType === selectedLine ||
      typeOptions.some((option) => option.value === selectedType))
      ? selectedType
      : selectedLine;
  const showGame = categorySupportsCardGame(typeValue);
  const popularGames = CARD_GAME_FILTERS.filter((option) =>
    CARD_GAME_POPULAR.includes(option.value),
  );
  const otherGames = CARD_GAME_FILTERS.filter(
    (option) => !CARD_GAME_POPULAR.includes(option.value),
  );

  return (
    <details className="filter-group" {...(hasSelection ? { open: true } : {})}>
      <summary>Cards Filters</summary>
      <label>
        Category
        <select
          form={SEARCH_FORM}
          name="cardLine"
          defaultValue={selectedLine}
          onChange={(event) => {
            const line = event.currentTarget.value;
            setSelectedLine(line);
            const nextType = line === "any" ? "any" : line;
            setSelectedType(nextType);
            const form = event.currentTarget.form;
            const typeField = form?.elements.namedItem("cardCategory");
            if (typeField instanceof HTMLSelectElement) {
              typeField.value = nextType;
            }
            const gameField = form?.elements.namedItem("cardGame");
            if (gameField instanceof HTMLSelectElement) {
              gameField.value = "any";
            }
            onFilterChange(event);
          }}
        >
          <option value="any">Any</option>
          {CARD_CATEGORY_LINES.map((option) => (
            <optgroup key={option.group} label={option.group}>
              <option value={option.value}>{option.label}</option>
            </optgroup>
          ))}
        </select>
      </label>
      <label hidden={selectedLine === "any"}>
        Type
        <select
          form={SEARCH_FORM}
          name="cardCategory"
          value={selectedLine === "any" ? "any" : typeValue}
          onChange={(event) => {
            setSelectedType(event.currentTarget.value);
            const form = event.currentTarget.form;
            const gameField = form?.elements.namedItem("cardGame");
            if (
              gameField instanceof HTMLSelectElement &&
              !categorySupportsCardGame(event.currentTarget.value)
            ) {
              gameField.value = "any";
            }
            onFilterChange(event);
          }}
        >
          <option value={selectedLine === "any" ? "any" : selectedLine}>
            Any
          </option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label hidden={!showGame}>
        Game
        <select
          form={SEARCH_FORM}
          name="cardGame"
          defaultValue={showGame ? (cardGame ?? "any") : "any"}
          onChange={onFilterChange}
        >
          <option value="any">Any</option>
          <optgroup label="Popular">
            {popularGames.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="All games">
            {otherGames.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label>
        Grader
        <select
          form={SEARCH_FORM}
          name="grader"
          defaultValue={grader ?? "any"}
          onChange={(event) => {
            setSelectedGrader(event.currentTarget.value);
            onFilterChange(event);
          }}
        >
          <option value="any">Any</option>
          {CARD_GRADER_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label hidden={selectedGrader === "any"}>
        Grade
        <select
          form={SEARCH_FORM}
          name="grade"
          defaultValue={cardGrade ?? DEFAULT_CARD_GRADE}
          onChange={onFilterChange}
        >
          {CARD_GRADE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
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
