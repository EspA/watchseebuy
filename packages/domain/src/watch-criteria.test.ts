import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseBrickCategory,
  parseBrickStatus,
  parseBrickType,
  SET_EXCLUDE_WORDS,
} from "./brick-filters.ts";
import {
  parseFigureCategory,
  parseFigureCompleteness,
  parseFigurePackaging,
  parseFigurePunch,
  parseFigureScale,
} from "./figure-filters.ts";
import {
  CARDED_EXCLUDE_WORDS,
  parseWheelsCategory,
  parseWheelsPackaging,
  parseWheelsScale,
} from "./wheel-filters.ts";
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
  DEFAULT_EBAY_SITE,
  parseEbaySite,
} from "./ebay-sites.ts";
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
  assert.equal(parseCardGrade("9.5"), "9.5");
  assert.equal(parseCardGrade("1"), "1");
  assert.equal(parseCardGrade("11"), undefined);
  assert.equal(parseCardGrader("beckett"), "bgs");
  assert.equal(parseCardGrader("raw"), "raw");
  assert.equal(composeCatalogQuery("charizard", { grader: "psa" }), "charizard PSA");
  assert.equal(
    composeCatalogQuery("charizard", { grader: "psa", cardGrade: "10" }),
    "charizard PSA 10",
  );
  assert.equal(
    composeCatalogQuery("charizard", { grader: "cgc", cardGrade: "9.5" }),
    "charizard CGC 9.5",
  );
  assert.equal(composeCatalogQuery("charizard", { grader: "raw" }), "charizard");
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
      rarity: "special-illustration-rare",
    }),
    "charizard \"Base Set\" SIR",
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
    stripAllCatalogLabels('charizard "Base Set" SIR English'),
    "charizard",
  );

  const base = parseSearchIntent("charizard");
  const filtered = applyWatchOverrides(base, {
    cardSet: "base-set",
    rarity: "holo-rare",
    printing: "1st-edition",
    language: "english",
  });
  const coverage = toCoverageQuery(filtered);
  assert.match(coverage.keywords, /base set/);
  assert.match(coverage.keywords, /holo rare/);
  assert.match(coverage.keywords, /1st edition/);
  assert.ok(!coverage.keywords.includes("english"));
  assert.notEqual(coverage.key, toCoverageQuery(base).key);
  assert.ok(!browseFilterParts({ listingType: "all" }).join(",").includes("rarity"));
  assert.match(describeWatch(filtered), /Base Set/);
  assert.match(describeWatch(filtered), /Holo Rare/);
  assert.match(describeWatch(filtered), /English/);

  const japanese = applyWatchOverrides(base, { language: "japanese" });
  assert.match(toCoverageQuery(japanese).keywords, /japanese/);

  const raw = applyWatchOverrides(base, {
    grader: "raw",
    cardGrade: "10",
    excludeKeywords: mergeExcludeKeywords(["lot"]),
  });
  assert.equal(raw.cardGrade, undefined);
  assert.ok(!toCoverageQuery(raw).keywords.includes("raw"));
  assert.ok(toCoverageQuery(raw).excludeKeywords?.includes("psa"));
  assert.ok(toCoverageQuery(raw).excludeKeywords?.includes("graded"));
  assert.match(describeWatch(raw), /Raw/);

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
  assert.ok(coverage.excludeKeywords?.includes("reproduction"));
  assert.ok(coverage.excludeKeywords?.includes("fake"));
  assert.ok(coverage.excludeKeywords?.includes("custom"));
  assert.notEqual(coverage.key, toCoverageQuery(base).key);
  assert.match(describeWatch(ccg), /Collectible Card Games/);
  const singles = applyWatchOverrides(base, { cardCategory: "183454" });
  assert.equal(toCoverageQuery(singles).categoryIds, "183454");
  assert.equal(toCoverageQuery(singles).keywords, "charizard");
  assert.match(describeWatch(singles), /Singles/);
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
  assert.match(describeWatch(filtered), /Singles/);
  assert.match(describeWatch(filtered), /Pokémon TCG/);
  const withoutGame = applyWatchOverrides(filtered, {
    cardCategory: "212",
  });
  assert.equal(toCoverageQuery(withoutGame).aspectFilter, undefined);
  assert.equal(withoutGame.cardGame, undefined);

  const parentAndGame = applyWatchOverrides(base, {
    cardCategory: "2536",
    cardGame: "pokemon-tcg",
  });
  assert.equal(toCoverageQuery(parentAndGame).categoryIds, "183454");
  assert.equal(
    toCoverageQuery(parentAndGame).aspectFilter,
    "categoryId:183454,Game:{Pokémon TCG}",
  );

  const mtgDropsPokemonSet = applyWatchOverrides(base, {
    cardGame: "magic-the-gathering",
    cardCategory: "183454",
    cardSet: "base-set",
    rarity: "holo-rare",
  });
  assert.equal(mtgDropsPokemonSet.cardSet, undefined);
  assert.equal(mtgDropsPokemonSet.rarity, undefined);
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
  assert.ok(setCoverage.excludeKeywords?.includes("plate"));
  assert.ok(setCoverage.excludeKeywords?.includes("brick"));
  assert.ok(setCoverage.excludeKeywords?.includes("panel"));
  assert.ok(setCoverage.excludeKeywords?.includes("tile"));
  assert.ok(setCoverage.excludeKeywords?.includes("slope"));
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
  assert.equal(parseFigureCategory("149372"), "149372");
  assert.equal(parseFigureCategory("262346"), "262346");
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
  const labubu = applyWatchOverrides(base, { figureCategory: "149372" });
  assert.equal(toCoverageQuery(labubu).categoryIds, "149372");
  assert.match(describeWatch(labubu), /Collectible Figures & Bobbleheads/);
  const barbie = applyWatchOverrides(base, { figureCategory: "262346" });
  assert.equal(toCoverageQuery(barbie).categoryIds, "262346");
  assert.match(describeWatch(barbie), /Dolls & Doll Playsets/);
});

