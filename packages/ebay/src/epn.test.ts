import assert from "node:assert/strict";
import { test } from "node:test";
import {
  epnConfigFromEnv,
  epnEnabledFromEnv,
  epnItemUrl,
  plainItemUrl,
} from "./epn.ts";

test("plain item URL stays on the marketplace host", () => {
  assert.equal(
    plainItemUrl("227513009768", "ebay.com"),
    "https://www.ebay.com/itm/227513009768",
  );
});

test("no campaign id means no affiliate URL", () => {
  assert.equal(epnItemUrl({ itemId: "227513009768" }), null);
});

test("custom item links match the EPN Link Generator shape", () => {
  const href = epnItemUrl({
    itemId: "227513009768",
    campaignId: "5339205421",
    publisherId: "7704103",
    toolId: "10001",
    customId: "wsbtest",
  });
  assert.equal(
    href,
    "https://www.ebay.com/itm/227513009768?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339205421&customid=wsbtest&toolid=10001&mkevt=1",
  );
});

test("UK listings use the UK rotation id", () => {
  const href = epnItemUrl({
    itemId: "227513009768",
    campaignId: "5339205421",
    site: "ebay.co.uk",
    customId: "wsbtest",
  });
  const url = new URL(href!);
  assert.equal(url.origin, "https://www.ebay.co.uk");
  assert.equal(url.searchParams.get("mkrid"), "710-53481-19255-0");
  assert.equal(url.searchParams.get("siteid"), "3");
  assert.equal(url.searchParams.get("campid"), "5339205421");
});

test("search and alert campaigns stay separate", () => {
  const env = {
    EPN_PUBLISHER_ID: "7704103",
    EPN_CAMPAIGN_ID_SEARCH: "5339205421",
    EPN_CAMPAIGN_ID_ALERT: "5339205422",
    EPN_TOOL_ID: "10001",
  };
  assert.deepEqual(epnConfigFromEnv("search", env), {
    campaignId: "5339205421",
    publisherId: "7704103",
    toolId: "10001",
  });
  assert.deepEqual(epnConfigFromEnv("alert", env), {
    campaignId: "5339205422",
    publisherId: "7704103",
    toolId: "10001",
  });
  assert.equal(epnEnabledFromEnv(env), true);
  assert.equal(epnEnabledFromEnv({}), false);
});
