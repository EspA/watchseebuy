"use client";

import {
  composeCatalogQuery,
  excludeWordsField,
  mergeExcludeKeywords,
  parseBrickStatus,
  parseBrickType,
  DEFAULT_CARD_GRADE,
  cardSkippedDefaultExcludes,
  isSlabGrader,
  parseCardCategory,
  parseCardGame,
  parseCardGrade,
  parseCardGrader,
  parseCardLanguage,
  parseCardLine,
  parseCardPrinting,
  parseCardRarity,
  parseCardSet,
  parseExcludeWords,
  stripAllCatalogLabels,
  unofficialExcludeWords,
  withoutUnofficialExcludeWords,
  withoutSealedExcludeWords,
  withoutSetExcludeWords,
  brickExcludeWords,
  parseFigureCompleteness,
  parseFigurePackaging,
  parseFigurePunch,
  parseWheelsPackaging,
  cardExcludeWords,
  figureExcludeWords,
  wheelsExcludeWords,
  withoutCardExcludeWords,
  withoutCardedExcludeWords,
  withoutFigureExcludeWords,
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
  const wheelsPackaging = parseWheelsPackaging(
    selectValue(form, "wheelsPackaging"),
  );
  const figurePackaging = parseFigurePackaging(
    selectValue(form, "figurePackaging"),
  );
  const figureCompleteness = parseFigureCompleteness(
    selectValue(form, "figureCompleteness"),
  );
  const figurePunch = parseFigurePunch(selectValue(form, "figurePunch"));
  if (cardSet) selection.cardSet = cardSet;
  if (rarity) selection.rarity = rarity;
  if (printing) selection.printing = printing;
  if (language) selection.language = language;
  if (grader) {
    selection.grader = grader;
    if (isSlabGrader(grader)) {
      selection.cardGrade = cardGrade ?? DEFAULT_CARD_GRADE;
    }
  }
  if (brickType) selection.brickType = brickType;
  if (brickStatus) selection.brickStatus = brickStatus;
  if (wheelsPackaging) selection.wheelsPackaging = wheelsPackaging;
  if (figurePackaging) selection.figurePackaging = figurePackaging;
  if (figureCompleteness) selection.figureCompleteness = figureCompleteness;
  if (figurePunch) selection.figurePunch = figurePunch;
  const noReprints = form.elements.namedItem("cardNoReprints");
  if (noReprints instanceof HTMLInputElement) {
    selection.cardNoReprints = noReprints.value !== "0";
  }
  const noProxy = form.elements.namedItem("cardNoProxy");
  if (noProxy instanceof HTMLInputElement) {
    selection.cardNoProxy = noProxy.value !== "0";
  }
  return selection;
}

export function syncCatalogSearchForm(
  form: HTMLFormElement,
  changed?: string,
) {
  const gradeField = form.elements.namedItem("grade");
  if (
    isSlabGrader(selectValue(form, "grader")) &&
    gradeField instanceof HTMLSelectElement &&
    !parseCardGrade(gradeField.value)
  ) {
    gradeField.value = DEFAULT_CARD_GRADE;
  }
  const selection = readCatalogSelection(form);
  const unofficial = form.elements.namedItem("unofficial");
  const excludeUnofficial =
    unofficial instanceof HTMLInputElement ? unofficial.value !== "0" : true;
  const cardCategory =
    parseCardCategory(selectValue(form, "cardCategory")) ??
    parseCardLine(selectValue(form, "cardLine"));
  const cardGame = parseCardGame(selectValue(form, "cardGame"));
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
  const cardSelection = {
    ...selection,
    ...(cardCategory ? { cardCategory } : {}),
    ...(cardGame ? { cardGame } : {}),
  };
  if (exclude instanceof HTMLInputElement) {
    exclude.value = excludeWordsField(
      mergeExcludeKeywords([
        ...withoutCardExcludeWords(
          withoutFigureExcludeWords(
            withoutCardedExcludeWords(
              withoutUnofficialExcludeWords(
                withoutSealedExcludeWords(
                  withoutSetExcludeWords(parseExcludeWords(exclude.value)),
                ),
              ),
            ),
          ),
        ),
        ...unofficialExcludeWords(excludeUnofficial),
        ...brickExcludeWords(selection.brickType, selection.brickStatus),
        ...wheelsExcludeWords(selection.wheelsPackaging),
        ...figureExcludeWords(selection.figurePackaging, selection.figurePunch),
        ...cardExcludeWords(cardSelection),
      ], cardSkippedDefaultExcludes(cardSelection)),
    );
  }
}
