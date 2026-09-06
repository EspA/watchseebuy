"use client";

import {
  parseUserTimeZone,
  timeZoneGroups,
  timeZoneLabel,
} from "@waitseebuy/domain";
import { useEffect, useMemo, useState } from "react";

export function SettingsForm({
  shipToPostal,
  timezone,
}: {
  shipToPostal: string;
  timezone: string;
}) {
  const groups = useMemo(() => timeZoneGroups(), []);
  const [zone, setZone] = useState(timezone);
  const knownZones = useMemo(
    () => new Set(groups.flatMap((group) => group.zones)),
    [groups],
  );

  useEffect(() => {
    if (timezone) return;
    const detected = parseUserTimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    if (detected) setZone(detected);
  }, [timezone]);

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
          {zone && !knownZones.has(zone) ? (
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
      <div className="settings-actions">
        <button className="btn" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}
