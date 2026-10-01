import { eq, sql } from "drizzle-orm";
import type { Database } from "./client";
import { ebayApiCalls, emailSends, user, userEvents } from "./schema";

export type EbayApiName =
  | "oauth"
  | "browse_search"
  | "get_items"
  | "get_item"
  | "notification_public_key";
export type EbayApiSource =
  | "web_search"
  | "web_agent"
  | "worker_poll"
  | "account_deletion"
  | "partner_browse";

export type EmailKind = "alert" | "magic_link" | "password_reset" | "contact";
export type EmailSendStatus = "delivered" | "failed" | "logged_only";

export type UserEventKind = "search" | "buy_click";

const TELEMETRY_PAUSE_MS = 60_000;
const CONNECTION_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "CONNECT_TIMEOUT",
  "CONNECTION_CLOSED",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
]);

let telemetryBlockedUntil = 0;
let telemetryPauseReported = false;
let telemetryAttempt: Promise<void> | null = null;

function errorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current && typeof current === "object"; depth++) {
    const record = current as { code?: unknown; cause?: unknown };
    if (typeof record.code === "string") return record.code;
    current = record.cause;
  }
  return undefined;
}

function databaseUnreachable(error: unknown): boolean {
  const code = errorCode(error);
  if (code && CONNECTION_CODES.has(code)) return true;
  const message = error instanceof Error ? error.message : "";
  return /ECONNREFUSED|connect ECONNREFUSED|Connection refused/i.test(message);
}

/** One failed connection pauses later writes so a down database cannot log once per eBay call. */
async function writeTelemetry(write: () => Promise<void>): Promise<void> {
  if (Date.now() < telemetryBlockedUntil) return;
  if (telemetryAttempt) {
    await telemetryAttempt;
    if (Date.now() < telemetryBlockedUntil) return;
  }

  let finish!: () => void;
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  telemetryAttempt = gate;
  try {
    await write();
    telemetryPauseReported = false;
  } catch (error) {
    if (!databaseUnreachable(error)) throw error;
    telemetryBlockedUntil = Date.now() + TELEMETRY_PAUSE_MS;
    if (!telemetryPauseReported) {
      telemetryPauseReported = true;
      const code = errorCode(error);
      console.error(
        JSON.stringify({
          at: new Date().toISOString(),
          message: "database unreachable; api telemetry paused",
          error: code ?? "connect failed",
        }),
      );
    }
  } finally {
    finish();
    if (telemetryAttempt === gate) telemetryAttempt = null;
  }
}

export async function recordEbayApiCall(
  db: Database,
  input: {
    api: EbayApiName;
    source: EbayApiSource;
    ok: boolean;
    httpStatus?: number | null;
    durationMs: number;
    error?: string | null;
  },
) {
  await writeTelemetry(async () => {
    await db.insert(ebayApiCalls).values({
      id: crypto.randomUUID(),
      api: input.api,
      source: input.source,
      ok: input.ok,
      httpStatus: input.httpStatus ?? null,
      durationMs: input.durationMs,
      error: input.ok ? null : input.error ?? null,
    });
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
  await writeTelemetry(async () => {
    await db.insert(userEvents).values({
      id: crypto.randomUUID(),
      kind: input.kind,
      userId: input.userId ?? null,
      ip: input.ip ?? null,
      meta: input.meta ?? null,
    });

    if (!input.userId) return;
    if (input.kind === "search") {
      await db
        .update(user)
        .set({ searchCount: sql`${user.searchCount} + 1` })
        .where(eq(user.id, input.userId));
      return;
    }
    if (input.kind === "buy_click") {
      await db
        .update(user)
        .set({ buyClickCount: sql`${user.buyClickCount} + 1` })
        .where(eq(user.id, input.userId));
    }
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
