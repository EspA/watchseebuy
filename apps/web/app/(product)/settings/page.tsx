import { getLocale, getTranslations } from "next-intl/server";
import {
  canResetPassword,
  socialAuthLabel,
} from "@watchseebuy/domain";
import { getDb, getUserAuthSummary, getUserSettings } from "@watchseebuy/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CancelSubscription } from "@/components/cancel-subscription";
import { PasswordSettings } from "@/components/password-settings";
import { SettingsForm } from "@/components/settings-form";
import { currentBilling } from "@/lib/current-billing";
import { getRequestPreferences } from "@/lib/request-preferences";
import { getSession } from "@/lib/session";

function passwordNotice(status: string | undefined) {
  if (status === "set") return "Password saved.";
  if (status === "short") return "Use at least 8 characters.";
  if (status === "failed") return "Could not save that password.";
  return null;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; password?: string; plan?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in?next=/settings");
  }

  const { saved, password, plan } = await searchParams;
  const db = getDb();
  const [settings, authSummary] = await Promise.all([
    getUserSettings(db, session.user.id),
    getUserAuthSummary(db, session.user.id),
  ]);
  const allowPassword = canResetPassword(authSummary.providerIds);
  const socials = authSummary.providerIds
    .map(socialAuthLabel)
    .filter((label, index, all) => all.indexOf(label) === index);
  const notice = passwordNotice(password);
  const prefs = await getRequestPreferences({ settings });
  const billing = await currentBilling(session.user.id);
  const locale = await getLocale();
  const t = await getTranslations("settings");
  const expires = billing.expiresAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(billing.expiresAt)
    : null;
  const planNote = !expires
    ? t("planNoExpiry")
    : billing.status === "cancelled"
      ? t("planEnds", { date: expires })
      : t("planRenews", { date: expires });

  return (
    <main className="page settings-page">
      <h1>{t("title")}</h1>
      {saved ? <p className="banner">{t("saved")}</p> : null}
      {plan === "active" ? <p className="banner">{t("planActive")}</p> : null}
      {plan === "cancelled" ? <p className="banner">{t("planCancelled")}</p> : null}
      {plan === "cancel_failed" ? (
        <p className="muted">{t("planCancelFailed")}</p>
      ) : null}
      {notice ? (
        <p className={password === "set" ? "banner" : "muted"}>{notice}</p>
      ) : null}

      <div className="settings">
        <section className="panel settings-panel">
          <h2>{t("plan")}</h2>
          <p className="settings-plan-name">{t(`planName.${billing.plan}`)}</p>
          {billing.interval ? (
            <p className="muted">{t(`planInterval.${billing.interval}`)}</p>
          ) : null}
          <p className="muted">{planNote}</p>
          {billing.status === "active" && expires ? (
            <CancelSubscription
              planName={t(`planName.${billing.plan}`)}
              endsOn={expires}
            />
          ) : null}
          <p className="settings-plan-link">
            <Link href="/pricing">{t("seePlans")}</Link>
          </p>
        </section>

        <section className="panel settings-panel">
          <SettingsForm
            shipToPostal={settings?.shipToPostal ?? ""}
            timezone={settings?.timezone ?? ""}
            theme={settings?.theme ?? ""}
            ebaySite={settings?.ebaySite ?? prefs.defaultSite}
            locale={settings?.locale ?? prefs.locale}
          />
        </section>

        <section className="panel settings-panel">
          <h2>{t("password")}</h2>
          {allowPassword ? (
            <PasswordSettings
              email={settings?.email ?? session.user.email}
              hasPassword={authSummary.hasPassword}
            />
          ) : (
            <p className="muted">
              You sign in with {socials.join(" or ")}. Password reset is not
              used for this account.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
