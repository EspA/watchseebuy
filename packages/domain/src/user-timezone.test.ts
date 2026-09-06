import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_USER_TIMEZONE,
  nextWatchDigestAt,
  parseUserTimeZone,
  resolveUserTimeZone,
} from "./user-timezone.ts";

test("parses IANA time zones and rejects junk", () => {
  assert.equal(parseUserTimeZone("America/New_York"), "America/New_York");
  assert.equal(parseUserTimeZone(" Europe/Paris "), "Europe/Paris");
  assert.equal(parseUserTimeZone("not/a/zone"), undefined);
  assert.equal(parseUserTimeZone(""), undefined);
});

test("falls back to Eastern time", () => {
  assert.equal(resolveUserTimeZone(undefined), DEFAULT_USER_TIMEZONE);
  assert.equal(resolveUserTimeZone("nope"), DEFAULT_USER_TIMEZONE);
});

test("daily digest is the next 8pm in the user timezone", () => {
  const now = new Date("2026-09-05T15:00:00.000Z");
  const next = nextWatchDigestAt("daily", "America/New_York", now);
  assert.ok(next);
  assert.equal(next.toISOString(), "2026-09-06T00:00:00.000Z");
});

test("weekly digest is the next Sunday 8pm in the user timezone", () => {
  const saturday = new Date("2026-09-05T15:00:00.000Z");
  const next = nextWatchDigestAt("weekly", "America/New_York", saturday);
  assert.ok(next);
  assert.equal(next.toISOString(), "2026-09-07T00:00:00.000Z");
});

test("on-change watches have no digest time", () => {
  assert.equal(nextWatchDigestAt("on_change", "America/New_York"), null);
});
