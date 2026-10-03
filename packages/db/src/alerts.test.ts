import assert from "node:assert/strict";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { coverageDueForPollQuery } from "./alerts.ts";
import * as schema from "./schema.ts";

test("coverage poll interval is cast to bigint so it can multiply an interval", () => {
  const client = postgres("postgres://watchseebuy:watchseebuy@127.0.0.1:1/watchseebuy", {
    max: 1,
    connect_timeout: 1,
  });
  const db = drizzle(client, { schema });
  const { sql: text, params } = coverageDueForPollQuery(
    db,
    new Date("2026-10-03T14:07:00.000Z"),
    {
      defaultPollMs: 3_600_000,
      premiumPollMs: 900_000,
      premiumPlusPollMs: 300_000,
    },
  ).toSQL();

  assert.match(text, /least\(\$\d+::bigint, \$\d+::bigint\)/i);
  assert.match(text, /else \$\d+::bigint/i);
  assert.match(text, /\$\d+::timestamptz/i);
  assert.match(text, /\* interval '1 millisecond'/i);
  assert.ok(params.includes("2026-10-03T14:07:00.000Z"));
  assert.equal(params.some((param) => param instanceof Date), false);
  void client.end({ timeout: 0 });
});
