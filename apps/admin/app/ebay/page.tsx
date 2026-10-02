import {
  EBAY_STAT_WINDOWS,
  ebayApiBreakdown,
  ebayApiDailyStats,
  ebayApiStatusBreakdown,
  ebayApiWindowStats,
  getDb,
  listRecentEbayAccountDeletions,
  parseEbayStatDay,
  parseEbayStatWindow,
} from "@watchseebuy/db";
import {
  notificationEndpointStatusFromEnv,
  partnerBrowseStatusFromEnv,
} from "@watchseebuy/ebay";
import Link from "next/link";
import { CountLink } from "@/components/count-link";
import { ebayFailuresHref, ebayPageHref } from "@/lib/ebay-stats";
import { formatDate, formatUtcDay } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function EbayStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; day?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const days = parseEbayStatWindow(query.days);
  const day = parseEbayStatDay(query.day, days);
  const db = getDb();
  const [totals, daily, breakdown, failures, deletions] = await Promise.all([
    ebayApiWindowStats(db, days),
    ebayApiDailyStats(db, days),
    ebayApiBreakdown(db, days, day),
    ebayApiStatusBreakdown(db, days, day),
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
        Days are Eastern Time. Pick a day to filter the API table, or click a
        failure count to see the error body. Source{" "}
        <code>partner_browse</code> is The Timeless Vault; it shares this
        app&apos;s eBay quota.
      </p>
      <nav className="windows" aria-label="Time window">
        {EBAY_STAT_WINDOWS.map((windowDays) => (
          <Link
            key={windowDays}
            href={ebayPageHref(windowDays, parseEbayStatDay(day, windowDays))}
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
        <h2>Per day (ET)</h2>
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
                return (
                  <Link
                    key={row.day}
                    className={`day-chart-col${day === row.day ? " selected" : ""}`}
                    href={`${ebayPageHref(days, row.day)}#by-api`}
                    title={title}
                    aria-current={day === row.day ? "true" : undefined}
                  >
                    {stack}
                  </Link>
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
                  <tr
                    key={row.day}
                    id={`day-${row.day}`}
                    className={day === row.day ? "selected" : undefined}
                  >
                    <td>
                      <Link href={`${ebayPageHref(days, row.day)}#by-api`}>
                        {formatUtcDay(row.day)}
                      </Link>
                    </td>
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
      <div className="panel" style={{ marginTop: 16 }} id="by-api">
        <h2>By API and source</h2>
        <nav className="windows day-filters" aria-label="Day">
          <Link
            href={`${ebayPageHref(days)}#by-api`}
            aria-current={!day ? "page" : undefined}
          >
            All days
          </Link>
          {[...daily]
            .reverse()
            .filter((row) => row.total > 0)
            .map((row) => (
              <Link
                key={row.day}
                href={`${ebayPageHref(days, row.day)}#by-api`}
                aria-current={day === row.day ? "page" : undefined}
              >
                {formatUtcDay(row.day)}
              </Link>
            ))}
        </nav>
        {day ? (
          <p className="muted">{formatUtcDay(day)} (ET)</p>
        ) : (
          <p className="muted">Last {days} days</p>
        )}
        {breakdown.length === 0 ? (
          <p className="muted">No eBay calls recorded in this view.</p>
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
                        ...(day ? { day } : {}),
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
                        ...(day ? { day } : {}),
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
          <p className="muted">No failed calls in this view.</p>
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
                        ...(day ? { day } : {}),
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