test("figure scale is a Browse aspect_filter, not a keyword", () => {
  assert.equal(parseFigureScale("3-75"), "3-75");
  assert.equal(parseFigureScale("6-in"), "6-in");
  assert.equal(parseFigureScale("nope"), undefined);
  const base = parseSearchIntent("kenner luke");
  const filtered = applyWatchOverrides(base, {
    figureCategory: "261068",
    figureScale: "3-75",
  });
  const coverage = toCoverageQuery(filtered);
  assert.equal(coverage.categoryIds, "261068");
  assert.equal(coverage.aspectFilter, 'categoryId:261068,Scale:{3.75"}');
  assert.equal(coverage.keywords, "kenner luke");
  assert.match(describeWatch(filtered), /3\.75/);

  const scaleOnly = applyWatchOverrides(base, { figureScale: "1-6" });
  assert.equal(toCoverageQuery(scaleOnly).categoryIds, "246");
  assert.equal(
    toCoverageQuery(scaleOnly).aspectFilter,
    "categoryId:246,Scale:{1:6}",
  );

  const accessories = applyWatchOverrides(base, {
    figureCategory: "261070",
    figureScale: "3-75",
  });
  assert.equal(accessories.figureScale, undefined);
  assert.equal(toCoverageQuery(accessories).aspectFilter, undefined);
});

test("figure packaging, completeness, and punch inject keywords", () => {
  assert.equal(parseFigurePackaging("carded"), "carded");
  assert.equal(parseFigureCompleteness("complete"), "complete");
  assert.equal(parseFigurePunch("unpunched"), "unpunched");
  assert.equal(
    composeCatalogQuery("kenner luke", { figurePackaging: "carded" }),
    "kenner luke carded",
  );
  assert.equal(
    composeCatalogQuery("kenner luke", {
      figurePackaging: "loose",
      figureCompleteness: "complete",
    }),
    "kenner luke loose complete",
  );
  assert.equal(
    composeCatalogQuery("kenner luke", {
      figurePackaging: "carded",
      figurePunch: "unpunched",
    }),
    "kenner luke carded unpunched",
  );

  const base = parseSearchIntent("kenner luke");
  const carded = applyWatchOverrides(base, {
    figurePackaging: "carded",
    figurePunch: "punched",
    figureCompleteness: "complete",
    excludeKeywords: mergeExcludeKeywords(["lot"]),
  });
  assert.equal(carded.figureCompleteness, undefined);
  assert.equal(toCoverageQuery(carded).keywords, "kenner luke carded punched");
  assert.ok(toCoverageQuery(carded).excludeKeywords?.includes("uncarded"));
  assert.ok(toCoverageQuery(carded).excludeKeywords?.includes("unpunched"));
  assert.match(describeWatch(carded), /Carded/);
  assert.match(describeWatch(carded), /Punched/);

  const loose = applyWatchOverrides(base, {
    figurePackaging: "loose",
    figureCompleteness: "incomplete",
    figurePunch: "unpunched",
  });
  assert.equal(loose.figurePunch, undefined);
  assert.equal(toCoverageQuery(loose).keywords, "kenner luke loose incomplete");
  assert.deepEqual(userExcludeWords(loose.excludeKeywords), []);
  assert.match(describeWatch(loose), /Loose/);
  assert.match(describeWatch(loose), /Incomplete/);
});

test("hot wheels category is a Browse category_ids, not a keyword", () => {
  assert.equal(parseWheelsCategory("222"), "222");
  assert.equal(parseWheelsCategory("180273"), "180273");
  assert.equal(parseWheelsCategory("180507"), "180507");
  assert.equal(parseWheelsCategory("999999"), undefined);
  const base = parseSearchIntent("hot wheels treasure hunt");
  const filtered = applyWatchOverrides(base, { wheelsCategory: "180273" });
  const coverage = toCoverageQuery(filtered);
  assert.equal(coverage.categoryIds, "180273");
  assert.equal(coverage.keywords, "hot wheels treasure hunt");
  assert.ok(!coverage.keywords.includes("cars, trucks"));
  assert.notEqual(coverage.key, toCoverageQuery(base).key);
  assert.match(describeWatch(filtered), /Cars, Trucks & Vans/);
  assert.ok(
    !browseFilterParts({ listingType: "all" }).join(",").includes("180273"),
  );
});

