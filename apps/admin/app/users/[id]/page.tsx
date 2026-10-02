import {
  COMPLIMENTARY_INTERVAL,
  isComplimentaryInterval,
} from "@watchseebuy/domain";
import { getAdminUserDetail, getDb, isUnauthenticatedUserId } from "@watchseebuy/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { describeIpLocation } from "@/lib/geo";
import {
  formatBillingInterval,
  formatDate,
  formatEventDetail,
  formatEventKind,
  formatPlanName,
  formatProviders,
  formatSearchMode,
} from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { plan: planNotice } = await searchParams;
  const user = await getAdminUserDetail(getDb(), id);
  if (!user) notFound();
  const location = await describeIpLocation(user.lastIp, user.lastCountry);
  const guest = isUnauthenticatedUserId(user.id);
  const intervalLabel = formatBillingInterval(user.billingInterval);
  const complimentary = isComplimentaryInterval(user.billingInterval);

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
      {planNotice === "saved" ? <p className="banner">Plan updated.</p> : null}
      {planNotice === "invalid" ? (
        <p className="error">That plan change was not valid.</p>
      ) : null}
      <dl className="dl">
        <dt>First name</dt>
        <dd>{user.firstName ?? "—"}</dd>
        <dt>Last name</dt>
        <dd>{user.lastName ?? "—"}</dd>
        <dt>Plan</dt>
        <dd>{guest ? "—" : formatPlanName(user.plan)}</dd>
        <dt>Billing</dt>
        <dd>{guest ? "—" : intervalLabel ?? "—"}</dd>
        <dt>Status</dt>
        <dd>{guest ? "—" : user.subscriptionStatus ?? "—"}</dd>
        <dt>Expires</dt>
        <dd>
          {guest || complimentary
            ? "—"
            : formatDate(user.subscriptionExpiresAt)}
        </dd>
        <dt>PayPal</dt>
        <dd>{guest ? "—" : user.paypalSubscriptionId ?? "—"}</dd>
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
      {guest ? null : (
        <div className="panel">
          <h2>Change plan</h2>
          <p className="muted">
            Complimentary grants Premium or Premium+ without payment. Monthly
            and annual here are gift periods, not a PayPal subscription.
            Changing a plan does not cancel PayPal billing.
          </p>
          {user.paypalSubscriptionId ? (
            <p className="error">
              This user still has PayPal subscription {user.paypalSubscriptionId}.
              Cancel it in PayPal if they should stop being charged.
            </p>
          ) : null}
          <form
            className="plan-form"
            method="post"
            action={`/api/users/${user.id}/plan`}
          >
            <label>
              Plan
              <select name="plan" defaultValue={user.plan}>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="premium_plus">Premium+</option>
              </select>
            </label>
            <label>
              Billing
              <select
                name="interval"
                defaultValue={
                  user.billingInterval ?? COMPLIMENTARY_INTERVAL
                }
              >
                <option value={COMPLIMENTARY_INTERVAL}>
                  Complimentary (no payment)
                </option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
            <button className="btn" type="submit">
              Update plan
            </button>
          </form>
        </div>
      )}
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
