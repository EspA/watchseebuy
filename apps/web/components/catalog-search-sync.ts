"use client";

import {
  composeCatalogQuery,
  excludeWordsField,
  mergeExcludeKeywords,
  parseBrickStatus,
  parseBrickType,
  DEFAULT_CARD_GRADE,
  parseCardGrade,
  parseCardGrader,
  parseCardLanguage,
  parseCardPrinting,
  parseCardRarity,
  parseCardSet,
  parseExcludeWords,
  stripAllCatalogLabels,
  withoutSetExcludeWords,
  brickExcludeWords,
  type CatalogSelection,
} from "@waitseebuy/domain";

export function selectValue(
  form: HTMLFormElement,
  name: string,
): string | undefined {
  const field = form.elements.namedItem(name);
  if (!(field instanceof HTMLSelectElement)) return undefined;
  return field.value;
}

export function readCatalogSelection(form: HTMLFormElement): CatalogSelection {
  const selection: CatalogSelection = {};
  const cardSet = parseCardSet(selectValue(form, "set"));
  const rarity = parseCardRarity(selectValue(form, "rarity"));
  const printing = parseCardPrinting(selectValue(form, "printing"));
  const language = parseCardLanguage(selectValue(form, "language"));
  const grader = parseCardGrader(selectValue(form, "grader"));
  const cardGrade = parseCardGrade(selectValue(form, "grade"));
  const brickType = parseBrickType(selectValue(form, "brickType"));
  const brickStatus = parseBrickStatus(selectValue(form, "brickStatus"));
  if (cardSet) selection.cardSet = cardSet;
  if (rarity) selection.rarity = rarity;
  if (printing) selection.printing = printing;
  if (language) selection.language = language;
  if (grader) {
    selection.grader = grader;
    selection.cardGrade = cardGrade ?? DEFAULT_CARD_GRADE;
  }
  if (brickType) selection.brickType = brickType;
  if (brickStatus) selection.brickStatus = brickStatus;
  return selection;
}

export function syncCatalogSearchForm(
  form: HTMLFormElement,
  changed?: string,
) {
  const gradeField = form.elements.namedItem("grade");
  if (
    parseCardGrader(selectValue(form, "grader")) &&
    gradeField instanceof HTMLSelectElement &&
    !parseCardGrade(gradeField.value)
  ) {
    gradeField.value = DEFAULT_CARD_GRADE;
  }
  const selection = readCatalogSelection(form);
  const input = form.elements.namedItem("q");
  if (input instanceof HTMLInputElement) {
    input.value = composeCatalogQuery(
      stripAllCatalogLabels(input.value, {
        includeGraders:
          Boolean(selection.grader) ||
          changed === "grader" ||
          changed === "grade",
      }),
      selection,
    );
  }
  const exclude = form.elements.namedItem("exclude");
  if (exclude instanceof HTMLInputElement) {
    exclude.value = excludeWordsField(
      mergeExcludeKeywords([
        ...withoutSetExcludeWords(parseExcludeWords(exclude.value)),
        ...brickExcludeWords(selection.brickType),
      ]),
    );
  }
}
