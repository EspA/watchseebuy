import assert from "node:assert/strict";
import { test } from "node:test";
import { canResetPassword } from "./user-auth.ts";

test("email and magic-link accounts can reset a password", () => {
  assert.equal(canResetPassword([]), true);
  assert.equal(canResetPassword(["credential"]), true);
});

test("SSO-only accounts cannot reset a password", () => {
  assert.equal(canResetPassword(["google"]), false);
  assert.equal(canResetPassword(["apple", "facebook"]), false);
});

test("linked email plus SSO can still reset a password", () => {
  assert.equal(canResetPassword(["google", "credential"]), true);
});
