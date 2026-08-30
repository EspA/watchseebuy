import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describeSellerFeedback,
  listingMatchesConfidence,
  parseMinConfidence,
  sellerConfidence,
  sellerConfidenceTone,
} from "./seller-confidence.ts";

test("missing or invalid feedback scores 0", () => {
  assert.equal(sellerConfidence({}), 0);
  assert.equal(sellerConfidence({ sellerFeedbackScore: 200 }), 0);
  assert.equal(sellerConfidence({ sellerFeedbackPercentage: 100 }), 0);
  assert.equal(
    sellerConfidence({ sellerFeedbackScore: 0, sellerFeedbackPercentage: 100 }),
    0,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: Number.NaN,
      sellerFeedbackPercentage: 99.8,
    }),
    0,
  );
});

test("quality and volume combine into a 0–10 score", () => {
  assert.equal(
    sellerConfidence({ sellerFeedbackScore: 5, sellerFeedbackPercentage: 100 }),
    3,
  );
  assert.equal(
    sellerConfidence({ sellerFeedbackScore: 25, sellerFeedbackPercentage: 100 }),
    5,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 100,
      sellerFeedbackPercentage: 99.8,
    }),
    7,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 500,
      sellerFeedbackPercentage: 99.5,
    }),
    9,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 2000,
      sellerFeedbackPercentage: 99.8,
    }),
    10,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 10_000,
      sellerFeedbackPercentage: 98,
    }),
    7,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 10_000,
      sellerFeedbackPercentage: 96,
    }),
    5,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 10_000,
      sellerFeedbackPercentage: 92,
    }),
    1,
  );
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 10_000,
      sellerFeedbackPercentage: 90,
    }),
    0,
  );
});

test("volume past 500 does not raise a weaker percentage", () => {
  assert.equal(
    sellerConfidence({
      sellerFeedbackScore: 500,
      sellerFeedbackPercentage: 98,
    }),
    sellerConfidence({
      sellerFeedbackScore: 20_000,
      sellerFeedbackPercentage: 98,
    }),
  );
});

test("confidence filter and tone", () => {
  assert.equal(parseMinConfidence(""), undefined);
  assert.equal(parseMinConfidence("0"), undefined);
  assert.equal(parseMinConfidence("7"), 7);
  assert.equal(parseMinConfidence("11"), undefined);
  assert.equal(listingMatchesConfidence({}, undefined), true);
  assert.equal(
    listingMatchesConfidence(
      { sellerFeedbackScore: 100, sellerFeedbackPercentage: 99.8 },
      7,
    ),
    true,
  );
  assert.equal(
    listingMatchesConfidence(
      { sellerFeedbackScore: 25, sellerFeedbackPercentage: 100 },
      7,
    ),
    false,
  );
  assert.equal(sellerConfidenceTone(8), "high");
  assert.equal(sellerConfidenceTone(5), "mid");
  assert.equal(sellerConfidenceTone(3), "low");
  assert.equal(
    describeSellerFeedback({
      sellerFeedbackScore: 1240,
      sellerFeedbackPercentage: 99.5,
    }),
    "99.5% · 1,240 feedback",
  );
});
