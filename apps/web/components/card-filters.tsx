"use client";

import { useState, type ChangeEvent } from "react";
import { submitSearchForm } from "@/components/auto-search";
import { useFilterGroup } from "@/components/filter-accordion";
import { syncCatalogSearchForm } from "@/components/catalog-search-sync";
import {
  CARD_CATEGORY_LINES,
  CARD_GAME_FILTERS,
  CARD_GAME_POPULAR,
  CARD_GAME_WEDGE,
  CARD_GRADE_FILTERS,
  CARD_GRADER_FILTERS,
  CARD_LANGUAGE_FILTERS,
  CARD_PRINTING_FILTERS,
  CARD_RARITY_FILTERS,
  CARD_SET_FILTERS,
  CARD_SET_GROUPS,
  CCG_LINE_ID,
  DEFAULT_CARD_GRADE,
  cardCategoryChildren,
  cardCategoryLineOf,
  categorySupportsCardGame,
  isPokemonCardGame,
  isSlabGrader,
} from "@waitseebuy/domain";

const SEARCH_FORM = "search-form";

function onFilterChange(event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
  const form = event.currentTarget.form;
  if (!form) return;
  syncCatalogSearchForm(form, event.currentTarget.name);
  submitSearchForm(form);
}

function searchForm(): HTMLFormElement | null {
  const form = document.getElementById(SEARCH_FORM);
  return form instanceof HTMLFormElement ? form : null;
}

function submitIntegrityChange(name: "cardNoReprints" | "cardNoProxy", on: boolean) {
  const form = searchForm();
  const hidden = form?.elements.namedItem(name);
  if (hidden instanceof HTMLInputElement) hidden.value = on ? "1" : "0";
  if (!form) return;
  syncCatalogSearchForm(form, name);
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
  cardNoReprints,
  cardNoProxy,
}: {
  cardCategory?: string;
  cardGame?: string;
  cardSet?: string;
  rarity?: string;
  printing?: string;
  language?: string;
  grader?: string;
  cardGrade?: string;
  cardNoReprints?: boolean;
  cardNoProxy?: boolean;
}) {
  const [selectedGrader, setSelectedGrader] = useState(grader ?? "any");
  const [selectedLine, setSelectedLine] = useState(
    cardCategoryLineOf(cardCategory) ?? "any",
  );
  const [selectedType, setSelectedType] = useState(cardCategory ?? "any");
  const [selectedGame, setSelectedGame] = useState(cardGame ?? "any");
  const [noReprints, setNoReprints] = useState(cardNoReprints !== false);
  const [noProxy, setNoProxy] = useState(cardNoProxy !== false);
  const hasSelection = Boolean(
    cardCategory ||
      cardGame ||
      cardSet ||
      rarity ||
      printing ||
      language ||
      grader ||
      cardNoReprints === false ||
      cardNoProxy === false,
  );
  const typeOptions = cardCategoryChildren(selectedLine);
  const typeValue =
    selectedType !== "any" &&
    (selectedType === selectedLine ||
      typeOptions.some((option) => option.value === selectedType))
      ? selectedType
      : selectedLine;
  const showGame =
    selectedLine === CCG_LINE_ID || categorySupportsCardGame(typeValue);
  const showPokemonFacets = isPokemonCardGame(selectedGame);
  const showGrade = isSlabGrader(selectedGrader);
  const popularGames = CARD_GAME_FILTERS.filter((option) =>
    CARD_GAME_POPULAR.includes(option.value),
  );
  const wedgeGames = CARD_GAME_FILTERS.filter(
    (option) =>
      CARD_GAME_WEDGE.includes(option.value) &&
      !CARD_GAME_POPULAR.includes(option.value),
  );
  const otherGames = CARD_GAME_FILTERS.filter(
    (option) =>
      !CARD_GAME_POPULAR.includes(option.value) &&
      !CARD_GAME_WEDGE.includes(option.value),
  );

  const { open, onToggle } = useFilterGroup("cards", hasSelection);

  return (
    <details className="filter-group" open={open} onToggle={onToggle}>
      <summary>Cards</summary>
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
            if (line !== CCG_LINE_ID) {
              setSelectedGame("any");
              const gameField = form?.elements.namedItem("cardGame");
              if (gameField instanceof HTMLSelectElement) {
                gameField.value = "any";
              }
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
              !categorySupportsCardGame(event.currentTarget.value) &&
              event.currentTarget.value !== CCG_LINE_ID
            ) {
              setSelectedGame("any");
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
          onChange={(event) => {
            const next = event.currentTarget.value;
            setSelectedGame(next);
            if (!isPokemonCardGame(next)) {
              const form = event.currentTarget.form;
              const setField = form?.elements.namedItem("set");
              if (setField instanceof HTMLSelectElement) setField.value = "any";
              const rarityField = form?.elements.namedItem("rarity");
              if (rarityField instanceof HTMLSelectElement) {
                rarityField.value = "any";
              }
            }
            onFilterChange(event);
          }}
        >
          <option value="any">Any</option>
          <optgroup label="Popular">
            {popularGames.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Launch lines">
            {wedgeGames.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="More games">
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
      <label hidden={!showGrade}>
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
      <label hidden={!showPokemonFacets}>
        Set
        <select
          form={SEARCH_FORM}
          name="set"
          defaultValue={showPokemonFacets ? (cardSet ?? "any") : "any"}
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
      <label hidden={!showPokemonFacets}>
        Rarity
        <select
          form={SEARCH_FORM}
          name="rarity"
          defaultValue={showPokemonFacets ? (rarity ?? "any") : "any"}
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
      <div className="filter-chips">
        <input
          type="hidden"
          form={SEARCH_FORM}
          name="cardNoReprints"
          value={noReprints ? "1" : "0"}
        />
        <input
          type="hidden"
          form={SEARCH_FORM}
          name="cardNoProxy"
          value={noProxy ? "1" : "0"}
        />
        <label className="filter-chip">
          <input
            type="checkbox"
            checked={noReprints}
            onChange={(event) => {
              const on = event.currentTarget.checked;
              setNoReprints(on);
              submitIntegrityChange("cardNoReprints", on);
            }}
          />
          No reprints
        </label>
        <label className="filter-chip">
          <input
            type="checkbox"
            checked={noProxy}
            onChange={(event) => {
              const on = event.currentTarget.checked;
              setNoProxy(on);
              submitIntegrityChange("cardNoProxy", on);
            }}
          />
          No proxy
        </label>
      </div>
    </details>
  );
}
