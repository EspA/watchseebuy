import { describeWatch, type WatchCriteria } from "@waitseebuy/domain";
import { getDb, listWatchesForUser } from "@waitseebuy/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteWatchForm } from "@/components/delete-watch-form";
import { getSession } from "@/lib/session";
import { searchHrefForWatch } from "@/lib/watch-search";

function asCriteria(value: unknown): WatchCriteria | null {
  if (!value || typeof value !== "object") return null;
  if (!("query" in value) || typeof value.query !== "string") return null;
  return value as WatchCriteria;
}

export default async function WatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in?next=/watches");
  }

  const { saved } = await searchParams;
  const items = await listWatchesForUser(getDb(), session.user.id);

  return (
    <main className="page">
      <h1>Your watches</h1>
      <p className="lede">
        Quiet watches for the pieces you will wait for. We alert when the
        landed price looks fair — not every time something lists.
      </p>
      <p className="muted">Signed in as {session.user.email}</p>

      {saved ? (
        <p className="banner" style={{ marginTop: 20 }}>
          Watch saved. Alerts come next — quiet, and only when it is a deal.
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="panel" style={{ marginTop: 24 }}>
          <p>No watches yet.</p>
          <p className="muted">
            <Link href="/search">Search a piece</Link> and save the intent.
          </p>
        </div>
      ) : (
        <ul className="watch-list">
          {items.map((watch) => {
            const criteria = asCriteria(watch.criteria);
            const href = searchHrefForWatch({
              label: watch.label,
              criteria,
              watchId: watch.id,
            });
            return (
              <li className="panel watch-card" key={watch.id}>
                <h2>
                  <Link href={href}>{watch.label}</Link>
                </h2>
                <p className="muted">
                  {criteria ? describeWatch(criteria) : watch.coverageKeywords}
                </p>
                <div className="watch-actions">
                  <Link className="btn secondary" href={href}>
                    Open search
                  </Link>
                  <DeleteWatchForm watchId={watch.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
