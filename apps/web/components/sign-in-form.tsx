"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type Provider = "google" | "facebook" | "apple";

export function SignInForm({
  available,
  callbackURL,
}: {
  available: { google: boolean; facebook: boolean; apple: boolean };
  callbackURL: string;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function social(provider: Provider) {
    setError(null);
    const { error: err } = await authClient.signIn.social({
      provider,
      callbackURL,
    });
    if (err) setError(err.message ?? "Sign-in failed");
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: err } = await authClient.signIn.magicLink({
      email,
      callbackURL,
    });
    if (err) {
      setError(err.message ?? "Could not send link");
      return;
    }
    setSent(true);
    try {
      const res = await fetch("/api/dev/magic-link");
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) setDevLink(data.url);
      }
    } catch {
      // Local helper only; the server log still has the URL.
    }
  }

  const anySocial = available.google || available.facebook || available.apple;

  return (
    <div className="stack">
      {available.google ? (
        <button className="btn wide" type="button" onClick={() => social("google")}>
          Continue with Google
        </button>
      ) : null}
      {available.facebook ? (
        <button className="btn wide secondary" type="button" onClick={() => social("facebook")}>
          Continue with Facebook
        </button>
      ) : null}
      {available.apple ? (
        <button className="btn wide secondary" type="button" onClick={() => social("apple")}>
          Continue with Apple
        </button>
      ) : null}

      {anySocial ? <p className="muted">or use email</p> : null}

      {sent ? (
        <div className="stack">
          <p>
            No inbox yet in local — open the sign-in link from the web server
            log
            {devLink ? ", or use the link below." : "."}
          </p>
          {devLink ? (
            <p>
              <a href={devLink}>Open local sign-in link</a>
            </p>
          ) : null}
        </div>
      ) : (
        <form className="stack" onSubmit={sendLink}>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              border: "1px solid var(--line)",
              background: "var(--card)",
              color: "var(--ink)",
              padding: "14px 16px",
              borderRadius: 6,
            }}
          />
          <button className="btn wide" type="submit">
            Email me a sign-in link
          </button>
        </form>
      )}

      {error ? <p className="muted">{error}</p> : null}
    </div>
  );
}
