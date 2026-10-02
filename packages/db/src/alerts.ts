import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { Database } from "./client";
import {
  alerts,
  coverageQueries,
  listings,
  matches,
  subscriptions,
  user,
  watches,
} from "./schema";
import { deletedEbayUsernames } from "./account-deletion";

export type CoverageToPoll = {
  id: string;
  key: string;
  keywords: string;
  condition: string;
  ebaySite: string;
  listingType: string;
  lastPolledAt: Date | null;
};

export type WatchForAlert = {
  id: string;
  userId: string;
  coverageQueryId: string;
  label: string;
  criteria: unknown;
  alertFrequency: string;
  lastAlertedAt: Date | null;
  createdAt: Date;
  userEmail: string;
  userTimezone: string | null;
};

export type StoredListing = {
  ebayItemId: string;
  title: string;
  payload: unknown;
};

export type UnsentMatch = {
  matchId: string;
  watchId: string;
  ebayItemId: string;
  landedCents: number;
  compDeltaPct: number | null;
  listing: StoredListing;
};

export async function listCoverageDueForPoll(
  db: Database,
  now: Date,
  intervals: {
    defaultPollMs: number;
    premiumPollMs: number;
    premiumPlusPollMs: number;
  },
) {
  const pollMs = sql`MIN(
    CASE
      WHEN ${watches.alertFrequency} = 'on_change'
        AND ${subscriptions.plan} = 'premium_plus'
        AND ${subscriptions.status} IN ('active', 'cancelled')
        AND ${subscriptions.expiresAt} > ${now}
      THEN LEAST(${intervals.defaultPollMs}, ${intervals.premiumPlusPollMs})
      WHEN ${watches.alertFrequency} = 'on_change'
        AND ${subscriptions.plan} = 'premium'
        AND ${subscriptions.status} IN ('active', 'cancelled')
        AND ${subscriptions.expiresAt} > ${now}
      THEN LEAST(${intervals.defaultPollMs}, ${intervals.premiumPollMs})
      ELSE ${intervals.defaultPollMs}
    END
  )`;
  return db
    .select({
      id: coverageQueries.id,
      key: coverageQueries.key,
      keywords: coverageQueries.keywords,
      condition: coverageQueries.condition,
      ebaySite: coverageQueries.ebaySite,
      listingType: coverageQueries.listingType,
      lastPolledAt: coverageQueries.lastPolledAt,
    })
    .from(coverageQueries)
    .innerJoin(watches, eq(watches.coverageQueryId, coverageQueries.id))
    .leftJoin(subscriptions, eq(subscriptions.userId, watches.userId))
    .groupBy(
      coverageQueries.id,
      coverageQueries.key,
      coverageQueries.keywords,
      coverageQueries.condition,
      coverageQueries.ebaySite,
      coverageQueries.listingType,
      coverageQueries.lastPolledAt,
    )
    .having(
      or(
        isNull(coverageQueries.lastPolledAt),
        sql`${coverageQueries.lastPolledAt} <= ${now} - (${pollMs} * interval '1 millisecond')`,
      ),
    );
}

export async function listWatchesForCoverage(
  db: Database,
  coverageQueryId: string,
): Promise<WatchForAlert[]> {
  const rows = await db
    .select({
      id: watches.id,
      userId: watches.userId,
      coverageQueryId: watches.coverageQueryId,
      label: watches.label,
      criteria: watches.criteria,
      alertFrequency: watches.alertFrequency,
      lastAlertedAt: watches.lastAlertedAt,
      createdAt: watches.createdAt,
      userEmail: user.email,
      userTimezone: user.timezone,
    })
    .from(watches)
    .innerJoin(user, eq(watches.userId, user.id))
    .where(eq(watches.coverageQueryId, coverageQueryId));

  return rows.map(toWatchForAlert);
}

export async function listAlertableWatches(
  db: Database,
): Promise<WatchForAlert[]> {
  const rows = await db
    .select({
      id: watches.id,
      userId: watches.userId,
      coverageQueryId: watches.coverageQueryId,
      label: watches.label,
      criteria: watches.criteria,
      alertFrequency: watches.alertFrequency,
      lastAlertedAt: watches.lastAlertedAt,
      createdAt: watches.createdAt,
      userEmail: user.email,
      userTimezone: user.timezone,
    })
    .from(watches)
    .innerJoin(user, eq(watches.userId, user.id));

  return rows.map(toWatchForAlert);
}

function toWatchForAlert(row: {
  id: string;
  userId: string;
  coverageQueryId: string;
  label: string;
  criteria: unknown;
  alertFrequency: string;
  lastAlertedAt: Date | null;
  createdAt: Date;
  userEmail: string;
  userTimezone: string | null;
}): WatchForAlert {
  return row;
}

export async function markCoveragePolled(
  db: Database,
  coverageQueryId: string,
  at = new Date(),
) {
  await db
    .update(coverageQueries)
    .set({ lastPolledAt: at })
    .where(eq(coverageQueries.id, coverageQueryId));
}

export async function listListingsByEbayItemIds(
  db: Database,
  ebayItemIds: string[],
): Promise<Map<string, StoredListing>> {
  if (ebayItemIds.length === 0) return new Map();
  const unique = [...new Set(ebayItemIds)];
  const rows = await db
    .select({
      ebayItemId: listings.ebayItemId,
      title: listings.title,
      payload: listings.payload,
    })
    .from(listings)
    .where(inArray(listings.ebayItemId, unique));
  return new Map(
    rows.map((row) => [
      row.ebayItemId,
      {
        ebayItemId: row.ebayItemId,
        title: row.title,
        payload: row.payload,
      },
    ]),
  );
}

