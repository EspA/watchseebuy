import { sql } from "drizzle-orm";
import type { Database } from "./client";

const PURGE_JOB = "db_purge";
const COUNTERS_JOB = "event_counters_seeded";
const MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;
const BATCH = 5_000;
const MAX_BATCHES = 20;

export const RETENTION = {
  ebayApiCallsDays: 60,
  emailSendsDays: 60,
  userEventsDays: 60,
  alertsDays: 90,
  matchesDays: 180,
  soldCompCacheDays: 7,
} as const;

export type PurgeDeleted = {
  ebayApiCalls: number;
  emailSends: number;
  userEvents: number;
  sessions: number;
  verifications: number;
  alerts: number;
  matches: number;
  listings: number;
  coverageQueries: number;
  soldCompCache: number;
};

export type DailyPurgeResult =
  | { ran: false }
  | ({ ran: true } & PurgeDeleted);

function daysAgo(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function startOfUtcDay(now: Date) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function iso(value: Date) {
  return value.toISOString();
}

function rowCount(result: unknown): number {
  if (Array.isArray(result)) return result.length;
  if (result && typeof result === "object" && "count" in result) {
    const count = Number((result as { count: unknown }).count);
    return Number.isFinite(count) ? count : 0;
  }
  return 0;
}

async function claimedOnce(db: Database, job: string, now: Date) {
  const result = await db.execute(sql`
    INSERT INTO maintenance_runs (job, last_ran_at)
    VALUES (${job}, ${iso(now)})
    ON CONFLICT (job) DO NOTHING
    RETURNING job
  `);
  return rowCount(result) > 0;
}

async function claimedJob(
  db: Database,
  job: string,
  now: Date,
  minIntervalMs: number,
) {
  const cutoff = new Date(now.getTime() - minIntervalMs);
  const result = await db.execute(sql`
    INSERT INTO maintenance_runs (job, last_ran_at)
    VALUES (${job}, ${iso(now)})
    ON CONFLICT (job) DO UPDATE
    SET last_ran_at = ${iso(now)}
    WHERE maintenance_runs.last_ran_at < ${iso(cutoff)}
    RETURNING job
  `);
  return rowCount(result) > 0;
}

async function releaseJob(db: Database, job: string, now: Date) {
  const retryAt = new Date(now.getTime() - MIN_INTERVAL_MS - 60_000);
  await db.execute(sql`
    UPDATE maintenance_runs
    SET last_ran_at = ${iso(retryAt)}
    WHERE job = ${job}
  `);
}

async function deleteBatches(
  db: Database,
  statement: (limit: number) => ReturnType<typeof sql>,
) {
  let deleted = 0;
  for (let i = 0; i < MAX_BATCHES; i += 1) {
    const n = rowCount(await db.execute(statement(BATCH)));
    deleted += n;
    if (n < BATCH) break;
  }
  return deleted;
}

async function seedEventCountersOnce(db: Database, now: Date) {
  const claimed = await claimedOnce(db, COUNTERS_JOB, now);
  if (!claimed) return;
  try {
    await db.execute(sql`
      UPDATE "user" AS u SET
        search_count = GREATEST(u.search_count, COALESCE((
          SELECT count(*)::int FROM user_events e
          WHERE e.user_id = u.id AND e.kind = 'search'
        ), 0)),
        buy_click_count = GREATEST(u.buy_click_count, COALESCE((
          SELECT count(*)::int FROM user_events e
          WHERE e.user_id = u.id AND e.kind = 'buy_click'
        ), 0))
    `);
  } catch (error) {
    await db.execute(sql`
      DELETE FROM maintenance_runs WHERE job = ${COUNTERS_JOB}
    `);
    throw error;
  }
}

async function backfillAlertedAt(db: Database) {
  await db.execute(sql`
    UPDATE matches AS m
    SET alerted_at = a.sent_at
    FROM alerts a
    WHERE a.match_id = m.id
      AND m.alerted_at IS NULL
      AND a.sent_at IS NOT NULL
  `);
}

async function rollupEbayApiCalls(db: Database, now: Date) {
  const completeBefore = startOfUtcDay(now);
  await db.execute(sql`
    INSERT INTO ebay_api_daily (day, api, source, total, success, failure, rate_limited)
    SELECT
      (called_at AT TIME ZONE 'America/New_York')::date AS day,
      api,
      source,
      count(*)::int,
      count(*) FILTER (WHERE ok)::int,
      count(*) FILTER (WHERE NOT ok)::int,
      count(*) FILTER (WHERE http_status = 429)::int
    FROM ebay_api_calls
    WHERE called_at < ${iso(completeBefore)}
    GROUP BY 1, 2, 3
    ON CONFLICT (day, api, source) DO UPDATE SET
      total = EXCLUDED.total,
      success = EXCLUDED.success,
      failure = EXCLUDED.failure,
      rate_limited = EXCLUDED.rate_limited
  `);
}

async function runDailyPurge(db: Database, now: Date): Promise<PurgeDeleted> {
  await seedEventCountersOnce(db, now);
  await backfillAlertedAt(db);
  await rollupEbayApiCalls(db, now);

  const apiCutoff = iso(daysAgo(now, RETENTION.ebayApiCallsDays));
  const emailCutoff = iso(daysAgo(now, RETENTION.emailSendsDays));
  const eventCutoff = iso(daysAgo(now, RETENTION.userEventsDays));
  const alertCutoff = iso(daysAgo(now, RETENTION.alertsDays));
  const matchCutoff = iso(daysAgo(now, RETENTION.matchesDays));
  const compCutoff = iso(daysAgo(now, RETENTION.soldCompCacheDays));
  const nowIso = iso(now);

  const ebayApiCalls = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM ebay_api_calls
      WHERE id IN (
        SELECT id FROM ebay_api_calls
        WHERE called_at < ${apiCutoff}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const emailSends = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM email_sends
      WHERE id IN (
        SELECT id FROM email_sends
        WHERE sent_at < ${emailCutoff}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const userEvents = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM user_events
      WHERE id IN (
        SELECT id FROM user_events
        WHERE occurred_at < ${eventCutoff}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const sessions = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM session
      WHERE id IN (
        SELECT id FROM session
        WHERE expires_at < ${nowIso}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const verifications = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM verification
      WHERE id IN (
        SELECT id FROM verification
        WHERE expires_at < ${nowIso}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const alerts = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM alerts
      WHERE id IN (
        SELECT id FROM alerts
        WHERE sent_at IS NOT NULL AND sent_at < ${alertCutoff}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const matches = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM matches
      WHERE id IN (
        SELECT id FROM matches
        WHERE alerted_at IS NOT NULL AND created_at < ${matchCutoff}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const listings = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM listings
      WHERE ebay_item_id IN (
        SELECT l.ebay_item_id
        FROM listings l
        LEFT JOIN matches m ON m.ebay_item_id = l.ebay_item_id
        WHERE m.id IS NULL
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING ebay_item_id
    `,
  );

  const coverageQueries = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM coverage_queries
      WHERE id IN (
        SELECT cq.id
        FROM coverage_queries cq
        LEFT JOIN watches w ON w.coverage_query_id = cq.id
        WHERE w.id IS NULL
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING id
    `,
  );

  const soldCompCache = await deleteBatches(
    db,
    (limit) => sql`
      DELETE FROM sold_comp_cache
      WHERE item_key IN (
        SELECT item_key FROM sold_comp_cache
        WHERE fetched_at < ${compCutoff}
        LIMIT ${sql.raw(String(limit))}
      )
      RETURNING item_key
    `,
  );

  return {
    ebayApiCalls,
    emailSends,
    userEvents,
    sessions,
    verifications,
    alerts,
    matches,
    listings,
    coverageQueries,
    soldCompCache,
  };
}

export async function maybeRunDailyPurge(
  db: Database,
  now = new Date(),
): Promise<DailyPurgeResult> {
  const claimed = await claimedJob(db, PURGE_JOB, now, MIN_INTERVAL_MS);
  if (!claimed) return { ran: false };
  try {
    const deleted = await runDailyPurge(db, now);
    return { ran: true, ...deleted };
  } catch (error) {
    await releaseJob(db, PURGE_JOB, now);
    throw error;
  }
}
