import { unstable_noStore as noStore } from "next/cache";
import {
  attachPriceScores,
  landedCostCents,
  excludeWordsField,
  listingMatchesCondition,
  listingMatchesConfidence,
  listingMatchesListingType,
  listingMatchesPriceScore,
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

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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
    score?: string;
    listing?: string;
    exclude?: string;
    sort?: string;
    set?: string;
    rarity?: string;
    printing?: string;
    language?: string;
    grader?: string;
    grade?: string;
    cardLine?: string;
    cardCategory?: string;
    cardGame?: string;
    figureCategory?: string;
    brickCategory?: string;
    brickType?: string;
    brickStatus?: string;
  }>;
}) {
  noStore();
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
    ...(query.score !== undefined ? { score: query.score } : {}),
    ...(query.listing !== undefined ? { listing: query.listing } : {}),
    ...(query.exclude !== undefined ? { exclude: query.exclude } : {}),
    ...(query.set !== undefined ? { set: query.set } : {}),
    ...(query.rarity !== undefined ? { rarity: query.rarity } : {}),
    ...(query.printing !== undefined ? { printing: query.printing } : {}),
    ...(query.language !== undefined ? { language: query.language } : {}),
    ...(query.grader !== undefined ? { grader: query.grader } : {}),
    ...(query.grade !== undefined ? { grade: query.grade } : {}),
    ...(query.cardLine !== undefined ? { cardLine: query.cardLine } : {}),
    ...(query.cardCategory !== undefined
      ? { cardCategory: query.cardCategory }
      : {}),
    ...(query.cardGame !== undefined ? { cardGame: query.cardGame } : {}),
    ...(query.figureCategory !== undefined
      ? { figureCategory: query.figureCategory }
      : {}),
    ...(query.brickCategory !== undefined
      ? { brickCategory: query.brickCategory }
      : {}),
    ...(query.brickType !== undefined ? { brickType: query.brickType } : {}),
    ...(query.brickStatus !== undefined ? { brickStatus: query.brickStatus } : {}),
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

  const filtered = result.listings
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
  const identified =
    q.trim() && filtered.length > 0
      ? await ebay.hydrateProductSignals(filtered, coverage.ebaySite)
      : filtered;
  const listings = attachPriceScores(identified).filter((listing) =>
    listingMatchesPriceScore(listing, intent.minPriceScore),
  );
  const scoreScope = [
    q,
    query.min,
    query.max,
    query.condition,
    query.confidence,
    query.score,
    query.listing,
    query.located,
    query.to,
    query.zip,
    query.exclude,
    query.set,
    query.rarity,
    query.printing,
    query.language,
    query.grader,
    query.grade,
    query.cardLine,
    query.cardCategory,
    query.cardGame,
    query.figureCategory,
    query.brickCategory,
    query.brickType,
    query.brickStatus,
    query.sort,
  ].join("|");
  const filteredOut = result.listings.length > 0 && listings.length === 0;

  return (
    <main className="page">
      <h1>Search</h1>
      <form id="search-form" className="search-block" action="/search" method="get">
        <div className="search">
          <input
            key={searchBarQuery(q, intent)}
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
            key={scoreScope}
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
              <ul className="listings" key={scoreScope}>
                {listings.map((listing) => (
                  <ListingCard
                    key={`${listing.ebayItemId}:${listing.priceScore.score}:${listing.priceScore.sampleSize}:${listing.priceScore.deltaPct}`}
                    listing={listing}
                  />
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
