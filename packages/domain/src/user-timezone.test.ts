import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_USER_TIMEZONE,
  nextWatchDigestAt,
  parseUserTimeZone,
  resolveUserTimeZone,
  zonedCalendarDays,
  zonedDateKey,
  zonedDayBounds,
  zonedWindowStart,
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

test("Eastern calendar days use midnight in America/New_York", () => {
  const edt = zonedDayBounds("2026-09-15", "America/New_York");
  const est = zonedDayBounds("2026-01-15", "America/New_York");
  assert.ok(edt);
  assert.ok(est);
  assert.equal(edt.start.toISOString(), "2026-09-15T04:00:00.000Z");
  assert.equal(edt.end.toISOString(), "2026-09-16T04:00:00.000Z");
  assert.equal(est.start.toISOString(), "2026-01-15T05:00:00.000Z");
  assert.equal(est.end.toISOString(), "2026-01-16T05:00:00.000Z");
});

test("late-night UTC still belongs to the previous Eastern day", () => {
  assert.equal(
    zonedDateKey(new Date("2026-09-15T03:30:00.000Z"), "America/New_York"),
    "2026-09-14",
  );
});

test("window start is midnight of the first Eastern day", () => {
  const now = new Date("2026-09-15T18:00:00.000Z");
  assert.deepEqual(zonedCalendarDays(2, now, "America/New_York"), [
    "2026-09-14",
    "2026-09-15",
  ]);
  assert.equal(
    zonedWindowStart(2, now, "America/New_York").toISOString(),
    "2026-09-14T04:00:00.000Z",
  );
});
