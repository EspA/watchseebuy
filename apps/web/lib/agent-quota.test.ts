import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANONYMOUS_AGENT_SEARCH_LIMIT,
  anonymousAgentSearchAllowed,
  readAgentSearchCount,
  signAgentSearchCount,
} from "./agent-quota.ts";

const secret = "test-secret";

test("an anonymous visitor can run 10 AI searches", () => {
  assert.equal(ANONYMOUS_AGENT_SEARCH_LIMIT, 10);
  assert.equal(anonymousAgentSearchAllowed(0), true);
  assert.equal(anonymousAgentSearchAllowed(9), true);
  assert.equal(anonymousAgentSearchAllowed(10), false);
});

test("the search count cookie rejects a forged value", () => {
  assert.equal(readAgentSearchCount(signAgentSearchCount(9, secret), secret), 9);
  assert.equal(readAgentSearchCount("0.forged", secret), 0);
  assert.equal(
    readAgentSearchCount(signAgentSearchCount(4, "other-secret"), secret),
    0,
  );
  assert.equal(readAgentSearchCount(undefined, secret), 0);
});
