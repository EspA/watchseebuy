import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema, Sql>>;

const globalForDb = globalThis as typeof globalThis & {
  waitseebuySql?: Sql;
  waitseebuyDb?: Db;
};

function poolMax() {
  const raw = Number(process.env.DATABASE_POOL_MAX);
  if (Number.isFinite(raw) && raw > 0) return Math.min(raw, 10);
  return 3;
}

function getClient(url: string): Sql {
  if (!globalForDb.waitseebuySql) {
    globalForDb.waitseebuySql = postgres(url, {
      max: poolMax(),
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    });
  }
  return globalForDb.waitseebuySql;
}

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(getClient(url), { schema });
}

export type Database = ReturnType<typeof createDb>;

export function getDb(url = process.env.DATABASE_URL) {
  globalForDb.waitseebuyDb ??= createDb(url);
  return globalForDb.waitseebuyDb;
}
