export const SEARCH_PAGE_SIZE = 24;
export const SEARCH_MAX_OFFSET = 10_000;

export function parseSearchPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  const maxPage = Math.floor(SEARCH_MAX_OFFSET / SEARCH_PAGE_SIZE) + 1;
  return Math.min(n, maxPage);
}

export function searchOffset(page: number): number {
  return Math.min((page - 1) * SEARCH_PAGE_SIZE, SEARCH_MAX_OFFSET);
}

export function searchPageCount(
  total: number | undefined,
  fetched: number,
  page: number,
): number {
  if (total !== undefined && Number.isFinite(total) && total >= 0) {
    const capped = Math.min(total, SEARCH_MAX_OFFSET + SEARCH_PAGE_SIZE);
    return Math.max(1, Math.ceil(capped / SEARCH_PAGE_SIZE));
  }
  if (fetched >= SEARCH_PAGE_SIZE) return page + 1;
  return Math.max(1, page);
}
