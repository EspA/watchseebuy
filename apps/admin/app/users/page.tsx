import {
  countUsers,
  getDb,
  isUnauthenticatedUserId,
  listAdminUsers,
} from "@watchseebuy/db";
import Link from "next/link";
import { formatDate, formatPlanColumn, formatProviders } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdmin();
  const db = getDb();
  const [users, total] = await Promise.all([
    listAdminUsers(db),
    countUsers(db),
  ]);

  return (
    <main className="page">
      <h1>Users</h1>
      <p className="lede">{total} accounts.</p>
      <div className="panel">
        {users.length === 0 ? (
          <p className="muted">No users yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Last login</th>
                <th>Auth</th>
                <th>Watches</th>
                <th>Searches</th>
                <th>Buy clicks</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/users/${row.id}`}>
                      {isUnauthenticatedUserId(row.id)
                        ? "Unauthenticated"
                        : row.email}
                    </Link>
                  </td>
                  <td>
                    {isUnauthenticatedUserId(row.id)
                      ? "Guest searches"
                      : [row.firstName, row.lastName].filter(Boolean).join(" ") ||
                        row.name}
                  </td>
                  <td>
                    {isUnauthenticatedUserId(row.id) ? "—" : formatPlanColumn(row)}
                  </td>
                  <td>
                    {isUnauthenticatedUserId(row.id)
                      ? "—"
                      : formatDate(row.lastLoginAt)}
                  </td>
                  <td>
                    {isUnauthenticatedUserId(row.id)
                      ? "—"
                      : formatProviders(row.providerIds)}
                  </td>
                  <td>{row.watchesCount}</td>
                  <td>{row.searchCount}</td>
                  <td>{row.buyClickCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
