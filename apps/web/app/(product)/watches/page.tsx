import { getTranslations } from "next-intl/server";
import {
  describeWatch,
  parseWatchFrequency,
  watchLimitForPlan,
  type WatchCriteria,
} from "@watchseebuy/domain";
import { getDb, listWatchesForUser } from "@watchseebuy/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteWatchForm } from "@/components/delete-watch-form";
import { WatchSettingsForm } from "@/components/watch-settings-form";
import { currentBilling } from "@/lib/current-billing";
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
  const billing = await currentBilling(session.user.id);
  const watchLimit = watchLimitForPlan(billing.plan);
  const items = await listWatchesForUser(getDb(), session.user.id);
  const t = await getTranslations("watches");

  return (
    <main className="page">
      {saved ? <p className="banner">{t("saved")}</p> : null}

      {items.length === 0 ? (
        <div className="panel">
          <p>{t("empty")}</p>
          <p className="muted">
            {t.rich("emptyHint", {
              search: (chunks) => <Link href="/search">{chunks}</Link>,
            })}
          </p>
        </div>
      ) : (
        <>
          <p className="muted watch-count">
            {t(items.length >= watchLimit ? "countFull" : "count", {
              count: items.length,
              limit: watchLimit,
            })}
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
                        {t("openSearch")}
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
                    <summary>{t("criteria")}</summary>
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
