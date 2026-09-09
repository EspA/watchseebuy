import { nextWatchDigestAt } from "./user-timezone.ts";
import { parseWatchFrequency, type WatchFrequency } from "./watch-frequency.ts";

export function isWatchDigestDue(input: {
  frequency: WatchFrequency | string;
  timeZone: string;
  createdAt: Date;
  lastSentAt?: Date | null;
  now?: Date;
}): boolean {
  const frequency = parseWatchFrequency(input.frequency);
  if (frequency === "on_change") return false;
  const scheduled = nextWatchDigestAt(
    frequency,
    input.timeZone,
    input.lastSentAt ?? input.createdAt,
  );
  if (!scheduled) return false;
  return scheduled.getTime() <= (input.now ?? new Date()).getTime();
}
