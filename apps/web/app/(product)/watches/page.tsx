import {
  describeWatch,
  FREE_WATCH_LIMIT,
  parseWatchFrequency,
  type WatchCriteria,
} from "@waitseebuy/domain";
import { getDb, listWatchesForUser } from "@waitseebuy/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteWatchForm } from "@/components/delete-watch-form";
import { WatchSettingsForm } from "@/components/watch-settings-form";
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
      {saved ? (
        <p className="banner">
          Watch saved. Alerts come on the schedule you pick.
        </p>
      ) : null}

      {items.length === 0 ? (
        <div className="panel">
          <p>No watches yet.</p>
          <p className="muted">
            <Link href="/search">Search a piece</Link> and click Watch this to
            add a new watch.
          </p>
        </div>
      ) : (
        <>
          <p className="muted watch-count">
            {items.length >= FREE_WATCH_LIMIT
              ? `${items.length} of ${FREE_WATCH_LIMIT} watches. Stop one to add another.`
              : `${items.length} of ${FREE_WATCH_LIMIT} watches.`}
          </p>
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
                <div className="watch-card-top">
                  <h2>
                    <Link href={href}>{watch.label}</Link>
                  </h2>
                  <div className="watch-actions">
                    <Link className="btn" href={href}>
                      Open search
                    </Link>
                    <DeleteWatchForm watchId={watch.id} />
                  </div>
                </div>
                <WatchSettingsForm
                  watchId={watch.id}
                  frequency={parseWatchFrequency(watch.alertFrequency)}
                  {...(criteria?.maxLandedCents !== undefined
                    ? { maxLandedCents: criteria.maxLandedCents }
                    : {})}
                />
                <details className="watch-criteria">
                  <summary>Criteria</summary>
                  <p className="muted">
                    {criteria
                      ? describeWatch(criteria)
                      : watch.coverageKeywords}
                  </p>
                </details>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </main>
  );
}
