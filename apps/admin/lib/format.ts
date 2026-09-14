import { socialAuthLabel } from "@waitseebuy/domain";

const DATE = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatUtcDay(day: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE.format(date);
}

export function formatProviders(providerIds: string[]) {
  if (providerIds.length === 0) return "—";
  return providerIds
    .map((id) => {
      if (id === "credential") return "Password";
      if (id === "magic-link" || id === "magicLink") return "Magic link";
      return socialAuthLabel(id);
    })
    .join(", ");
}

export function formatEventKind(kind: string) {
  if (kind === "buy_click") return "Buy click";
  if (kind === "search") return "Search";
  return kind;
}
