import { emailBreakdown, emailWindowStats, getDb } from "@waitseebuy/db";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function EmailStatsPage() {
  await requireAdmin();
  const db = getDb();
  const [today, week, month, breakdown] = await Promise.all([
    emailWindowStats(db, 1),
    emailWindowStats(db, 7),
    emailWindowStats(db, 30),
    emailBreakdown(db, 30),
  ]);

  return (
    <main className="page">
      <h1>Email</h1>
      <p className="lede">
        Alert, magic-link, password-reset, and contact-form sends.
      </p>
      <div className="cards">
        <div className="stat">
          <strong>{today.total}</strong>
          <span>Sends today</span>
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
          <strong>{month.delivered}</strong>
          <span>Delivered (30d)</span>
        </div>
        <div className="stat">
          <strong>{month.failed}</strong>
          <span>Failed (30d)</span>
        </div>
        <div className="stat">
          <strong>{month.loggedOnly}</strong>
          <span>Logged only (30d)</span>
        </div>
      </div>
      <div className="panel">
        <h2>Last 30 days by kind</h2>
        {breakdown.length === 0 ? (
          <p className="muted">No emails recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Kind</th>
                <th>Total</th>
                <th>Delivered</th>
                <th>Failed</th>
                <th>Logged only</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.kind}>
                  <td>{row.kind}</td>
                  <td>{row.total}</td>
                  <td>{row.delivered}</td>
                  <td>{row.failed}</td>
                  <td>{row.loggedOnly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
