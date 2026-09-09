import assert from "node:assert/strict";
import test from "node:test";
import {
  filterGroupForCategoryId,
  suggestFilterGroup,
} from "./filter-group.ts";

test("known eBay category ids map to filter groups", () => {
  assert.equal(filterGroupForCategoryId("2536"), "cards");
  assert.equal(filterGroupForCategoryId("183454"), "cards");
  assert.equal(filterGroupForCategoryId("246"), "figures");
  assert.equal(filterGroupForCategoryId("149372"), "figures");
  assert.equal(filterGroupForCategoryId("222"), "vehicles");
  assert.equal(filterGroupForCategoryId("183446"), "bricks");
  assert.equal(filterGroupForCategoryId("19006"), "bricks");
  assert.equal(filterGroupForCategoryId("999999"), undefined);
});

test("suggests the most returned mapped category group", () => {
  assert.equal(suggestFilterGroup([]), undefined);
  assert.equal(
    suggestFilterGroup([{ categoryIds: ["999"] }, { categoryIds: [] }]),
    undefined,
  );
  assert.equal(
    suggestFilterGroup([
      { categoryIds: ["19006"] },
      { categoryIds: ["183447"] },
      { categoryIds: ["183454"] },
    ]),
    "bricks",
  );
  assert.equal(
    suggestFilterGroup([
      { categoryIds: ["2536", "183454"] },
      { categoryIds: ["246"] },
    ]),
    "cards",
  );
  assert.equal(
    suggestFilterGroup([
      { categoryIds: ["246"] },
      { categoryIds: ["19006"] },
    ]),
    "figures",
  );
});
