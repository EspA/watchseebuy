import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "./client";
import { coverageQueries, watches } from "./schema";

export type CoverageQueryInput = {
  key: string;
  keywords: string;
  condition: string;
  ebaySite: string;
  listingType: string;
};

export type SavedWatch = {
  id: string;
  label: string;
  criteria: unknown;
  createdAt: Date;
  coverageKey: string;
  coverageKeywords: string;
  sharedWatchCount: number;
  alertFrequency: string;
};

async function upsertCoverageQuery(db: Database, coverage: CoverageQueryInput) {
  await db
    .insert(coverageQueries)
    .values({
      id: crypto.randomUUID(),
      key: coverage.key,
      keywords: coverage.keywords,
      condition: coverage.condition,
      ebaySite: coverage.ebaySite,
      listingType: coverage.listingType,
    })
    .onConflictDoNothing({ target: coverageQueries.key });

  const [row] = await db
    .select()
    .from(coverageQueries)
    .where(eq(coverageQueries.key, coverage.key))
    .limit(1);

  if (!row) {
    throw new Error(`coverage query missing after upsert: ${coverage.key}`);
  }
  return row;
}

export async function getWatchForUser(
  db: Database,
  input: { userId: string; watchId: string },
) {
  const [row] = await db
    .select()
    .from(watches)
    .where(and(eq(watches.id, input.watchId), eq(watches.userId, input.userId)))
    .limit(1);
  return row ?? null;
}

export async function saveWatch(
  db: Database,
  input: {
    userId: string;
    label: string;
    criteria: unknown;
    coverage: CoverageQueryInput;
    watchId?: string;
  },
) {
  const coverage = await upsertCoverageQuery(db, input.coverage);

  if (input.watchId) {
    const owned = await getWatchForUser(db, {
      userId: input.userId,
      watchId: input.watchId,
    });
    if (owned) {
      const [collision] = await db
        .select()
        .from(watches)
        .where(
          and(
            eq(watches.userId, input.userId),
            eq(watches.coverageQueryId, coverage.id),
          ),
        )
        .limit(1);

      if (collision && collision.id !== owned.id) {
        await db
          .update(watches)
          .set({ label: input.label, criteria: input.criteria })
          .where(eq(watches.id, collision.id));
        await db.delete(watches).where(eq(watches.id, owned.id));
        return { watch: { ...collision, label: input.label }, coverage, created: false };
      }

      const [updated] = await db
        .update(watches)
        .set({
          label: input.label,
          criteria: input.criteria,
          coverageQueryId: coverage.id,
        })
        .where(eq(watches.id, owned.id))
        .returning();
      if (!updated) {
        throw new Error("watch missing after update");
      }
      return { watch: updated, coverage, created: false };
    }
  }

  const id = crypto.randomUUID();

  await db
    .insert(watches)
    .values({
      id,
      userId: input.userId,
      coverageQueryId: coverage.id,
      label: input.label,
      criteria: input.criteria,
    })
    .onConflictDoUpdate({
      target: [watches.userId, watches.coverageQueryId],
      set: {
        label: input.label,
        criteria: input.criteria,
      },
    });

  const [watch] = await db
    .select()
    .from(watches)
    .where(
      and(
        eq(watches.userId, input.userId),
        eq(watches.coverageQueryId, coverage.id),
      ),
    )
    .limit(1);

  if (!watch) {
    throw new Error("watch missing after save");
  }

  return { watch, coverage, created: watch.id === id };
}

export async function listWatchesForUser(db: Database, userId: string) {
  const rows = await db
    .select({
      id: watches.id,
      label: watches.label,
      criteria: watches.criteria,
      alertFrequency: watches.alertFrequency,
      createdAt: watches.createdAt,
      coverageId: coverageQueries.id,
      coverageKey: coverageQueries.key,
      coverageKeywords: coverageQueries.keywords,
    })
    .from(watches)
    .innerJoin(coverageQueries, eq(watches.coverageQueryId, coverageQueries.id))
    .where(eq(watches.userId, userId))
    .orderBy(desc(watches.createdAt));

  const coverageIds = [...new Set(rows.map((r) => r.coverageId))];
  const counts = new Map<string, number>();
  if (coverageIds.length > 0) {
    const countRows = await db
      .select({
        coverageId: watches.coverageQueryId,
        n: sql<number>`count(*)::int`,
      })
      .from(watches)
      .where(inArray(watches.coverageQueryId, coverageIds))
      .groupBy(watches.coverageQueryId);
    for (const row of countRows) {
      counts.set(row.coverageId, row.n);
    }
  }

  return rows.map(
    (row): SavedWatch => ({
      id: row.id,
      label: row.label,
      criteria: row.criteria,
      createdAt: row.createdAt,
      alertFrequency: row.alertFrequency,
      coverageKey: row.coverageKey,
      coverageKeywords: row.coverageKeywords,
      sharedWatchCount: counts.get(row.coverageId) ?? 1,
    }),
  );
}

export async function updateWatchSettings(
  db: Database,
  input: {
    userId: string;
    watchId: string;
    alertFrequency: string;
    maxLandedCents?: number | null;
  },
) {
  const owned = await getWatchForUser(db, {
    userId: input.userId,
    watchId: input.watchId,
  });
  if (!owned) return false;

  const nextCriteria =
    input.maxLandedCents === undefined
      ? owned.criteria
      : withMaxPrice(owned.criteria, input.maxLandedCents);

  const [updated] = await db
    .update(watches)
    .set({
      criteria: nextCriteria,
      alertFrequency: input.alertFrequency,
    })
    .where(and(eq(watches.id, owned.id), eq(watches.userId, input.userId)))
    .returning({ id: watches.id });

  return Boolean(updated);
}

function withMaxPrice(criteria: unknown, maxLandedCents: number | null) {
  if (!criteria || typeof criteria !== "object") return criteria;
  const next = { ...criteria } as Record<string, unknown>;
  if (maxLandedCents === null) {
    delete next.maxLandedCents;
    return next;
  }
  next.maxLandedCents = maxLandedCents;
  const min = next.minLandedCents;
  if (typeof min === "number" && min > maxLandedCents) {
    next.minLandedCents = maxLandedCents;
  }
  return next;
}

export async function deleteWatchForUser(
  db: Database,
  input: { userId: string; watchId: string },
) {
  const deleted = await db
    .delete(watches)
    .where(and(eq(watches.id, input.watchId), eq(watches.userId, input.userId)))
    .returning({ id: watches.id });

  return Boolean(deleted[0]);
}