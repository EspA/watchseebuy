/**
 * Official eBay REST MarketplaceIdEnum values used as
 * X-EBAY-C-MARKETPLACE-ID on Browse. India (EBAY_IN) is closed.
 * Motors (EBAY_MOTORS_US) is not a country site.
 * @see https://developer.ebay.com/api-docs/static/rest-request-components.html
 */

export const DEFAULT_EBAY_SITE = "EBAY_US";

export const APP_LOCALES = ["en", "de", "fr", "it", "es", "nl", "pl"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_APP_LOCALE: AppLocale = "en";

export const APP_LOCALE_FILTERS: { value: AppLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
  { value: "es", label: "Español" },
  { value: "nl", label: "Nederlands" },
  { value: "pl", label: "Polski" },
];

export type EbaySiteOption = {
  value: string;
  label: string;
  flag: string;
  host: string;
  country: string;
  currency: string;
  locales: AppLocale[];
  defaultLocale: AppLocale;
};

/** Live consumer marketplaces from MarketplaceIdEnum. Featured sites first.
 *  Hidden for now: Malaysia, Philippines, Taiwan, Thailand, Vietnam. */
export const EBAY_SITE_FILTERS: EbaySiteOption[] = [
  { value: "EBAY_AU", label: "Australia", flag: "🇦🇺", host: "ebay.com.au", country: "AU", currency: "AUD", locales: ["en"], defaultLocale: "en" },
  { value: "EBAY_CA", label: "Canada", flag: "🇨🇦", host: "ebay.ca", country: "CA", currency: "CAD", locales: ["en", "fr"], defaultLocale: "en" },
  { value: "EBAY_FR", label: "France", flag: "🇫🇷", host: "ebay.fr", country: "FR", currency: "EUR", locales: ["fr"], defaultLocale: "fr" },
  { value: "EBAY_DE", label: "Germany", flag: "🇩🇪", host: "ebay.de", country: "DE", currency: "EUR", locales: ["de"], defaultLocale: "de" },
  { value: "EBAY_IT", label: "Italy", flag: "🇮🇹", host: "ebay.it", country: "IT", currency: "EUR", locales: ["it"], defaultLocale: "it" },
  { value: "EBAY_ES", label: "Spain", flag: "🇪🇸", host: "ebay.es", country: "ES", currency: "EUR", locales: ["es"], defaultLocale: "es" },
  { value: "EBAY_GB", label: "United Kingdom", flag: "🇬🇧", host: "ebay.co.uk", country: "GB", currency: "GBP", locales: ["en"], defaultLocale: "en" },
  { value: "EBAY_US", label: "United States", flag: "🇺🇸", host: "ebay.com", country: "US", currency: "USD", locales: ["en"], defaultLocale: "en" },
  { value: "EBAY_AT", label: "Austria", flag: "🇦🇹", host: "ebay.at", country: "AT", currency: "EUR", locales: ["de"], defaultLocale: "de" },
  { value: "EBAY_BE", label: "Belgium", flag: "🇧🇪", host: "ebay.be", country: "BE", currency: "EUR", locales: ["nl", "fr"], defaultLocale: "nl" },
  { value: "EBAY_HK", label: "Hong Kong", flag: "🇭🇰", host: "ebay.com.hk", country: "HK", currency: "HKD", locales: ["en"], defaultLocale: "en" },
  { value: "EBAY_IE", label: "Ireland", flag: "🇮🇪", host: "ebay.ie", country: "IE", currency: "EUR", locales: ["en"], defaultLocale: "en" },
  { value: "EBAY_NL", label: "Netherlands", flag: "🇳🇱", host: "ebay.nl", country: "NL", currency: "EUR", locales: ["nl"], defaultLocale: "nl" },
  { value: "EBAY_PL", label: "Poland", flag: "🇵🇱", host: "ebay.pl", country: "PL", currency: "PLN", locales: ["pl"], defaultLocale: "pl" },
  { value: "EBAY_SG", label: "Singapore", flag: "🇸🇬", host: "ebay.com.sg", country: "SG", currency: "SGD", locales: ["en"], defaultLocale: "en" },
  { value: "EBAY_CH", label: "Switzerland", flag: "🇨🇭", host: "ebay.ch", country: "CH", currency: "CHF", locales: ["de", "fr", "it"], defaultLocale: "de" },
];

const THE_LABELS = new Set([
  "United States",
  "United Kingdom",
  "Netherlands",
]);

const BY_VALUE = new Map(
  EBAY_SITE_FILTERS.map((option) => [option.value, option]),
);
const BY_COUNTRY = new Map(
  EBAY_SITE_FILTERS.map((option) => [option.country, option]),
);

export function parseEbaySite(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const key = raw.trim().toUpperCase().replace(/-/g, "_");
  if (BY_VALUE.has(key)) return key;
  if (key.startsWith("EBAY_") && BY_VALUE.has(key)) return key;
  const country = key.replace(/^EBAY_/, "");
  return BY_COUNTRY.get(country)?.value;
}

export function ebaySiteOf(raw: string | undefined): EbaySiteOption {
  const parsed = parseEbaySite(raw);
  return (parsed ? BY_VALUE.get(parsed) : undefined) ?? BY_VALUE.get(DEFAULT_EBAY_SITE)!;
}

export function ebaySiteLabel(value: string | undefined): string {
  return ebaySiteOf(value).label;
}

export function ebaySiteInPhrase(value: string | undefined): string {
  const label = ebaySiteLabel(value);
  return THE_LABELS.has(label) ? `the ${label}` : label;
}

export function ebaySiteHost(value: string | undefined): string {
  return ebaySiteOf(value).host;
}

export function ebaySiteCurrency(value: string | undefined): string {
  return ebaySiteOf(value).currency;
}

export function ebaySiteCountry(value: string | undefined): string {
  return ebaySiteOf(value).country;
}

export function ebaySitesWithLead(
  lead: string = DEFAULT_EBAY_SITE,
): EbaySiteOption[] {
  const head = EBAY_SITE_FILTERS.filter((option) => option.value === lead);
  const tail = EBAY_SITE_FILTERS.filter((option) => option.value !== lead);
  return head.length ? [...head, ...tail] : EBAY_SITE_FILTERS;
}

export function ebaySiteForCountry(
  country: string | undefined | null,
): string {
  const key = country?.trim().toUpperCase();
  if (!key) return DEFAULT_EBAY_SITE;
  return BY_COUNTRY.get(key)?.value ?? DEFAULT_EBAY_SITE;
}

export function storeLocaleOf(site: string | undefined): AppLocale {
  return ebaySiteOf(site).defaultLocale;
}

export function parseAppLocale(
  raw: string | undefined | null,
): AppLocale | undefined {
  if (!raw?.trim()) return undefined;
  const key = raw.trim().toLowerCase().split("-")[0];
  return APP_LOCALES.find((locale) => locale === key);
}

export function localeFromAcceptLanguage(
  header: string | undefined | null,
  allowed: readonly AppLocale[] = APP_LOCALES,
): AppLocale | undefined {
  if (!header?.trim()) return undefined;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return {
        tag: tag?.trim().toLowerCase() ?? "",
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((item) => item.tag && item.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const item of ranked) {
    const locale = parseAppLocale(item.tag);
    if (locale && allowed.includes(locale)) return locale;
  }
  return undefined;
}

export function detectSiteAndLocale(input: {
  country?: string | null;
  acceptLanguage?: string | null;
}): { site: string; locale: AppLocale } {
  const country = input.country?.trim().toUpperCase() || undefined;
  if (country && BY_COUNTRY.has(country)) {
    const option = BY_COUNTRY.get(country)!;
    const locale =
      option.locales.length > 1
        ? (localeFromAcceptLanguage(input.acceptLanguage, option.locales) ??
          option.defaultLocale)
        : option.defaultLocale;
    return { site: option.value, locale };
  }

  const locale =
    localeFromAcceptLanguage(input.acceptLanguage) ?? DEFAULT_APP_LOCALE;
  return { site: DEFAULT_EBAY_SITE, locale };
}

/** Browse Accept-Language for a marketplace, e.g. de-DE or fr-CA. */
export function ebayAcceptLanguage(
  site: string | undefined,
  locale?: AppLocale,
): string {
  const option = ebaySiteOf(site);
  const lang =
    locale && option.locales.includes(locale)
      ? locale
      : option.defaultLocale;
  return `${lang}-${option.country}`;
}

export function appLocaleLabel(value: AppLocale): string {
  return APP_LOCALE_FILTERS.find((option) => option.value === value)?.label ?? value;
}

export function resolvePreferences(input: {
  urlSite?: string | null;
  accountSite?: string | null;
  accountLocale?: string | null;
  cookieSite?: string | null;
  cookieLocale?: string | null;
  country?: string | null;
  acceptLanguage?: string | null;
}): { site: string; defaultSite: string; locale: AppLocale } {
  const detected = detectSiteAndLocale({
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.acceptLanguage !== undefined
      ? { acceptLanguage: input.acceptLanguage }
      : {}),
  });
  const locale =
    parseAppLocale(input.accountLocale) ??
    parseAppLocale(input.cookieLocale) ??
    detected.locale;
  const defaultSite =
    parseEbaySite(input.accountSite ?? undefined) ??
    parseEbaySite(input.cookieSite ?? undefined) ??
    detected.site;
  return {
    site: parseEbaySite(input.urlSite ?? undefined) ?? defaultSite,
    defaultSite,
    locale,
  };
}
