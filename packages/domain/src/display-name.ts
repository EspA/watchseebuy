export function splitDisplayName(name: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  const firstName = parts[0] ?? null;
  if (parts.length === 1) return { firstName, lastName: null };
  return { firstName, lastName: parts.slice(1).join(" ") };
}
