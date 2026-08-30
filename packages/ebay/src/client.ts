import {
  ebaySearchQuery,
  type CandidateListing,
  type CoverageQuery,
} from "@waitseebuy/domain";
import {
  fetchApplicationToken,
  hostsForEnv,
  searchItemSummaries,
} from "./browse";

export type EbayClientConfig = {
  clientId?: string;
  clientSecret?: string;
  env?: "sandbox" | "production";
};

export type SearchResult = {
  listings: CandidateListing[];
  configured: boolean;
  note?: string;
};

type CachedToken = { token: string; expiresAtMs: number };

let tokenCache: CachedToken | null = null;

/**
 * Single eBay client. Every feature that wants "just one more search" goes here.
 */
export class EbayClient {
  constructor(private readonly config: EbayClientConfig) {}

  isConfigured(): boolean {
    return Boolean(this.config.clientId && this.config.clientSecret);
  }

  private env(): "sandbox" | "production" {
    return this.config.env === "sandbox" ? "sandbox" : "production";
  }

  private async token(): Promise<string> {
    const now = Date.now();
    if (tokenCache && tokenCache.expiresAtMs > now + 60_000) {
      return tokenCache.token;
    }
    const { token, expiresInSec } = await fetchApplicationToken(
      hostsForEnv(this.env()),
      this.config.clientId ?? "",
      this.config.clientSecret ?? "",
    );
    tokenCache = { token, expiresAtMs: now + expiresInSec * 1000 };
    return token;
  }

  async search(
    coverage: CoverageQuery,
    bounds?: { maxLandedCents?: number },
  ): Promise<SearchResult> {
    if (!this.isConfigured()) {
      return {
        listings: [],
        configured: false,
        note: "eBay API credentials are not set. Search will light up after keys are added.",
      };
    }

    try {
      const token = await this.token();
      const result = await searchItemSummaries({
        hosts: hostsForEnv(this.env()),
        token,
        q: ebaySearchQuery(coverage.keywords, coverage.excludeKeywords),
        marketplaceId: coverage.ebaySite,
        listingType: coverage.listingType,
        ...(bounds?.maxLandedCents !== undefined
          ? { priceMaxCents: bounds.maxLandedCents }
          : {}),
        ...(coverage.condition !== "any"
          ? { condition: coverage.condition }
          : {}),
        ...(coverage.itemLocation
          ? { itemLocation: coverage.itemLocation }
          : {}),
        ...(coverage.deliveryCountry
          ? { deliveryCountry: coverage.deliveryCountry }
          : {}),
        ...(coverage.deliveryPostal
          ? { deliveryPostal: coverage.deliveryPostal }
          : {}),
      });
      return { ...result, configured: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "eBay search failed";
      return { listings: [], configured: true, note: message };
    }
  }
}

export function createEbayClientFromEnv(): EbayClient {
  const rawEnv = (process.env.EBAY_ENV ?? "sandbox").toLowerCase();
  const config: EbayClientConfig = {
    env: rawEnv === "production" ? "production" : "sandbox",
  };
  if (process.env.EBAY_CLIENT_ID) config.clientId = process.env.EBAY_CLIENT_ID;
  if (process.env.EBAY_CLIENT_SECRET) {
    config.clientSecret = process.env.EBAY_CLIENT_SECRET;
  }
  return new EbayClient(config);
}
