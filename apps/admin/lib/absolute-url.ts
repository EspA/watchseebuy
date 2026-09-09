const CONFIGURED_ORIGIN = (
  process.env.ADMIN_BETTER_AUTH_URL ??
  process.env.APP_URL ??
  ""
).replace(/\/$/, "");

/**
 * Builds an absolute URL for redirects.
 *
 * Cloud Run does not forward a usable `Host` header to this container, so
 * `new URL(path, request.url)` resolves against the container's own bind
 * address instead of the public domain (observed in production as
 * `https://localhost:8080/...`). Prefer the explicitly configured public
 * origin and only fall back to `request.url` when it isn't set, e.g. local
 * dev.
 */
export function absoluteUrl(pathAndQuery: string, request: { url: string }): URL {
  if (CONFIGURED_ORIGIN) {
    return new URL(pathAndQuery, CONFIGURED_ORIGIN);
  }
  return new URL(pathAndQuery, request.url);
}
