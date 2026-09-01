import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseBrickCategory,
  parseBrickStatus,
  parseBrickType,
  SET_EXCLUDE_WORDS,
} from "./brick-filters.ts";
import { parseFigureCategory } from "./figure-filters.ts";
import {
  composeCatalogQuery,
  CARD_GAME_FILTERS,
  parseCardCategory,
  parseCardGame,
  parseCardGrade,
  parseCardGrader,
  parseCardLanguage,
  parseCardRarity,
  parseCardSet,
  stripAllCatalogLabels,
  stripCatalogTerms,
} from "./card-filters.ts";
import {
  applyWatchOverrides,
  browseFilterParts,
  describeWatch,
  ebaySearchQuery,
  excludeWordsField,
  listingMatchesCondition,
  listingMatchesListingType,
  listingPassesExcludeKeywords,
  mergeExcludeKeywords,
  parseAvailableTo,
  parseConditionFilter,
  parseExcludeWords,
  parseItemLocation,
  parseListingTypeFilter,
  parseSearchIntent,
  toCoverageQuery,
  userExcludeWords,
} from "./watch-criteria.ts";


test("different landed maxes share one coverage query", () => {
  const a = toCoverageQuery(parseSearchIntent("Lego Star Wars under $80"));
  const b = toCoverageQuery(parseSearchIntent("lego star wars under $40"));
  assert.equal(a.key, b.key);
  assert.equal(a.keywords, "lego star wars");
  assert.equal(parseSearchIntent("Lego Star Wars under $80").maxLandedCents, 8000);
  assert.equal(parseSearchIntent("lego star wars under $40").maxLandedCents, 4000);
});

test("word order does not mint a new poll", () => {
  const a = toCoverageQuery(parseSearchIntent("PSA 10 1986 Fleer Jordan"));
  const b = toCoverageQuery(parseSearchIntent("1986 fleer jordan psa 10"));
  assert.equal(a.key, b.key);
  assert.equal(a.condition, "graded");
});

test("listing type is part of coverage, price is not", () => {
  const bin = toCoverageQuery(parseSearchIntent("vintage comic buy it now under $25"));
  const all = toCoverageQuery(parseSearchIntent("vintage comic under $25"));
  assert.notEqual(bin.key, all.key);
  assert.equal(bin.listingType, "bin");
  assert.equal(all.listingType, "all");
});

test("over $X becomes a min price and does not change coverage", () => {
  const a = parseSearchIntent("Lego Star Wars over $20 under $80");
  const b = parseSearchIntent("Lego Star Wars under $80");
  assert.equal(a.minLandedCents, 2000);
  assert.equal(a.maxLandedCents, 8000);
  assert.equal(toCoverageQuery(a).key, toCoverageQuery(b).key);
});

test("listing condition filter uses eBay ids", () => {
  assert.equal(parseConditionFilter("new"), "1000");
  assert.equal(parseConditionFilter("1500"), "1500");
  assert.equal(
    listingMatchesCondition({ conditionId: "1000", condition: "New" }, "1000"),
    true,
  );
  assert.equal(
    listingMatchesCondition({ conditionId: "3000", condition: "Used" }, "1000"),
    false,
  );
  assert.equal(
    listingMatchesCondition(
      { conditionId: "6000", condition: "Acceptable" },
      "6000",
    ),
    true,
  );
});

test("item location and available-to change coverage, confidence does not", () => {
  const base = parseSearchIntent("Lego Star Wars under $80");
  const located = applyWatchOverrides(base, { itemLocation: "country:US" });
  const available = applyWatchOverrides(base, { shipToCountry: "CA" });
  const confidence = applyWatchOverrides(base, { minConfidence: 7 });
  const priceScore = applyWatchOverrides(base, { minPriceScore: 8 });
  assert.notEqual(toCoverageQuery(located).key, toCoverageQuery(base).key);
  assert.notEqual(toCoverageQuery(available).key, toCoverageQuery(base).key);
  assert.equal(toCoverageQuery(confidence).key, toCoverageQuery(base).key);
  assert.equal(toCoverageQuery(priceScore).key, toCoverageQuery(base).key);
  assert.equal(toCoverageQuery(located).itemLocation, "country:US");
  assert.equal(toCoverageQuery(available).deliveryCountry, "CA");
  assert.match(describeWatch(confidence), /seller confidence 7\+/);
  assert.match(describeWatch(priceScore), /price score 8\+/);
});

