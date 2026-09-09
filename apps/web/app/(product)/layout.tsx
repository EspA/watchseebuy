import { getDb, getUserSettings } from "@waitseebuy/db";
import { AccountTheme } from "@/components/account-theme";
import { AdblockBanner } from "@/components/adblock-banner";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { TimezoneSync } from "@/components/timezone-sync";
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

  return (
    <div className="shell">
      {session && !settings?.timezone ? <TimezoneSync /> : null}
      {session ? <AccountTheme theme={settings?.theme ?? null} /> : null}
      <Header />
      <AdblockBanner />
      {children}
      <SiteFooter disclosure="WaitSeeBuy is an independent product. If you buy through our links, we may earn a commission from the eBay Partner Network. That does not change the price you pay." />
    </div>
  );
}
