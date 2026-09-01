import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attachPriceScores,
  listingMatchesPriceScore,
  parseMinPriceScore,
  scoreVersusMedian,
} from "./price-score.ts";
import type { ProductIdentity } from "./product-identity.ts";

const highId = (key: string, label = "PSA 10 Jordan"): ProductIdentity => ({
  itemKey: key,
  confidence: "high",
  source: "epid",
  label,
});

test("price score filter matches numeric scores only", () => {
  assert.equal(parseMinPriceScore(""), undefined);
  assert.equal(parseMinPriceScore("8"), 8);
  assert.equal(listingMatchesPriceScore({}, undefined), true);
  assert.equal(
    listingMatchesPriceScore(
      { priceScore: { score: 8, tone: "high", deltaPct: -10, sampleSize: 4, reason: "" } },
      8,
    ),
    true,
  );
  assert.equal(
    listingMatchesPriceScore(
      { priceScore: { score: 5, tone: "mid", deltaPct: 0, sampleSize: 4, reason: "" } },
      8,
    ),
    false,
  );
  assert.equal(
    listingMatchesPriceScore(
      { priceScore: { score: null, tone: "low", deltaPct: null, sampleSize: 1, reason: "" } },
      5,
    ),
    false,
  );
});

test("score is 5 at the median and rises when cheaper", () => {
  const peers = [10_000, 10_000, 10_000];
  const at = scoreVersusMedian(10_000, peers, "high");
  assert.equal(at.score, 5);
  assert.equal(at.deltaPct, 0);
  assert.match(at.reason, /At the median/);

  const cheap = scoreVersusMedian(7_500, peers, "high");
  assert.equal(cheap.score, 10);
  assert.equal(cheap.deltaPct, -25);
  assert.match(cheap.reason, /25% below/);

  const rich = scoreVersusMedian(12_500, peers, "high");
  assert.equal(rich.score, 0);
  assert.equal(rich.deltaPct, 25);
});

test("low identity never produces a numeric score", () => {
  const scored = scoreVersusMedian(5_000, [8_000, 9_000, 10_000], "low");
  assert.equal(scored.score, null);
  assert.match(scored.reason, /not identify/i);
});

test("fewer than two similar listings is unscored", () => {
  const scored = scoreVersusMedian(5_000, [5_000], "high");
  assert.equal(scored.score, null);
  assert.match(scored.reason, /at least 2/);
});

test("medium identity caps a strong score until the sample is 3+", () => {
  const capped = scoreVersusMedian(7_500, [10_000, 10_000], "medium");
  assert.equal(capped.score, 7);
  const full = scoreVersusMedian(7_500, [10_000, 10_000, 10_000], "medium");
  assert.equal(full.score, 10);
});

test("a narrower result set recomputes scores from scratch", () => {
  const identity = highId("epid|1|psa|10");
  const cheap = {
    ebayItemId: "1",
    itemCents: 7_500,
    shippingCents: 0,
    identity,
    priceScore: {
      score: 10,
      tone: "high" as const,
      deltaPct: -25,
      sampleSize: 3,
      reason: "stale",
    },
  };
  const mid = {
    ebayItemId: "2",
    itemCents: 10_000,
    shippingCents: 0,
    identity,
  };
  const high = {
    ebayItemId: "3",
    itemCents: 12_500,
    shippingCents: 0,
    identity,
  };

  const wide = attachPriceScores([cheap, mid, high]);
  assert.equal(wide[0]?.priceScore.score, 10);
  assert.equal(wide[0]?.priceScore.sampleSize, 3);

  const narrow = attachPriceScores([cheap, mid]);
  assert.equal(narrow[0]?.priceScore.score, 8);
  assert.equal(narrow[0]?.priceScore.sampleSize, 2);
  assert.notEqual(narrow[0]?.priceScore.reason, "stale");
});

test("attachPriceScores groups by item key and skips low-confidence peers", () => {
  const scored = attachPriceScores([
    {
      ebayItemId: "1",
      itemCents: 7_500,
      shippingCents: 0,
      identity: highId("epid|1|psa|10"),
    },
    {
      ebayItemId: "2",
      itemCents: 10_000,
      shippingCents: 0,
      identity: highId("epid|1|psa|10"),
    },
    {
      ebayItemId: "3",
      itemCents: 10_000,
      shippingCents: 0,
      identity: highId("epid|1|psa|10"),
    },
    {
      ebayItemId: "4",
      itemCents: 1_000,
      shippingCents: 0,
      identity: {
        itemKey: "title|wow",
        confidence: "low",
        source: "title",
        label: "Wow",
      },
    },
  ]);

  assert.equal(scored[0]?.priceScore.score, 10);
  assert.equal(scored[0]?.priceScore.sampleSize, 3);
  assert.equal(scored[3]?.priceScore.score, null);
});
