import { authClient } from "@/lib/auth-client";

type ResetResult = { error?: { message?: string } | null };

type PasswordResetClient = {
  requestPasswordReset?: (args: {
    email: string;
    redirectTo: string;
  }) => Promise<ResetResult>;
  forgetPassword: (args: {
    email: string;
    redirectTo: string;
  }) => Promise<ResetResult>;
};

export async function requestPasswordReset(email: string) {
  const client = authClient as unknown as PasswordResetClient;
  const args = { email, redirectTo: "/reset-password" };
  if (client.requestPasswordReset) {
    return client.requestPasswordReset(args);
  }
  return client.forgetPassword(args);
}

export async function peekDevResetLink() {
  try {
    const res = await fetch("/api/dev/magic-link");
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}
