"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const { error: err } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (err) {
      setError(err.message ?? "Could not reset password");
      return;
    }
    router.replace("/settings?password=set");
    router.refresh();
  }

  return (
    <form className="settings-form" onSubmit={(event) => void submit(event)}>
      <label>
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label>
        Confirm password
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <div className="settings-actions">
        <button className="btn" type="submit">
          Save password
        </button>
      </div>
      {error ? <p className="muted">{error}</p> : null}
    </form>
  );
}
