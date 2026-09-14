import { getTranslations } from "next-intl/server";
import {
  canResetPassword,
  socialAuthLabel,
} from "@waitseebuy/domain";
import { getDb, getUserAuthSummary, getUserSettings } from "@waitseebuy/db";
import { redirect } from "next/navigation";
import { PasswordSettings } from "@/components/password-settings";
import { SettingsForm } from "@/components/settings-form";
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
  searchParams: Promise<{ saved?: string; password?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in?next=/settings");
  }

  const { saved, password } = await searchParams;
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
  const t = await getTranslations("settings");

  return (
    <main className="page settings-page">
      <h1>{t("title")}</h1>
      {saved ? <p className="banner">{t("saved")}</p> : null}
      {notice ? (
        <p className={password === "set" ? "banner" : "muted"}>{notice}</p>
      ) : null}

      <div className="settings">
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
