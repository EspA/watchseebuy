"use client";

import { useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    setError(null);

    const body = new FormData(form);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not send your message.");
      setStatus("error");
      return;
    }

    form.reset();
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="contact-form-thanks">
        Thanks. We will get back to you soon.
      </p>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="contact-form-row">
        <label className="contact-field">
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required maxLength={200} />
        </label>
        <label className="contact-field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
      </div>
      <label className="contact-field">
        <span>Phone</span>
        <input
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
        />
      </label>
      <label className="contact-field contact-field-comment">
        <span>Comment</span>
        <textarea name="comment" required maxLength={5000} rows={7} />
      </label>
      <input
        className="contact-honeypot"
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      {error ? <p className="contact-form-error">{error}</p> : null}
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
