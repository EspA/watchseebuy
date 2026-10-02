import {
  DEFAULT_USER_TIMEZONE,
  zonedCalendarDays,
  zonedDayBounds,
  zonedWindowStart,
} from "@watchseebuy/domain";
import { and, desc, eq, gte, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { Database } from "./client";
import { account, ebayApiCalls, emailSends, user, userEvents, watches } from "./schema";
import {
  backfillUnauthenticatedCounts,
  ensureUnauthenticatedUser,
  UNAUTHENTICATED_USER_ID,
} from "./telemetry";

export const ADMIN_STATS_TIMEZONE = DEFAULT_USER_TIMEZONE;

/** Literal zone name. A bound parameter is parsed as an interval. */
const ADMIN_TZ_SQL = sql.raw(
  `'${ADMIN_STATS_TIMEZONE.replaceAll("'", "''")}'`,
);

export type AdminUserListRow = {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  lastLoginAt: Date | null;
  lastIp: string | null;
  lastCountry: string | null;
  loginCount: number;
  createdAt: Date;
  providerIds: string[];
  watchesCount: number;
  searchCount: number;
  buyClickCount: number;
};

export type AdminUserDetail = AdminUserListRow & {
  shipToPostal: string | null;
  timezone: string | null;
  ebaySite: string | null;
  locale: string | null;
  recentEvents: Array<{
    id: string;
    occurredAt: Date;
    kind: string;
    ip: string | null;
    meta: Record<string, unknown> | null;
  }>;
};

export type EbayApiWindowStats = {
  total: number;
  success: number;
  failure: number;
  rateLimited: number;
};

export type EbayApiBreakdownRow = {
  api: string;
  source: string;
  total: number;
  success: number;
  failure: number;
  rateLimited: number;
};

export type EbayApiStatusRow = {
  api: string;
  httpStatus: number | null;
  total: number;
};

export const EBAY_STAT_WINDOWS = [7, 14, 30] as const;
export type EbayStatWindow = (typeof EBAY_STAT_WINDOWS)[number];
export const EBAY_FAILURE_PAGE_SIZE = 50;

export type EbayApiDayRow = {
  day: string;
  total: number;
  success: number;
  failure: number;
  rateLimited: number;
};

export type EbayApiFailureFilters = {
  days: number;
  api?: string;
  source?: string;
  httpStatus?: number;
  day?: string;
  limit?: number;
  offset?: number;
};

export type EbayApiErrorGroup = {
  httpStatus: number | null;
  error: string | null;
  total: number;
};

export type EbayApiFailureRow = {
  id: string;
  calledAt: Date;
  api: string;
  source: string;
  httpStatus: number | null;
  durationMs: number;
  error: string | null;
};

export function parseEbayStatWindow(
  raw: string | undefined | null,
): EbayStatWindow {
  const n = Number(raw);
  return n === 7 || n === 14 || n === 30 ? n : 30;
}

export function utcDayBounds(day: string): { start: Date; end: Date } | null {
  return zonedDayBounds(day, ADMIN_STATS_TIMEZONE);
}

function calendarWindowStart(days: number) {
  return zonedWindowStart(days, new Date(), ADMIN_STATS_TIMEZONE);
}

function eachAdminDay(days: number): string[] {
  return zonedCalendarDays(days, new Date(), ADMIN_STATS_TIMEZONE);
}

export function fillEbayApiDays(
  days: number,
  rows: EbayApiDayRow[],
): EbayApiDayRow[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  return eachAdminDay(days).map(
    (day) =>
      byDay.get(day) ?? {
        day,
        total: 0,
        success: 0,
        failure: 0,
        rateLimited: 0,
      },
  );
}

export type EmailWindowStats = {
  total: number;
  delivered: number;
  failed: number;
  loggedOnly: number;
};

export type EmailBreakdownRow = {
  kind: string;
  total: number;
  delivered: number;
  failed: number;
  loggedOnly: number;
};

function asInt(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0;
}

export async function listAdminUsers(db: Database): Promise<AdminUserListRow[]> {
  await backfillUnauthenticatedCounts(db);
  const watchCounts = db
    .select({
      userId: watches.userId,
      watchesCount: sql<number>`count(*)::int`.as("watches_count"),
    })
    .from(watches)
    .groupBy(watches.userId)
    .as("watch_counts");

  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLoginAt: user.lastLoginAt,
      lastIp: user.lastIp,
      lastCountry: user.lastCountry,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
      watchesCount: watchCounts.watchesCount,
      searchCount: user.searchCount,
      buyClickCount: user.buyClickCount,
    })
    .from(user)
    .leftJoin(watchCounts, eq(watchCounts.userId, user.id))
    .orderBy(
      sql`case when ${user.id} = ${UNAUTHENTICATED_USER_ID} then 0 else 1 end`,
      desc(user.createdAt),
    );

  const accounts = await db
    .select({
      userId: account.userId,
      providerId: account.providerId,
    })
    .from(account);

  const providers = new Map<string, string[]>();
  for (const row of accounts) {
    const list = providers.get(row.userId) ?? [];
    list.push(row.providerId);
    providers.set(row.userId, list);
  }

  return rows.map((row) => ({
    ...row,
    providerIds: providers.get(row.id) ?? [],
    watchesCount: asInt(row.watchesCount),
    searchCount: asInt(row.searchCount),
    buyClickCount: asInt(row.buyClickCount),
  }));
}

