import {
  browseFilterParts,
  ebayAcceptLanguage,
  parseAppLocale,
  SEARCH_PAGE_SIZE,
  type BrowseFilterInput,
  type CandidateListing,
  type ConditionClass,
  type ListingType,
} from "@watchseebuy/domain";
import {
  ebayErrorFromBody,
  ebayErrorFromText,
  ebayErrorFromThrown,
  truncateEbayError,
} from "./browse-error";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type Money = { value?: string; currency?: string };

type TypedNameValue = { name?: string; value?: string };

type ConditionDescriptor = {
  name?: string;
  values?: string[];
  additionalInfo?: string;
};

type Product = {
  gtins?: string[];
  mpns?: string[];
  brand?: string;
  aspectGroups?: Array<{
    aspects?: Array<{ localizedName?: string; localizedValues?: string[] }>;
  }>;
};

type ItemSummary = {
  itemId?: string;
  legacyItemId?: string;
  epid?: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: Money;
  currentBidPrice?: Money;
  itemWebUrl?: string;
  buyingOptions?: string[];
  shippingOptions?: Array<{ shippingCost?: Money }>;
  condition?: string;
  conditionId?: string;
  categoryId?: string;
  categories?: Array<{ categoryId?: string; categoryName?: string }>;
  leafCategoryIds?: string[];
  shortDescription?: string;
  itemLocation?: {
    city?: string;
    stateOrProvince?: string;
    postalCode?: string;
    country?: string;
  };
  seller?: {
    username?: string;
    feedbackScore?: number;
    feedbackPercentage?: string | number;
  };
};

type BrowseItem = ItemSummary & {
  gtin?: string;
  mpn?: string;
  localizedAspects?: TypedNameValue[];
  conditionDescriptors?: ConditionDescriptor[];
  product?: Product;
};

type ItemsResponse = {
  items?: BrowseItem[];
  errors?: Array<{ message?: string; longMessage?: string }>;
};

type SearchResponse = {
  itemSummaries?: ItemSummary[];
  total?: number;
  offset?: number;
  limit?: number;
  errors?: Array<{ message?: string; longMessage?: string }>;
};

export type BrowseHosts = {
  identity: string;
  buy: string;
};

export function hostsForEnv(env: "sandbox" | "production"): BrowseHosts {
  if (env === "sandbox") {
    return {
      identity: "https://api.sandbox.ebay.com",
      buy: "https://api.sandbox.ebay.com",
    };
  }
  return {
    identity: "https://api.ebay.com",
    buy: "https://api.ebay.com",
  };
}

function parseFeedbackPercentage(
  raw: string | number | undefined,
): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = typeof raw === "number" ? raw : Number.parseFloat(raw);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function dollarsToCents(value: string | undefined): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function categoryIdsFromItem(item: BrowseItem): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const add = (raw?: string | number) => {
    const id = raw == null ? "" : String(raw).trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  add(item.categoryId);
  for (const id of item.leafCategoryIds ?? []) add(id);
  for (const category of item.categories ?? []) add(category.categoryId);
  return ids;
}

export function mapItemSummary(item: ItemSummary): CandidateListing | null {
  return mapBrowseItem(item);
}

export function mapBrowseItem(item: BrowseItem): CandidateListing | null {
  const ebayItemId = item.legacyItemId ?? item.itemId;
  if (!ebayItemId || !item.title) return null;

  const options = item.buyingOptions ?? [];
  const isBin = options.includes("FIXED_PRICE");
  const listing: CandidateListing = {
    ebayItemId,
    title: item.title,
    itemCents: dollarsToCents(item.price?.value ?? item.currentBidPrice?.value),
    shippingCents: dollarsToCents(item.shippingOptions?.[0]?.shippingCost?.value),
    listingType:
      options.includes("AUCTION") && !isBin ? "auction" : "bin",
  };
  if (item.itemId) listing.restItemId = item.itemId;
  if (item.epid) listing.epid = item.epid;
  const gtin = item.gtin ?? item.product?.gtins?.[0];
  if (gtin) listing.gtin = gtin;
  const mpn = item.mpn ?? item.product?.mpns?.[0];
  if (mpn) listing.mpn = mpn;
  const brand = item.product?.brand ?? aspectValue(item, "Brand");
  if (brand) listing.brand = brand;
  const aspects = mergeAspects(item);
  if (aspects.length > 0) listing.localizedAspects = aspects;
  if (item.conditionDescriptors?.length) {
    listing.conditionDescriptors = item.conditionDescriptors;
  }
  if (options.length > 0) listing.buyingOptions = options;
  const sellerUsername = item.seller?.username?.trim();
  if (sellerUsername) listing.sellerUsername = sellerUsername;
  if (item.seller?.feedbackScore !== undefined) {
    listing.sellerFeedbackScore = item.seller.feedbackScore;
  }
  const feedbackPct = parseFeedbackPercentage(item.seller?.feedbackPercentage);
  if (feedbackPct !== undefined) {
    listing.sellerFeedbackPercentage = feedbackPct;
  }
  if (item.currentBidPrice?.value) {
    listing.currentBidCents = dollarsToCents(item.currentBidPrice.value);
  }
  if (item.image?.imageUrl) listing.imageUrl = item.image.imageUrl;
  if (item.condition) listing.condition = item.condition;
  if (item.conditionId) listing.conditionId = String(item.conditionId);
  const categoryIds = categoryIdsFromItem(item);
  if (categoryIds.length > 0) listing.categoryIds = categoryIds;
  const locationCountry = item.itemLocation?.country?.trim().toUpperCase();
  if (locationCountry) listing.itemLocationCountry = locationCountry;
  if (item.itemWebUrl) listing.webUrl = item.itemWebUrl;
  if (item.shortDescription?.trim()) {
    listing.description = item.shortDescription.trim();
  }
  return listing;
}

