import { desc, inArray, sql } from "drizzle-orm";
import type { Database } from "./client";
import { ebayAccountDeletions } from "./schema.ts";

export type AccountDeletionRecord = {
  id: string;
  notificationId: string;
  topic: string;
  username: string | null;
  ebayUserId: string | null;
  eventDate: Date | null;
  listingsRedacted: number;
  receivedAt: Date;
};

export async function redactListingsForEbayUsername(
  db: Database,
  username: string,
): Promise<number> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return 0;
  const result = await db.execute(sql`
    UPDATE listings
    SET
      seller_username = NULL,
      payload = CASE
        WHEN jsonb_typeof(payload) = 'object' THEN payload - 'sellerUsername'
        ELSE payload
      END
    WHERE
      (
        seller_username IS NOT NULL
        AND lower(seller_username) = ${normalized}
      )
      OR (
        jsonb_typeof(payload) = 'object'
        AND lower(payload->>'sellerUsername') = ${normalized}
      )
    RETURNING ebay_item_id
  `);
  return rowCount(result);
}

function rowCount(result: unknown): number {
  if (Array.isArray(result)) return result.length;
  if (result && typeof result === "object" && "count" in result) {
    const count = Number((result as { count: unknown }).count);
    return Number.isFinite(count) ? count : 0;
  }
  return 0;
}

export async function recordEbayAccountDeletion(
  db: Database,
  input: {
    notificationId: string;
    topic: string;
    username?: string | null;
    ebayUserId?: string | null;
    eventDate?: Date | null;
    listingsRedacted: number;
  },
): Promise<{ created: boolean }> {
  const inserted = await db
    .insert(ebayAccountDeletions)
    .values({
      id: crypto.randomUUID(),
      notificationId: input.notificationId,
      topic: input.topic,
      username: input.username ?? null,
      ebayUserId: input.ebayUserId ?? null,
      eventDate: input.eventDate ?? null,
      listingsRedacted: input.listingsRedacted,
    })
    .onConflictDoNothing({ target: ebayAccountDeletions.notificationId })
    .returning({ id: ebayAccountDeletions.id });
  return { created: inserted.length > 0 };
}

export async function processEbayAccountDeletion(
  db: Database,
  input: {
    notificationId: string;
    topic: string;
    username?: string | null;
    userId?: string | null;
    eventDate?: Date | null;
  },
): Promise<{ listingsRedacted: number; duplicate: boolean }> {
  const listingsRedacted = input.username
    ? await redactListingsForEbayUsername(db, input.username)
    : 0;
  const recorded = await recordEbayAccountDeletion(db, {
    notificationId: input.notificationId,
    topic: input.topic,
    listingsRedacted,
    ...(input.username ? { username: input.username } : {}),
    ...(input.userId ? { ebayUserId: input.userId } : {}),
    ...(input.eventDate ? { eventDate: input.eventDate } : {}),
  });
  return { listingsRedacted, duplicate: !recorded.created };
}

export function deletedUsernamesLookup(db: Database, usernames: string[]) {
  return db
    .select({ username: ebayAccountDeletions.username })
    .from(ebayAccountDeletions)
    .where(inArray(sql`lower(${ebayAccountDeletions.username})`, usernames));
}

export async function deletedEbayUsernames(
  db: Database,
  usernames: string[],
): Promise<Set<string>> {
  const normalized = [
    ...new Set(
      usernames
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0),
    ),
  ];
  if (normalized.length === 0) return new Set();
  const rows = await deletedUsernamesLookup(db, normalized);
  return new Set(
    rows
      .map((row) => row.username?.trim().toLowerCase())
      .filter((name): name is string => Boolean(name)),
  );
}

export async function listRecentEbayAccountDeletions(
  db: Database,
  limit = 50,
): Promise<AccountDeletionRecord[]> {
  return db
    .select({
      id: ebayAccountDeletions.id,
      notificationId: ebayAccountDeletions.notificationId,
      topic: ebayAccountDeletions.topic,
      username: ebayAccountDeletions.username,
      ebayUserId: ebayAccountDeletions.ebayUserId,
      eventDate: ebayAccountDeletions.eventDate,
      listingsRedacted: ebayAccountDeletions.listingsRedacted,
      receivedAt: ebayAccountDeletions.receivedAt,
    })
    .from(ebayAccountDeletions)
    .orderBy(desc(ebayAccountDeletions.receivedAt))
    .limit(limit);
}
