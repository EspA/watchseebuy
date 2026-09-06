"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { peekDevResetLink, requestPasswordReset } from "@/lib/password-reset";

export function PasswordSettings({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}) {
  const [resetState, setResetState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [resetError, setResetError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSaved, setChangeSaved] = useState(false);

  async function sendReset() {
    setResetState("sending");
    setResetError(null);
    setDevLink(null);
    const { error } = await requestPasswordReset(email);
    if (error) {
      setResetState("error");
      setResetError(error.message ?? "Could not send a reset email");
      return;
    }
    setResetState("sent");
    const url = await peekDevResetLink();
    if (url) setDevLink(url);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChangeError(null);
    setChangeSaved(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");
    if (newPassword.length < 8) {
      setChangeError("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setChangeError("New passwords do not match.");
      return;
    }
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      setChangeError(error.message ?? "Could not change password");
      return;
    }
    form.reset();
    setChangeSaved(true);
  }

  return (
    <div className="stack">
      {hasPassword ? (
        <form className="settings-form" onSubmit={changePassword}>
          <label>
            Current password
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <div className="settings-actions">
            <button className="btn" type="submit">
              Change password
            </button>
          </div>
          {changeSaved ? <p className="watch-note">Password updated.</p> : null}
          {changeError ? <p className="muted">{changeError}</p> : null}
        </form>
      ) : (
        <form className="settings-form" action="/api/settings/password" method="post">
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
          <p className="watch-note">
            Magic-link sign-in still works. A password is optional.
          </p>
          <div className="settings-actions">
            <button className="btn" type="submit">
              Set password
            </button>
          </div>
        </form>
      )}

      <div className="stack">
        <p className="watch-note">
          Or email a reset link to {email}.
        </p>
        <div className="settings-actions">
          <button
            className="btn secondary"
            type="button"
            disabled={resetState === "sending"}
            onClick={() => void sendReset()}
          >
            {resetState === "sending" ? "Sending…" : "Email a reset link"}
          </button>
        </div>
        {resetState === "sent" ? (
          <p>
            Reset link sent.
            {devLink ? (
              <>
                {" "}
                <a href={devLink}>Open local reset link</a>
              </>
            ) : null}
          </p>
        ) : null}
        {resetError ? <p className="muted">{resetError}</p> : null}
      </div>
    </div>
  );
}