test("listing and location filters parse eBay values", () => {
  assert.equal(parseListingTypeFilter("bin"), "bin");
  assert.equal(parseListingTypeFilter("best_offer"), "best_offer");
  assert.equal(parseListingTypeFilter("nope"), "all");
  assert.equal(parseItemLocation("region:NORTH_AMERICA"), "region:NORTH_AMERICA");
  assert.equal(parseItemLocation("country:ZZ"), "any");
  assert.equal(parseAvailableTo("GB"), "GB");
  assert.equal(parseAvailableTo("ZZ"), "any");
});

test("browse filter maps location, delivery, and listing type", () => {
  const filter = browseFilterParts({
    listingType: "all",
    itemLocation: "country:US",
    deliveryCountry: "CA",
    deliveryPostal: "M5V",
    condition: "3000",
  }).join(",");
  assert.ok(filter.includes("buyingOptions:{FIXED_PRICE|AUCTION|BEST_OFFER}"));
  assert.ok(filter.includes("itemLocationCountry:{US}"));
  assert.ok(filter.includes("deliveryCountry:CA"));
  assert.ok(filter.includes("deliveryPostalCode:M5V"));
  assert.ok(filter.includes("conditionIds:{3000}"));
});

test("browse filter uses region and auction buying option", () => {
  assert.deepEqual(
    browseFilterParts({
      listingType: "auction",
      itemLocation: "region:NORTH_AMERICA",
    }),
    ["buyingOptions:{AUCTION}", "itemLocationRegion:{NORTH_AMERICA}"],
  );
});

test("browse filter does not invent a feedback score clause", () => {
  const parts = browseFilterParts({ listingType: "bin" });
  assert.deepEqual(parts, ["buyingOptions:{FIXED_PRICE}"]);
});

test("listing type matcher", () => {
  assert.equal(
    listingMatchesListingType(
      { listingType: "bin", buyingOptions: ["FIXED_PRICE", "BEST_OFFER"] },
      "best_offer",
    ),
    true,
  );
  assert.equal(
    listingMatchesListingType(
      { listingType: "bin", buyingOptions: ["FIXED_PRICE"] },
      "best_offer",
    ),
    false,
  );
});

test("user exclude words parse, cover, and hide from the field defaults", () => {
  assert.deepEqual(parseExcludeWords("lot, broken reproduction"), [
    "lot",
    "broken reproduction",
  ]);
  assert.deepEqual(parseExcludeWords("lot broken"), ["lot", "broken"]);
  const base = parseSearchIntent("Lego Star Wars");
  assert.equal(excludeWordsField(base.excludeKeywords), "");
  const withUser = applyWatchOverrides(base, {
    excludeKeywords: mergeExcludeKeywords(["lot"]),
  });
  assert.equal(excludeWordsField(withUser.excludeKeywords), "lot");
  assert.notEqual(toCoverageQuery(withUser).key, toCoverageQuery(base).key);
  assert.equal(
    listingPassesExcludeKeywords({ title: "Lego Star Wars lot" }, withUser.excludeKeywords),
    false,
  );
  assert.equal(
    listingPassesExcludeKeywords({ title: "Lego Star Wars UCS" }, withUser.excludeKeywords),
    true,
  );
  assert.equal(ebaySearchQuery("lego star wars", ["lot"]), "lego star wars -lot");
});

