"use client";

import { WATCH_FREQUENCY_FILTERS, type WatchFrequency } from "@waitseebuy/domain";
import { dollarsField } from "@/lib/search-params";

export function WatchSettingsForm({
  watchId,
  maxLandedCents,
  frequency,
}: {
  watchId: string;
  maxLandedCents?: number;
  frequency: WatchFrequency;
}) {
  return (
    <form
      className="watch-settings"
      action={`/api/watches/${watchId}`}
      method="post"
    >
      <label>
        Max price
        <input
          name="max"
          type="text"
          inputMode="decimal"
          placeholder="optional"
          defaultValue={dollarsField(maxLandedCents)}
          onBlur={(event) => event.currentTarget.form?.requestSubmit()}
        />
      </label>
      <label className="watch-settings-frequency">
        Frequency
        <select
          name="frequency"
          defaultValue={frequency}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {WATCH_FREQUENCY_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
