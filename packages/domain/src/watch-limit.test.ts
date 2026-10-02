import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FREE_WATCH_LIMIT,
  atWatchLimit,
  watchLimitForPlan,
} from "./watch-limit.ts";

test("free accounts cap at ten watches", () => {
  assert.equal(watchLimitForPlan("free"), FREE_WATCH_LIMIT);
  assert.equal(FREE_WATCH_LIMIT, 10);
  assert.equal(atWatchLimit(9), false);
  assert.equal(atWatchLimit(10), true);
  assert.equal(atWatchLimit(11), true);
});

test("paid plans raise the watch cap", () => {
  assert.equal(watchLimitForPlan("premium"), 100);
  assert.equal(watchLimitForPlan("premium_plus"), 300);
  assert.equal(atWatchLimit(50, "premium"), false);
  assert.equal(atWatchLimit(100, "premium"), true);
  assert.equal(atWatchLimit(100, "premium_plus"), false);
});
