import { createHmac, timingSafeEqual } from "node:crypto";

export const AGENT_QUOTA_COOKIE = "wsb_agent_searches";
export const ANONYMOUS_AGENT_SEARCH_LIMIT = 10;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function anonymousAgentSearchAllowed(used: number): boolean {
  return used < ANONYMOUS_AGENT_SEARCH_LIMIT;
}

export function signAgentSearchCount(count: number, secret: string): string {
  const payload = String(count);
  const mac = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function readAgentSearchCount(
  token: string | undefined,
  secret: string,
): number {
  if (!token || !secret) return 0;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return 0;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const actual = Buffer.from(mac);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) {
    return 0;
  }
  const count = Number(payload);
  if (!Number.isInteger(count) || count < 0 || count > 1_000_000) return 0;
  return count;
}

export function agentQuotaKey(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(`agent-quota:${ip}`).digest("hex");
}

export function agentQuotaCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
}
