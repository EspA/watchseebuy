import { getDb, getUserMailProfile } from "@watchseebuy/db";
import {
  PAID_PRICE_CENTS,
  formatUsdFromCents,
  resolveUserTimeZone,
  type BillingInterval,
  type PaidPlan,
} from "@watchseebuy/domain";
import { renderSubscriptionEmail, sendTransactionalEmail } from "@watchseebuy/notify";

const PLAN_NAME: Record<PaidPlan, string> = {
  premium: "Premium",
  premium_plus: "Premium+",
};

export async function sendSubscriptionWelcome(input: {
  userId: string;
  plan: PaidPlan;
  interval: BillingInterval;
  renewsAt: Date;
  paypalSubscriptionId: string;
}) {
  const profile = await getUserMailProfile(getDb(), input.userId);
  const email = profile?.email.trim();
  if (!email) return;

  const appUrl = (process.env.APP_URL ?? "https://watchseebuy.com").replace(/\/$/, "");
  const rendered = renderSubscriptionEmail({
    planName: PLAN_NAME[input.plan],
    billingLabel: input.interval === "annual" ? "Annual" : "Monthly",
    price: subscriptionPrice(input.plan, input.interval),
    renewsOn: new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeZone: resolveUserTimeZone(profile?.timezone),
    }).format(input.renewsAt),
    firstName: profile?.firstName,
    settingsUrl: `${appUrl}/settings`,
    appUrl,
    brandMarkUrl: `${appUrl}/brand-mark.png?v=16`,
  });

  await sendTransactionalEmail({
    to: email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    kind: "subscription",
    userId: input.userId,
    dedupeId: `subscription-welcome:${input.paypalSubscriptionId}`,
  });
}

function subscriptionPrice(plan: PaidPlan, interval: BillingInterval): string {
  const cents = PAID_PRICE_CENTS[plan][interval];
  const amount = formatUsdFromCents(cents);
  if (interval === "annual") {
    const monthly = formatUsdFromCents(Math.round(cents / 12));
    return `${amount} per year (${monthly} per month)`;
  }
  return `${amount} per month`;
}
