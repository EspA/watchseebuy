import { getTranslations } from "next-intl/server";
import { PricingPlans } from "@/components/pricing-plans";
import { currentBilling } from "@/lib/current-billing";
import { getSession } from "@/lib/session";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();
  const billing = session
    ? await currentBilling(session.user.id)
    : { plan: "free" as const, interval: null, status: null, expiresAt: null };
  const t = await getTranslations("pricing");
  const notice =
    error === "cancelled"
      ? t("cancelled")
      : error === "unavailable"
        ? t("unavailable")
        : null;

  return (
    <main className="page pricing-page">
      <h1>{t("title")}</h1>
      <p className="muted pricing-lede">{t("lede")}</p>
      {notice ? <p className="banner">{notice}</p> : null}
      <PricingPlans
        signedIn={Boolean(session)}
        plan={billing.plan}
        interval={billing.interval}
        status={billing.status}
      />
    </main>
  );
}
