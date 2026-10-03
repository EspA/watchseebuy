import assert from "node:assert/strict";
import { test } from "node:test";
import { renderSubscriptionEmail } from "./subscription-email.ts";

const base = {
  settingsUrl: "https://watchseebuy.com/settings",
  appUrl: "https://watchseebuy.com",
  brandMarkUrl: "https://watchseebuy.com/brand-mark.png",
  renewsOn: "October 31, 2026",
} as const;

test("a monthly subscription email thanks the buyer and lists the plan", () => {
  const email = renderSubscriptionEmail({
    ...base,
    planName: "Premium",
    billingLabel: "Monthly",
    price: "$4.99 per month",
    firstName: "Sam",
  });
  assert.equal(email.subject, "Thanks for subscribing to WatchSeeBuy Premium");
  assert.match(email.text, /Thank you, Sam\. Your Premium plan is active\./);
  assert.match(email.text, /Price: \$4\.99 per month/);
  assert.match(email.text, /Billing: Monthly/);
  assert.match(email.text, /Renews: October 31, 2026/);
  assert.match(email.text, /Cancel anytime in Settings/);
  assert.match(email.html, /View your plan/);
});

test("annual billing shows the yearly price and the monthly equivalent", () => {
  const email = renderSubscriptionEmail({
    ...base,
    planName: "Premium+",
    billingLabel: "Annual",
    price: "$99.90 per year ($8.33 per month)",
  });
  assert.match(email.subject, /Premium\+/);
  assert.match(email.text, /Thank you\. Your Premium\+ plan is active\./);
  assert.match(email.text, /\$99\.90 per year \(\$8\.33 per month\)/);
  assert.match(email.text, /Billing: Annual/);
});

test("a first name is escaped in the html", () => {
  const email = renderSubscriptionEmail({
    ...base,
    planName: "Premium",
    billingLabel: "Monthly",
    price: "$4.99 per month",
    firstName: "<Sam>",
  });
  assert.match(email.html, /Thank you, &lt;Sam&gt;\./);
  assert.doesNotMatch(email.html, /Thank you, <Sam>/);
});
