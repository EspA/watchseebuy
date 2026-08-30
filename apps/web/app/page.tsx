import { ExcludeWords } from "@/components/exclude-words";

export default function HomePage() {
  return (
    <main className="hero">
      <h1>Wait. See. Buy.</h1>
      <p className="lede">
        The fair-price companion for eBay collectibles. Look up a card, a
        figure, a comic, Lego toys. See what it actually sold for, including
        shipping.
        Save a watch when you are ready to wait.
      </p>
      <form className="search-block" action="/search" method="get">
        <div className="search">
          <input
            name="q"
            type="search"
            required
            placeholder="PSA 10 1986 Fleer Jordan"
            aria-label="Search collectibles"
          />
          <button type="submit">See prices</button>
        </div>
        <ExcludeWords value="" />
      </form>
    </main>
  );
}
