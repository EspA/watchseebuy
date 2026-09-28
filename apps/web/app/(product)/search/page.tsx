import { unstable_noStore as noStore } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  attachPriceScores,
  landedCostCents,
  excludeWordsField,
  listingMatchesCondition,
  listingMatchesConfidence,
  listingMatchesItemLocation,
  listingMatchesListingType,
  listingMatchesPriceScore,
  suggestFilterGroup,
  toCoverageQuery,
  withinLandedRange,
  atWatchLimit,
  FREE_WATCH_LIMIT,
  SEARCH_PAGE_SIZE,
  parseSearchPage,
  searchOffset,
  searchPageCount,
} from "@watchseebuy/domain";
import { createEbayClientFromEnv } from "@watchseebuy/ebay";
import Link from "next/link";
import { EbaySiteSelect } from "@/components/ebay-site-select";
import { ExcludeWords } from "@/components/exclude-words";
import { ListingCard } from "@/components/listing-card";
import { SaveWatchForm } from "@/components/save-watch-form";
import { SearchSort } from "@/components/search-sort";
import { SearchPagination } from "@/components/search-pagination";
import { SearchSubmit } from "@/components/search-submit";
import { searchHrefWithPage } from "@/lib/search-href";
import {
  SearchForm,
  SearchPendingProvider,
  SearchResultsPane,
} from "@/components/search-navigation";
import { getDb, getUserSettings, countWatchesForUser } from "@watchseebuy/db";
import { headers } from "next/headers";
import { clientMeta, persistUserEvent } from "@/lib/client-meta";
import { intentFromSearchQuery, searchBarQuery } from "@/lib/search-params";
import { compareSearchListings, searchSortFromQuery } from "@/lib/search-sort";
import { getRequestPreferences } from "@/lib/request-preferences";
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
    cardNoReprints?: string;
    cardNoProxy?: string;
    unofficial?: string;
    figureCategory?: string;
    figureScale?: string;
    figurePackaging?: string;
    figureCompleteness?: string;
    figurePunch?: string;
    brickCategory?: string;
    brickType?: string;
    brickStatus?: string;
    wheelsCategory?: string;
    wheelsScale?: string;
    wheelsPackaging?: string;
    site?: string;
    page?: string;
    error?: string;
  }>;
}) {
  noStore();
  const query = await searchParams;
  const q = query.q ?? "";
  const page = parseSearchPage(query.page);
  const sort = searchSortFromQuery(query.sort);
  const session = await getSession();
  const settings = session
    ? await getUserSettings(getDb(), session.user.id)
    : null;
  const watchCount = session
    ? await countWatchesForUser(getDb(), session.user.id)
    : 0;
  const watchLimitReached =
    Boolean(session) && !query.watch && atWatchLimit(watchCount);
  const zip =
    query.zip !== undefined ? query.zip : (settings?.shipToPostal ?? undefined);
  const prefs = await getRequestPreferences({
    urlSite: query.site,
    settings,
  });
  const intent = intentFromSearchQuery({
    q,
    ...(query.watch !== undefined ? { watch: query.watch } : {}),
    ...(query.min !== undefined ? { min: query.min } : {}),
    ...(query.max !== undefined ? { max: query.max } : {}),
    ...(zip !== undefined ? { zip } : {}),
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
    ...(query.cardNoReprints !== undefined
      ? { cardNoReprints: query.cardNoReprints }
      : {}),
    ...(query.cardNoProxy !== undefined
      ? { cardNoProxy: query.cardNoProxy }
      : {}),
    ...(query.unofficial !== undefined ? { unofficial: query.unofficial } : {}),
    ...(query.figureCategory !== undefined
      ? { figureCategory: query.figureCategory }
      : {}),
    ...(query.figureScale !== undefined ? { figureScale: query.figureScale } : {}),
    ...(query.figurePackaging !== undefined
      ? { figurePackaging: query.figurePackaging }
      : {}),
    ...(query.figureCompleteness !== undefined
      ? { figureCompleteness: query.figureCompleteness }
      : {}),
    ...(query.figurePunch !== undefined ? { figurePunch: query.figurePunch } : {}),
    ...(query.brickCategory !== undefined
      ? { brickCategory: query.brickCategory }
      : {}),
    ...(query.brickType !== undefined ? { brickType: query.brickType } : {}),
    ...(query.brickStatus !== undefined ? { brickStatus: query.brickStatus } : {}),
    ...(query.wheelsCategory !== undefined
      ? { wheelsCategory: query.wheelsCategory }
      : {}),
    ...(query.wheelsScale !== undefined ? { wheelsScale: query.wheelsScale } : {}),
    ...(query.wheelsPackaging !== undefined
      ? { wheelsPackaging: query.wheelsPackaging }
      : {}),
    site: query.site ?? prefs.site,
  });
  const coverage = toCoverageQuery(intent);
  if (q.trim()) {
    const meta = clientMeta(await headers());
    await persistUserEvent({
      kind: "search",
      userId: session?.user.id ?? null,
      ip: meta.ip,
      meta: {
        q: q.trim().slice(0, 200),
        site: intent.ebaySite,
      },
    });
  }
  const ebay = createEbayClientFromEnv("web_search");
  const result = q.trim()
      ? await ebay.search(coverage, {
        offset: searchOffset(page),
        limit: SEARCH_PAGE_SIZE,
        locale: prefs.locale,
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
        listingMatchesItemLocation(listing, intent.itemLocation) &&
        listingMatchesConfidence(listing, intent.minConfidence)
      );
    });
  const identified =
    q.trim() && filtered.length > 0
      ? await ebay.hydrateProductSignals(
          filtered,
          coverage.ebaySite,
          prefs.locale,
        )
      : filtered;
  const listings = attachPriceScores(identified)
    .filter((listing) =>
      listingMatchesPriceScore(listing, intent.minPriceScore),
    )
    .sort((a, b) => compareSearchListings(a, b, sort));
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
    query.cardNoReprints,
    query.cardNoProxy,
    query.unofficial,
    query.figureCategory,
    query.figureScale,
    query.figurePackaging,
    query.figureCompleteness,
    query.figurePunch,
    query.brickCategory,
    query.brickType,
    query.brickStatus,
    query.wheelsCategory,
    query.wheelsScale,
    query.wheelsPackaging,
    query.site,
    query.sort,
    query.page,
  ].join("|");
  const filteredOut = result.listings.length > 0 && listings.length === 0;
  const suggestedGroup = suggestFilterGroup(result.listings);
  const pageCount = searchPageCount(result.total, result.listings.length, page);
  const pageLinks = {
    page,
    pageCount,
    ...(page > 1 ? { prevHref: searchHrefWithPage(query, page - 1) } : {}),
    ...(page < pageCount
      ? { nextHref: searchHrefWithPage(query, page + 1) }
      : {}),
  };
  const pagination =
    pageCount > 1 ? <SearchPagination {...pageLinks} /> : null;
  const t = await getTranslations("search");

  return (
    <main className="page">
      <SearchPendingProvider>
      {query.error === "limit" ? (
        <p className="banner">
          {t.rich("watchLimit", {
            limit: FREE_WATCH_LIMIT,
            watches: (chunks) => <Link href="/watches">{chunks}</Link>,
          })}
        </p>
      ) : null}
      <SearchForm>
        <div className="search">
          <div className="search-combo">
            <EbaySiteSelect site={intent.ebaySite} />
            <input
              key={searchBarQuery(q, intent)}
              name="q"
              type="search"
              defaultValue={searchBarQuery(q, intent)}
              placeholder={t("placeholder")}
              aria-label={t("label")}
            />
          </div>
          {query.watch ? (
            <input type="hidden" name="watch" value={query.watch} />
          ) : null}
          <SearchSubmit />
        </div>
        <ExcludeWords value={excludeWordsField(intent.excludeKeywords)} />
      </SearchForm>

      {q.trim() ? (
        <div className="search-split">
          <SaveWatchForm
            q={q}
            intent={intent}
            signedIn={Boolean(session)}
            {...(query.watch ? { watchId: query.watch } : {})}
            {...(settings?.shipToPostal
              ? { settingsPostal: settings.shipToPostal }
              : {})}
            {...(suggestedGroup ? { suggestedGroup } : {})}
            {...(watchLimitReached ? { atWatchLimit: true } : {})}
          />
          <SearchResultsPane>
          {listings.length > 0 ? (
            <div className="results">
              <div className="results-toolbar">
                <p className="results-count">
                  {listings.length}{" "}
                  {listings.length === 1 ? t("result") : t("results")}
                  {pageCount > 1 && pageCount <= 20
                    ? ` · ${t("pageOf", { page, pageCount })}`
                    : pageCount > 20
                      ? ` · ${t("page", { page })}`
                      : ""}
                </p>
                <div className="results-toolbar-actions">
                  <SearchSort value={sort} />
                  {pageCount > 1 ? (
                    <SearchPagination {...pageLinks} compact />
                  ) : null}
                </div>
              </div>
              <ul className="listings" key={scoreScope}>
                {listings.map((listing) => (
                  <ListingCard
                    key={`${listing.ebayItemId}:${listing.priceScore.score}:${listing.priceScore.sampleSize}:${listing.priceScore.deltaPct}`}
                    listing={listing}
                    site={intent.ebaySite}
                  />
                ))}
              </ul>
              {pagination}
            </div>
          ) : (
            <div className="panel">
              <p>
                {filteredOut
                  ? t("noMatchFilters")
                  : (result.note ?? t("noListings"))}
              </p>
              {pagination}
            </div>
          )}
          </SearchResultsPane>
        </div>
      ) : null}
      </SearchPendingProvider>
    </main>
  );
}
