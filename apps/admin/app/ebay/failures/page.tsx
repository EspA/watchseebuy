import {
  EBAY_FAILURE_PAGE_SIZE,
  ebayApiErrorGroups,
  ebayApiFailureCount,
  getDb,
  listEbayApiFailures,
} from "@watchseebuy/db";
import Link from "next/link";
import { CountLink } from "@/components/count-link";
import { ebayFailuresHref, ebayPageHref, parseEbayFailureQuery } from "@/lib/ebay-stats";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

function filterLabel(query: ReturnType<typeof parseEbayFailureQuery>) {
  const parts = [`Last ${query.days} days (UTC)`];
  if (query.day) parts.push(query.day);
  if (query.api) parts.push(query.api);
  if (query.source) parts.push(query.source);
  if (query.httpStatus != null) parts.push(`HTTP ${query.httpStatus}`);
  return parts.join(" · ");
}

export default async function EbayFailuresPage({
  searchParams,
}: {
  searchParams: Promise<{
    days?: string;
    api?: string;
    source?: string;
    status?: string;
    day?: string;
    page?: string;
  }>;
}) {
  await requireAdmin();
  const query = parseEbayFailureQuery(await searchParams);
  const filters = {
    days: query.days,
    ...(query.api ? { api: query.api } : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.httpStatus != null ? { httpStatus: query.httpStatus } : {}),
    ...(query.day ? { day: query.day } : {}),
  };
  const db = getDb();
  const [groups, total] = await Promise.all([
    ebayApiErrorGroups(db, filters),
    ebayApiFailureCount(db, filters),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / EBAY_FAILURE_PAGE_SIZE));
  const page = Math.min(Math.max(query.page, 1), pageCount);
  const rows = await listEbayApiFailures(db, {
    ...filters,
    limit: EBAY_FAILURE_PAGE_SIZE,
    offset: (page - 1) * EBAY_FAILURE_PAGE_SIZE,
  });

  return (
    <main className="page">
      <p>
        <Link className="back" href={ebayPageHref(query.days, query.day)}>
          eBay API
        </Link>
      </p>
      <h1>Failed calls</h1>
      <p className="lede">{filterLabel(query)}</p>
      <div className="cards">
        <div className="stat">
          <strong>{total}</strong>
          <span>Failures in view</span>
        </div>
        <div className="stat">
          <strong>{groups.length}</strong>
          <span>Distinct errors</span>
        </div>
      </div>
      <div className="panel">
        <h2>Errors</h2>
        {groups.length === 0 ? (
          <p className="muted">No failed calls match these filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>HTTP status</th>
                <th>Error</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((row) => (
                <tr key={`${row.httpStatus ?? "none"}:${row.error ?? ""}`}>
                  <td>{row.httpStatus ?? "—"}</td>
                  <td className="error-cell">
                    {row.error ?? (
                      <span className="muted">
                        No error body stored (recorded before we kept eBay
                        messages)
                      </span>
                    )}
                  </td>
                  <td>
                    <CountLink
                      count={row.total}
                      href={ebayFailuresHref({
                        ...filters,
                        httpStatus: row.httpStatus,
                      })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Recent failures</h2>
        {rows.length === 0 ? (
          <p className="muted">No failed calls match these filters.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>API</th>
                  <th>Source</th>
                  <th>HTTP</th>
                  <th>ms</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.calledAt)}</td>
                    <td>{row.api}</td>
                    <td>{row.source}</td>
                    <td>{row.httpStatus ?? "—"}</td>
                    <td>{row.durationMs}</td>
                    <td className="error-cell">
                      {row.error ?? (
                        <span className="muted">No error body stored</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageCount > 1 ? (
              <nav className="pager" aria-label="Failure pages">
                {page > 1 ? (
                  <Link
                    href={ebayFailuresHref({ ...filters, page: page - 1 })}
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="muted">Previous</span>
                )}
                <span className="muted">
                  Page {page} of {pageCount}
                </span>
                {page < pageCount ? (
                  <Link
                    href={ebayFailuresHref({ ...filters, page: page + 1 })}
                  >
                    Next
                  </Link>
                ) : (
                  <span className="muted">Next</span>
                )}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
