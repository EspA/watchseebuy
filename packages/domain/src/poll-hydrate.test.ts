import assert from "node:assert/strict";
import { test } from "node:test";
import type { CandidateListing } from "./matcher.ts";
import {
  listingFromStoredPayload,
  listingsNeedingProductHydration,
  needsProductHydration,
} from "./poll-hydrate.ts";
import type { WatchCriteria } from "./watch-criteria.ts";

function listing(
  overrides: Partial<CandidateListing> & Pick<CandidateListing, "title">,
): CandidateListing {
  return {
    ebayItemId: overrides.ebayItemId ?? "1",
    restItemId: overrides.restItemId ?? "v1|1|0",
    itemCents: overrides.itemCents ?? 10_000,
    shippingCents: overrides.shippingCents ?? 500,
    listingType: overrides.listingType ?? "bin",
    ...overrides,
  };
}

function watch(overrides: Partial<WatchCriteria> = {}): WatchCriteria {
  return {
    query: "charizard",
    condition: "any",
    excludeKeywords: [],
    listingType: "all",
    ebaySite: "EBAY_US",
    ...overrides,
  };
}

test("needsProductHydration skips catalog-keyed listings", () => {
  assert.equal(
    needsProductHydration(listing({ title: "Charizard", epid: "15032" })),
    false,
  );
  assert.equal(
    needsProductHydration(listing({ title: "Charizard", gtin: "123" })),
    false,
  );
  assert.equal(
    needsProductHydration(
      listing({ title: "Charizard", brand: "Pokemon", mpn: "BS-4" }),
    ),
    false,
  );
  assert.equal(
    needsProductHydration(
      listing({
        title: "Charizard",
        localizedAspects: [{ name: "Set", value: "Base" }],
      }),
    ),
    false,
  );
  assert.equal(
    needsProductHydration(listing({ title: "Charizard", restItemId: undefined })),
    false,
  );
});

test("worker hydrate only the unmatched-signal listings that fit a watch", () => {
  const hits = [
    listing({
      ebayItemId: "keep",
      title: "PSA 10 Charizard Base Set",
    }),
    listing({
      ebayItemId: "epid-already",
      title: "PSA 10 Charizard Base Set",
      epid: "15032",
    }),
    listing({
      ebayItemId: "over-cap",
      title: "Charizard Base Set",
      itemCents: 80_000,
    }),
  ];

  const needed = listingsNeedingProductHydration(hits, [
    watch({ maxLandedCents: 20_000 }),
  ]);
  assert.deepEqual(
    needed.map((row) => row.ebayItemId),
    ["keep"],
  );
});

test("listings that only fail minPriceScore are still hydrated once", () => {
  const needed = listingsNeedingProductHydration(
    [listing({ title: "PSA 10 Charizard Base Set" })],
    [watch({ minPriceScore: 8 })],
  );
  assert.equal(needed.length, 1);
});

test("hydrate cap stops a broad coverage query from fetching the whole page", () => {
  const hits = Array.from({ length: 24 }, (_, i) =>
    listing({
      ebayItemId: String(i),
      restItemId: `v1|${i}|0`,
      title: "PSA 10 Charizard Base Set",
    }),
  );
  const needed = listingsNeedingProductHydration(hits, [watch()], 8);
  assert.equal(needed.length, 8);
});

test("zero limit disables worker getItem", () => {
  const needed = listingsNeedingProductHydration(
    [listing({ title: "PSA 10 Charizard Base Set" })],
    [watch()],
    0,
  );
  assert.equal(needed.length, 0);
});

test("listingFromStoredPayload keeps catalog signals for the next poll", () => {
  const stored = listingFromStoredPayload({
    ebayItemId: "1",
    title: "Charizard",
    itemCents: 1000,
    shippingCents: 100,
    listingType: "bin",
    restItemId: "v1|1|0",
    epid: "15032",
    localizedAspects: [{ name: "Set", value: "Base" }],
  });
  assert.ok(stored);
  assert.equal(stored.epid, "15032");
  assert.equal(needsProductHydration(stored), false);
});
