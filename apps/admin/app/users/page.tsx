import { countUsers, getDb, listAdminUsers } from "@waitseebuy/db";
import Link from "next/link";
import { formatDate, formatProviders } from "@/lib/format";
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
                    <Link href={`/users/${row.id}`}>{row.email}</Link>
                  </td>
                  <td>
                    {[row.firstName, row.lastName].filter(Boolean).join(" ") ||
                      row.name}
                  </td>
                  <td>{formatDate(row.lastLoginAt)}</td>
                  <td>{formatProviders(row.providerIds)}</td>
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
