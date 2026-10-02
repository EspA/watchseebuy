import { eq, sql } from "drizzle-orm";
import type { Database } from "./client";
import { agentSearchQuota } from "./schema";

export async function readAgentSearchQuota(
  db: Database,
  key: string,
): Promise<number> {
  const [row] = await db
    .select({ count: agentSearchQuota.count })
    .from(agentSearchQuota)
    .where(eq(agentSearchQuota.key, key))
    .limit(1);
  return row?.count ?? 0;
}

export async function incrementAgentSearchQuota(
  db: Database,
  key: string,
): Promise<number> {
  const [row] = await db
    .insert(agentSearchQuota)
    .values({ key, count: 1, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: agentSearchQuota.key,
      set: {
        count: sql`${agentSearchQuota.count} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: agentSearchQuota.count });
  return row?.count ?? 1;
}

export async function writeAgentSearchQuota(
  db: Database,
  key: string,
  count: number,
) {
  await db
    .insert(agentSearchQuota)
    .values({ key, count, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: agentSearchQuota.key,
      set: {
        count: sql`GREATEST(${agentSearchQuota.count}, excluded.count)`,
        updatedAt: new Date(),
      },
    });
}
