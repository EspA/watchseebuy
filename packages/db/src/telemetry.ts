import { eq, sql } from "drizzle-orm";
import type { Database } from "./client";
import { ebayApiCalls, emailSends, user, userEvents } from "./schema";

export type EbayApiName = "oauth" | "browse_search" | "get_items";
export type EbayApiSource = "web_search" | "worker_poll";

export type EmailKind = "alert" | "magic_link" | "password_reset" | "contact";
export type EmailSendStatus = "delivered" | "failed" | "logged_only";

export type UserEventKind = "search" | "buy_click";

export async function recordEbayApiCall(
  db: Database,
  input: {
    api: EbayApiName;
    source: EbayApiSource;
    ok: boolean;
    httpStatus?: number | null;
    durationMs: number;
  },
) {
  await db.insert(ebayApiCalls).values({
    id: crypto.randomUUID(),
    api: input.api,
    source: input.source,
    ok: input.ok,
    httpStatus: input.httpStatus ?? null,
    durationMs: input.durationMs,
  });
}

export async function recordEmailSend(
  db: Database,
  input: {
    kind: EmailKind;
    userId?: string | null;
    status: EmailSendStatus;
    error?: string | null;
  },
) {
  await db.insert(emailSends).values({
    id: crypto.randomUUID(),
    kind: input.kind,
    userId: input.userId ?? null,
    status: input.status,
    ok: input.status === "delivered",
    error: input.error ?? null,
  });
}

export async function recordUserEvent(
  db: Database,
  input: {
    kind: UserEventKind;
    userId?: string | null;
    ip?: string | null;
    meta?: Record<string, unknown> | null;
  },
) {
  await db.insert(userEvents).values({
    id: crypto.randomUUID(),
    kind: input.kind,
    userId: input.userId ?? null,
    ip: input.ip ?? null,
    meta: input.meta ?? null,
  });
}

export async function recordConsumerLogin(
  db: Database,
  input: {
    userId: string;
    ip?: string | null;
    country?: string | null;
  },
) {
  const patch: {
    lastLoginAt: Date;
    loginCount: ReturnType<typeof sql>;
    updatedAt: Date;
    lastIp?: string;
    lastCountry?: string;
  } = {
    lastLoginAt: new Date(),
    loginCount: sql`${user.loginCount} + 1`,
    updatedAt: new Date(),
  };
  if (input.ip) patch.lastIp = input.ip;
  if (input.country) patch.lastCountry = input.country;

  await db.update(user).set(patch).where(eq(user.id, input.userId));
}
