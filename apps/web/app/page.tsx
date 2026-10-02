import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getDb, getUserSettings } from "@watchseebuy/db";
import { BrandLink, HeaderTools } from "@/components/header";
import { BrandMark } from "@/components/brand-mark";
import { HomeSearch } from "@/components/home-search";
import { PreferenceCookieSync } from "@/components/preference-cookie-sync";
import { SiteFooter } from "@/components/site-footer";
import { getRequestPreferences } from "@/lib/request-preferences";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "WatchSeeBuy",
  description: "Your vintage toys finder companion. Whether it's a graded card, a rare Lego, or a carded figure, we help you search, watch, and buy the piece you're looking for.",
  openGraph: {
    title: "WatchSeeBuy",
    description: "Your vintage toys finder companion. Whether it's a graded card, a rare Lego, or a carded figure, we help you search, watch, and buy the piece you're looking for.",
    url: "https://watchseebuy.com",
    siteName: "WatchSeeBuy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "WatchSeeBuy",
    description: "Your vintage toys finder companion. Whether it's a graded card, a rare Lego, or a carded figure, we help you search, watch, and buy the piece you're looking for.",
  },
};

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string; mode?: string }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  const settings = session
    ? await getUserSettings(getDb(), session.user.id)
    : null;
  const prefs = await getRequestPreferences({
    urlSite: query.site,
    settings,
  });
  const site = prefs.site;
  const t = await getTranslations("home");
  return (
    <div className="tease">
      <PreferenceCookieSync site={prefs.defaultSite} locale={prefs.locale} />
      <div className="tease-inner">
        <header className="tease-top">
          <BrandLink />
          {process.env.COMING_SOON === "1" ? (
            <p className="tease-status">{t("liveSoon")}</p>
          ) : (
            <HeaderTools />
          )}
        </header>

        <main className="tease-hero">
          <div className="tease-headline">
            <div className="tease-headline-copy">
              <h1 className="tease-title" aria-label="Watch. See. Buy.">
                <span>Watch.</span>
                <span>See.</span>
                <span>Buy.</span>
              </h1>
            </div>
            <div className="tease-mark-slot">
              <BrandMark className="tease-mark" alt="WatchSeeBuy" />
            </div>
          </div>
          <p className="tease-slogan">{t("slogan")}</p>
          <p className="tease-lede">{t("lede")}</p>

          {process.env.COMING_SOON === "1" ? null : (
            <HomeSearch
              site={site}
              leadSite={prefs.defaultSite}
              agent={query.mode !== "classic"}
              signedIn={Boolean(session)}
            />
          )}

          <ul className="tease-beats">
            <li>
              <h2>{t("watchTitle")}</h2>
              <p>{t("watchBody")}</p>
            </li>
            <li>
              <h2>{t("seeTitle")}</h2>
              <p>{t("seeBody")}</p>
            </li>
            <li>
              <h2>{t("buyTitle")}</h2>
              <p>{t("buyBody")}</p>
            </li>
          </ul>

          <p className="tease-vert">
            Pokémon · LEGO · Hot Wheels · Labubu · Kenner Star Wars ·
            Transformers · TMNT · Barbie · G.I. Joe · He-Man
          </p>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
