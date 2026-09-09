import { sendTransactionalEmail } from "@waitseebuy/notify";
import { NextResponse } from "next/server";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const CONTACT_INBOX = "contact@waitseebuy.com";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(form: FormData, name: string, max: number) {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  const form = await request.formData();
  if (field(form, "company", 80)) {
    return NextResponse.json({ ok: true });
  }

  const name = field(form, "name", 200);
  const email = field(form, "email", 254);
  const phone = field(form, "phone", 40);
  const comment = field(form, "comment", 5000);

  if (!name || !email || !comment) {
    return NextResponse.json(
      { error: "Name, email, and comment are required." },
      { status: 400 },
    );
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const phoneLine = phone || "(not provided)";
  const text = [
    "New message from the WaitSeeBuy contact form.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phoneLine}`,
    "",
    "Comment:",
    comment,
  ].join("\n");
  const html = `
    <p>New message from the WaitSeeBuy contact form.</p>
    <p>
      <strong>Name:</strong> ${escapeHtml(name)}<br />
      <strong>Email:</strong> ${escapeHtml(email)}<br />
      <strong>Phone:</strong> ${escapeHtml(phoneLine)}
    </p>
    <p><strong>Comment:</strong></p>
    <p>${escapeHtml(comment).replaceAll("\n", "<br />")}</p>
  `;

  try {
    const sent = await sendTransactionalEmail({
      to: CONTACT_INBOX,
      from: `WaitSeeBuy <${CONTACT_INBOX}>`,
      replyTo: `${name} <${email}>`,
      subject: `Contact form: ${name}`,
      text,
      html,
      kind: "contact",
    });
    if (!sent.delivered) {
      return NextResponse.json(
        { error: "Could not send your message." },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not send your message." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
