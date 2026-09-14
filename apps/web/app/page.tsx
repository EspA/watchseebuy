import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_EBAY_SITE } from "@waitseebuy/domain";
import { getDb, getUserSettings } from "@waitseebuy/db";
import { BrandLink, HeaderTools } from "@/components/header";
import { BrandMark } from "@/components/brand-mark";
import { EbaySiteSwitch } from "@/components/ebay-site-switch";
import { PreferenceCookieSync } from "@/components/preference-cookie-sync";
import { SearchSubmit } from "@/components/search-submit";
import { SiteFooter } from "@/components/site-footer";
import { getRequestPreferences } from "@/lib/request-preferences";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "WaitSeeBuy",
  description:
    "The PSA 10. The factory-sealed set. The carded figure. We watch with you and tell you when the price to your door is worth buying.",
  openGraph: {
    title: "WaitSeeBuy",
    description:
      "The PSA 10. The factory-sealed set. The carded figure. We watch with you and tell you when the price to your door is worth buying.",
    url: "https://waitseebuy.com",
    siteName: "WaitSeeBuy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "WaitSeeBuy",
    description:
      "The PSA 10. The factory-sealed set. The carded figure. We watch with you and tell you when the price to your door is worth buying.",
  },
};

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
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
              <p className="tease-kicker">{t("kicker")}</p>
              <h1 className="tease-title" aria-label="Wait. See. Buy.">
                <span>Wait.</span>
                <span>See.</span>
                <span>Buy.</span>
              </h1>
            </div>
            <div className="tease-mark-slot">
              <BrandMark className="tease-mark" alt="WaitSeeBuy" />
            </div>
          </div>
          <p className="tease-lede">{t("lede")}</p>

          {process.env.COMING_SOON === "1" ? null : (
            <>
              <form className="search tease-search" action="/search" method="get">
                {site !== DEFAULT_EBAY_SITE ? (
                  <input type="hidden" name="site" value={site} />
                ) : null}
                <input
                  name="q"
                  type="search"
                  required
                  placeholder={t("placeholder")}
                  aria-label={t("searchLabel")}
                />
                <SearchSubmit />
              </form>
              <EbaySiteSwitch
                site={site}
                leadSite={prefs.defaultSite}
                homeLinks
              />
            </>
          )}

          <ul className="tease-beats">
            <li>
              <h2>{t("waitTitle")}</h2>
              <p>{t("waitBody")}</p>
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
