import assert from "node:assert/strict";
import { test } from "node:test";
import { parseShipToPostal } from "./ship-to-postal.ts";

test("accepts US ZIP and ZIP+4", () => {
  assert.equal(parseShipToPostal("10001"), "10001");
  assert.equal(parseShipToPostal(" 10001-1234 "), "10001-1234");
});

test("accepts other short postal codes", () => {
  assert.equal(parseShipToPostal("k1a 0b1"), "K1A 0B1");
  assert.equal(parseShipToPostal("SW1A 1AA"), "SW1A 1AA");
});

test("rejects empty or invalid values", () => {
  assert.equal(parseShipToPostal(""), undefined);
  assert.equal(parseShipToPostal("   "), undefined);
  assert.equal(parseShipToPostal(undefined), undefined);
  assert.equal(parseShipToPostal("not a zip!!!"), undefined);
  assert.equal(parseShipToPostal("1234567890123"), undefined);
});
