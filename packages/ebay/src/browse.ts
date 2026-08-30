import {
  browseFilterParts,
  type BrowseFilterInput,
  type CandidateListing,
  type ConditionClass,
  type ListingType,
} from "@waitseebuy/domain";

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type Money = { value?: string; currency?: string };

type ItemSummary = {
  itemId?: string;
  legacyItemId?: string;
  title?: string;
  image?: { imageUrl?: string };
  price?: Money;
  currentBidPrice?: Money;
  itemWebUrl?: string;
  buyingOptions?: string[];
  shippingOptions?: Array<{ shippingCost?: Money }>;
  condition?: string;
  conditionId?: string;
  shortDescription?: string;
  seller?: { feedbackScore?: number; feedbackPercentage?: string | number };
};

type SearchResponse = {
  itemSummaries?: ItemSummary[];
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

export function mapItemSummary(item: ItemSummary): CandidateListing | null {
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
  if (options.length > 0) listing.buyingOptions = options;
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
  if (item.itemWebUrl) listing.webUrl = item.itemWebUrl;
  if (item.shortDescription?.trim()) {
    listing.description = item.shortDescription.trim();
  }
  return listing;
}

export async function fetchApplicationToken(
  hosts: BrowseHosts,
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; expiresInSec: number }> {
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
  const body = (await res.json()) as TokenResponse;
  if (!res.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? body.error ?? `eBay token HTTP ${res.status}`,
    );
  }
  return { token: body.access_token, expiresInSec: body.expires_in ?? 7200 };
}

export async function searchItemSummaries(input: {
  hosts: BrowseHosts;
  token: string;
  q: string;
  marketplaceId: string;
  limit?: number;
  priceMaxCents?: number;
  condition?: ConditionClass;
  listingType?: ListingType;
  itemLocation?: string;
  deliveryCountry?: string;
  deliveryPostal?: string;
}): Promise<{ listings: CandidateListing[]; note?: string }> {
  const url = new URL(`${input.hosts.buy}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", input.q);
  url.searchParams.set("limit", String(input.limit ?? 24));
  url.searchParams.set("fieldgroups", "EXTENDED");
  const filter = browseFilter(input);
  if (filter) url.searchParams.set("filter", filter);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.token}`,
      "X-EBAY-C-MARKETPLACE-ID": input.marketplaceId,
    },
  });
  const body = (await res.json()) as SearchResponse;
  if (!res.ok) {
    const message =
      body.errors?.[0]?.longMessage ??
      body.errors?.[0]?.message ??
      `eBay search HTTP ${res.status}`;
    return { listings: [], note: message };
  }

  const listings = (body.itemSummaries ?? [])
    .map(mapItemSummary)
    .filter((item): item is CandidateListing => item !== null);

  return { listings };
}

export function browseFilter(input: BrowseFilterInput): string | undefined {
  const parts = browseFilterParts(input);
  return parts.length > 0 ? parts.join(",") : undefined;
}
