import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "WaitSeeBuy — Live soon",
  description:
    "The PSA 10. The factory-sealed set. The carded figure. We watch with you and tell you when the price to your door is worth buying.",
  openGraph: {
    title: "WaitSeeBuy — Live soon",
    description:
      "The PSA 10. The factory-sealed set. The carded figure. We watch with you and tell you when the price to your door is worth buying.",
    url: "https://waitseebuy.com",
    siteName: "WaitSeeBuy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "WaitSeeBuy — Live soon",
    description:
      "The PSA 10. The factory-sealed set. The carded figure. We watch with you and tell you when the price to your door is worth buying.",
  },
};

export default function ComingSoonPage() {
  return (
    <div className="tease">
      <div className="tease-inner">
        <header className="tease-top">
          <p className="tease-brand">WaitSeeBuy.com</p>
          {process.env.COMING_SOON === "1" ? (
            <p className="tease-status">Live soon</p>
          ) : (
            <AppNav />
          )}
        </header>

        <main className="tease-hero">
          <div className="tease-headline">
            <div className="tease-headline-copy">
              <p className="tease-kicker">For the exacting collector</p>
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
          <p className="tease-lede">
            The PSA 10. The factory-sealed set. The carded figure. We watch
            with you and tell you when the price to your door is worth buying.
          </p>

          {process.env.COMING_SOON === "1" ? null : (
            <form className="search tease-search" action="/search" method="get">
              <input
                name="q"
                type="search"
                required
                placeholder="PSA 10 1986 Fleer Jordan"
                aria-label="Search collectibles"
              />
              <button type="submit">See prices</button>
            </form>
          )}

          <ul className="tease-beats">
            <li>
              <h2>Wait</h2>
              <p>
                You share the piece and the precise criteria. We watch for you,
                and alert you on your schedule: a new listing, a daily note, or
                a weekly recap.
              </p>
            </li>
            <li>
              <h2>See</h2>
              <p>
                Search is quick and obvious. Every listing shows a confidence
                score, a price score, and the price to your door. Nothing
                hidden.
              </p>
            </li>
            <li>
              <h2>Buy</h2>
              <p>
                We curate for collectors, not a faster marketplace. When
                it is worth it, you buy.
              </p>
            </li>
          </ul>

          <p className="tease-vert">
            Pokémon · LEGO · Hot Wheels · Labubu · Kenner Star Wars ·
            Transformers · TMNT · Barbie · G.I. Joe · He-Man
          </p>
        </main>

        <footer className="tease-foot">
          <p>© 2026 WaitSeeBuy.com</p>
        </footer>
      </div>
    </div>
  );
}
