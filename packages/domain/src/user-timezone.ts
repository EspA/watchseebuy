import {
  parseWatchFrequency,
  type WatchFrequency,
} from "./watch-frequency.ts";

export const DEFAULT_USER_TIMEZONE = "America/New_York";
export const WATCH_DIGEST_HOUR = 20;
export const WATCH_WEEKLY_DIGEST_DAY = 0;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function isIanaTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function parseUserTimeZone(
  raw: string | undefined | null,
): string | undefined {
  const value = raw?.trim();
  if (!value || !isIanaTimeZone(value)) return undefined;
  return value;
}

export function resolveUserTimeZone(raw: string | undefined | null): string {
  return parseUserTimeZone(raw) ?? DEFAULT_USER_TIMEZONE;
}

export function zonedDateKey(
  date: Date,
  timeZone = DEFAULT_USER_TIMEZONE,
): string {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function addCalendarDays(day: string, delta: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  const next = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + delta),
  );
  return next.toISOString().slice(0, 10);
}

export function zonedDayBounds(
  day: string,
  timeZone = DEFAULT_USER_TIMEZONE,
): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [year, month, dayNum] = day.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const start = wallTimeToUtc(
    { year, month, day: dayNum, hour: 0, minute: 0, second: 0 },
    timeZone,
  );
  const next = addCalendarDays(day, 1);
  const [nextYear, nextMonth, nextDay] = next.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const end = wallTimeToUtc(
    {
      year: nextYear,
      month: nextMonth,
      day: nextDay,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
  return { start, end };
}

export function zonedCalendarDays(
  days: number,
  now = new Date(),
  timeZone = DEFAULT_USER_TIMEZONE,
): string[] {
  const today = zonedDateKey(now, timeZone);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(addCalendarDays(today, -i));
  }
  return keys;
}

export function zonedWindowStart(
  days: number,
  now = new Date(),
  timeZone = DEFAULT_USER_TIMEZONE,
): Date {
  const first = zonedCalendarDays(days, now, timeZone)[0] ?? zonedDateKey(now, timeZone);
  return zonedDayBounds(first, timeZone)?.start ?? now;
}

export function listTimeZones(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return Intl.supportedValuesOf("timeZone");
  }
  return [DEFAULT_USER_TIMEZONE, "UTC"];
}

export function timeZoneLabel(zone: string): string {
  const city = zone.split("/").slice(1).join(" / ").replaceAll("_", " ");
  return city || zone;
}

export function timeZoneGroups(): { region: string; zones: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const zone of listTimeZones()) {
    const region = zone.split("/")[0] ?? zone;
    const list = groups.get(region) ?? [];
    list.push(zone);
    groups.set(region, list);
  }
  return [...groups.entries()].map(([region, zones]) => ({ region, zones }));
}

export function nextWatchDigestAt(
  frequency: WatchFrequency | string,
  timeZone: string,
  now = new Date(),
): Date | null {
  const parsed = parseWatchFrequency(frequency);
  if (parsed === "on_change") return null;
  const zone = resolveUserTimeZone(timeZone);
  const targetWeekday =
    parsed === "weekly" ? WATCH_WEEKLY_DIGEST_DAY : undefined;
  return nextLocalHour(now, zone, WATCH_DIGEST_HOUR, targetWeekday);
}

function nextLocalHour(
  now: Date,
  timeZone: string,
  hour: number,
  weekday?: number,
): Date {
  for (let dayOffset = 0; dayOffset <= 8; dayOffset += 1) {
    const probe = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const parts = zonedParts(probe, timeZone);
    if (weekday !== undefined && parts.weekday !== weekday) continue;
    const candidate = wallTimeToUtc(
      {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour,
        minute: 0,
        second: 0,
      },
      timeZone,
    );
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  throw new Error(`could not find next digest in ${timeZone}`);
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

function wallTimeToUtc(
  wall: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );
  const offset = offsetAt(utcGuess, timeZone);
  let instant = utcGuess - offset;
  const shifted = offsetAt(instant, timeZone);
  if (shifted !== offset) instant = utcGuess - shifted;
  return new Date(instant);
}

function offsetAt(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instant;
}
