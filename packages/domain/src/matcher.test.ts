import assert from "node:assert/strict";
import { test } from "node:test";
import { matchListing, type CandidateListing } from "./matcher.ts";
import { parseSearchIntent, type WatchCriteria } from "./watch-criteria.ts";

function listing(
  title: string,
  overrides: Partial<CandidateListing> = {},
): CandidateListing {
  return {
    ebayItemId: overrides.ebayItemId ?? "1",
    title,
    itemCents: overrides.itemCents ?? 550_000,
    shippingCents: overrides.shippingCents ?? 0,
    listingType: overrides.listingType ?? "bin",
    ...overrides,
  };
}

const yodaWatch: WatchCriteria = parseSearchIntent(
  "LEGO Star Wars I Love NY Yoda",
);

test("a watch keeps eBay loose matches and drops excluded titles", () => {
  const kept = [
    "2013 LEGO STAR WARS YODA I HEART NY TOYS R US TIMES SQUARE EXCLUSIVE MINIFIGURE",
    "LEGO Star Wars New York Yoda I Heart New York sealed authentic",
    "LEGO Star Wars SW0465 New York Yoda",
    "LEGO 2013 NY YODA I HEART LOVE TOYS R US TIMES SQUARE (sw0465a)",
  ];
  for (const title of kept) {
    assert.equal(matchListing(listing(title), yodaWatch).matches, true, title);
  }
  assert.equal(
    matchListing(
      listing(
        "NEW Star Wars Yoda NY New York I Love Shirt Custom Lego Minifigure",
      ),
      yodaWatch,
    ).matches,
    false,
  );
});

test("price and exclude filters still reject a coverage hit", () => {
  const title = "LEGO Star Wars SW0465 New York Yoda";
  assert.equal(
    matchListing(listing(title, { itemCents: 20_000 }), {
      ...yodaWatch,
      maxLandedCents: 5_000,
    }).matches,
    false,
  );
  assert.equal(
    matchListing(listing("LEGO lot of Yoda figures"), {
      ...yodaWatch,
      excludeKeywords: ["lot"],
    }).matches,
    false,
  );
});
