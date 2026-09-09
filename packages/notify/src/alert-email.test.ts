import assert from "node:assert/strict";
import { test } from "node:test";
import { alertEmailIntro, alertEmailSubject, alertEmailTitle } from "./alert-copy.ts";
import { escapeHtml } from "./html.ts";

test("email titles follow the watch frequency", () => {
  assert.equal(alertEmailTitle("on_change"), "Potential new deal");
  assert.equal(alertEmailTitle("daily"), "Daily report");
  assert.equal(alertEmailTitle("weekly"), "Weekly report");
});

test("subject includes the frequency title and watch label", () => {
  assert.equal(
    alertEmailSubject({
      frequency: "on_change",
      watchLabel: "PSA 10 Base Set Charizard",
      listingCount: 1,
    }),
    "Potential new deal: PSA 10 Base Set Charizard",
  );
  assert.equal(
    alertEmailSubject({
      frequency: "on_change",
      watchLabel: "PSA 10 Base Set Charizard",
      listingCount: 2,
    }),
    "Potential new deal: 2 new matches for PSA 10 Base Set Charizard",
  );
  assert.equal(
    alertEmailSubject({
      frequency: "daily",
      watchLabel: "PSA 10 Base Set Charizard",
      listingCount: 3,
    }),
    "Daily report: PSA 10 Base Set Charizard",
  );
  assert.equal(
    alertEmailSubject({
      frequency: "weekly",
      watchLabel: "PSA 10 Base Set Charizard",
      listingCount: 3,
    }),
    "Weekly report: PSA 10 Base Set Charizard",
  );
});

test("intro copy changes with frequency and count", () => {
  assert.match(
    alertEmailIntro({ frequency: "on_change", listingCount: 1 }),
    /A new listing matches/,
  );
  assert.match(
    alertEmailIntro({ frequency: "daily", listingCount: 3 }),
    /Today’s 3 matches/,
  );
  assert.match(
    alertEmailIntro({ frequency: "weekly", listingCount: 1 }),
    /This week’s match/,
  );
});

test("escapes HTML in user-facing strings", () => {
  assert.equal(escapeHtml(`<script>alert("x")</script>`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
});
