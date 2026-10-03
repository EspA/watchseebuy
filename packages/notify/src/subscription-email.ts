import { attr, escapeHtml } from "./html.ts";

const INK = "#1c1917";
const MUTED = "#57534e";
const PAPER = "#f6f1e8";
const CARD = "#fffdf8";
const LINE = "#e7e0d4";
const ACCENT = "#9a3412";

export type SubscriptionEmailInput = {
  planName: string;
  billingLabel: string;
  price: string;
  renewsOn: string;
  settingsUrl: string;
  appUrl: string;
  brandMarkUrl: string;
  firstName?: string | null;
};

export type RenderedSubscriptionEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderSubscriptionEmail(
  input: SubscriptionEmailInput,
): RenderedSubscriptionEmail {
  const subject = `Thanks for subscribing to WatchSeeBuy ${input.planName}`;
  const greeting = greetingLine(input.firstName, input.planName);
  const keep = `Cancel anytime in Settings. You keep ${input.planName} until that renewal date.`;
  return {
    subject,
    text: renderText({
      subject,
      greeting,
      planName: input.planName,
      billing: input.billingLabel,
      price: input.price,
      renews: input.renewsOn,
      keep,
      settingsUrl: input.settingsUrl,
    }),
    html: renderHtml({
      ...input,
      subject,
      greeting,
      billing: input.billingLabel,
      renews: input.renewsOn,
      keep,
    }),
  };
}

function greetingLine(firstName: string | null | undefined, planName: string): string {
  const name = firstName?.trim();
  if (name) return `Thank you, ${name}. Your ${planName} plan is active.`;
  return `Thank you. Your ${planName} plan is active.`;
}

function renderText(input: {
  subject: string;
  greeting: string;
  planName: string;
  billing: string;
  price: string;
  renews: string;
  keep: string;
  settingsUrl: string;
}): string {
  return [
    input.subject,
    "",
    input.greeting,
    "",
    `Plan: ${input.planName}`,
    `Billing: ${input.billing}`,
    `Price: ${input.price}`,
    `Renews: ${input.renews}`,
    "",
    input.keep,
    "",
    `View your plan: ${input.settingsUrl}`,
  ].join("\n");
}

function renderHtml(
  input: SubscriptionEmailInput & {
    subject: string;
    greeting: string;
    planName: string;
    billing: string;
    price: string;
    renews: string;
    keep: string;
  },
): string {
  const rows = (
    [
      ["Plan", input.planName],
      ["Billing", input.billing],
      ["Price", input.price],
      ["Renews", input.renews],
    ] as [string, string][]
  )
    .map(
      ([label, value]) => `<tr>
        <td style="padding:8px 12px 8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${MUTED};vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:${INK};">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK};font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(input.greeting)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:24px 12px 40px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:0 4px 20px;">
              <a href="${attr(input.appUrl)}" style="text-decoration:none;color:${INK};">
                <img src="${attr(input.brandMarkUrl)}" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border:0;">
                <span style="font-size:20px;letter-spacing:-0.02em;vertical-align:middle;padding-left:8px;">WatchSeeBuy</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 8px;color:${ACCENT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">
              Subscription
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 16px;font-size:28px;line-height:1.15;letter-spacing:-0.03em;">
              ${escapeHtml(input.planName)} is active
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.5;color:${INK};">
              ${escapeHtml(input.greeting)}
            </td>
          </tr>
          <tr>
            <td style="padding:4px 16px;background:${CARD};border:1px solid ${LINE};border-radius:10px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 4px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5;color:${MUTED};">
              ${escapeHtml(input.keep)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 8px;">
              <a href="${attr(input.settingsUrl)}" style="display:inline-block;background:${INK};color:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;text-decoration:none;padding:12px 16px;border-radius:6px;">View your plan</a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 4px 0;border-top:1px solid ${LINE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.55;color:${MUTED};">
              <a href="${attr(input.settingsUrl)}" style="color:${MUTED};">Settings</a>
              &nbsp;·&nbsp;
              <a href="${attr(input.appUrl)}" style="color:${MUTED};">watchseebuy.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
