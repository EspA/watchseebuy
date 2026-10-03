import assert from "node:assert/strict";
import { test } from "node:test";
import { agentScoreFloorsFromText, agentSortFromText } from "./agent-sort.ts";

test("cheap and expensive choose a price order", () => {
  assert.equal(agentSortFromText("cheap sealed lego castle"), "price");
  assert.equal(agentSortFromText("the most expensive bone shaker"), "price-desc");
  assert.equal(agentSortFromText("not expensive vegeta"), "price");
  assert.equal(agentSortFromText("pas cher labubu"), "price");
  assert.equal(agentSortFromText("teurer Hot Wheels"), "price-desc");
});

test("a price cap does not choose a sort", () => {
  assert.equal(agentSortFromText("pikachu psa 10 under 40"), undefined);
  assert.equal(agentSortFromText("kenner luke skywalker"), undefined);
});

test("best sellers and best deals choose the score sorts", () => {
  assert.equal(agentSortFromText("I want the best sellers"), "seller-score");
  assert.equal(agentSortFromText("top rated sellers"), "seller-score");
  assert.equal(agentSortFromText("worst sellers"), "seller-score-asc");
  assert.equal(agentSortFromText("show me the best deals"), "price-score");
  assert.equal(agentSortFromText("best value lego"), "price-score");
  assert.equal(agentSortFromText("meilleurs vendeurs"), "seller-score");
});

test("price score and seller score outrank cheap or expensive", () => {
  assert.equal(agentSortFromText("high price score charizard"), "price-score");
  assert.equal(agentSortFromText("lowest price score"), "price-score-asc");
  assert.equal(agentSortFromText("best seller score"), "seller-score");
  assert.equal(agentSortFromText("low seller score lots"), "seller-score-asc");
  assert.equal(
    agentSortFromText("cheap, but sort by seller score"),
    "seller-score",
  );
});

test("best sellers does not set a price or seller floor", () => {
  assert.deepEqual(agentScoreFloorsFromText("lego pirates from the best sellers"), {
    clearPrice: false,
    clearSeller: false,
  });
  assert.deepEqual(agentScoreFloorsFromText("show the best deals"), {
    clearPrice: false,
    clearSeller: false,
  });
  assert.deepEqual(agentScoreFloorsFromText("price score 8 and the best sellers"), {
    price: 8,
    clearPrice: false,
    clearSeller: false,
  });
  assert.deepEqual(agentScoreFloorsFromText("seller score of at least 9"), {
    seller: 9,
    clearPrice: false,
    clearSeller: false,
  });
  assert.deepEqual(agentScoreFloorsFromText("at least 8 price score"), {
    price: 8,
    clearPrice: false,
    clearSeller: false,
  });
  assert.deepEqual(agentScoreFloorsFromText("clear the price score"), {
    clearPrice: true,
    clearSeller: false,
  });
});

test("the later score wins when both are named", () => {
  assert.equal(
    agentSortFromText("price score, actually seller score"),
    "seller-score",
  );
  assert.equal(
    agentSortFromText("seller score then price score"),
    "price-score",
  );
});
