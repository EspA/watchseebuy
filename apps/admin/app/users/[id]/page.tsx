import { getAdminUserDetail, getDb, isUnauthenticatedUserId } from "@watchseebuy/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { describeIpLocation } from "@/lib/geo";
import {
  formatDate,
  formatEventDetail,
  formatEventKind,
  formatProviders,
  formatSearchMode,
} from "@/lib/format";
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
  const guest = isUnauthenticatedUserId(user.id);

  return (
    <main className="page">
      <p>
        <Link className="back" href="/users">
          Users
        </Link>
      </p>
      <h1>{guest ? "Unauthenticated" : user.email}</h1>
      <p className="lede">
        {guest
          ? "Searches and buy clicks from visitors who are not signed in."
          : user.name}
      </p>
      <dl className="dl">
        <dt>First name</dt>
        <dd>{user.firstName ?? "—"}</dd>
        <dt>Last name</dt>
        <dd>{user.lastName ?? "—"}</dd>
        <dt>Last login</dt>
        <dd>{guest ? "—" : formatDate(user.lastLoginAt)}</dd>
        <dt>Auth count</dt>
        <dd>{guest ? "—" : user.loginCount}</dd>
        <dt>Auth method</dt>
        <dd>{guest ? "—" : formatProviders(user.providerIds)}</dd>
        <dt>Last IP</dt>
        <dd>{user.lastIp ?? "—"}</dd>
        <dt>Location</dt>
        <dd>{location}</dd>
        <dt>Ship-to</dt>
        <dd>{user.shipToPostal ?? "—"}</dd>
        <dt>Timezone</dt>
        <dd>{user.timezone ?? "—"}</dd>
        <dt>eBay store</dt>
        <dd>{user.ebaySite ?? "—"}</dd>
        <dt>Language</dt>
        <dd>{user.locale ?? "—"}</dd>
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
                <th>Mode</th>
                <th>IP</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {user.recentEvents.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.occurredAt)}</td>
                  <td>{formatEventKind(event.kind)}</td>
                  <td>
                    {event.kind === "search"
                      ? formatSearchMode(event.meta)
                      : "—"}
                  </td>
                  <td>{event.ip ?? "—"}</td>
                  <td className="muted">{formatEventDetail(event.meta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
