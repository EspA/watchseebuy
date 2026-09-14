import {
  EBAY_STAT_WINDOWS,
  ebayApiBreakdown,
  ebayApiDailyStats,
  ebayApiStatusBreakdown,
  ebayApiWindowStats,
  getDb,
  listRecentEbayAccountDeletions,
  parseEbayStatWindow,
} from "@waitseebuy/db";
import {
  notificationEndpointStatusFromEnv,
  partnerBrowseStatusFromEnv,
} from "@waitseebuy/ebay";
import Link from "next/link";
import { CountLink } from "@/components/count-link";
import { ebayFailuresHref, ebayPageHref } from "@/lib/ebay-stats";
import { formatDate, formatUtcDay } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function EbayStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();
  const { days: rawDays } = await searchParams;
  const days = parseEbayStatWindow(rawDays);
  const db = getDb();
  const [totals, daily, breakdown, failures, deletions] = await Promise.all([
    ebayApiWindowStats(db, days),
    ebayApiDailyStats(db, days),
    ebayApiBreakdown(db, days),
    ebayApiStatusBreakdown(db, days),
    listRecentEbayAccountDeletions(db),
  ]);
  const deletionEndpoint = notificationEndpointStatusFromEnv();
  const partnerBrowse = partnerBrowseStatusFromEnv();
  const peak = Math.max(...daily.map((row) => row.total), 1);
  const firstDay = daily[0]?.day;
  const lastDay = daily[daily.length - 1]?.day;

  return (
    <main className="page">
      <h1>eBay API</h1>
      <p className="lede">
        Calls through the shared client, including the partner Browse proxy.
        Days are UTC. Click a failure count to see the HTTP status and error
        body. Source <code>partner_browse</code> is The Timeless Vault; it
        shares this app&apos;s eBay quota.
      </p>
      <nav className="windows" aria-label="Time window">
        {EBAY_STAT_WINDOWS.map((windowDays) => (
          <Link
            key={windowDays}
            href={ebayPageHref(windowDays)}
            aria-current={windowDays === days ? "page" : undefined}
          >
            Last {windowDays} days
          </Link>
        ))}
      </nav>
      <div className="cards">
        <div className="stat">
          <strong>{totals.total}</strong>
          <span>Calls</span>
        </div>
        <div className="stat">
          <strong>{totals.success}</strong>
          <span>Success</span>
        </div>
        <div className="stat">
          <strong>
            <CountLink
              count={totals.failure}
              href={ebayFailuresHref({ days })}
            />
          </strong>
          <span>Failure</span>
        </div>
        <div className="stat">
          <strong>
            <CountLink
              count={totals.rateLimited}
              href={ebayFailuresHref({ days, httpStatus: 429 })}
            />
          </strong>
          <span>HTTP 429</span>
        </div>
      </div>
      <div className="panel">
        <h2>Per day (UTC)</h2>
        {daily.every((row) => row.total === 0) ? (
          <p className="muted">No eBay calls recorded in this window.</p>
        ) : (
          <>
            <div className="day-chart" aria-hidden="true">
              {daily.map((row) => {
                const height = Math.max((row.total / peak) * 100, row.total ? 4 : 0);
                const title = `${formatUtcDay(row.day)}: ${row.total} calls, ${row.failure} failed`;
                const stack = (
                  <span
                    className="day-chart-stack"
                    style={{ height: `${height}%` }}
                  >
                    <span
                      className="day-chart-fail"
                      style={{ flexGrow: row.failure }}
                    />
                    <span
                      className="day-chart-ok"
                      style={{ flexGrow: Math.max(row.success, 0.0001) }}
                    />
                  </span>
                );
                return row.failure > 0 ? (
                  <Link
                    key={row.day}
                    className="day-chart-col"
                    href={ebayFailuresHref({ days, day: row.day })}
                    title={title}
                  >
                    {stack}
                  </Link>
                ) : (
                  <span key={row.day} className="day-chart-col" title={title}>
                    {stack}
                  </span>
                );
              })}
            </div>
            {firstDay && lastDay ? (
              <div className="day-chart-axis">
                <span>{formatUtcDay(firstDay)}</span>
                <span>{formatUtcDay(lastDay)}</span>
              </div>
            ) : null}
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Total</th>
                  <th>Success</th>
                  <th>Failure</th>
                  <th>429</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().map((row) => (
                  <tr key={row.day} id={`day-${row.day}`}>
                    <td>{formatUtcDay(row.day)}</td>
                    <td>{row.total}</td>
                    <td>{row.success}</td>
                    <td>
                      <CountLink
                        count={row.failure}
                        href={ebayFailuresHref({ days, day: row.day })}
                      />
                    </td>
                    <td>
                      <CountLink
                        count={row.rateLimited}
                        href={ebayFailuresHref({
                          days,
                          day: row.day,
                          httpStatus: 429,
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Partner Browse proxy</h2>
        <p className="muted">
          The Timeless Vault can call official eBay Browse through this app at{" "}
          <code>/buy/browse/v1/*</code> with{" "}
          <code>Authorization: Bearer</code> matching{" "}
          <code>PARTNER_BROWSE_TOKEN</code>. Unset the token to turn the
          proxy off.
        </p>
        <dl className="dl">
          <dt>Path</dt>
          <dd>{partnerBrowse.publicPath}</dd>
          <dt>Partner token</dt>
          <dd>{partnerBrowse.tokenSet ? "Set" : "Missing (proxy off)"}</dd>
        </dl>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>By API and source</h2>
        {breakdown.length === 0 ? (
          <p className="muted">No eBay calls recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>API</th>
                <th>Source</th>
                <th>Total</th>
                <th>Success</th>
                <th>Failure</th>
                <th>429</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={`${row.api}:${row.source}`}>
                  <td>{row.api}</td>
                  <td>{row.source}</td>
                  <td>{row.total}</td>
                  <td>{row.success}</td>
                  <td>
                    <CountLink
                      count={row.failure}
                      href={ebayFailuresHref({
                        days,
                        api: row.api,
                        source: row.source,
                      })}
                    />
                  </td>
                  <td>
                    <CountLink
                      count={row.rateLimited}
                      href={ebayFailuresHref({
                        days,
                        api: row.api,
                        source: row.source,
                        httpStatus: 429,
                      })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Failed calls by HTTP status</h2>
        {failures.length === 0 ? (
          <p className="muted">No failed calls in this window.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>API</th>
                <th>HTTP status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {failures.map((row) => (
                <tr key={`${row.api}:${row.httpStatus ?? "none"}`}>
                  <td>{row.api}</td>
                  <td>{row.httpStatus ?? "—"}</td>
                  <td>
                    <CountLink
                      count={row.total}
                      href={ebayFailuresHref({
                        days,
                        api: row.api,
                        httpStatus: row.httpStatus,
                      })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Marketplace user account deletion</h2>
        <p className="muted">
          eBay calls{" "}
          <code>/api/ebay/account-deletion</code> when a marketplace user
          closes their account. We strip that seller&apos;s username from
          cached listing snapshots. Register this exact URL and the
          verification token in Application Keys.
        </p>
        <dl className="dl">
          <dt>Endpoint</dt>
          <dd>
            {deletionEndpoint.endpoint ?? "—"}
            {deletionEndpoint.configured ? "" : " (not ready)"}
          </dd>
          <dt>Verification token</dt>
          <dd>{deletionEndpoint.tokenSet ? "Set" : "Missing"}</dd>
        </dl>
        {deletionEndpoint.error ? (
          <p className="error">{deletionEndpoint.error}</p>
        ) : null}
        {deletions.length === 0 ? (
          <p className="muted">No deletion notifications received yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>Username</th>
                <th>User ID</th>
                <th>Listings cleared</th>
                <th>Notification</th>
              </tr>
            </thead>
            <tbody>
              {deletions.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.receivedAt)}</td>
                  <td>{row.username ?? "—"}</td>
                  <td>{row.ebayUserId ?? "—"}</td>
                  <td>{row.listingsRedacted}</td>
                  <td>{row.notificationId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