test("hot wheels scale is a Browse aspect_filter, not a keyword", () => {
  assert.equal(parseWheelsScale("1-64"), "1-64");
  assert.equal(parseWheelsScale("1:64"), "1-64");
  assert.equal(parseWheelsScale("nope"), undefined);
  const base = parseSearchIntent("hot wheels");
  const filtered = applyWatchOverrides(base, {
    wheelsCategory: "180507",
    wheelsScale: "1-64",
  });
  const coverage = toCoverageQuery(filtered);
  assert.equal(coverage.categoryIds, "180507");
  assert.equal(coverage.aspectFilter, "categoryId:180507,Scale:{1:64}");
  assert.equal(coverage.keywords, "hot wheels");
  assert.ok(!coverage.keywords.includes("1:64"));
  assert.notEqual(
    coverage.key,
    toCoverageQuery(applyWatchOverrides(base, { wheelsCategory: "180507" }))
      .key,
  );
  assert.match(describeWatch(filtered), /Vintage Manufacture/);
  assert.match(describeWatch(filtered), /1:64/);

  const scaleOnly = applyWatchOverrides(base, { wheelsScale: "1-43" });
  const scaleCoverage = toCoverageQuery(scaleOnly);
  assert.equal(scaleCoverage.categoryIds, "222");
  assert.equal(scaleCoverage.aspectFilter, "categoryId:222,Scale:{1:43}");
  assert.equal(scaleCoverage.keywords, "hot wheels");

  const accessories = applyWatchOverrides(base, {
    wheelsCategory: "180278",
    wheelsScale: "1-64",
  });
  assert.equal(accessories.wheelsScale, undefined);
  assert.equal(toCoverageQuery(accessories).aspectFilter, undefined);
  assert.equal(toCoverageQuery(accessories).categoryIds, "180278");
});

test("hot wheels packaging injects keywords; Carded excludes uncarded", () => {
  assert.equal(parseWheelsPackaging("carded"), "carded");
  assert.equal(parseWheelsPackaging("loose"), "loose");
  assert.equal(parseWheelsPackaging("nope"), undefined);
  assert.equal(
    composeCatalogQuery("hot wheels", { wheelsPackaging: "carded" }),
    "hot wheels carded",
  );
  assert.equal(
    composeCatalogQuery("hot wheels", { wheelsPackaging: "loose" }),
    "hot wheels loose",
  );
  assert.equal(
    stripCatalogTerms("hot wheels carded", { wheelsPackaging: "carded" }),
    "hot wheels",
  );
  assert.equal(stripAllCatalogLabels("hot wheels carded loose"), "hot wheels");

  const base = parseSearchIntent("hot wheels bone shaker");
  const carded = applyWatchOverrides(base, {
    wheelsPackaging: "carded",
    excludeKeywords: mergeExcludeKeywords(["lot"]),
  });
  assert.deepEqual(
    userExcludeWords(carded.excludeKeywords).sort((a, b) =>
      a.localeCompare(b),
    ),
    [...CARDED_EXCLUDE_WORDS, "lot"].sort((a, b) => a.localeCompare(b)),
  );
  assert.equal(toCoverageQuery(carded).keywords, "hot wheels bone shaker carded");
  assert.ok(toCoverageQuery(carded).excludeKeywords?.includes("uncarded"));
  assert.match(describeWatch(carded), /Carded/);

  const loose = applyWatchOverrides(base, { wheelsPackaging: "loose" });
  assert.equal(toCoverageQuery(loose).keywords, "hot wheels bone shaker loose");
  assert.deepEqual(userExcludeWords(loose.excludeKeywords), []);
  assert.match(describeWatch(loose), /Loose/);

  const cleared = applyWatchOverrides(carded, { clearWheelsPackaging: true });
  assert.deepEqual(userExcludeWords(cleared.excludeKeywords), ["lot"]);
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

test("ebay site is a Browse marketplace id and changes coverage", () => {
  assert.equal(parseEbaySite("EBAY_GB"), "EBAY_GB");
  assert.equal(parseEbaySite("gb"), "EBAY_GB");
  assert.equal(parseEbaySite("de"), "EBAY_DE");
  assert.equal(parseEbaySite("nope"), undefined);
  const base = parseSearchIntent("charizard");
  assert.equal(base.ebaySite, DEFAULT_EBAY_SITE);
  const uk = applyWatchOverrides(base, { ebaySite: "EBAY_GB" });
  assert.equal(uk.ebaySite, "EBAY_GB");
  assert.equal(toCoverageQuery(uk).ebaySite, "EBAY_GB");
  assert.notEqual(toCoverageQuery(uk).key, toCoverageQuery(base).key);
  assert.match(describeWatch(uk), /United Kingdom/);
});
