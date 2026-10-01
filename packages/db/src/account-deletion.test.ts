import assert from "node:assert/strict";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { deletedUsernamesLookup } from "./account-deletion.ts";
import * as schema from "./schema.ts";

test("deleted seller lookup uses an IN list, not a row ANY()", () => {
  const client = postgres("postgres://watchseebuy:watchseebuy@127.0.0.1:1/watchseebuy", {
    max: 1,
    connect_timeout: 1,
  });
  const db = drizzle(client, { schema });
  const text = deletedUsernamesLookup(db, ["SellerA", "sellerb"]).toSQL().sql;
  assert.match(text, / in \(/i);
  assert.doesNotMatch(text, /ANY\(\(/);
  assert.match(text, /\$1/);
  assert.match(text, /\$2/);
  void client.end({ timeout: 0 });
});
