import {
  getDb,
  recordEmailSend,
  type EmailKind,
  type EmailSendStatus,
} from "@waitseebuy/db";
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
}) {
  const smtp = smtpConfigFromEnv();
  try {
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
          "WaitSeeBuy <alerts@waitseebuy.com>",
        to: input.to,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<pre>${escapeHtml(input.text)}</pre>`,
      });
      await persistEmailSend({
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
    await persistEmailSend({
      kind: input.kind,
      status: "logged_only",
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
    });
    return { delivered: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await persistEmailSend({
      kind: input.kind,
      status: "failed",
      error: message,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
    });
    throw error;
  }
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
