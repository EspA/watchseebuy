import assert from "node:assert/strict";
import { test } from "node:test";
import { composeCatalogQuery } from "./card-filters.ts";
import {
  applyWatchOverrides,
  parseSearchIntent,
  toCoverageQuery,
  unofficialExcludeWords,
  userExcludeWords,
} from "./watch-criteria.ts";
import { localizeQueryTerm } from "./store-query-terms.ts";

test("store-language query terms follow the marketplace", () => {
  assert.equal(localizeQueryTerm("carded", "fr"), "blister");
  assert.equal(localizeQueryTerm("sealed", "de"), "ovp");
  assert.equal(localizeQueryTerm("carded", "en"), "carded");
  assert.equal(
    composeCatalogQuery("hot wheels", { wheelsPackaging: "carded" }, "fr"),
    "hot wheels blister",
  );
  assert.equal(
    composeCatalogQuery("lego", { brickStatus: "factory-sealed" }, "de"),
    "lego ovp",
  );
});

test("German unofficial excludes use store language", () => {
  const words = unofficialExcludeWords(true, "de");
  assert.ok(words.includes("fälschung"));
  assert.ok(words.includes("reproduktion"));
  assert.ok(words.includes("nachbau"));
  assert.ok(!words.includes("fake"));
});

test("DE-site coverage injects German exclude words", () => {
  const intent = applyWatchOverrides(parseSearchIntent("lego star wars"), {
    ebaySite: "EBAY_DE",
    figurePackaging: "carded",
  });
  const coverage = toCoverageQuery(intent);
  assert.equal(coverage.ebaySite, "EBAY_DE");
  assert.match(coverage.keywords, /carded/);
  const excluded = userExcludeWords(intent.excludeKeywords);
  assert.ok(excluded.includes("fälschung"));
  assert.ok(excluded.includes("lose"));
  assert.ok(!excluded.includes("fake"));
});
