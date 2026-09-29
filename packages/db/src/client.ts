import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema, Sql>>;

const globalForDb = globalThis as typeof globalThis & {
  watchseebuySql?: Sql;
  watchseebuyDb?: Db;
};

function poolMax() {
  const raw = Number(process.env.DATABASE_POOL_MAX);
  if (Number.isFinite(raw) && raw > 0) return Math.min(raw, 10);
  return 3;
}

function cloudSqlSocket(url: string): string | undefined {
  const instance = process.env.CLOUD_SQL_CONNECTION_NAME?.trim();
  if (instance) return `/cloudsql/${instance}`;
  try {
    const host = new URL(url).searchParams.get("host");
    if (host?.startsWith("/cloudsql/")) return host;
  } catch {
    return undefined;
  }
  return undefined;
}

function getClient(url: string): Sql {
  if (!globalForDb.watchseebuySql) {
    const options = {
      max: poolMax(),
      idle_timeout: 20,
      max_lifetime: 60 * 30,
      connect_timeout: 5,
    };
    const socket = cloudSqlSocket(url);
    globalForDb.watchseebuySql = socket
      ? postgres({
          ...options,
          host: socket,
          database: new URL(url).pathname.replace(/^\//, "") || "watchseebuy",
          username: decodeURIComponent(new URL(url).username),
          password: decodeURIComponent(new URL(url).password),
        })
      : postgres(url, options);
  }
  return globalForDb.watchseebuySql;
}

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(getClient(url), { schema });
}

export type Database = ReturnType<typeof createDb>;

export function getDb(url = process.env.DATABASE_URL) {
  globalForDb.watchseebuyDb ??= createDb(url);
  return globalForDb.watchseebuyDb;
}
