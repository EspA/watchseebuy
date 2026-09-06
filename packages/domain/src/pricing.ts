export type LandedInputs = {
  itemCents: number;
  shippingCents: number;
  importEstimateCents?: number;
};

export function landedCostCents(input: LandedInputs): number {
  return (
    input.itemCents + input.shippingCents + (input.importEstimateCents ?? 0)
  );
}

export function formatUsd(cents: number): string {
  return formatMoney(cents, "USD");
}

export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function dollarsToCents(raw: string): number | undefined {
  const trimmed = raw.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100);
}

export function withinLandedRange(
  landedCents: number,
  bounds: { minLandedCents?: number; maxLandedCents?: number },
): boolean {
  if (
    bounds.minLandedCents !== undefined &&
    landedCents < bounds.minLandedCents
  ) {
    return false;
  }
  if (
    bounds.maxLandedCents !== undefined &&
    landedCents > bounds.maxLandedCents
  ) {
    return false;
  }
  return true;
}
