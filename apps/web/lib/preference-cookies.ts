import type { AppLocale } from "@waitseebuy/domain";

export const LOCALE_COOKIE = "wsb_locale";
export const EBAY_SITE_COOKIE = "wsb_ebay_site";
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function preferenceCookieOptions() {
  return {
    path: "/",
    maxAge: PREFERENCE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
  };
}

export function applyPreferenceCookies(site: string, locale: AppLocale) {
  const maxAge = PREFERENCE_COOKIE_MAX_AGE;
  document.cookie = `${EBAY_SITE_COOKIE}=${site}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function applyLocaleCookie(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function applySiteCookie(site: string) {
  document.cookie = `${EBAY_SITE_COOKIE}=${site}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; samesite=lax`;
}
