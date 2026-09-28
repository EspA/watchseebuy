"use client";

import { useTranslations } from "next-intl";
import { WATCH_FREQUENCY_FILTERS, type WatchFrequency } from "@watchseebuy/domain";
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
  const t = useTranslations("watches");
  const frequencyLabel: Record<string, string> = {
    on_change: t("frequencyOnChange"),
    daily: t("frequencyDaily"),
    weekly: t("frequencyWeekly"),
  };
  return (
    <form
      className="watch-settings"
      action={`/api/watches/${watchId}`}
      method="post"
    >
      <label>
        {t("maxPrice")}
        <input
          name="max"
          type="text"
          inputMode="decimal"
          placeholder={t("optional")}
          defaultValue={dollarsField(maxLandedCents)}
          onBlur={(event) => event.currentTarget.form?.requestSubmit()}
        />
      </label>
      <label className="watch-settings-frequency">
        {t("frequency")}
        <select
          name="frequency"
          defaultValue={frequency}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {WATCH_FREQUENCY_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {frequencyLabel[option.value] ?? option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
