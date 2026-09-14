import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ebayErrorFromBody,
  ebayErrorFromText,
  ebayErrorFromThrown,
  truncateEbayError,
} from "./browse-error.ts";

test("prefers eBay longMessage from JSON errors", () => {
  assert.equal(
    ebayErrorFromBody(
      {
        errors: [
          { message: "short", longMessage: "The token is invalid." },
        ],
      },
      401,
    ),
    "The token is invalid.",
  );
});

test("falls back to OAuth error_description", () => {
  assert.equal(
    ebayErrorFromBody(
      { error: "invalid_client", error_description: "client auth failed" },
      401,
    ),
    "client auth failed",
  );
});

test("falls back to HTTP status when the body is empty", () => {
  assert.equal(ebayErrorFromBody({}, 503), "HTTP 503");
  assert.equal(ebayErrorFromText("  ", 429), "HTTP 429");
});

test("parses JSON text bodies and truncates raw text", () => {
  assert.equal(
    ebayErrorFromText(
      JSON.stringify({ errors: [{ message: "Too many requests" }] }),
      429,
    ),
    "Too many requests",
  );
  assert.equal(ebayErrorFromText("plain boom", 500), "plain boom");
});

test("truncates long errors and reads thrown Error messages", () => {
  const long = "x".repeat(600);
  assert.equal(truncateEbayError(long).length, 500);
  assert.equal(ebayErrorFromThrown(new Error("socket hang up")), "socket hang up");
  assert.equal(ebayErrorFromThrown(undefined, 0), "request failed");
});
