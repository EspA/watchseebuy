"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function SearchPagination({
  page,
  pageCount,
  prevHref,
  nextHref,
  compact,
}: {
  page: number;
  pageCount: number;
  prevHref?: string;
  nextHref?: string;
  compact?: boolean;
}) {
  const t = useTranslations("search");
  if (pageCount <= 1) return null;

  return (
    <nav
      className={compact ? "search-pagination is-compact" : "search-pagination"}
      aria-label={compact ? t("prevNext") : t("pages")}
    >
      {prevHref ? (
        <Link className="btn secondary" href={prevHref} scroll={false}>
          {t("previous")}
        </Link>
      ) : (
        <span className="btn secondary" aria-disabled="true">
          {t("previous")}
        </span>
      )}
      {compact ? null : (
        <p className="search-pagination-status">
          {pageCount > 20
            ? t("page", { page })
            : t("pageOf", { page, pageCount })}
        </p>
      )}
      {nextHref ? (
        <Link className="btn secondary" href={nextHref} scroll={false}>
          {t("next")}
        </Link>
      ) : (
        <span className="btn secondary" aria-disabled="true">
          {t("next")}
        </span>
      )}
    </nav>
  );
}
