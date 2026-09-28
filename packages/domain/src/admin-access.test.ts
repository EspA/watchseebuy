import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_ADMIN_EMAIL, isAllowedAdminEmail } from "./admin-access.ts";

test("allowlists the operator email case-insensitively", () => {
  assert.equal(isAllowedAdminEmail("contact@watchseebuy.com"), true);
  assert.equal(isAllowedAdminEmail("  Contact@WatchSeeBuy.com  "), true);
  assert.equal(isAllowedAdminEmail("other@example.com"), false);
  assert.equal(
    isAllowedAdminEmail("ops@example.com", "ops@example.com"),
    true,
  );
  assert.equal(
    isAllowedAdminEmail(
      "contact@waitseebuy.com",
      "contact@waitseebuy.com,contact@watchseebuy.com",
    ),
    true,
  );
  assert.equal(DEFAULT_ADMIN_EMAIL, "contact@watchseebuy.com");
});