function aspectValue(item: BrowseItem, name: string): string | undefined {
  const needle = name.toLowerCase();
  const fromListing = item.localizedAspects?.find(
    (aspect) => aspect.name?.toLowerCase() === needle,
  )?.value;
  if (fromListing) return fromListing;
  for (const group of item.product?.aspectGroups ?? []) {
    for (const aspect of group.aspects ?? []) {
      if (aspect.localizedName?.toLowerCase() === needle) {
        return aspect.localizedValues?.[0];
      }
    }
  }
  return undefined;
}

function mergeAspects(item: BrowseItem): TypedNameValue[] {
  const byName = new Map<string, string>();
  for (const aspect of item.localizedAspects ?? []) {
    if (aspect.name && aspect.value) byName.set(aspect.name, aspect.value);
  }
  for (const group of item.product?.aspectGroups ?? []) {
    for (const aspect of group.aspects ?? []) {
      const name = aspect.localizedName;
      const value = aspect.localizedValues?.[0];
      if (name && value && !byName.has(name)) byName.set(name, value);
    }
  }
  return [...byName.entries()].map(([name, value]) => ({ name, value }));
}

export type EbayApiCallEvent = {
  api:
    | "oauth"
    | "browse_search"
    | "get_items"
    | "get_item"
    | "notification_public_key";
  ok: boolean;
  httpStatus: number;
  durationMs: number;
  error?: string;
};

export type EbayApiRecorder = (event: EbayApiCallEvent) => void | Promise<void>;

