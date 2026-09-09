"use client";

import {
  parseUserTimeZone,
  timeZoneGroups,
  timeZoneLabel,
} from "@waitseebuy/domain";
import { useEffect, useMemo, useState } from "react";
import { applyTheme, parseTheme, themeFromDocument, type Theme } from "@/lib/theme";

export function SettingsForm({
  shipToPostal,
  timezone,
  theme,
}: {
  shipToPostal: string;
  timezone: string;
  theme: string;
}) {
  const [zone, setZone] = useState(timezone);
  const [appearance, setAppearance] = useState<Theme>(
    parseTheme(theme) ?? "light",
  );
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
    <form className="settings-form" action="/api/settings" method="post">
      <label>
        Ship-to ZIP
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
        Used on search so you do not have to type it each time.
      </p>
      <label>
        Timezone
        <select
          name="timezone"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
        >
          {!zone ? <option value="">Detecting…</option> : null}
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
        Daily and weekly watch reports land at 8pm in this timezone.
      </p>
      <label>
        Appearance
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
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <p className="watch-note">
        Remembered on this account when you are signed in.
      </p>
      <div className="settings-actions">
        <button className="btn" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}
