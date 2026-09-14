import assert from "node:assert/strict";
import test from "node:test";
import {
  SEARCH_PAGE_SIZE,
  parseSearchPage,
  searchOffset,
  searchPageCount,
} from "./search-page.ts";

test("search page parses and clamps", () => {
  assert.equal(parseSearchPage(undefined), 1);
  assert.equal(parseSearchPage("2"), 2);
  assert.equal(parseSearchPage("0"), 1);
  assert.equal(parseSearchPage("nope"), 1);
  assert.equal(searchOffset(1), 0);
  assert.equal(searchOffset(2), SEARCH_PAGE_SIZE);
});

test("search page count uses eBay total or a fetched full page", () => {
  assert.equal(searchPageCount(24, 24, 1), 1);
  assert.equal(searchPageCount(25, 24, 1), 2);
  assert.equal(searchPageCount(48, 24, 1), 2);
  assert.equal(searchPageCount(undefined, 24, 1), 2);
  assert.equal(searchPageCount(undefined, 8, 2), 2);
});
