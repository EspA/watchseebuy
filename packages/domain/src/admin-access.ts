export const DEFAULT_ADMIN_EMAIL = "contact@watchseebuy.com";

export function isAllowedAdminEmail(
  email: string,
  allowed: string = process.env.ADMIN_ALLOWED_EMAIL ?? DEFAULT_ADMIN_EMAIL,
) {
  const candidate = email.trim().toLowerCase();
  if (!candidate) return false;
  return allowed
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(candidate);
}