export async function getAdminUserDetail(
  db: Database,
  userId: string,
): Promise<AdminUserDetail | null> {
  if (userId === UNAUTHENTICATED_USER_ID) {
    await ensureUnauthenticatedUser(db);
  }
  const [settings] = await db
    .select({
      shipToPostal: user.shipToPostal,
      timezone: user.timezone,
      ebaySite: user.ebaySite,
      locale: user.locale,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!settings) return null;

  const listed = await listAdminUsers(db);
  const row = listed.find((item) => item.id === userId);
  if (!row) return null;

  const events = await db
    .select({
      id: userEvents.id,
      occurredAt: userEvents.occurredAt,
      kind: userEvents.kind,
      ip: userEvents.ip,
      meta: userEvents.meta,
    })
    .from(userEvents)
    .where(
      userId === UNAUTHENTICATED_USER_ID
        ? or(eq(userEvents.userId, userId), isNull(userEvents.userId))
        : eq(userEvents.userId, userId),
    )
    .orderBy(desc(userEvents.occurredAt))
    .limit(25);

  return {
    ...row,
    shipToPostal: settings.shipToPostal,
    timezone: settings.timezone,
    ebaySite: settings.ebaySite,
    locale: settings.locale,
    recentEvents: events.map((event) => ({
      ...event,
      meta: event.meta ?? null,
    })),
  };
}

function windowStart(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function parseEbayStatDay(
  raw: string | undefined | null,
  days: number,
): string | undefined {
  if (!raw || !utcDayBounds(raw)) return undefined;
  return eachAdminDay(days).includes(raw) ? raw : undefined;
}

function ebayApiViewWhere(days: number, day?: string) {
  const bounds = day ? utcDayBounds(day) : null;
  if (bounds) {
    return and(
      gte(ebayApiCalls.calledAt, bounds.start),
      lt(ebayApiCalls.calledAt, bounds.end),
    );
  }
  return gte(ebayApiCalls.calledAt, calendarWindowStart(days));
}

export async function ebayApiWindowStats(
  db: Database,
  days: number,
): Promise<EbayApiWindowStats> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      success: sql<number>`count(*) filter (where ${ebayApiCalls.ok})::int`,
      failure: sql<number>`count(*) filter (where not ${ebayApiCalls.ok})::int`,
      rateLimited: sql<number>`count(*) filter (where ${ebayApiCalls.httpStatus} = 429)::int`,
    })
    .from(ebayApiCalls)
    .where(gte(ebayApiCalls.calledAt, calendarWindowStart(days)));

  return {
    total: asInt(row?.total),
    success: asInt(row?.success),
    failure: asInt(row?.failure),
    rateLimited: asInt(row?.rateLimited),
  };
}

