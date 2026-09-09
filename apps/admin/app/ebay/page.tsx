import {
  ebayApiBreakdown,
  ebayApiStatusBreakdown,
  ebayApiWindowStats,
  getDb,
  listRecentEbayAccountDeletions,
} from "@waitseebuy/db";
import { notificationEndpointStatusFromEnv } from "@waitseebuy/ebay";
import { requireAdmin } from "@/lib/require-admin";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EbayStatsPage() {
  await requireAdmin();
  const db = getDb();
  const [today, week, month, breakdown, failures, deletions] = await Promise.all([
    ebayApiWindowStats(db, 1),
    ebayApiWindowStats(db, 7),
    ebayApiWindowStats(db, 30),
    ebayApiBreakdown(db, 30),
    ebayApiStatusBreakdown(db, 30),
    listRecentEbayAccountDeletions(db),
  ]);
  const deletionEndpoint = notificationEndpointStatusFromEnv();

  return (
    <main className="page">
      <h1>eBay API</h1>
      <p className="lede">
        Calls through the shared client. Use these numbers for the Application
        Growth Check.
      </p>
      <div className="cards">
        <div className="stat">
          <strong>{today.total}</strong>
          <span>Calls today</span>
        </div>
        <div className="stat">
          <strong>{week.total}</strong>
          <span>Last 7 days</span>
        </div>
        <div className="stat">
          <strong>{month.total}</strong>
          <span>Last 30 days</span>
        </div>
        <div className="stat">
          <strong>{month.success}</strong>
          <span>Success (30d)</span>
        </div>
        <div className="stat">
          <strong>{month.failure}</strong>
          <span>Failure (30d)</span>
        </div>
        <div className="stat">
          <strong>{month.rateLimited}</strong>
          <span>HTTP 429 (30d)</span>
        </div>
      </div>
      <div className="panel">
        <h2>Last 30 days by API and source</h2>
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
                  <td>{row.failure}</td>
                  <td>{row.rateLimited}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Failed calls by HTTP status (30d)</h2>
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
                  <td>{row.total}</td>
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
