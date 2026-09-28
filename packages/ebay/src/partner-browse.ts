import { createHash, timingSafeEqual } from "node:crypto";
import type { EbayApiCallEvent } from "./browse";

export const PARTNER_BROWSE_PATH_PREFIX = "/buy/browse/v1";
export const PARTNER_BROWSE_TOKEN_MIN_LENGTH = 32;

const EBAY_BROWSE_ORIGINS = [
  "https://api.ebay.com",
  "https://api.sandbox.ebay.com",
];

type EnvMap = Record<string, string | undefined>;

export type PartnerBrowseStatus = {
  configured: boolean;
  tokenSet: boolean;
  publicPath: string;
};

export type PartnerBrowseAuth =
  | { ok: true }
  | { ok: false; status: 401 | 503; body: ReturnType<typeof ebayBrowseError> };

export function partnerBrowseTokensFromEnv(env: EnvMap = process.env): string[] {
  return (env.PARTNER_BROWSE_TOKEN ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length >= PARTNER_BROWSE_TOKEN_MIN_LENGTH);
}

export function partnerBrowseStatusFromEnv(
  env: EnvMap = process.env,
): PartnerBrowseStatus {
  const tokens = partnerBrowseTokensFromEnv(env);
  return {
    configured: tokens.length > 0,
    tokenSet: tokens.length > 0,
    publicPath: `${PARTNER_BROWSE_PATH_PREFIX}/*`,
  };
}

export function partnerBrowseOriginFromEnv(env: EnvMap = process.env): string {
  const raw = (env.APP_URL ?? env.BETTER_AUTH_URL ?? "https://watchseebuy.com").trim();
  return raw.replace(/\/+$/, "") || "https://watchseebuy.com";
}

export function authorizePartnerBrowse(
  authorization: string | null,
  env: EnvMap = process.env,
): PartnerBrowseAuth {
  const tokens = partnerBrowseTokensFromEnv(env);
  if (tokens.length === 0) {
    return {
      ok: false,
      status: 503,
      body: ebayBrowseError(
        2003,
        "APPLICATION",
        "Partner Browse proxy is not configured.",
        "Set PARTNER_BROWSE_TOKEN (32+ characters) on WatchSeeBuy.",
      ),
    };
  }

  const presented = bearerToken(authorization);
  if (!presented || !tokens.some((token) => timingSafeEqualString(presented, token))) {
    return {
      ok: false,
      status: 401,
      body: ebayBrowseError(
        1001,
        "REQUEST",
        "Invalid access token",
        "Invalid access token. Check the value of the Authorization HTTP request header.",
      ),
    };
  }

  return { ok: true };
}

export function partnerBrowsePath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  const parts: string[] = [];
  for (const raw of segments) {
    const segment = raw.trim();
    if (!segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\")) {
      return null;
    }
    parts.push(encodeURIComponent(segment));
  }
  return `${PARTNER_BROWSE_PATH_PREFIX}/${parts.join("/")}`;
}

export function browseApiNameFromPath(
  pathname: string,
): EbayApiCallEvent["api"] {
  const path = pathname.toLowerCase();
  if (path.includes("/item_summary/")) return "browse_search";
  if (path.includes("/item/")) return "get_item";
  return "browse_search";
}

/**
 * Keep follow-up Browse URLs (itemHref, href, next) on this host so a
 * partner that switched Authorization to the WatchSeeBuy token does not
 * send that token to api.ebay.com. Public listing URLs are unchanged.
 */
export function rewriteBrowseHrefs(body: string, publicOrigin: string): string {
  const origin = publicOrigin.replace(/\/+$/, "");
  if (!origin) return body;
  let rewritten = body;
  for (const host of EBAY_BROWSE_ORIGINS) {
    rewritten = rewritten.split(`${host}/buy/browse/`).join(`${origin}/buy/browse/`);
  }
  return rewritten;
}

export function ebayBrowseError(
  errorId: number,
  category: "REQUEST" | "APPLICATION" | "SYSTEM",
  message: string,
  longMessage: string,
) {
  return {
    errors: [
      {
        errorId,
        domain: "API_BROWSE",
        category,
        message,
        longMessage,
      },
    ],
  };
}

export function pickUpstreamBrowseHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, name) => {
    const key = name.toLowerCase();
    if (
      key === "content-type" ||
      key === "rlogid" ||
      key.startsWith("x-ebay-") ||
      key.startsWith("x-ratelimit")
    ) {
      out.set(name, value);
    }
  });
  if (!out.has("content-type")) {
    out.set("content-type", "application/json");
  }
  return out;
}

function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

function timingSafeEqualString(left: string, right: string): boolean {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}
