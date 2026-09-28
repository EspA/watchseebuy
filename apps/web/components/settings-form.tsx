"use client";

import { useTranslations } from "next-intl";
import {
  APP_LOCALE_FILTERS,
  EBAY_SITE_FILTERS,
  parseAppLocale,
  parseEbaySite,
  parseUserTimeZone,
  timeZoneGroups,
  timeZoneLabel,
} from "@watchseebuy/domain";
import { useEffect, useMemo, useState } from "react";
import { applyPreferenceCookies } from "@/lib/preference-cookies";
import { applyTheme, parseTheme, themeFromDocument, type Theme } from "@/lib/theme";

export function SettingsForm({
  shipToPostal,
  timezone,
  theme,
  ebaySite,
  locale,
}: {
  shipToPostal: string;
  timezone: string;
  theme: string;
  ebaySite: string;
  locale: string;
}) {
  const [zone, setZone] = useState(timezone);
  const [site, setSite] = useState(ebaySite);
  const [language, setLanguage] = useState(locale);
  const [appearance, setAppearance] = useState<Theme>(
    parseTheme(theme) ?? "light",
  );
  const t = useTranslations("settings");
  const [menuReady, setMenuReady] = useState(false);
  const groups = useMemo(
    () => (menuReady ? timeZoneGroups() : []),
    [menuReady],
  );
  const knownZones = useMemo(
    () => new Set(groups.flatMap((group) => group.zones)),
    [groups],
  );

  useEffect(() => {
    setMenuReady(true);
    if (!parseTheme(theme)) setAppearance(themeFromDocument());
    if (timezone) return;
    const detected = parseUserTimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    if (detected) setZone(detected);
  }, [theme, timezone]);

  return (
    <form
      className="settings-form"
      action="/api/settings"
      method="post"
      onSubmit={() => {
        const nextSite = parseEbaySite(site);
        const nextLocale = parseAppLocale(language);
        if (nextSite && nextLocale) applyPreferenceCookies(nextSite, nextLocale);
      }}
    >
      <label>
        {t("ebayStore")}
        <select
          name="site"
          value={site}
          onChange={(event) => setSite(event.target.value)}
        >
          {EBAY_SITE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.flag} {option.label}
            </option>
          ))}
        </select>
      </label>
      <p className="watch-note">
        {t("ebayStoreNote")}
      </p>
      <label>
        {t("siteLanguage")}
        <select
          name="locale"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {APP_LOCALE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <p className="watch-note">
        {t("siteLanguageNote")}
      </p>
      <label>
        {t("shipTo")}
        <input
          name="zip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="10001"
          defaultValue={shipToPostal}
        />
      </label>
      <p className="watch-note">
        {t("shipToNote")}
      </p>
      <label>
        {t("timezone")}
        <select
          name="timezone"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
        >
          {!zone ? <option value="">{t("detecting")}</option> : null}
          {zone && (!menuReady || !knownZones.has(zone)) ? (
            <option value={zone}>{timeZoneLabel(zone)}</option>
          ) : null}
          {groups.map((group) => (
            <optgroup key={group.region} label={group.region}>
              {group.zones.map((item) => (
                <option key={item} value={item}>
                  {timeZoneLabel(item)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p className="watch-note">
        {t("timezoneNote")}
      </p>
      <label>
        {t("appearance")}
        <select
          name="theme"
          value={appearance}
          onChange={(event) => {
            const next = parseTheme(event.target.value);
            if (!next) return;
            setAppearance(next);
            applyTheme(next);
          }}
        >
          <option value="light">{t("light")}</option>
          <option value="dark">{t("dark")}</option>
        </select>
      </label>
      <p className="watch-note">
        {t("appearanceNote")}
      </p>
      <div className="settings-actions">
        <button className="btn" type="submit">
          {t("save")}
        </button>
      </div>
    </form>
  );
}
