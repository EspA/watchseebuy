export const SOCIAL_AUTH_PROVIDERS = ["google", "facebook", "apple"] as const;

export type SocialAuthProvider = (typeof SOCIAL_AUTH_PROVIDERS)[number];

export function isSocialAuthProvider(value: string): value is SocialAuthProvider {
  return (SOCIAL_AUTH_PROVIDERS as readonly string[]).includes(value);
}

export function canResetPassword(providerIds: readonly string[]): boolean {
  const hasSocial = providerIds.some(isSocialAuthProvider);
  const hasEmailAuth =
    providerIds.length === 0 ||
    providerIds.some((id) => !isSocialAuthProvider(id));
  return !hasSocial || hasEmailAuth;
}

export function socialAuthLabel(providerId: string): string {
  if (providerId === "google") return "Google";
  if (providerId === "facebook") return "Facebook";
  if (providerId === "apple") return "Apple";
  return providerId;
}
