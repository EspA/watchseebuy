import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PAID_PRICE_CENTS,
  PLAN_ENTITLEMENTS,
  cancelledExpiresAt,
  coveragePollIntervalMs,
  effectiveBillingPlan,
  formatUsdFromCents,
  parsePaidPlanKey,
  paypalAmount,
} from "./billing.ts";

test("annual billing charges ten months", () => {
  assert.equal(PAID_PRICE_CENTS.premium.monthly, 499);
  assert.equal(PAID_PRICE_CENTS.premium.annual, 4990);
  assert.equal(PAID_PRICE_CENTS.premium_plus.monthly, 999);
  assert.equal(PAID_PRICE_CENTS.premium_plus.annual, 9990);
  assert.equal(formatUsdFromCents(499), "$4.99");
  assert.equal(formatUsdFromCents(4990), "$49.90");
  assert.equal(formatUsdFromCents(9990), "$99.90");
  assert.equal(paypalAmount(4990), "49.90");
});

test("a paid plan stays active until it expires", () => {
  const future = new Date("2027-01-01T00:00:00.000Z");
  const past = new Date("2020-01-01T00:00:00.000Z");
  const now = new Date("2026-06-01T00:00:00.000Z");
  assert.equal(effectiveBillingPlan(null, now), "free");
  assert.equal(
    effectiveBillingPlan(
      {
        plan: "premium",
        status: "active",
        expiresAt: future,
        billingInterval: "monthly",
      },
      now,
    ),
    "premium",
  );
  assert.equal(
    effectiveBillingPlan(
      {
        plan: "premium_plus",
        status: "cancelled",
        expiresAt: future,
        billingInterval: "annual",
      },
      now,
    ),
    "premium_plus",
  );
  assert.equal(
    effectiveBillingPlan(
      {
        plan: "premium",
        status: "active",
        expiresAt: past,
        billingInterval: "monthly",
      },
      now,
    ),
    "free",
  );
});

test("cancelling keeps the later paid period", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const stored = new Date("2026-07-01T00:00:00.000Z");
  const sooner = new Date("2026-06-15T00:00:00.000Z");
  const later = new Date("2026-08-01T00:00:00.000Z");
  assert.equal(cancelledExpiresAt(stored, null, now).toISOString(), stored.toISOString());
  assert.equal(cancelledExpiresAt(stored, sooner, now).toISOString(), stored.toISOString());
  assert.equal(cancelledExpiresAt(stored, later, now).toISOString(), later.toISOString());
  assert.equal(cancelledExpiresAt(null, null, now).toISOString(), now.toISOString());
});

test("on-change polls follow the fastest plan on a coverage query", () => {
  const hour = PLAN_ENTITLEMENTS.free.onChangeIntervalMs;
  assert.equal(
    coveragePollIntervalMs(
      [{ alertFrequency: "on_change", plan: "free" }],
      hour,
    ),
    hour,
  );
  assert.equal(
    coveragePollIntervalMs(
      [
        { alertFrequency: "on_change", plan: "free" },
        { alertFrequency: "daily", plan: "premium_plus" },
      ],
      hour,
    ),
    hour,
  );
  assert.equal(
    coveragePollIntervalMs(
      [
        { alertFrequency: "on_change", plan: "free" },
        { alertFrequency: "on_change", plan: "premium_plus" },
      ],
      hour,
    ),
    PLAN_ENTITLEMENTS.premium_plus.onChangeIntervalMs,
  );
});

test("paypal plan keys round-trip", () => {
  assert.deepEqual(parsePaidPlanKey("premium_annual"), {
    plan: "premium",
    interval: "annual",
  });
  assert.deepEqual(parsePaidPlanKey("premium_plus_monthly"), {
    plan: "premium_plus",
    interval: "monthly",
  });
  assert.equal(parsePaidPlanKey("free_monthly"), null);
});
