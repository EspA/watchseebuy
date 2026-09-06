/**
 * Official eBay REST MarketplaceIdEnum values used as
 * X-EBAY-C-MARKETPLACE-ID on Browse. India (EBAY_IN) is closed.
 * Motors (EBAY_MOTORS_US) is not a country site.
 * @see https://developer.ebay.com/api-docs/static/rest-request-components.html
 */

export const DEFAULT_EBAY_SITE = "EBAY_US";

export type EbaySiteOption = {
  value: string;
  label: string;
  flag: string;
  host: string;
  country: string;
  currency: string;
};

/** Live consumer marketplaces from MarketplaceIdEnum. Featured sites first.
 *  Hidden for now: Malaysia, Philippines, Taiwan, Thailand, Vietnam. */
export const EBAY_SITE_FILTERS: EbaySiteOption[] = [
  { value: "EBAY_AU", label: "Australia", flag: "🇦🇺", host: "ebay.com.au", country: "AU", currency: "AUD" },
  { value: "EBAY_CA", label: "Canada", flag: "🇨🇦", host: "ebay.ca", country: "CA", currency: "CAD" },
  { value: "EBAY_FR", label: "France", flag: "🇫🇷", host: "ebay.fr", country: "FR", currency: "EUR" },
  { value: "EBAY_DE", label: "Germany", flag: "🇩🇪", host: "ebay.de", country: "DE", currency: "EUR" },
  { value: "EBAY_IT", label: "Italy", flag: "🇮🇹", host: "ebay.it", country: "IT", currency: "EUR" },
  { value: "EBAY_ES", label: "Spain", flag: "🇪🇸", host: "ebay.es", country: "ES", currency: "EUR" },
  { value: "EBAY_GB", label: "United Kingdom", flag: "🇬🇧", host: "ebay.co.uk", country: "GB", currency: "GBP" },
  { value: "EBAY_US", label: "United States", flag: "🇺🇸", host: "ebay.com", country: "US", currency: "USD" },
  { value: "EBAY_AT", label: "Austria", flag: "🇦🇹", host: "ebay.at", country: "AT", currency: "EUR" },
  { value: "EBAY_BE", label: "Belgium", flag: "🇧🇪", host: "ebay.be", country: "BE", currency: "EUR" },
  { value: "EBAY_HK", label: "Hong Kong", flag: "🇭🇰", host: "ebay.com.hk", country: "HK", currency: "HKD" },
  { value: "EBAY_IE", label: "Ireland", flag: "🇮🇪", host: "ebay.ie", country: "IE", currency: "EUR" },
  { value: "EBAY_NL", label: "Netherlands", flag: "🇳🇱", host: "ebay.nl", country: "NL", currency: "EUR" },
  { value: "EBAY_PL", label: "Poland", flag: "🇵🇱", host: "ebay.pl", country: "PL", currency: "PLN" },
  { value: "EBAY_SG", label: "Singapore", flag: "🇸🇬", host: "ebay.com.sg", country: "SG", currency: "SGD" },
  { value: "EBAY_CH", label: "Switzerland", flag: "🇨🇭", host: "ebay.ch", country: "CH", currency: "CHF" },
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
