import assert from "node:assert/strict";
import { test } from "node:test";
import { interpretAgentTurn } from "./agent-search.ts";
import { parseSearchIntent } from "./watch-criteria.ts";

test("out of scope drops the model reply and does not search", () => {
  const turn = interpretAgentTurn({
    action: "out_of_scope",
    reply: "Here is a poem about the weather.",
    query: "kenner luke",
    maxDollars: 40,
  });
  assert.deepEqual(turn, { action: "out_of_scope" });
});

test("an unknown action is out of scope", () => {
  const turn = interpretAgentTurn({
    action: "write_email",
    query: "hot wheels",
  });
  assert.equal(turn.action, "out_of_scope");
});

test("a search maps price, condition, and packaging onto the search url", () => {
  const turn = interpretAgentTurn(
    {
      action: "search",
      reply: "Carded Kenner Luke, under $40 to your door.",
      query: "kenner luke skywalker",
      maxDollars: 40,
      condition: "1000",
      listing: "bin",
      figurePackaging: "carded",
      located: "country:US",
    },
    { ebaySite: "EBAY_US" },
  );
  assert.equal(turn.action, "search");
  if (turn.action !== "search") return;
  assert.equal(turn.criteria.query, "kenner luke skywalker");
  assert.equal(turn.criteria.maxLandedCents, 4000);
  assert.equal(turn.criteria.condition, "1000");
  assert.equal(turn.criteria.listingType, "bin");
  assert.equal(turn.criteria.figurePackaging, "carded");
  assert.equal(turn.params.get("q"), "kenner luke skywalker");
  assert.equal(turn.params.get("max"), "40");
  assert.equal(turn.params.get("condition"), "1000");
  assert.equal(turn.params.get("listing"), "bin");
  assert.equal(turn.params.get("figurePackaging"), "carded");
  assert.equal(turn.params.get("located"), "country:US");
  assert.equal(turn.params.get("mode"), null);
});

test("unknown filter ids are dropped", () => {
  const turn = interpretAgentTurn({
    action: "search",
    query: "hot wheels bone shaker",
    condition: "mint",
    listing: "sniper",
    figurePackaging: "blister",
    maxDollars: 25,
  });
  assert.equal(turn.action, "search");
  if (turn.action !== "search") return;
  assert.equal(turn.criteria.condition, "any");
  assert.equal(turn.criteria.listingType, "all");
  assert.equal(turn.criteria.figurePackaging, undefined);
  assert.equal(turn.criteria.maxLandedCents, 2500);
  assert.equal(turn.params.get("condition"), null);
  assert.equal(turn.params.get("max"), "25");
});

test("a search with no piece becomes a clarify", () => {
  const turn = interpretAgentTurn({
    action: "search",
    reply: "Which figure?",
    query: "   ",
    maxDollars: 40,
  });
  assert.deepEqual(turn, {
    action: "clarify",
    reply: "Which figure?",
    fresh: false,
  });
});

test("clarify leaves the current search alone", () => {
  const current = parseSearchIntent("kenner luke under $40");
  const turn = interpretAgentTurn(
    {
      action: "clarify",
      reply: "Carded or loose?",
      query: "hot wheels",
    },
    { current },
  );
  assert.deepEqual(turn, {
    action: "clarify",
    reply: "Carded or loose?",
    fresh: false,
  });
});

test("a follow-up keeps criteria the model did not mention", () => {
  const current = parseSearchIntent("kenner luke under $80");
  current.figurePackaging = "carded";
  const turn = interpretAgentTurn(
    {
      action: "search",
      reply: "New only.",
      condition: "1000",
    },
    { current },
  );
  assert.equal(turn.action, "search");
  if (turn.action !== "search") return;
  assert.equal(turn.criteria.query, "kenner luke");
  assert.equal(turn.criteria.maxLandedCents, 8000);
  assert.equal(turn.criteria.condition, "1000");
  assert.equal(turn.criteria.figurePackaging, "carded");
  assert.equal(turn.params.get("q"), "kenner luke");
  assert.equal(turn.params.get("max"), "80");
  assert.equal(turn.params.get("figurePackaging"), "carded");
});

