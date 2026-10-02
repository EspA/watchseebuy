"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function CancelSubscription({
  planName,
  endsOn,
}: {
  planName: string;
  endsOn: string;
}) {
  const t = useTranslations("settings");
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <p className="settings-plan-link">
        <button
          type="button"
          className="btn secondary"
          onClick={() => setConfirming(true)}
        >
          {t("cancelSubscription")}
        </button>
      </p>
    );
  }

  return (
    <form action="/api/billing/cancel" method="post" className="settings-cancel">
      <p className="muted">{t("cancelConfirm", { plan: planName, date: endsOn })}</p>
      <div className="settings-plan-actions">
        <button className="btn" type="submit">
          {t("cancelSubscription")}
        </button>
        <button
          className="btn secondary"
          type="button"
          onClick={() => setConfirming(false)}
        >
          {t("keepPlan")}
        </button>
      </div>
    </form>
  );
}
