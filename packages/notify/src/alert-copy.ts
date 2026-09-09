import type { WatchFrequency } from "@waitseebuy/domain";

export const ALERT_EMAIL_TITLES = {
  on_change: "Potential new deal",
  daily: "Daily report",
  weekly: "Weekly report",
} as const satisfies Record<WatchFrequency, string>;

export function alertEmailTitle(frequency: WatchFrequency): string {
  return ALERT_EMAIL_TITLES[frequency];
}

export function alertEmailSubject(input: {
  frequency: WatchFrequency;
  watchLabel: string;
  listingCount: number;
}): string {
  const title = alertEmailTitle(input.frequency);
  const label = input.watchLabel.trim() || "your watch";
  if (input.frequency === "on_change") {
    return input.listingCount > 1
      ? `${title}: ${input.listingCount} new matches for ${label}`
      : `${title}: ${label}`;
  }
  return `${title}: ${label}`;
}

export function alertEmailIntro(input: {
  frequency: WatchFrequency;
  listingCount: number;
}): string {
  const n = input.listingCount;
  const listings = n === 1 ? "listing" : "listings";
  if (input.frequency === "on_change") {
    return n === 1
      ? "A new listing matches your watch. Price to your door is below."
      : `${n} new ${listings} match your watch. Price to your door is below.`;
  }
  if (input.frequency === "daily") {
    return n === 1
      ? "Today’s match for this watch. See the price to your door, then decide."
      : `Today’s ${n} matches for this watch. See the price to your door, then decide.`;
  }
  return n === 1
    ? "This week’s match for this watch. See the price to your door, then decide."
    : `This week’s ${n} matches for this watch. See the price to your door, then decide.`;
}