test("card catalog filters inject into eBay keywords, not Browse filter", () => {
  assert.equal(parseCardRarity("holo-rare"), "holo-rare");
  assert.equal(parseCardRarity("nope"), undefined);
  assert.equal(parseCardSet("base-set"), "base-set");
  assert.equal(parseCardLanguage("japanese"), "japanese");
  assert.equal(parseCardGrader("psa"), "psa");
  assert.equal(parseCardGrader("cgc"), "cgc");
  assert.equal(parseCardGrader("nope"), undefined);
  assert.equal(parseCardGrade("10"), "10");
  assert.equal(parseCardGrade("1"), "1");
  assert.equal(parseCardGrade("11"), undefined);
  assert.equal(composeCatalogQuery("charizard", { grader: "psa" }), "charizard PSA");
  assert.equal(
    composeCatalogQuery("charizard", { grader: "psa", cardGrade: "10" }),
    "charizard PSA 10",
  );
  assert.equal(
    composeCatalogQuery("charizard", { grader: "cgc", cardGrade: "9" }),
    "charizard CGC 9",
  );
  assert.equal(
    composeCatalogQuery("charizard PSA 10", { grader: "psa", cardGrade: "10" }),
    "charizard PSA 10",
  );
  assert.equal(stripCatalogTerms("charizard PSA", { grader: "bgs" }), "charizard PSA");
  assert.equal(stripCatalogTerms("charizard PSA", { grader: "psa" }), "charizard");
  assert.equal(
    stripCatalogTerms("charizard PSA 10", { grader: "psa", cardGrade: "10" }),
    "charizard",
  );
  assert.equal(
    stripAllCatalogLabels("PSA 10 charizard", { includeGraders: false }),
    "PSA 10 charizard",
  );
  assert.equal(stripAllCatalogLabels("PSA 10 charizard"), "charizard");
  assert.equal(
    composeCatalogQuery("charizard", {
      cardSet: "base-set",
      rarity: "holo-rare",
    }),
    'charizard "Base Set" "Holo Rare"',
  );
  assert.equal(
    composeCatalogQuery('charizard "Base Set"', { cardSet: "base-set" }),
    'charizard "Base Set"',
  );
  assert.equal(
    stripCatalogTerms('charizard "Holo Rare"', { rarity: "holo-rare" }),
    "charizard",
  );
  assert.equal(
    stripAllCatalogLabels('charizard "Base Set" "Holo Rare" English'),
    "charizard",
  );

  const base = parseSearchIntent("charizard");
  const filtered = applyWatchOverrides(base, {
    cardSet: "base-set",
    rarity: "holo-rare",
    printing: "holofoil",
    language: "english",
  });
  const coverage = toCoverageQuery(filtered);
  assert.match(coverage.keywords, /base set/);
  assert.match(coverage.keywords, /holo rare/);
  assert.notEqual(coverage.key, toCoverageQuery(base).key);
  assert.ok(!browseFilterParts({ listingType: "all" }).join(",").includes("rarity"));
  assert.match(describeWatch(filtered), /Base Set/);
  assert.match(describeWatch(filtered), /Holo Rare/);

  const graded = applyWatchOverrides(base, { grader: "cgc", cardGrade: "10" });
  assert.match(toCoverageQuery(graded).keywords, /cgc 10/);
  assert.match(describeWatch(graded), /CGC 10/);
});

test("trading cards category is a Browse category_ids, not a keyword", () => {
  assert.equal(parseCardCategory("2536"), "2536");
  assert.equal(parseCardCategory("183454"), "183454");
  assert.equal(parseCardCategory("999999"), undefined);
  const base = parseSearchIntent("charizard");
  const ccg = applyWatchOverrides(base, { cardCategory: "2536" });
  const coverage = toCoverageQuery(ccg);
  assert.equal(coverage.categoryIds, "2536");
  assert.equal(coverage.keywords, "charizard");
  assert.ok(!coverage.keywords.includes("collectible card"));
  assert.notEqual(coverage.key, toCoverageQuery(base).key);
  assert.match(describeWatch(ccg), /Collectible Card Games/);
  const singles = applyWatchOverrides(base, { cardCategory: "183454" });
  assert.equal(toCoverageQuery(singles).categoryIds, "183454");
  assert.equal(toCoverageQuery(singles).keywords, "charizard");
  assert.match(describeWatch(singles), /Single Cards/);
  assert.ok(
    !browseFilterParts({ listingType: "all" }).join(",").includes("183454"),
  );
});

test("CCG game is a Browse aspect_filter, not a keyword", () => {
  const slugs = CARD_GAME_FILTERS.map((option) => option.value);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(parseCardGame("pokemon-tcg"), "pokemon-tcg");
  assert.equal(parseCardGame("Pokémon TCG"), "pokemon-tcg");
  assert.equal(parseCardGame("nope"), undefined);
  const base = parseSearchIntent("charizard");
  const filtered = applyWatchOverrides(base, {
    cardCategory: "183454",
    cardGame: "pokemon-tcg",
  });
  const coverage = toCoverageQuery(filtered);
  assert.equal(coverage.categoryIds, "183454");
  assert.equal(
    coverage.aspectFilter,
    "categoryId:183454,Game:{Pokémon TCG}",
  );
  assert.equal(coverage.keywords, "charizard");
  assert.ok(!coverage.keywords.toLowerCase().includes("pokemon"));
  assert.notEqual(
    coverage.key,
    toCoverageQuery(applyWatchOverrides(base, { cardCategory: "183454" })).key,
  );
  assert.match(describeWatch(filtered), /Single Cards/);
  assert.match(describeWatch(filtered), /Pokémon TCG/);
  const withoutGame = applyWatchOverrides(filtered, {
    cardCategory: "2536",
  });
  assert.equal(toCoverageQuery(withoutGame).aspectFilter, undefined);
});

