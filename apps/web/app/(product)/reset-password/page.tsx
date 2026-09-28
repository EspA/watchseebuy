import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const invalid = error === "INVALID_TOKEN" || !token;

  return (
    <main className="page">
      <h1>Reset password</h1>
      <p className="lede">Choose a new password for this WatchSeeBuy account.</p>
      <div className="panel settings-panel" style={{ marginTop: 28, maxWidth: 420 }}>
        {invalid ? (
          <p className="muted">
            That reset link is invalid or expired.{" "}
            <Link href="/settings">Request a new one from Settings</Link>.
          </p>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
    </main>
  );
}
