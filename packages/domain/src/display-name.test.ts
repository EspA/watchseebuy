import assert from "node:assert/strict";
import { test } from "node:test";
import { splitDisplayName } from "./display-name.ts";

test("splits a first and last name", () => {
  assert.deepEqual(splitDisplayName("Ada Lovelace"), {
    firstName: "Ada",
    lastName: "Lovelace",
  });
});

test("keeps extra words on the last name", () => {
  assert.deepEqual(splitDisplayName("Jean Luc Picard"), {
    firstName: "Jean",
    lastName: "Luc Picard",
  });
});

test("handles a single token and blanks", () => {
  assert.deepEqual(splitDisplayName("Cher"), {
    firstName: "Cher",
    lastName: null,
  });
  assert.deepEqual(splitDisplayName("   "), {
    firstName: null,
    lastName: null,
  });
});
