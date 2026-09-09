import assert from "node:assert/strict";
import { test } from "node:test";
import { isWatchDigestDue } from "./alert-schedule.ts";

test("daily digest is due at the next 8pm after create or last send", () => {
  const createdAt = new Date("2026-09-05T15:00:00.000Z");
  assert.equal(
    isWatchDigestDue({
      frequency: "daily",
      timeZone: "America/New_York",
      createdAt,
      now: new Date("2026-09-05T19:00:00.000Z"),
    }),
    false,
  );
  assert.equal(
    isWatchDigestDue({
      frequency: "daily",
      timeZone: "America/New_York",
      createdAt,
      now: new Date("2026-09-06T00:01:00.000Z"),
    }),
    true,
  );
  assert.equal(
    isWatchDigestDue({
      frequency: "daily",
      timeZone: "America/New_York",
      createdAt,
      lastSentAt: new Date("2026-09-06T00:02:00.000Z"),
      now: new Date("2026-09-06T00:30:00.000Z"),
    }),
    false,
  );
});

test("weekly digest waits for Sunday 8pm local", () => {
  const createdAt = new Date("2026-09-05T15:00:00.000Z");
  assert.equal(
    isWatchDigestDue({
      frequency: "weekly",
      timeZone: "America/New_York",
      createdAt,
      now: new Date("2026-09-06T12:00:00.000Z"),
    }),
    false,
  );
  assert.equal(
    isWatchDigestDue({
      frequency: "weekly",
      timeZone: "America/New_York",
      createdAt,
      now: new Date("2026-09-07T00:01:00.000Z"),
    }),
    true,
  );
});

test("on-change watches are not digest-scheduled", () => {
  assert.equal(
    isWatchDigestDue({
      frequency: "on_change",
      timeZone: "America/New_York",
      createdAt: new Date("2026-09-05T15:00:00.000Z"),
      now: new Date("2026-09-07T00:01:00.000Z"),
    }),
    false,
  );
});
