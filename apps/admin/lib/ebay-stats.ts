import {
  parseEbayStatWindow,
  utcDayBounds,
  type EbayStatWindow,
} from "@watchseebuy/db";

export type EbayFailureQuery = {
  days: EbayStatWindow;
  api?: string;
  source?: string;
  httpStatus?: number;
  day?: string;
  page: number;
};

function cleanToken(value: string | undefined, max = 64) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.length > max) return undefined;
  return trimmed;
}

export function parseEbayFailureQuery(input: {
  days?: string;
  api?: string;
  source?: string;
  status?: string;
  day?: string;
  page?: string;
}): EbayFailureQuery {
  const status = Number(input.status);
  const page = Number(input.page);
  const api = cleanToken(input.api);
  const source = cleanToken(input.source);
  const day = input.day && utcDayBounds(input.day) ? input.day : undefined;
  return {
    days: parseEbayStatWindow(input.days),
    ...(api ? { api } : {}),
    ...(source ? { source } : {}),
    ...(Number.isInteger(status) && status >= 100 && status <= 599
      ? { httpStatus: status }
      : {}),
    ...(day ? { day } : {}),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

export function ebayPageHref(days: number, day?: string) {
  const params = new URLSearchParams();
  if (days !== 30) params.set("days", String(days));
  if (day) params.set("day", day);
  const search = params.toString();
  return search ? `/ebay?${search}` : "/ebay";
}

export function ebayFailuresHref(query: {
  days: number;
  api?: string;
  source?: string;
  httpStatus?: number | null;
  day?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (query.days !== 30) params.set("days", String(query.days));
  if (query.api) params.set("api", query.api);
  if (query.source) params.set("source", query.source);
  if (query.httpStatus != null) params.set("status", String(query.httpStatus));
  if (query.day) params.set("day", query.day);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `/ebay/failures?${search}` : "/ebay/failures";
}
