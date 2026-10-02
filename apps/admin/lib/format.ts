import { DEFAULT_USER_TIMEZONE, socialAuthLabel } from "@watchseebuy/domain";

const DATE = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: DEFAULT_USER_TIMEZONE,
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

export function formatSearchMode(meta: Record<string, unknown> | null | undefined) {
  const mode = meta && typeof meta.mode === "string" ? meta.mode : "";
  if (mode === "classic") return "Classic";
  if (mode === "agent") return "AI";
  return "—";
}

export function formatEventDetail(meta: Record<string, unknown> | null | undefined) {
  if (!meta) return "—";
  if (typeof meta.summary === "string" && meta.summary.trim()) {
    return meta.summary.trim();
  }
  const { mode: _mode, summary: _summary, filters, ...rest } = meta;
  const parts: string[] = [];
  if (typeof rest.q === "string" && rest.q.trim()) parts.push(rest.q.trim());
  if (filters && typeof filters === "object" && !Array.isArray(filters)) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === "") continue;
      parts.push(`${key}=${Array.isArray(value) ? value.join(",") : String(value)}`);
    }
  }
  const leftover = Object.fromEntries(
    Object.entries(rest).filter(([key]) => key !== "q"),
  );
  if (Object.keys(leftover).length > 0) parts.push(JSON.stringify(leftover));
  return parts.length > 0 ? parts.join(" · ") : "—";
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
