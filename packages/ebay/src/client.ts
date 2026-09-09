import {
  applyListingIdentity,
  ebaySearchQuery,
  type CandidateListing,
  type CoverageQuery,
} from "@waitseebuy/domain";
import {
  getDb,
  recordEbayApiCall,
  type EbayApiSource,
} from "@waitseebuy/db";
import {
  fetchApplicationToken,
  getItemsByRestId,
  getNotificationPublicKey,
  hostsForEnv,
  mergeHydratedListing,
  searchItemSummaries,
  type EbayApiRecorder,
} from "./browse";
import {
  parseEbaySignatureHeader,
  verifyNotificationSignature,
} from "./account-deletion";

export type EbayClientConfig = {
  clientId?: string;
  clientSecret?: string;
  env?: "sandbox" | "production";
  source?: EbayApiSource;
};

export type SearchResult = {
  listings: CandidateListing[];
  configured: boolean;
  note?: string;
};

type CachedToken = { token: string; expiresAtMs: number };
type CachedPublicKey = { key: string; expiresAtMs: number };

let tokenCache: CachedToken | null = null;
const publicKeyCache = new Map<string, CachedPublicKey>();
const PUBLIC_KEY_TTL_MS = 60 * 60 * 1000;

function persistEbayCall(
  source: EbayApiSource,
): EbayApiRecorder {
  return async (event) => {
    if (!process.env.DATABASE_URL) return;
    try {
      await recordEbayApiCall(getDb(), {
        api: event.api,
        source,
        ok: event.ok,
        httpStatus: event.httpStatus,
        durationMs: event.durationMs,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          at: new Date().toISOString(),
          message: "ebay_api_calls insert failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  };
}

/**
 * Single eBay client. Every feature that wants "just one more search" goes here.
 */
export class EbayClient {
  private readonly record: EbayApiRecorder;

  constructor(private readonly config: EbayClientConfig) {
    this.record = persistEbayCall(config.source ?? "web_search");
  }

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
      this.record,
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
        record: this.record,
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
        ...(coverage.categoryIds ? { categoryIds: coverage.categoryIds } : {}),
        ...(coverage.aspectFilter ? { aspectFilter: coverage.aspectFilter } : {}),
      });
      return { ...result, configured: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "eBay search failed";
      return { listings: [], configured: true, note: message };
    }
  }

  /**
   * Public getItem per listing (PRODUCT field group). Call only after local
   * filters so search itself stays a single item_summary request. Bulk
   * getItems is Limited Release and is not used.
   */
  async hydrateProductSignals(
    listings: CandidateListing[],
    marketplaceId: string,
  ): Promise<CandidateListing[]> {
    if (!this.isConfigured() || listings.length === 0) {
      return listings.map((listing) => applyListingIdentity(listing));
    }

    const ids = listings
      .map((listing) => listing.restItemId)
      .filter((id): id is string => Boolean(id));

    let details: CandidateListing[] = [];
    if (ids.length > 0) {
      try {
        const token = await this.token();
        details = await getItemsByRestId({
          hosts: hostsForEnv(this.env()),
          token,
          marketplaceId,
          itemIds: ids,
          record: this.record,
        });
      } catch {
        details = [];
      }
    }

    const byRestId = new Map(
      details
        .filter((item) => item.restItemId)
        .map((item) => [item.restItemId as string, item]),
    );
    const byLegacyId = new Map(
      details.map((item) => [item.ebayItemId, item]),
    );

    return listings.map((listing) => {
      const detail =
        (listing.restItemId
          ? byRestId.get(listing.restItemId)
          : undefined) ?? byLegacyId.get(listing.ebayItemId);
      const merged = detail ? mergeHydratedListing(listing, detail) : listing;
      return applyListingIdentity(merged);
    });
  }

  async verifyAccountDeletionSignature(
    rawBody: string,
    signatureHeader: string | null,
  ): Promise<boolean> {
    const parsed = parseEbaySignatureHeader(signatureHeader);
    if (!parsed || !this.isConfigured()) return false;
    const now = Date.now();
    const cached = publicKeyCache.get(parsed.kid);
    let key = cached && cached.expiresAtMs > now ? cached.key : null;
    if (!key) {
      const token = await this.token();
      const fetched = await getNotificationPublicKey({
        hosts: hostsForEnv(this.env()),
        token,
        keyId: parsed.kid,
        record: this.record,
      });
      key = fetched.key;
      publicKeyCache.set(parsed.kid, {
        key,
        expiresAtMs: now + PUBLIC_KEY_TTL_MS,
      });
    }
    return verifyNotificationSignature({
      rawBody,
      signature: parsed.signature,
      publicKeyPem: key,
    });
  }
}

export function createEbayClientFromEnv(
  source: EbayApiSource = "web_search",
): EbayClient {
  const rawEnv = (process.env.EBAY_ENV ?? "sandbox").toLowerCase();
  const config: EbayClientConfig = {
    env: rawEnv === "production" ? "production" : "sandbox",
    source,
  };
  if (process.env.EBAY_CLIENT_ID) config.clientId = process.env.EBAY_CLIENT_ID;
  if (process.env.EBAY_CLIENT_SECRET) {
    config.clientSecret = process.env.EBAY_CLIENT_SECRET;
  }
  return new EbayClient(config);
}
