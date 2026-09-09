import {
  canResetPassword,
  socialAuthLabel,
} from "@waitseebuy/domain";
import { getDb, getUserAuthSummary, getUserSettings } from "@waitseebuy/db";
import { redirect } from "next/navigation";
import { PasswordSettings } from "@/components/password-settings";
import { SettingsForm } from "@/components/settings-form";
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

  return (
    <main className="page settings-page">
      <h1>Settings</h1>
      {saved ? <p className="banner">Settings saved.</p> : null}
      {notice ? (
        <p className={password === "set" ? "banner" : "muted"}>{notice}</p>
      ) : null}

      <div className="settings">
        <section className="panel settings-panel">
          <h2>Delivery and time</h2>
          <SettingsForm
            shipToPostal={settings?.shipToPostal ?? ""}
            timezone={settings?.timezone ?? ""}
            theme={settings?.theme ?? ""}
          />
        </section>

        <section className="panel settings-panel">
          <h2>Password</h2>
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
