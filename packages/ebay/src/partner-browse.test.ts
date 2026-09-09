import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authorizePartnerBrowse,
  browseApiNameFromPath,
  ebayBrowseError,
  partnerBrowseOriginFromEnv,
  partnerBrowsePath,
  partnerBrowseStatusFromEnv,
  partnerBrowseTokensFromEnv,
  pickUpstreamBrowseHeaders,
  rewriteBrowseHrefs,
} from "./partner-browse.ts";

const TOKEN = "waitseebuy-partner-browse-token-32chars";

test("ignores short partner tokens", () => {
  assert.deepEqual(partnerBrowseTokensFromEnv({ PARTNER_BROWSE_TOKEN: "short" }), []);
});

test("accepts comma-separated tokens for rotation", () => {
  const next = "waitseebuy-partner-browse-token-rotated";
  assert.deepEqual(
    partnerBrowseTokensFromEnv({ PARTNER_BROWSE_TOKEN: `${TOKEN}, ${next}` }),
    [TOKEN, next],
  );
});

test("status is off until a long token is set", () => {
  assert.equal(partnerBrowseStatusFromEnv({}).configured, false);
  assert.equal(
    partnerBrowseStatusFromEnv({ PARTNER_BROWSE_TOKEN: TOKEN }).configured,
    true,
  );
});

test("authorize rejects missing configuration with 503", () => {
  const result = authorizePartnerBrowse("Bearer anything", {});
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 503);
});

test("authorize accepts a matching bearer token", () => {
  assert.deepEqual(
    authorizePartnerBrowse(`Bearer ${TOKEN}`, { PARTNER_BROWSE_TOKEN: TOKEN }),
    { ok: true },
  );
});

test("authorize rejects a wrong token with an eBay-shaped 401", () => {
  const result = authorizePartnerBrowse("Bearer not-the-token", {
    PARTNER_BROWSE_TOKEN: TOKEN,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 401);
  assert.equal(result.body.errors[0]?.errorId, 1001);
});

test("builds a Browse path and rejects traversal", () => {
  assert.equal(
    partnerBrowsePath(["item_summary", "search"]),
    "/buy/browse/v1/item_summary/search",
  );
  assert.equal(
    partnerBrowsePath(["item", "v1|257326501016|0"]),
    "/buy/browse/v1/item/v1%7C257326501016%7C0",
  );
  assert.equal(partnerBrowsePath(["item", "..", "secret"]), null);
  assert.equal(partnerBrowsePath([]), null);
});

test("maps Browse paths onto existing telemetry names", () => {
  assert.equal(
    browseApiNameFromPath("/buy/browse/v1/item_summary/search"),
    "browse_search",
  );
  assert.equal(
    browseApiNameFromPath("/buy/browse/v1/item/v1%7C1%7C0"),
    "get_item",
  );
});

test("rewrites Browse hrefs onto the public origin", () => {
  const body = JSON.stringify({
    href: "https://api.ebay.com/buy/browse/v1/item_summary/search?q=lego",
    next: "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?offset=200",
    itemSummaries: [
      {
        itemHref: "https://api.ebay.com/buy/browse/v1/item/v1|1|0",
        itemWebUrl: "https://www.ebay.com/itm/1",
      },
    ],
  });
  const rewritten = JSON.parse(
    rewriteBrowseHrefs(body, "https://waitseebuy.com/"),
  ) as {
    href: string;
    next: string;
    itemSummaries: Array<{ itemHref: string; itemWebUrl: string }>;
  };
  assert.equal(
    rewritten.href,
    "https://waitseebuy.com/buy/browse/v1/item_summary/search?q=lego",
  );
  assert.equal(
    rewritten.next,
    "https://waitseebuy.com/buy/browse/v1/item_summary/search?offset=200",
  );
  assert.equal(
    rewritten.itemSummaries[0]?.itemHref,
    "https://waitseebuy.com/buy/browse/v1/item/v1|1|0",
  );
  assert.equal(rewritten.itemSummaries[0]?.itemWebUrl, "https://www.ebay.com/itm/1");
});

test("public origin prefers APP_URL", () => {
  assert.equal(
    partnerBrowseOriginFromEnv({
      APP_URL: "https://waitseebuy.com/",
      BETTER_AUTH_URL: "http://localhost:3000",
    }),
    "https://waitseebuy.com",
  );
});

test("forwards Browse and rate-limit headers only", () => {
  const headers = pickUpstreamBrowseHeaders(
    new Headers({
      "Content-Type": "application/json;charset=UTF-8",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      "X-RateLimit-Remaining": "12",
      rlogid: "t6Lgjg0",
      "Set-Cookie": "drop=1",
    }),
  );
  assert.equal(headers.get("content-type"), "application/json;charset=UTF-8");
  assert.equal(headers.get("x-ebay-c-marketplace-id"), "EBAY_US");
  assert.equal(headers.get("x-ratelimit-remaining"), "12");
  assert.equal(headers.get("rlogid"), "t6Lgjg0");
  assert.equal(headers.get("set-cookie"), null);
});

test("error helper matches eBay Browse error envelope", () => {
  const body = ebayBrowseError(1001, "REQUEST", "Invalid access token", "Nope.");
  assert.equal(body.errors.length, 1);
  assert.equal(body.errors[0]?.domain, "API_BROWSE");
});
