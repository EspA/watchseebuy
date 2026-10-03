import {
  claimEmailSend,
  finishEmailSend,
  getDb,
  recordEmailSend,
  releaseEmailSend,
  type EmailKind,
  type EmailSendStatus,
} from "@watchseebuy/db";
import nodemailer from "nodemailer";
import { escapeHtml } from "./html.ts";
import { smtpConfigFromEnv } from "./smtp.ts";

export type { EmailKind, EmailSendStatus };

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  kind: EmailKind;
  html?: string;
  replyTo?: string;
  from?: string;
  userId?: string | null;
  /** Stable id so a repeated subscription event does not mail twice. */
  dedupeId?: string;
}) {
  const smtp = smtpConfigFromEnv();
  const dedupe = input.dedupeId?.trim() || undefined;
  let claimed = false;
  let sent = false;
  try {
    if (dedupe && process.env.DATABASE_URL) {
      claimed = await claimEmailSend(getDb(), {
        id: dedupe,
        kind: input.kind,
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
      });
      if (!claimed) return { delivered: false as const };
    }

    if (smtp) {
      const transport = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        ...(smtp.user
          ? { auth: { user: smtp.user, pass: smtp.pass ?? "" } }
          : {}),
      });
      await transport.sendMail({
        from:
          input.from ??
          process.env.EMAIL_FROM ??
          "WatchSeeBuy <alerts@watchseebuy.com>",
        to: input.to,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<pre>${escapeHtml(input.text)}</pre>`,
      });
      sent = true;
      await recordOutcome(dedupe, claimed, {
        kind: input.kind,
        status: "delivered",
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
      });
      return { delivered: true as const };
    }

    console.log(
      JSON.stringify({
        at: new Date().toISOString(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        message: "SMTP_HOST is not set; email logged only.",
      }),
    );
    await recordOutcome(dedupe, claimed, {
      kind: input.kind,
      status: "logged_only",
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
    });
    return { delivered: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (sent) {
      await recordOutcome(dedupe, claimed, {
        kind: input.kind,
        status: "delivered",
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
      });
      return { delivered: true as const };
    }
    if (claimed && dedupe) {
      try {
        await releaseEmailSend(getDb(), dedupe);
      } catch (releaseError) {
        console.error(
          "email claim release failed",
          releaseError instanceof Error ? releaseError.message : releaseError,
        );
      }
    } else {
      await persistEmailSend({
        kind: input.kind,
        status: "failed",
        error: message,
        ...(input.userId !== undefined ? { userId: input.userId } : {}),
      });
    }
    throw error;
  }
}

async function recordOutcome(
  dedupe: string | undefined,
  claimed: boolean,
  input: {
    kind: EmailKind;
    userId?: string | null;
    status: EmailSendStatus;
    error?: string;
  },
) {
  if (claimed && dedupe) {
    try {
      await finishEmailSend(getDb(), {
        id: dedupe,
        status: input.status,
        ...(input.error !== undefined ? { error: input.error } : {}),
      });
    } catch (error) {
      console.error(
        "email claim finish failed",
        error instanceof Error ? error.message : error,
      );
    }
    return;
  }
  await persistEmailSend(input);
}

async function persistEmailSend(input: {
  kind: EmailKind;
  userId?: string | null;
  status: EmailSendStatus;
  error?: string;
}) {
  if (!process.env.DATABASE_URL) return;
  try {
    await recordEmailSend(getDb(), {
      kind: input.kind,
      status: input.status,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      ...(input.error !== undefined ? { error: input.error } : {}),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        message: "email_sends insert failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