export async function ebayApiBreakdown(
  db: Database,
  days: number,
  day?: string,
): Promise<EbayApiBreakdownRow[]> {
  const rows = await db
    .select({
      api: ebayApiCalls.api,
      source: ebayApiCalls.source,
      total: sql<number>`count(*)::int`,
      success: sql<number>`count(*) filter (where ${ebayApiCalls.ok})::int`,
      failure: sql<number>`count(*) filter (where not ${ebayApiCalls.ok})::int`,
      rateLimited: sql<number>`count(*) filter (where ${ebayApiCalls.httpStatus} = 429)::int`,
    })
    .from(ebayApiCalls)
    .where(ebayApiViewWhere(days, day))
    .groupBy(ebayApiCalls.api, ebayApiCalls.source)
    .orderBy(ebayApiCalls.api, ebayApiCalls.source);

  return rows.map((row) => ({
    api: row.api,
    source: row.source,
    total: asInt(row.total),
    success: asInt(row.success),
    failure: asInt(row.failure),
    rateLimited: asInt(row.rateLimited),
  }));
}

export async function ebayApiStatusBreakdown(
  db: Database,
  days: number,
  day?: string,
): Promise<EbayApiStatusRow[]> {
  const rows = await db
    .select({
      api: ebayApiCalls.api,
      httpStatus: ebayApiCalls.httpStatus,
      total: sql<number>`count(*)::int`,
    })
    .from(ebayApiCalls)
    .where(
      and(
        ebayApiViewWhere(days, day),
        sql`not ${ebayApiCalls.ok}`,
      ),
    )
    .groupBy(ebayApiCalls.api, ebayApiCalls.httpStatus)
    .orderBy(ebayApiCalls.api, ebayApiCalls.httpStatus);

  return rows.map((row) => ({
    api: row.api,
    httpStatus: row.httpStatus,
    total: asInt(row.total),
  }));
}

