import {
  asWatchCriteria,
  attachPriceScores,
  describeWatch,
  isWatchDigestDue,
  matchListing,
  parseListingTypeFilter,
  parseWatchFrequency,
  resolveUserTimeZone,
  searchPathForWatch,
  toCoverageQuery,
  type CoverageQuery,
} from "@waitseebuy/domain";
import {
  getDb,
  insertMatchIfNew,
  listAlertableWatches,
  listCoverageDueForPoll,
  listUnsentMatchesForWatch,
  listWatchesForCoverage,
  markCoveragePolled,
  recordAlerts,
  upsertListings,
  type CoverageToPoll,
  type UnsentMatch,
  type WatchForAlert,
} from "@waitseebuy/db";
import { createEbayClientFromEnv, type EbayClient } from "@waitseebuy/ebay";
import {
  listingFromPayload,
  renderAlertEmail,
  sendTransactionalEmail,
} from "@waitseebuy/notify";
import { randomBytes } from "node:crypto";

const DEFAULT_POLL_MS = 60 * 60 * 1000;
const MAX_EMAIL_LISTINGS = 12;

export async function tick(now = new Date()) {
  const db = getDb();
  const ebay = createEbayClientFromEnv("worker_poll");
  const pollMs = Number(process.env.COVERAGE_POLL_MS ?? DEFAULT_POLL_MS);
  const staleBefore = new Date(
    now.getTime() - (Number.isFinite(pollMs) && pollMs > 0 ? pollMs : DEFAULT_POLL_MS),
  );

  const due = await listCoverageDueForPoll(db, staleBefore);
  let polled = 0;
  let newMatches = 0;
  for (const coverage of due) {
    const result = await pollCoverage(db, ebay, coverage);
    polled += 1;
    newMatches += result.newMatches;
  }

  const sent = await sendDueAlerts(db, now);
  return { polled, newMatches, ...sent };
}

async function pollCoverage(
  db: ReturnType<typeof getDb>,
  ebay: EbayClient,
  coverage: CoverageToPoll,
) {
  const watches = await listWatchesForCoverage(db, coverage.id);
  const query = coverageQueryForPoll(coverage, watches[0]?.criteria);
  const search = await ebay.search(query);
  const found = search.listings ?? [];
  const identified =
    found.length > 0
      ? await ebay.hydrateProductSignals(found, query.ebaySite)
      : [];
  const scored = attachPriceScores(identified);

  await upsertListings(
    db,
    scored.map((listing) => ({
      ebayItemId: listing.ebayItemId,
      title: listing.title,
      payload: { ...listing, ebaySite: query.ebaySite },
    })),
  );

  let newMatches = 0;
  for (const watch of watches) {
    const criteria = asWatchCriteria(watch.criteria);
    if (!criteria) continue;
    for (const listing of scored) {
      const decision = matchListing(listing, criteria);
      if (!decision.matches) continue;
      const created = await insertMatchIfNew(db, {
        watchId: watch.id,
        ebayItemId: listing.ebayItemId,
        landedCents: decision.landedCents,
        compDeltaPct: listing.priceScore?.deltaPct ?? null,
      });
      if (created?.created) newMatches += 1;
    }
  }

  await markCoveragePolled(db, coverage.id);
  return { newMatches };
}

function coverageQueryForPoll(
  coverage: CoverageToPoll,
  rawCriteria: unknown,
): CoverageQuery {
  const criteria = asWatchCriteria(rawCriteria);
  if (criteria) return toCoverageQuery(criteria);
  return {
    key: coverage.key,
    keywords: coverage.keywords,
    condition: coverage.condition as CoverageQuery["condition"],
    ebaySite: coverage.ebaySite,
    listingType: parseListingTypeFilter(coverage.listingType),
  };
}

async function sendDueAlerts(db: ReturnType<typeof getDb>, now: Date) {
  const watches = await listAlertableWatches(db);
  let emails = 0;
  for (const watch of watches) {
    const sent = await maybeSendWatch(db, watch, now);
    if (sent) emails += 1;
  }
  return { emails };
}

async function maybeSendWatch(
  db: ReturnType<typeof getDb>,
  watch: WatchForAlert,
  now: Date,
) {
  const frequency = parseWatchFrequency(watch.alertFrequency);
  const timeZone = resolveUserTimeZone(watch.userTimezone);
  const unsent = await listUnsentMatchesForWatch(db, watch.id);

  if (frequency === "on_change") {
    if (unsent.length === 0) return false;
    await sendWatchEmail(db, watch, unsent, now);
    return true;
  }

  const due = isWatchDigestDue({
    frequency,
    timeZone,
    createdAt: watch.createdAt,
    lastSentAt: watch.lastAlertedAt,
    now,
  });
  if (!due) return false;
  if (unsent.length === 0) {
    await recordAlerts(db, {
      watchId: watch.id,
      channel: "email",
      items: [],
      sentAt: now,
    });
    return false;
  }
  await sendWatchEmail(db, watch, unsent, now);
  return true;
}

async function sendWatchEmail(
  db: ReturnType<typeof getDb>,
  watch: WatchForAlert,
  unsent: UnsentMatch[],
  now: Date,
) {
  const appUrl = (process.env.APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const criteria = asWatchCriteria(watch.criteria);
  const chosen = unsent.slice(0, MAX_EMAIL_LISTINGS);
  const prepared = chosen.flatMap((match) => {
    const clickToken = randomBytes(18).toString("base64url");
    const listing = listingFromPayload(
      match.listing.payload,
      `${appUrl}/out/${clickToken}`,
    );
    return listing ? [{ matchId: match.matchId, clickToken, listing }] : [];
  });
  const items = prepared.map(({ matchId, clickToken }) => ({
    matchId,
    clickToken,
  }));
  const listings = prepared.map(({ listing }) => listing);

  if (listings.length === 0) return;

  const email = renderAlertEmail({
    frequency: parseWatchFrequency(watch.alertFrequency),
    watchLabel: watch.label,
    watchSummary: criteria ? describeWatch(criteria) : watch.label,
    listings,
    openSearchUrl: `${appUrl}${searchPathForWatch({
      label: watch.label,
      criteria,
      watchId: watch.id,
    })}`,
    stopWatchUrl: `${appUrl}/watches/${watch.id}/stop`,
    appUrl,
    brandMarkUrl: `${appUrl}/brand-mark.png?v=16`,
    ...(criteria?.ebaySite ? { site: criteria.ebaySite } : {}),
  });

  await sendTransactionalEmail({
    to: watch.userEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
    kind: "alert",
    userId: watch.userId,
  });
  await recordAlerts(db, {
    watchId: watch.id,
    channel: "email",
    items,
    sentAt: now,
  });
}
