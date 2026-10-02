import {
  PAID_PRICE_CENTS,
  paypalAmount,
  type BillingInterval,
  type PaidPlan,
} from "@watchseebuy/domain";

const PRODUCT_KEY = "product";

export function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function paypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim(),
  );
}

export function paypalProductKey(): string {
  return PRODUCT_KEY;
}

type TokenCache = { value: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export async function paypalAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;
  const id = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("PayPal is not configured");
  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PayPal auth failed (${response.status})`);
  const json: unknown = await response.json();
  const value = stringField(json, "access_token");
  const seconds = numberField(json, "expires_in");
  if (!value) throw new Error("PayPal auth failed");
  tokenCache = { value, expiresAt: Date.now() + seconds * 1000 };
  return value;
}

export async function paypalRequest(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await paypalAccessToken();
  const response = await fetch(`${paypalApiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  const json = text ? safeJson(text) : null;
  if (!response.ok) {
    throw new Error(`PayPal ${method} ${path} failed (${response.status})`);
  }
  return json;
}

export function planCharge(plan: PaidPlan, interval: BillingInterval) {
  const cents = PAID_PRICE_CENTS[plan][interval];
  return {
    value: paypalAmount(cents),
    currency_code: "USD",
    interval_unit: interval === "annual" ? "YEAR" : "MONTH",
  };
}

export function stringField(value: unknown, key: string): string {
  if (!value || typeof value !== "object" || !(key in value)) return "";
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : "";
}

export function numberField(value: unknown, key: string): number {
  if (!value || typeof value !== "object" || !(key in value)) return 0;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "number" && Number.isFinite(field) ? field : 0;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