export async function ebayApiDailyStats(
  db: Database,
  days: number,
): Promise<EbayApiDayRow[]> {
  const daySql = sql<string>`to_char((${ebayApiCalls.calledAt} AT TIME ZONE ${ADMIN_TZ_SQL})::date, 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      day: daySql,
      total: sql<number>`count(*)::int`,
      success: sql<number>`count(*) filter (where ${ebayApiCalls.ok})::int`,
      failure: sql<number>`count(*) filter (where not ${ebayApiCalls.ok})::int`,
      rateLimited: sql<number>`count(*) filter (where ${ebayApiCalls.httpStatus} = 429)::int`,
    })
    .from(ebayApiCalls)
    .where(gte(ebayApiCalls.calledAt, calendarWindowStart(days)))
    .groupBy(sql`(${ebayApiCalls.calledAt} AT TIME ZONE ${ADMIN_TZ_SQL})::date`)
    .orderBy(sql`(${ebayApiCalls.calledAt} AT TIME ZONE ${ADMIN_TZ_SQL})::date`);

  return fillEbayApiDays(
    days,
    rows.map((row) => ({
      day: row.day,
      total: asInt(row.total),
      success: asInt(row.success),
      failure: asInt(row.failure),
      rateLimited: asInt(row.rateLimited),
    })),
  );
}

function ebayApiFailureWhere(filters: EbayApiFailureFilters) {
  const parts = [
    sql`not ${ebayApiCalls.ok}`,
    gte(ebayApiCalls.calledAt, calendarWindowStart(filters.days)),
  ];
  if (filters.api) parts.push(eq(ebayApiCalls.api, filters.api));
  if (filters.source) parts.push(eq(ebayApiCalls.source, filters.source));
  if (filters.httpStatus != null) {
    parts.push(eq(ebayApiCalls.httpStatus, filters.httpStatus));
  }
  const bounds = filters.day ? utcDayBounds(filters.day) : null;
  if (bounds) {
    parts.push(gte(ebayApiCalls.calledAt, bounds.start));
    parts.push(lt(ebayApiCalls.calledAt, bounds.end));
  }
  return and(...parts);
}

export async function ebayApiErrorGroups(
  db: Database,
  filters: EbayApiFailureFilters,
): Promise<EbayApiErrorGroup[]> {
  const rows = await db
    .select({
      httpStatus: ebayApiCalls.httpStatus,
      error: ebayApiCalls.error,
      total: sql<number>`count(*)::int`,
    })
    .from(ebayApiCalls)
    .where(ebayApiFailureWhere(filters))
    .groupBy(ebayApiCalls.httpStatus, ebayApiCalls.error)
    .orderBy(desc(sql`count(*)`), ebayApiCalls.httpStatus);

  return rows.map((row) => ({
    httpStatus: row.httpStatus,
    error: row.error,
    total: asInt(row.total),
  }));
}

export async function ebayApiFailureCount(
  db: Database,
  filters: EbayApiFailureFilters,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(ebayApiCalls)
    .where(ebayApiFailureWhere(filters));
  return asInt(row?.total);
}

export async function listEbayApiFailures(
  db: Database,
  filters: EbayApiFailureFilters,
): Promise<EbayApiFailureRow[]> {
  const limit = Math.min(filters.limit ?? EBAY_FAILURE_PAGE_SIZE, 200);
  const offset = Math.max(filters.offset ?? 0, 0);
  const rows = await db
    .select({
      id: ebayApiCalls.id,
      calledAt: ebayApiCalls.calledAt,
      api: ebayApiCalls.api,
      source: ebayApiCalls.source,
      httpStatus: ebayApiCalls.httpStatus,
      durationMs: ebayApiCalls.durationMs,
      error: ebayApiCalls.error,
    })
    .from(ebayApiCalls)
    .where(ebayApiFailureWhere(filters))
    .orderBy(desc(ebayApiCalls.calledAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function emailWindowStats(
  db: Database,
  days: number,
): Promise<EmailWindowStats> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${emailSends.status} = 'delivered')::int`,
      failed: sql<number>`count(*) filter (where ${emailSends.status} = 'failed')::int`,
      loggedOnly: sql<number>`count(*) filter (where ${emailSends.status} = 'logged_only')::int`,
    })
    .from(emailSends)
    .where(gte(emailSends.sentAt, windowStart(days)));

  return {
    total: asInt(row?.total),
    delivered: asInt(row?.delivered),
    failed: asInt(row?.failed),
    loggedOnly: asInt(row?.loggedOnly),
  };
}

export async function emailBreakdown(
  db: Database,
  days: number,
): Promise<EmailBreakdownRow[]> {
  const rows = await db
    .select({
      kind: emailSends.kind,
      total: sql<number>`count(*)::int`,
      delivered: sql<number>`count(*) filter (where ${emailSends.status} = 'delivered')::int`,
      failed: sql<number>`count(*) filter (where ${emailSends.status} = 'failed')::int`,
      loggedOnly: sql<number>`count(*) filter (where ${emailSends.status} = 'logged_only')::int`,
    })
    .from(emailSends)
    .where(gte(emailSends.sentAt, windowStart(days)))
    .groupBy(emailSends.kind)
    .orderBy(emailSends.kind);

  return rows.map((row) => ({
    kind: row.kind,
    total: asInt(row.total),
    delivered: asInt(row.delivered),
    failed: asInt(row.failed),
    loggedOnly: asInt(row.loggedOnly),
  }));
}

export async function countUsers(db: Database) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(user)
    .where(ne(user.id, UNAUTHENTICATED_USER_ID));
  return asInt(row?.n);
}
