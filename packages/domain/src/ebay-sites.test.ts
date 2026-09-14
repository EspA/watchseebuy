import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_APP_LOCALE,
  DEFAULT_EBAY_SITE,
  detectSiteAndLocale,
  ebayAcceptLanguage,
  ebaySiteForCountry,
  localeFromAcceptLanguage,
  parseAppLocale,
  parseEbaySite,
  resolvePreferences,
  storeLocaleOf,
} from "./ebay-sites.ts";

test("maps store countries and falls back to the US", () => {
  assert.equal(ebaySiteForCountry("FR"), "EBAY_FR");
  assert.equal(ebaySiteForCountry("de"), "EBAY_DE");
  assert.equal(ebaySiteForCountry("JP"), DEFAULT_EBAY_SITE);
  assert.equal(ebaySiteForCountry(""), DEFAULT_EBAY_SITE);
  assert.equal(ebaySiteForCountry(undefined), DEFAULT_EBAY_SITE);
});

test("store locale follows the marketplace default", () => {
  assert.equal(storeLocaleOf("EBAY_DE"), "de");
  assert.equal(storeLocaleOf("EBAY_FR"), "fr");
  assert.equal(storeLocaleOf("EBAY_CA"), "en");
  assert.equal(storeLocaleOf("EBAY_BE"), "nl");
  assert.equal(storeLocaleOf("EBAY_CH"), "de");
  assert.equal(storeLocaleOf("EBAY_US"), "en");
});

test("Accept-Language picks a supported locale and ignores the rest", () => {
  assert.equal(localeFromAcceptLanguage("fr-CA,fr;q=0.9,en;q=0.8"), "fr");
  assert.equal(localeFromAcceptLanguage("ja-JP,en;q=0.8"), "en");
  assert.equal(localeFromAcceptLanguage("zh-CN"), undefined);
  assert.equal(
    localeFromAcceptLanguage("fr-BE,nl;q=0.8", ["nl", "fr"]),
    "fr",
  );
  assert.equal(
    localeFromAcceptLanguage("de-DE,en;q=0.8", ["nl", "fr"]),
    undefined,
  );
});

test("bilingual countries use Accept-Language among store languages", () => {
  assert.deepEqual(
    detectSiteAndLocale({ country: "CA", acceptLanguage: "fr-CA,en;q=0.8" }),
    { site: "EBAY_CA", locale: "fr" },
  );
  assert.deepEqual(
    detectSiteAndLocale({ country: "CA", acceptLanguage: "de-DE" }),
    { site: "EBAY_CA", locale: "en" },
  );
  assert.deepEqual(
    detectSiteAndLocale({ country: "BE", acceptLanguage: "fr-BE" }),
    { site: "EBAY_BE", locale: "fr" },
  );
  assert.deepEqual(detectSiteAndLocale({ country: "BE" }), {
    site: "EBAY_BE",
    locale: "nl",
  });
  assert.deepEqual(
    detectSiteAndLocale({ country: "CH", acceptLanguage: "it-CH" }),
    { site: "EBAY_CH", locale: "it" },
  );
});

test("unsupported country and missing geo fall back to US English", () => {
  assert.deepEqual(detectSiteAndLocale({ country: "JP" }), {
    site: DEFAULT_EBAY_SITE,
    locale: DEFAULT_APP_LOCALE,
  });
  assert.deepEqual(
    detectSiteAndLocale({ acceptLanguage: "de-DE,en;q=0.5" }),
    { site: DEFAULT_EBAY_SITE, locale: "de" },
  );
  assert.deepEqual(detectSiteAndLocale({}), {
    site: DEFAULT_EBAY_SITE,
    locale: DEFAULT_APP_LOCALE,
  });
});

test("parseAppLocale rejects unknown values", () => {
  assert.equal(parseAppLocale("fr"), "fr");
  assert.equal(parseAppLocale("FR-CA"), "fr");
  assert.equal(parseAppLocale("zh"), undefined);
  assert.equal(parseAppLocale(""), undefined);
});

test("Browse Accept-Language uses the store locale and country", () => {
  assert.equal(ebayAcceptLanguage("EBAY_DE"), "de-DE");
  assert.equal(ebayAcceptLanguage("EBAY_CA", "fr"), "fr-CA");
  assert.equal(ebayAcceptLanguage("EBAY_CA", "de"), "en-CA");
  assert.equal(ebayAcceptLanguage("EBAY_BE", "fr"), "fr-BE");
});

test("preference precedence is URL, account, cookie, then geo", () => {
  assert.deepEqual(
    resolvePreferences({
      urlSite: "EBAY_DE",
      accountSite: "EBAY_FR",
      accountLocale: "fr",
      cookieSite: "EBAY_IT",
      cookieLocale: "it",
      country: "US",
    }),
    { site: "EBAY_DE", defaultSite: "EBAY_FR", locale: "fr" },
  );
  assert.deepEqual(
    resolvePreferences({
      accountSite: "EBAY_FR",
      cookieSite: "EBAY_IT",
      cookieLocale: "it",
      country: "DE",
    }),
    { site: "EBAY_FR", defaultSite: "EBAY_FR", locale: "it" },
  );
  assert.deepEqual(
    resolvePreferences({
      cookieSite: "EBAY_ES",
      cookieLocale: "es",
      country: "DE",
    }),
    { site: "EBAY_ES", defaultSite: "EBAY_ES", locale: "es" },
  );
  assert.equal(parseEbaySite("not-a-site"), undefined);
  assert.equal(parseAppLocale("nope"), undefined);
});
