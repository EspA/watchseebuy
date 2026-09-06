export const WATCH_FREQUENCIES = ["on_change", "daily", "weekly"] as const;

export type WatchFrequency = (typeof WATCH_FREQUENCIES)[number];

export const DEFAULT_WATCH_FREQUENCY: WatchFrequency = "on_change";

export const WATCH_FREQUENCY_FILTERS: {
  value: WatchFrequency;
  label: string;
}[] = [
  {
    value: "on_change",
    label: "Trigger on change (any matching deal)",
  },
  {
    value: "daily",
    label: "Daily report (8pm local)",
  },
  {
    value: "weekly",
    label: "Weekly report (Sunday 8pm local)",
  },
];

export function isWatchFrequency(value: string): value is WatchFrequency {
  return WATCH_FREQUENCIES.includes(value as WatchFrequency);
}

export function parseWatchFrequency(
  raw: string | undefined | null,
): WatchFrequency {
  const value = raw?.trim();
  return value && isWatchFrequency(value) ? value : DEFAULT_WATCH_FREQUENCY;
}