function noteCall(
  record: EbayApiRecorder | undefined,
  event: EbayApiCallEvent,
) {
  if (!record) return;
  // Telemetry must not delay the search response. A stuck database write
  // was holding each getItem open, so the results page never rendered.
  void Promise.resolve()
    .then(() => record(event))
    .catch((error: unknown) => {
      console.error(
        JSON.stringify({
          at: new Date().toISOString(),
          message: "ebay api record failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    });
}

export async function fetchApplicationToken(
  hosts: BrowseHosts,
  clientId: string,
  clientSecret: string,
  record?: EbayApiRecorder,
): Promise<{ token: string; expiresInSec: number }> {
  const started = Date.now();
  let httpStatus = 0;
  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(`${hosts.identity}/identity/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "https://api.ebay.com/oauth/api_scope",
      }),
    });
    httpStatus = res.status;
    const body = (await res.json()) as TokenResponse;
    if (!res.ok || !body.access_token) {
      throw new Error(ebayErrorFromBody(body, res.status));
    }
    await noteCall(record, {
      api: "oauth",
      ok: true,
      httpStatus,
      durationMs: Date.now() - started,
    });
    return { token: body.access_token, expiresInSec: body.expires_in ?? 7200 };
  } catch (error) {
    await noteCall(record, {
      api: "oauth",
      ok: false,
      httpStatus,
      durationMs: Date.now() - started,
      error: ebayErrorFromThrown(error, httpStatus),
    });
    throw error;
  }
}

export async function searchItemSummaries(input: {
  hosts: BrowseHosts;
  token: string;
  q: string;
  marketplaceId: string;
  limit?: number;
  offset?: number;
  priceMaxCents?: number;
  condition?: ConditionClass;
  listingType?: ListingType;
  itemLocation?: string;
  deliveryCountry?: string;
  deliveryPostal?: string;
  categoryIds?: string;
  aspectFilter?: string;
  locale?: string;
  record?: EbayApiRecorder;
}): Promise<{
  listings: CandidateListing[];
  note?: string;
  total?: number;
  offset?: number;
  limit?: number;
}> {
  const url = new URL(`${input.hosts.buy}/buy/browse/v1/item_summary/search`);
  const limit = input.limit ?? SEARCH_PAGE_SIZE;
  url.searchParams.set("q", input.q);
  url.searchParams.set("limit", String(limit));
  if (input.offset) url.searchParams.set("offset", String(input.offset));
  url.searchParams.set("fieldgroups", "EXTENDED");
  if (input.categoryIds) url.searchParams.set("category_ids", input.categoryIds);
  if (input.aspectFilter) {
    url.searchParams.set("aspect_filter", input.aspectFilter);
  }
  const filter = browseFilter(input);
  if (filter) url.searchParams.set("filter", filter);

  const started = Date.now();
  let httpStatus = 0;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "X-EBAY-C-MARKETPLACE-ID": input.marketplaceId,
        "Accept-Language": ebayAcceptLanguage(
          input.marketplaceId,
          parseAppLocale(input.locale),
        ),
      },
    });
    httpStatus = res.status;
    const body = (await res.json()) as SearchResponse;
    if (!res.ok) {
      const message = ebayErrorFromBody(body, res.status);
      await noteCall(input.record, {
        api: "browse_search",
        ok: false,
        httpStatus,
        durationMs: Date.now() - started,
        error: message,
      });
      return { listings: [], note: message };
    }
    await noteCall(input.record, {
      api: "browse_search",
      ok: true,
      httpStatus,
      durationMs: Date.now() - started,
    });

    const listings = (body.itemSummaries ?? [])
      .map(mapItemSummary)
      .filter((item): item is CandidateListing => item !== null);

    return {
      listings,
      ...(typeof body.total === "number" ? { total: body.total } : {}),
      offset: body.offset ?? input.offset ?? 0,
      limit,
    };
  } catch (error) {
    await noteCall(input.record, {
      api: "browse_search",
      ok: false,
      httpStatus,
      durationMs: Date.now() - started,
      error: ebayErrorFromThrown(error, httpStatus),
    });
    throw error;
  }
}

export function browseFilter(input: BrowseFilterInput): string | undefined {
  const parts = browseFilterParts(input);
  return parts.length > 0 ? parts.join(",") : undefined;
}

const GET_ITEM_CONCURRENCY = 5;

/**
 * Public getItem (one REST id). Bulk getItems (/item/?item_ids=) is a
 * Limited Release partner API and rejects ordinary production keys; it also
 * does not accept fieldgroups=PRODUCT.
 */
export async function getItemsByRestId(input: {
  hosts: BrowseHosts;
  token: string;
  marketplaceId: string;
  itemIds: string[];
  locale?: string;
  record?: EbayApiRecorder;
}): Promise<CandidateListing[]> {
  const unique = [...new Set(input.itemIds.filter(Boolean))];
  const listings: CandidateListing[] = [];
  for (let i = 0; i < unique.length; i += GET_ITEM_CONCURRENCY) {
    const chunk = unique.slice(i, i + GET_ITEM_CONCURRENCY);
    const found = await Promise.all(
      chunk.map((itemId) =>
        getItemByRestId({
          hosts: input.hosts,
          token: input.token,
          marketplaceId: input.marketplaceId,
          itemId,
          ...(input.locale ? { locale: input.locale } : {}),
          ...(input.record ? { record: input.record } : {}),
        }),
      ),
    );
    for (const listing of found) {
      if (listing) listings.push(listing);
    }
  }
  return listings;
}

export async function getItemByRestId(input: {
  hosts: BrowseHosts;
  token: string;
  marketplaceId: string;
  itemId: string;
  locale?: string;
  record?: EbayApiRecorder;
}): Promise<CandidateListing | null> {
  const url = new URL(
    `${input.hosts.buy}/buy/browse/v1/item/${encodeURIComponent(input.itemId)}`,
  );
  url.searchParams.set("fieldgroups", "PRODUCT");
  const started = Date.now();
  let httpStatus = 0;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "X-EBAY-C-MARKETPLACE-ID": input.marketplaceId,
        "Accept-Language": ebayAcceptLanguage(
          input.marketplaceId,
          parseAppLocale(input.locale),
        ),
      },
    });
    httpStatus = res.status;
    const body = (await res.json()) as BrowseItem & ItemsResponse;
    if (!res.ok) {
      await noteCall(input.record, {
        api: "get_item",
        ok: false,
        httpStatus,
        durationMs: Date.now() - started,
        error: ebayErrorFromBody(body, res.status),
      });
      return null;
    }
    await noteCall(input.record, {
      api: "get_item",
      ok: true,
      httpStatus,
      durationMs: Date.now() - started,
    });
    return mapBrowseItem(body);
  } catch (error) {
    await noteCall(input.record, {
      api: "get_item",
      ok: false,
      httpStatus,
      durationMs: Date.now() - started,
      error: ebayErrorFromThrown(error, httpStatus),
    });
    return null;
  }
}

type PublicKeyResponse = {
  algorithm?: string;
  digest?: string;
  key?: string;
};

const BROWSE_FORWARD_HEADER_NAMES = [
  "x-ebay-c-marketplace-id",
  "x-ebay-c-enduserctx",
  "accept",
  "accept-language",
  "content-language",
  "content-type",
];

/**
 * Transparent Browse forward. Query string and JSON body stay as the
 * caller sent them so a partner can keep the official eBay contract.
 */
export async function forwardBrowseRequest(input: {
  hosts: BrowseHosts;
  token: string;
  method: string;
  pathname: string;
  search: string;
  headers: Headers;
  body?: string | null;
  api: EbayApiCallEvent["api"];
  record?: EbayApiRecorder;
}): Promise<{ status: number; body: string; headers: Headers }> {
  const url = new URL(`${input.pathname}${input.search}`, `${input.hosts.buy}/`);
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${input.token}`);
  for (const name of BROWSE_FORWARD_HEADER_NAMES) {
    const value = input.headers.get(name);
    if (value) headers.set(name, value);
  }

  const started = Date.now();
  let httpStatus = 0;
  try {
    const res = await fetch(url, {
      method: input.method,
      cache: "no-store",
      headers,
      ...((input.method === "GET" || input.method === "HEAD" || !input.body)
        ? {}
        : { body: input.body }),
    });
    httpStatus = res.status;
    const body = await res.text();
    await noteCall(input.record, {
      api: input.api,
      ok: res.ok,
      httpStatus,
      durationMs: Date.now() - started,
      ...(res.ok
        ? {}
        : {
            error: truncateEbayError(
              `${input.method} ${input.pathname}: ${ebayErrorFromText(body, res.status)}`,
            ),
          }),
    });
    return { status: res.status, body, headers: res.headers };
  } catch (error) {
    await noteCall(input.record, {
      api: input.api,
      ok: false,
      httpStatus,
      durationMs: Date.now() - started,
      error: truncateEbayError(
        `${input.method} ${input.pathname}: ${ebayErrorFromThrown(error, httpStatus)}`,
      ),
    });
    throw error;
  }
}

export async function getNotificationPublicKey(input: {
  hosts: BrowseHosts;
  token: string;
  keyId: string;
  record?: EbayApiRecorder;
}): Promise<{ key: string; algorithm?: string; digest?: string }> {
  const url = `${input.hosts.identity}/commerce/notification/v1/public_key/${encodeURIComponent(input.keyId)}`;
  const started = Date.now();
  let httpStatus = 0;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
      },
    });
    httpStatus = res.status;
    const body = (await res.json()) as PublicKeyResponse;
    if (!res.ok || !body.key) {
      throw new Error(ebayErrorFromBody(body, res.status));
    }
    await noteCall(input.record, {
      api: "notification_public_key",
      ok: true,
      httpStatus,
      durationMs: Date.now() - started,
    });
    const result: { key: string; algorithm?: string; digest?: string } = {
      key: body.key,
    };
    if (body.algorithm) result.algorithm = body.algorithm;
    if (body.digest) result.digest = body.digest;
    return result;
  } catch (error) {
    await noteCall(input.record, {
      api: "notification_public_key",
      ok: false,
      httpStatus,
      durationMs: Date.now() - started,
      error: ebayErrorFromThrown(error, httpStatus),
    });
    throw error;
  }
}

export function mergeHydratedListing(
  listing: CandidateListing,
  detail: CandidateListing,
): CandidateListing {
  return {
    ...listing,
    ...(detail.epid && !listing.epid ? { epid: detail.epid } : {}),
    ...(detail.gtin ? { gtin: detail.gtin } : {}),
    ...(detail.brand ? { brand: detail.brand } : {}),
    ...(detail.mpn ? { mpn: detail.mpn } : {}),
    ...(detail.localizedAspects?.length
      ? { localizedAspects: detail.localizedAspects }
      : {}),
    ...(detail.conditionDescriptors?.length
      ? { conditionDescriptors: detail.conditionDescriptors }
      : {}),
    ...(!listing.categoryIds?.length && detail.categoryIds?.length
      ? { categoryIds: detail.categoryIds }
      : {}),
    ...(!listing.itemLocationCountry && detail.itemLocationCountry
      ? { itemLocationCountry: detail.itemLocationCountry }
      : {}),
    ...(!listing.sellerUsername && detail.sellerUsername
      ? { sellerUsername: detail.sellerUsername }
      : {}),
  };
}
