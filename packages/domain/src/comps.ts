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
  grade?: string;
}): string {
  return [
    parts.company?.toLowerCase() ?? "raw",
    parts.set.toLowerCase().replace(/\s+/g, "-"),
    parts.subject.toLowerCase().replace(/\s+/g, "-"),
    parts.grade ?? "ungraded",
  ].join("|");
}
