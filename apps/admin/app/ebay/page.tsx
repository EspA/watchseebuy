import { ebayApiBreakdown, ebayApiWindowStats, getDb } from "@waitseebuy/db";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function EbayStatsPage() {
  await requireAdmin();
  const db = getDb();
  const [today, week, month, breakdown] = await Promise.all([
    ebayApiWindowStats(db, 1),
    ebayApiWindowStats(db, 7),
    ebayApiWindowStats(db, 30),
    ebayApiBreakdown(db, 30),
  ]);

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
    </main>
  );
}
