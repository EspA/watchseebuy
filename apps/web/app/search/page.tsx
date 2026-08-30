import {
  landedCostCents,
  excludeWordsField,
  listingMatchesCondition,
  listingMatchesConfidence,
  listingMatchesListingType,
  listingPassesExcludeKeywords,
  toCoverageQuery,
  withinLandedRange,
} from "@waitseebuy/domain";
import { createEbayClientFromEnv } from "@waitseebuy/ebay";
import { ExcludeWords } from "@/components/exclude-words";
import { ListingCard } from "@/components/listing-card";
import { SaveWatchForm } from "@/components/save-watch-form";
import { SearchSort } from "@/components/search-sort";
import { intentFromSearchQuery, searchBarQuery } from "@/lib/search-params";
import { priceSortFromQuery } from "@/lib/search-sort";
import { getSession } from "@/lib/session";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    watch?: string;
    min?: string;
    max?: string;
    zip?: string;
    condition?: string;
    located?: string;
    to?: string;
    confidence?: string;
    listing?: string;
    exclude?: string;
    sort?: string;
    set?: string;
    rarity?: string;
    printing?: string;
    language?: string;
  }>;
}) {
  const query = await searchParams;
  const q = query.q ?? "";
  const sort = priceSortFromQuery(query.sort);
  const intent = intentFromSearchQuery({
    q,
    ...(query.watch !== undefined ? { watch: query.watch } : {}),
    ...(query.min !== undefined ? { min: query.min } : {}),
    ...(query.max !== undefined ? { max: query.max } : {}),
    ...(query.zip !== undefined ? { zip: query.zip } : {}),
    ...(query.condition !== undefined ? { condition: query.condition } : {}),
    ...(query.located !== undefined ? { located: query.located } : {}),
    ...(query.to !== undefined ? { to: query.to } : {}),
    ...(query.confidence !== undefined ? { confidence: query.confidence } : {}),
    ...(query.listing !== undefined ? { listing: query.listing } : {}),
    ...(query.exclude !== undefined ? { exclude: query.exclude } : {}),
    ...(query.set !== undefined ? { set: query.set } : {}),
    ...(query.rarity !== undefined ? { rarity: query.rarity } : {}),
    ...(query.printing !== undefined ? { printing: query.printing } : {}),
    ...(query.language !== undefined ? { language: query.language } : {}),
  });
  const coverage = toCoverageQuery(intent);
  const session = await getSession();
  const ebay = createEbayClientFromEnv();
  const result = q.trim()
    ? await ebay.search(coverage, {
        ...(intent.maxLandedCents !== undefined
          ? { maxLandedCents: intent.maxLandedCents }
          : {}),
      })
    : { listings: [], configured: ebay.isConfigured() };

  const listings = result.listings
    .filter((listing) => {
      const landedOk = withinLandedRange(
        landedCostCents({
          itemCents: listing.itemCents,
          shippingCents: listing.shippingCents,
        }),
        intent,
      );
      return (
        landedOk &&
        listingMatchesCondition(listing, intent.condition) &&
        listingMatchesListingType(listing, intent.listingType) &&
        listingMatchesConfidence(listing, intent.minConfidence) &&
        listingPassesExcludeKeywords(listing, intent.excludeKeywords)
      );
    })
    .sort((a, b) => {
      const left = landedCostCents({
        itemCents: a.itemCents,
        shippingCents: a.shippingCents,
      });
      const right = landedCostCents({
        itemCents: b.itemCents,
        shippingCents: b.shippingCents,
      });
      return sort === "price-desc" ? right - left : left - right;
    });
  const filteredOut = result.listings.length > 0 && listings.length === 0;

  return (
    <main className="page">
      <h1>Search</h1>
      <form id="search-form" className="search-block" action="/search" method="get">
        <div className="search">
          <input
            name="q"
            type="search"
            defaultValue={searchBarQuery(q, intent)}
            placeholder="PSA 10 1986 Fleer Jordan"
            aria-label="Search collectibles"
          />
          {query.watch ? (
            <input type="hidden" name="watch" value={query.watch} />
          ) : null}
          <button type="submit">See prices</button>
        </div>
        <ExcludeWords value={excludeWordsField(intent.excludeKeywords)} />
      </form>

      {q.trim() ? (
        <div className="search-split">
          <SaveWatchForm
            q={q}
            intent={intent}
            signedIn={Boolean(session)}
            {...(query.watch ? { watchId: query.watch } : {})}
          />
          {listings.length > 0 ? (
            <div className="results">
              <div className="results-toolbar">
                <p className="results-count">
                  {listings.length}{" "}
                  {listings.length === 1 ? "result" : "results"}
                </p>
                <SearchSort value={sort} />
              </div>
              <ul className="listings">
                {listings.map((listing) => (
                  <ListingCard key={listing.ebayItemId} listing={listing} />
                ))}
              </ul>
            </div>
          ) : (
            <div className="panel">
              <p>
                {filteredOut
                  ? "Nothing matches those filters. Try widening price, condition, or location."
                  : (result.note ?? "No listings matched that search.")}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
