import { getAdminUserDetail, getDb } from "@waitseebuy/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { describeIpLocation } from "@/lib/geo";
import { formatDate, formatEventKind, formatProviders } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const user = await getAdminUserDetail(getDb(), id);
  if (!user) notFound();
  const location = await describeIpLocation(user.lastIp, user.lastCountry);

  return (
    <main className="page">
      <p>
        <Link className="back" href="/users">
          Users
        </Link>
      </p>
      <h1>{user.email}</h1>
      <p className="lede">{user.name}</p>
      <dl className="dl">
        <dt>First name</dt>
        <dd>{user.firstName ?? "—"}</dd>
        <dt>Last name</dt>
        <dd>{user.lastName ?? "—"}</dd>
        <dt>Last login</dt>
        <dd>{formatDate(user.lastLoginAt)}</dd>
        <dt>Auth count</dt>
        <dd>{user.loginCount}</dd>
        <dt>Auth method</dt>
        <dd>{formatProviders(user.providerIds)}</dd>
        <dt>Last IP</dt>
        <dd>{user.lastIp ?? "—"}</dd>
        <dt>Location</dt>
        <dd>{location}</dd>
        <dt>Ship-to</dt>
        <dd>{user.shipToPostal ?? "—"}</dd>
        <dt>Timezone</dt>
        <dd>{user.timezone ?? "—"}</dd>
        <dt>Created</dt>
        <dd>{formatDate(user.createdAt)}</dd>
        <dt>Watches</dt>
        <dd>{user.watchesCount}</dd>
        <dt>Searches</dt>
        <dd>{user.searchCount}</dd>
        <dt>Buy clicks</dt>
        <dd>{user.buyClickCount}</dd>
      </dl>
      <div className="panel">
        <h2>Recent events</h2>
        {user.recentEvents.length === 0 ? (
          <p className="muted">No search or buy events yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Kind</th>
                <th>IP</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {user.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.occurredAt)}</td>
                  <td>{formatEventKind(event.kind)}</td>
                  <td>{event.ip ?? "—"}</td>
                  <td className="muted">
                    {event.meta ? JSON.stringify(event.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
