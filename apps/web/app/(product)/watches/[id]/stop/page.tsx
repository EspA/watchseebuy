import { getTranslations } from "next-intl/server";
import { describeWatch, type WatchCriteria } from "@watchseebuy/domain";
import { getDb, getWatchForUser } from "@watchseebuy/db";
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
  const t = await getTranslations("watches");
  if (id === "preview-watch") {
    return (
      <main className="page">
        <div className="panel stop-watch">
          <h1>{t("stopTitle")}</h1>
          <p>PSA 10 Base Set Charizard</p>
          <p className="muted">{t("stopPreview")}</p>
          <div className="watch-actions">
            <Link className="btn secondary" href="/watches">
              {t("keepWatching")}
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
        <h1>{t("stopTitle")}</h1>
        <p>{watch.label}</p>
        <p className="muted">
          {criteria ? describeWatch(criteria) : watch.label}
        </p>
        <p className="muted">{t("stopNote")}</p>
        <div className="watch-actions">
          <form action={`/api/watches/${watch.id}/delete`} method="post">
            <button className="btn" type="submit">
              {t("stopWatching")}
            </button>
          </form>
          <Link className="btn secondary" href="/watches">
            {t("keepWatching")}
          </Link>
        </div>
      </div>
    </main>
  );
}
