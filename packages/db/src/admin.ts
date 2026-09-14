import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "./client";
import { account, ebayApiCalls, emailSends, user, userEvents, watches } from "./schema";

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
    .orderBy(desc(user.createdAt));

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
    .where(eq(userEvents.userId, userId))
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
    .where(gte(ebayApiCalls.calledAt, windowStart(days)));

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
    .where(gte(ebayApiCalls.calledAt, windowStart(days)))
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
        gte(ebayApiCalls.calledAt, windowStart(days)),
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
    .from(user);
  return asInt(row?.n);
}
