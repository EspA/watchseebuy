import { getTranslations } from "next-intl/server";
import { getDb, getUserSettings } from "@watchseebuy/db";
import { AccountTheme } from "@/components/account-theme";
import { AdblockBanner } from "@/components/adblock-banner";
import { Header } from "@/components/header";
import { PreferenceCookieSync } from "@/components/preference-cookie-sync";
import { SiteFooter } from "@/components/site-footer";
import { TimezoneSync } from "@/components/timezone-sync";
import { getRequestPreferences } from "@/lib/request-preferences";
import { getSession } from "@/lib/session";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const settings = session
    ? await getUserSettings(getDb(), session.user.id)
    : null;
  const prefs = await getRequestPreferences({ settings });
  const t = await getTranslations("footer");

  return (
    <div className="shell">
      <PreferenceCookieSync site={prefs.defaultSite} locale={prefs.locale} />
      {session && !settings?.timezone ? <TimezoneSync /> : null}
      {session ? <AccountTheme theme={settings?.theme ?? null} /> : null}
      <Header />
      <AdblockBanner />
      {children}
      <SiteFooter disclosure={t("disclosure")} />
    </div>
  );
}