export async function upsertListings(
  db: Database,
  rows: Array<{ ebayItemId: string; title: string; payload: unknown }>,
) {
  if (rows.length === 0) return;
  const blocked = await deletedEbayUsernames(
    db,
    rows
      .map((row) => sellerUsernameFromPayload(row.payload))
      .filter((name): name is string => Boolean(name)),
  );
  const values = rows.map((row) => {
    let payload = row.payload;
    let sellerUsername = sellerUsernameFromPayload(payload);
    if (sellerUsername && blocked.has(sellerUsername.toLowerCase())) {
      payload = stripSellerUsername(payload);
      sellerUsername = null;
    }
    return {
      ebayItemId: row.ebayItemId,
      title: row.title,
      payload,
      sellerUsername,
    };
  });
  await db
    .insert(listings)
    .values(values)
    .onConflictDoUpdate({
      target: listings.ebayItemId,
      set: {
        title: sql`excluded.title`,
        payload: sql`excluded.payload`,
        sellerUsername: sql`excluded.seller_username`,
      },
    });
}

function sellerUsernameFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const value = (payload as { sellerUsername?: unknown }).sellerUsername;
  if (typeof value !== "string") return null;
  const username = value.trim();
  return username.length > 0 ? username : null;
}

function stripSellerUsername(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  const next = { ...(payload as Record<string, unknown>) };
  delete next.sellerUsername;
  return next;
}

export async function insertMatchIfNew(
  db: Database,
  input: {
    watchId: string;
    ebayItemId: string;
    landedCents: number;
    compDeltaPct: number | null;
  },
): Promise<{ id: string; created: boolean } | null> {
  const id = crypto.randomUUID();
  const inserted = await db
    .insert(matches)
    .values({
      id,
      watchId: input.watchId,
      ebayItemId: input.ebayItemId,
      landedCents: input.landedCents,
      compDeltaPct: input.compDeltaPct,
    })
    .onConflictDoNothing({
      target: [matches.watchId, matches.ebayItemId],
    })
    .returning({ id: matches.id });

  if (inserted[0]) return { id: inserted[0].id, created: true };

  const [existing] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.watchId, input.watchId),
        eq(matches.ebayItemId, input.ebayItemId),
      ),
    )
    .limit(1);
  return existing ? { id: existing.id, created: false } : null;
}

export async function listUnsentMatchesForWatch(
  db: Database,
  watchId: string,
): Promise<UnsentMatch[]> {
  const rows = await db
    .select({
      matchId: matches.id,
      watchId: matches.watchId,
      ebayItemId: matches.ebayItemId,
      landedCents: matches.landedCents,
      compDeltaPct: matches.compDeltaPct,
      title: listings.title,
      payload: listings.payload,
    })
    .from(matches)
    .innerJoin(listings, eq(matches.ebayItemId, listings.ebayItemId))
    .leftJoin(alerts, eq(alerts.matchId, matches.id))
    .where(
      and(
        eq(matches.watchId, watchId),
        isNull(alerts.id),
        isNull(matches.alertedAt),
      ),
    )
    .orderBy(matches.createdAt);

  return rows.map((row) => ({
    matchId: row.matchId,
    watchId: row.watchId,
    ebayItemId: row.ebayItemId,
    landedCents: row.landedCents,
    compDeltaPct: row.compDeltaPct,
    listing: {
      ebayItemId: row.ebayItemId,
      title: row.title,
      payload: row.payload,
    },
  }));
}

export async function recordAlerts(
  db: Database,
  input: {
    watchId: string;
    channel: string;
    items: Array<{ matchId: string; clickToken: string }>;
    sentAt: Date;
  },
) {
  if (input.items.length === 0) {
    await db
      .update(watches)
      .set({ lastAlertedAt: input.sentAt })
      .where(eq(watches.id, input.watchId));
    return;
  }

  await db.insert(alerts).values(
    input.items.map((item) => ({
      id: crypto.randomUUID(),
      matchId: item.matchId,
      channel: input.channel,
      clickToken: item.clickToken,
      sentAt: input.sentAt,
    })),
  );
  await db
    .update(matches)
    .set({ alertedAt: input.sentAt })
    .where(
      and(
        inArray(
          matches.id,
          input.items.map((item) => item.matchId),
        ),
        isNull(matches.alertedAt),
      ),
    );
  await db
    .update(watches)
    .set({ lastAlertedAt: input.sentAt })
    .where(eq(watches.id, input.watchId));
}

export async function getAlertClick(
  db: Database,
  clickToken: string,
) {
  const [row] = await db
    .select({
      clickToken: alerts.clickToken,
      sentAt: alerts.sentAt,
      ebayItemId: matches.ebayItemId,
      payload: listings.payload,
      userId: watches.userId,
    })
    .from(alerts)
    .innerJoin(matches, eq(alerts.matchId, matches.id))
    .innerJoin(listings, eq(matches.ebayItemId, listings.ebayItemId))
    .innerJoin(watches, eq(matches.watchId, watches.id))
    .where(eq(alerts.clickToken, clickToken))
    .limit(1);
  return row ?? null;
}

export async function listWatchIdsWithUnsentMatches(
  db: Database,
  watchIds: string[],
) {
  if (watchIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ watchId: matches.watchId })
    .from(matches)
    .leftJoin(alerts, eq(alerts.matchId, matches.id))
    .where(
      and(
        inArray(matches.watchId, watchIds),
        isNull(alerts.id),
        isNull(matches.alertedAt),
      ),
    )
    .groupBy(matches.watchId);
  return new Set(rows.map((row) => row.watchId));
}
