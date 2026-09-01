export type SoldComp = {
  itemKey: string;
  windowDays: number;
  medianCents: number;
  sampleSize: number;
};

export function percentVsMedian(
  landedCents: number,
  medianCents: number,
): number | null {
  if (medianCents <= 0) return null;
  return Math.round(((landedCents - medianCents) / medianCents) * 100);
}

export function collectibleItemKey(parts: {
  company?: string;
  set: string;
  subject: string;
  cardNumber?: string;
  language?: string;
  variation?: string;
  grade?: string;
}): string {
  return [
    "card",
    parts.set.toLowerCase().replace(/\s+/g, "-"),
    parts.subject.toLowerCase().replace(/\s+/g, "-"),
    parts.cardNumber?.toLowerCase().replace(/\s+/g, "-") ?? "_",
    parts.language?.toLowerCase().replace(/\s+/g, "-") ?? "_",
    parts.variation?.toLowerCase().replace(/\s+/g, "-") ?? "_",
    parts.company?.toLowerCase() ?? "raw",
    parts.grade ?? "ungraded",
  ].join("|");
}
