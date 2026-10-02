"use client";

import {
  PAID_PRICE_CENTS,
  PLAN_ENTITLEMENTS,
  formatUsdFromCents,
  type BillingInterval,
  type BillingPlan,
} from "@watchseebuy/domain";
import { useTranslations } from "next-intl";
import { useState } from "react";

const CARDS = ["free", "premium", "premium_plus"] as const;

export function PricingPlans({
  signedIn,
  plan,
  interval,
  status,
}: {
  signedIn: boolean;
  plan: BillingPlan;
  interval: BillingInterval | null;
  status: "active" | "cancelled" | null;
}) {
  const t = useTranslations("pricing");
  const [cycle, setCycle] = useState<BillingInterval>("monthly");

  return (
    <div className="pricing">
      <div className="pricing-cycle" role="group" aria-label={t("cycle")}>
        <button
          type="button"
          className={cycle === "monthly" ? "is-selected" : undefined}
          aria-pressed={cycle === "monthly"}
          onClick={() => setCycle("monthly")}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          className={cycle === "annual" ? "is-selected" : undefined}
          aria-pressed={cycle === "annual"}
          onClick={() => setCycle("annual")}
        >
          {t("annual")}
          <span>{t("annualNote")}</span>
        </button>
      </div>
      <div className="pricing-grid">
        {CARDS.map((card) => (
          <PlanCard
            key={card}
            card={card}
            cycle={cycle}
            signedIn={signedIn}
            plan={plan}
            interval={interval}
            status={status}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  card,
  cycle,
  signedIn,
  plan,
  interval,
  status,
}: {
  card: (typeof CARDS)[number];
  cycle: BillingInterval;
  signedIn: boolean;
  plan: BillingPlan;
  interval: BillingInterval | null;
  status: "active" | "cancelled" | null;
}) {
  const t = useTranslations("pricing");
  const entitlements = PLAN_ENTITLEMENTS[card];
  const current =
    plan === card &&
    (card === "free" || (interval === cycle && status === "active"));
  const price =
    card === "free"
      ? t("freePrice")
      : formatUsdFromCents(PAID_PRICE_CENTS[card][cycle]);
  const cadence = card === "free" ? null : cycle === "annual" ? t("perYear") : t("perMonth");
  const monthlyEquivalent =
    card !== "free" && cycle === "annual"
      ? formatUsdFromCents(Math.round(PAID_PRICE_CENTS[card].annual / 12))
      : null;
  const intervalLabel =
    card === "free" ? t("intervalHour") : card === "premium" ? t("interval15") : t("interval5");

  return (
    <article className={card === "premium" ? "pricing-card is-featured" : "pricing-card"}>
      <h2>{t(`name.${card}`)}</h2>
      <p className="pricing-price">
        {price}
        {cadence ? <span>{cadence}</span> : null}
        {monthlyEquivalent ? (
          <span className="pricing-equivalent">{`(${monthlyEquivalent}${t("perMonth")})`}</span>
        ) : null}
      </p>
      <ul>
        <li>{t("classicUnlimited")}</li>
        <li>
          {entitlements.aiSearchesPerMonth === null
            ? t("aiUnlimited")
            : t("aiLimited", { count: entitlements.aiSearchesPerMonth })}
        </li>
        <li>{t("watches", { count: entitlements.maxWatches })}</li>
        <li>{t("onChange", { interval: intervalLabel })}</li>
        {card === "premium_plus" ? <li>{t("earlyAccess")}</li> : null}
      </ul>
      <PlanAction
        card={card}
        cycle={cycle}
        signedIn={signedIn}
        current={current}
      />
    </article>
  );
}

function PlanAction({
  card,
  cycle,
  signedIn,
  current,
}: {
  card: (typeof CARDS)[number];
  cycle: BillingInterval;
  signedIn: boolean;
  current: boolean;
}) {
  const t = useTranslations("pricing");
  if (card === "free") {
    return (
      <button type="button" className="btn secondary" disabled>
        {current ? t("current") : t("included")}
      </button>
    );
  }
  if (current) {
    return (
      <button type="button" className="btn secondary" disabled>
        {t("current")}
      </button>
    );
  }
  if (!signedIn) {
    return (
      <a className="btn" href="/sign-in?next=%2Fpricing">
        {t("subscribe")}
      </a>
    );
  }
  return (
    <form action="/api/billing/subscribe" method="post">
      <input type="hidden" name="plan" value={card} />
      <input type="hidden" name="interval" value={cycle} />
      <button type="submit" className="btn wide">
        {t("subscribe")}
      </button>
    </form>
  );
}
