const MAX_POSTAL_LENGTH = 12;
const POSTAL_PATTERN = /^[A-Z0-9][A-Z0-9 -]*$/;

export function parseShipToPostal(
  raw: string | undefined | null,
): string | undefined {
  const value = raw?.trim().replace(/\s+/g, " ").toUpperCase();
  if (!value) return undefined;
  if (value.length > MAX_POSTAL_LENGTH) return undefined;
  if (!POSTAL_PATTERN.test(value)) return undefined;
  return value;
}