test("building bricks type and status inject keywords; Set excludes instead", () => {
  assert.equal(parseBrickType("minifigure"), "minifigure");
  assert.equal(parseBrickType("set"), "set");
  assert.equal(parseBrickType("nope"), undefined);
  assert.equal(parseBrickStatus("factory-sealed"), "factory-sealed");
  assert.equal(parseBrickCategory("183446"), "183446");
  assert.equal(parseBrickCategory("19016"), undefined);
  assert.equal(composeCatalogQuery("lego", { brickType: "set" }), "lego");
  assert.equal(
    composeCatalogQuery("lego", { brickType: "minifigure" }),
    "lego minifigure",
  );
  assert.equal(
    composeCatalogQuery("lego", { brickType: "instructions-manual" }),
    "lego manual",
  );
  assert.equal(
    composeCatalogQuery("lego", { brickType: "original-box" }),
    "lego box",
  );
  assert.equal(
    composeCatalogQuery("lego", { brickStatus: "factory-sealed" }),
    "lego sealed",
  );
  assert.equal(
    composeCatalogQuery("lego", { brickStatus: "complete" }),
    "lego complete",
  );
  assert.equal(
    composeCatalogQuery("lego", { brickStatus: "incomplete" }),
    "lego incomplete",
  );
  assert.equal(
    stripCatalogTerms("lego minifigure sealed", {
      brickType: "minifigure",
      brickStatus: "factory-sealed",
    }),
    "lego",
  );
  assert.equal(stripAllCatalogLabels("lego minifigure sealed incomplete"), "lego");

  const base = parseSearchIntent("lego star wars");
  const setWatch = applyWatchOverrides(base, {
    brickType: "set",
    excludeKeywords: mergeExcludeKeywords(["lot"]),
  });
  assert.deepEqual(
    userExcludeWords(setWatch.excludeKeywords).sort((a, b) =>
      a.localeCompare(b),
    ),
    [...SET_EXCLUDE_WORDS, "lot"].sort((a, b) => a.localeCompare(b)),
  );
  const setCoverage = toCoverageQuery(setWatch);
  assert.equal(setCoverage.keywords, "lego star wars");
  assert.ok(setCoverage.excludeKeywords?.includes("Minifigure"));
  assert.ok(setCoverage.excludeKeywords?.includes("part"));
  assert.match(describeWatch(setWatch), /Set/);
  assert.match(describeWatch(setWatch), /excluding/);

  const minifig = applyWatchOverrides(base, { brickType: "minifigure" });
  assert.equal(toCoverageQuery(minifig).keywords, "lego star wars minifigure");
  assert.deepEqual(userExcludeWords(minifig.excludeKeywords), []);
  assert.match(describeWatch(minifig), /Minifigure/);

  const cleared = applyWatchOverrides(setWatch, { clearBrickType: true });
  assert.deepEqual(userExcludeWords(cleared.excludeKeywords), ["lot"]);
});

test("building toys category is a Browse category_ids, not a keyword", () => {
  const base = parseSearchIntent("lego star wars");
  const filtered = applyWatchOverrides(base, {
    brickCategory: "183446",
    brickStatus: "complete",
  });
  const coverage = toCoverageQuery(filtered);
  assert.equal(coverage.categoryIds, "183446");
  assert.equal(coverage.keywords, "lego star wars complete");
  assert.ok(!coverage.keywords.includes("building toys"));
  assert.notEqual(coverage.key, toCoverageQuery(base).key);
  assert.match(describeWatch(filtered), /Building Toys/);
  assert.match(describeWatch(filtered), /Complete/);
  assert.ok(
    !browseFilterParts({ listingType: "all" }).join(",").includes("183446"),
  );
});

test("action figures category is a Browse category_ids, not a keyword", () => {
  assert.equal(parseFigureCategory("246"), "246");
  assert.equal(parseFigureCategory("261068"), "261068");
  assert.equal(parseFigureCategory("999999"), undefined);
  const base = parseSearchIntent("star wars kenner");
  const filtered = applyWatchOverrides(base, { figureCategory: "246" });
  const coverage = toCoverageQuery(filtered);
  assert.equal(coverage.categoryIds, "246");
  assert.equal(coverage.keywords, "star wars kenner");
  assert.ok(!coverage.keywords.includes("action figures"));
  assert.notEqual(coverage.key, toCoverageQuery(base).key);
  assert.match(describeWatch(filtered), /Action Figures & Accessories/);
  assert.ok(
    !browseFilterParts({ listingType: "all" }).join(",").includes("246"),
  );
});

test("graded condition stays on the coverage query", () => {
  const raw = parseSearchIntent("PSA 10 1986 Fleer Jordan under $2000");
  assert.equal(raw.gradeCompany, "psa");
  assert.equal(raw.minGrade, 10);
  assert.equal(raw.maxLandedCents, 200000);
  assert.equal(raw.query.includes("PSA") || raw.query.includes("psa"), true);
  const coverage = toCoverageQuery(raw);
  assert.equal(coverage.condition, "graded");
  assert.match(coverage.keywords, /10/);
});