test("null query clears the piece and asks instead of searching", () => {
  const current = parseSearchIntent("kenner luke");
  const turn = interpretAgentTurn(
    { action: "search", reply: "What should I look for?", query: null },
    { current },
  );
  assert.deepEqual(turn, {
    action: "clarify",
    reply: "What should I look for?",
    fresh: false,
  });
});

test("null clears a price cap", () => {
  const current = parseSearchIntent("lego star wars under $80");
  const turn = interpretAgentTurn(
    { action: "search", reply: "Any price.", maxDollars: null },
    { current },
  );
  assert.equal(turn.action, "search");
  if (turn.action !== "search") return;
  assert.equal(turn.criteria.maxLandedCents, undefined);
  assert.equal(turn.params.get("max"), null);
});

test("a phrase in the query still sets the price cap", () => {
  const turn = interpretAgentTurn({
    action: "search",
    query: "factory sealed lego ucs under $200",
    brickStatus: "factory-sealed",
  });
  assert.equal(turn.action, "search");
  if (turn.action !== "search") return;
  assert.equal(turn.criteria.maxLandedCents, 20000);
  assert.equal(turn.criteria.brickStatus, "factory-sealed");
  assert.equal(turn.params.get("max"), "200");
  assert.equal(turn.params.get("brickStatus"), "factory-sealed");
});

test("a different piece drops the current search", () => {
  const current = parseSearchIntent("lego 4502 under $500");
  current.brickStatus = "factory-sealed";
  current.excludeKeywords = ["mosaics", "75208"];
  const turn = interpretAgentTurn(
    {
      action: "search",
      fresh: true,
      reply: "I'll look for a Hot Wheels Bone Shaker.",
      query: "hot wheels bone shaker",
    },
    { current, ebaySite: "EBAY_US" },
  );
  assert.equal(turn.action, "search");
  if (turn.action !== "search") return;
  assert.equal(turn.fresh, true);
  assert.equal(turn.criteria.query, "hot wheels bone shaker");
  assert.equal(turn.criteria.ebaySite, "EBAY_US");
  assert.equal(turn.criteria.maxLandedCents, undefined);
  assert.equal(turn.criteria.brickStatus, undefined);
  assert.equal(turn.criteria.excludeKeywords.includes("mosaics"), false);
  assert.equal(turn.criteria.excludeKeywords.includes("75208"), false);
  assert.equal(turn.params.get("q"), "hot wheels bone shaker");
  assert.equal(turn.params.get("max"), null);
  assert.equal(turn.params.get("brickStatus"), null);
});

test("fresh false keeps criteria the model did not mention", () => {
  const current = parseSearchIntent("kenner luke under $80");
  current.figurePackaging = "carded";
  const turn = interpretAgentTurn(
    {
      action: "search",
      fresh: false,
      reply: "New only.",
      condition: "1000",
    },
    { current },
  );
  assert.equal(turn.action, "search");
  if (turn.action !== "search") return;
  assert.equal(turn.fresh, false);
  assert.equal(turn.criteria.query, "kenner luke");
  assert.equal(turn.criteria.maxLandedCents, 8000);
  assert.equal(turn.criteria.figurePackaging, "carded");
});

test("a new search with no piece asks instead of keeping the old one", () => {
  const current = parseSearchIntent("lego 4502 under $500");
  const turn = interpretAgentTurn(
    {
      action: "search",
      fresh: true,
      reply: "Which piece?",
      query: "",
    },
    { current },
  );
  assert.deepEqual(turn, {
    action: "clarify",
    reply: "Which piece?",
    fresh: true,
  });
});

test("garbage payloads are out of scope", () => {
  assert.equal(interpretAgentTurn(null).action, "out_of_scope");
  assert.equal(interpretAgentTurn(["search"]).action, "out_of_scope");
});
