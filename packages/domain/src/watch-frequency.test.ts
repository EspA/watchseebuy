import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_WATCH_FREQUENCY,
  parseWatchFrequency,
} from "./watch-frequency.ts";

test("parses known watch frequencies", () => {
  assert.equal(parseWatchFrequency("on_change"), "on_change");
  assert.equal(parseWatchFrequency("daily"), "daily");
  assert.equal(parseWatchFrequency("weekly"), "weekly");
});

test("unknown frequency falls back to on change", () => {
  assert.equal(parseWatchFrequency(""), DEFAULT_WATCH_FREQUENCY);
  assert.equal(parseWatchFrequency("hourly"), DEFAULT_WATCH_FREQUENCY);
  assert.equal(parseWatchFrequency(undefined), DEFAULT_WATCH_FREQUENCY);
});
