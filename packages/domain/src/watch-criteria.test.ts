import assert from "node:assert/strict";
import { test } from "node:test";
import {
  composeCatalogQuery,
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
  assert.notEqual(toCoverageQuery(located).key, toCoverageQuery(base).key);
  assert.notEqual(toCoverageQuery(available).key, toCoverageQuery(base).key);
  assert.equal(toCoverageQuery(confidence).key, toCoverageQuery(base).key);
  assert.equal(toCoverageQuery(located).itemLocation, "country:US");
  assert.equal(toCoverageQuery(available).deliveryCountry, "CA");
  assert.match(describeWatch(confidence), /seller confidence 7\+/);
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
