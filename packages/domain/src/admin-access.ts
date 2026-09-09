export const DEFAULT_ADMIN_EMAIL = "contact@waitseebuy.com";

export function isAllowedAdminEmail(
  email: string,
  allowed: string = process.env.ADMIN_ALLOWED_EMAIL ?? DEFAULT_ADMIN_EMAIL,
) {
  return email.trim().toLowerCase() === allowed.trim().toLowerCase();
}
