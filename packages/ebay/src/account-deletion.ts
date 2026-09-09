import { createHash, createVerify } from "node:crypto";

export const ACCOUNT_DELETION_PATH = "/api/ebay/account-deletion";
export const VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;
export const MARKETPLACE_ACCOUNT_DELETION = "MARKETPLACE_ACCOUNT_DELETION";

export type NotificationEndpointConfig = {
  verificationToken: string;
  endpoint: string;
};

export type NotificationEndpointStatus = {
  configured: boolean;
  endpoint: string | null;
  tokenSet: boolean;
  error?: string;
};

export type AccountDeletionEvent = {
  notificationId: string;
  topic: string;
  eventDate: Date | null;
  username: string | null;
  userId: string | null;
};

export type EbaySignatureHeader = {
  kid: string;
  signature: string;
  alg?: string;
  digest?: string;
};

type EnvMap = Record<string, string | undefined>;

export function defaultNotificationEndpoint(appUrl?: string): string | null {
  const base = (appUrl ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  return `${base}${ACCOUNT_DELETION_PATH}`;
}

export function notificationEndpointStatusFromEnv(
  env: EnvMap = process.env,
): NotificationEndpointStatus {
  const parsed = parseNotificationEndpointConfig(env);
  if ("error" in parsed) {
    const status: NotificationEndpointStatus = {
      configured: false,
      endpoint: typeof env.EBAY_NOTIFICATION_ENDPOINT === "string"
        ? env.EBAY_NOTIFICATION_ENDPOINT.trim() || null
        : defaultNotificationEndpoint(env.APP_URL),
      tokenSet: Boolean(env.EBAY_NOTIFICATION_VERIFICATION_TOKEN?.trim()),
    };
    status.error = parsed.error;
    return status;
  }
  return {
    configured: true,
    endpoint: parsed.endpoint,
    tokenSet: true,
  };
}

export function notificationEndpointFromEnv(
  env: EnvMap = process.env,
): NotificationEndpointConfig {
  const parsed = parseNotificationEndpointConfig(env);
  if ("error" in parsed) {
    throw new Error(parsed.error);
  }
  return parsed;
}

function parseNotificationEndpointConfig(
  env: EnvMap,
): NotificationEndpointConfig | { error: string } {
  const verificationToken = env.EBAY_NOTIFICATION_VERIFICATION_TOKEN?.trim() ?? "";
  if (!VERIFICATION_TOKEN_PATTERN.test(verificationToken)) {
    return {
      error:
        "EBAY_NOTIFICATION_VERIFICATION_TOKEN must be 32-80 characters of letters, numbers, hyphen, or underscore.",
    };
  }
  const endpoint = (
    env.EBAY_NOTIFICATION_ENDPOINT?.trim() ||
    defaultNotificationEndpoint(env.APP_URL) ||
    ""
  ).replace(/\/+$/, "");
  if (!endpoint) {
    return {
      error:
        "Set EBAY_NOTIFICATION_ENDPOINT or APP_URL so the challenge hash uses the exact public URL.",
    };
  }
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return { error: "Notification endpoint must be an https URL." };
    }
  } catch {
    return { error: "Notification endpoint is not a valid URL." };
  }
  return { verificationToken, endpoint };
}

export function challengeResponse(
  challengeCode: string,
  verificationToken: string,
  endpoint: string,
): string {
  return createHash("sha256")
    .update(challengeCode)
    .update(verificationToken)
    .update(endpoint)
    .digest("hex");
}

export function parseAccountDeletionPayload(
  raw: string,
): AccountDeletionEvent {
  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Notification payload is not JSON.");
  }
  if (!body || typeof body !== "object") {
    throw new Error("Notification payload is empty.");
  }
  const record = body as {
    metadata?: { topic?: unknown };
    notification?: {
      notificationId?: unknown;
      eventDate?: unknown;
      data?: {
        username?: unknown;
        userId?: unknown;
      };
    };
  };
  const notificationId =
    typeof record.notification?.notificationId === "string"
      ? record.notification.notificationId.trim()
      : "";
  if (!notificationId) {
    throw new Error("Notification is missing notificationId.");
  }
  const topic =
    typeof record.metadata?.topic === "string" && record.metadata.topic.trim()
      ? record.metadata.topic.trim()
      : MARKETPLACE_ACCOUNT_DELETION;
  const username =
    typeof record.notification?.data?.username === "string"
      ? record.notification.data.username.trim() || null
      : null;
  const userId =
    typeof record.notification?.data?.userId === "string"
      ? record.notification.data.userId.trim() || null
      : null;
  const eventDateRaw =
    typeof record.notification?.eventDate === "string"
      ? record.notification.eventDate
      : "";
  const parsedDate = eventDateRaw ? new Date(eventDateRaw) : null;
  const eventDate =
    parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  return { notificationId, topic, eventDate, username, userId };
}

export function parseEbaySignatureHeader(
  header: string | null,
): EbaySignatureHeader | null {
  if (!header?.trim()) return null;
  try {
    const decoded = Buffer.from(header, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as {
      kid?: unknown;
      signature?: unknown;
      alg?: unknown;
      digest?: unknown;
    };
    if (typeof parsed.kid !== "string" || !parsed.kid.trim()) return null;
    if (typeof parsed.signature !== "string" || !parsed.signature.trim()) {
      return null;
    }
    const result: EbaySignatureHeader = {
      kid: parsed.kid.trim(),
      signature: parsed.signature.trim(),
    };
    if (typeof parsed.alg === "string" && parsed.alg) result.alg = parsed.alg;
    if (typeof parsed.digest === "string" && parsed.digest) {
      result.digest = parsed.digest;
    }
    return result;
  } catch {
    return null;
  }
}

export function formatPublicKeyPem(key: string): string {
  const trimmed = key.trim();
  if (trimmed.includes("BEGIN PUBLIC KEY")) {
    const inner = trimmed
      .replace(/-----BEGIN PUBLIC KEY-----/g, "")
      .replace(/-----END PUBLIC KEY-----/g, "")
      .replace(/\s+/g, "");
    const lines = inner.match(/.{1,64}/g)?.join("\n") ?? inner;
    return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
  }
  const body = trimmed.replace(/\s+/g, "");
  const lines = body.match(/.{1,64}/g)?.join("\n") ?? body;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

export function verifyNotificationSignature(input: {
  rawBody: string;
  signature: string;
  publicKeyPem: string;
}): boolean {
  try {
    const verifier = createVerify("SHA1");
    verifier.update(input.rawBody);
    verifier.end();
    return verifier.verify(
      formatPublicKeyPem(input.publicKeyPem),
      input.signature,
      "base64",
    );
  } catch {
    return false;
  }
}

export function redactSellerUsernameFromPayload(
  payload: unknown,
  username: string,
): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  const record = payload as Record<string, unknown>;
  const stored = record.sellerUsername;
  if (typeof stored !== "string") return payload;
  if (stored.toLowerCase() !== username.toLowerCase()) return payload;
  const next = { ...record };
  delete next.sellerUsername;
  return next;
}
