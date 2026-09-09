import { describeWatch, type WatchCriteria } from "@waitseebuy/domain";
import { getDb, getWatchForUser } from "@waitseebuy/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";

function asCriteria(value: unknown): WatchCriteria | null {
  if (!value || typeof value !== "object") return null;
  if (!("query" in value) || typeof value.query !== "string") return null;
  return value as WatchCriteria;
}

export default async function StopWatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?next=/watches/${id}/stop`);
  }
  if (id === "preview-watch") {
    return (
      <main className="page">
        <div className="panel stop-watch">
          <h1>Stop this watch?</h1>
          <p>PSA 10 Base Set Charizard</p>
          <p className="muted">
            This is the email-preview destination. A real stop link asks you to
            sign in, then removes the watch and its alerts.
          </p>
          <div className="watch-actions">
            <Link className="btn secondary" href="/watches">
              Keep watching
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const watch = await getWatchForUser(getDb(), {
    userId: session.user.id,
    watchId: id,
  });
  if (!watch) notFound();
  const criteria = asCriteria(watch.criteria);

  return (
    <main className="page">
      <div className="panel stop-watch">
        <h1>Stop this watch?</h1>
        <p>{watch.label}</p>
        <p className="muted">
          {criteria ? describeWatch(criteria) : watch.label}
        </p>
        <p className="muted">
          Alerts stop. You can always start a new watch from search.
        </p>
        <div className="watch-actions">
          <form action={`/api/watches/${watch.id}/delete`} method="post">
            <button className="btn" type="submit">
              Stop watching
            </button>
          </form>
          <Link className="btn secondary" href="/watches">
            Keep watching
          </Link>
        </div>
      </div>
    </main>
  );
}
