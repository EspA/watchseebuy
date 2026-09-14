import {
  DEFAULT_APP_LOCALE,
  DEFAULT_EBAY_SITE,
  resolvePreferences,
  type AppLocale,
} from "@waitseebuy/domain";
import { clientMeta } from "@/lib/client-meta";
import {
  EBAY_SITE_COOKIE,
  LOCALE_COOKIE,
} from "@/lib/preference-cookies";

export type ResolvedPreferences = {
  site: string;
  defaultSite: string;
  locale: AppLocale;
};

export { resolvePreferences };
export {
  EBAY_SITE_COOKIE,
  LOCALE_COOKIE,
  PREFERENCE_COOKIE_MAX_AGE,
  preferenceCookieOptions,
} from "@/lib/preference-cookies";

export function preferencesFromRequest(
  headers: Headers,
  cookies: { get(name: string): { value: string } | undefined },
  input?: {
    urlSite?: string | null;
    accountSite?: string | null;
    accountLocale?: string | null;
  },
): ResolvedPreferences {
  const meta = clientMeta(headers);
  return resolvePreferences({
    urlSite: input?.urlSite,
    accountSite: input?.accountSite,
    accountLocale: input?.accountLocale,
    cookieSite: cookies.get(EBAY_SITE_COOKIE)?.value,
    cookieLocale: cookies.get(LOCALE_COOKIE)?.value,
    country: meta.country,
    acceptLanguage: headers.get("accept-language"),
  });
}

export function fallbackPreferences(): ResolvedPreferences {
  return {
    site: DEFAULT_EBAY_SITE,
    defaultSite: DEFAULT_EBAY_SITE,
    locale: DEFAULT_APP_LOCALE,
  };
}
