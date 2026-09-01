import {
  describePriceScore,
  describeSellerFeedback,
  formatUsd,
  landedCostCents,
  sellerConfidence,
  sellerConfidenceTone,
} from "@waitseebuy/domain";
import type { CandidateListing, PriceScore } from "@waitseebuy/domain";
import { ListingDescription } from "@/components/listing-description";
import { epnItemUrl, plainItemUrl } from "@waitseebuy/ebay";

function listingMeta(listing: CandidateListing): string {
  const bits: string[] = [];
  if (listing.listingType === "auction") bits.push("Auction");
  if (listing.buyingOptions?.includes("BEST_OFFER")) bits.push("Best Offer");
  return bits.join(" · ");
}

export function ListingCard({ listing }: { listing: CandidateListing }) {
  const landed = landedCostCents({
    itemCents: listing.itemCents,
    shippingCents: listing.shippingCents,
  });
  const buyHref =
    epnItemUrl({
      itemId: listing.ebayItemId,
      ...(process.env.EPN_CAMPAIGN_ID
        ? { campaignId: process.env.EPN_CAMPAIGN_ID }
        : {}),
      ...(process.env.EPN_TOOL_ID ? { toolId: process.env.EPN_TOOL_ID } : {}),
    }) ??
    listing.webUrl ??
    plainItemUrl(listing.ebayItemId);
  const fallback = listing.webUrl ?? plainItemUrl(listing.ebayItemId);
  const breakdown =
    listing.shippingCents === 0
      ? `${formatUsd(listing.itemCents)} + shipping not shown or free`
      : `${formatUsd(listing.itemCents)} + ${formatUsd(listing.shippingCents)} shipping`;

  return (
    <li className="listing">
      {listing.imageUrl ? (
        // eBay listing thumbs; remote host varies by CDN.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.imageUrl} alt="" />
      ) : (
        <div className="listing-ph" />
      )}
      <div className="listing-main">
        <div className="listing-top">
          <div className="listing-copy">
            <h2>{listing.title}</h2>
            {listing.description ? (
              <ListingDescription text={listing.description} />
            ) : null}
            {listing.condition || listingMeta(listing) ? (
              <p className="listing-meta">
                {[listing.condition, listingMeta(listing)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            {listing.identity && listing.identity.confidence !== "low" ? (
              <p className="listing-identity">
                {listing.identity.label}
              </p>
            ) : null}
          </div>
          <div className="listing-price">
            <p className="listing-landed">{formatUsd(landed)}</p>
            <p className="listing-breakdown">{breakdown}</p>
            <div className="listing-scores">
              <PriceScoreCard
                score={listing.priceScore}
                identity={listing.identity}
              />
              <ConfidenceCard listing={listing} />
            </div>
          </div>
        </div>
        <div className="listing-actions">
          <a className="btn" href={buyHref} rel="nofollow sponsored" target="_blank">
            Buy on eBay
          </a>
          {buyHref !== fallback ? (
            <a className="btn secondary" href={fallback} rel="nofollow" target="_blank">
              Direct link
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function PriceScoreCard({
  score,
  identity,
}: {
  score?: PriceScore;
  identity?: CandidateListing["identity"];
}) {
  const resolved: PriceScore = score ?? {
    score: null,
    tone: "low",
    deltaPct: null,
    sampleSize: 0,
    reason: "Could not identify this product confidently",
  };
  return (
    <p
      className={`confidence confidence-${resolved.tone}`}
      title={describePriceScore(resolved, identity)}
    >
      <span className="confidence-score">{resolved.score ?? "—"}</span>
      <span className="confidence-label">Price score</span>
    </p>
  );
}

function ConfidenceCard({ listing }: { listing: CandidateListing }) {
  const score = sellerConfidence(listing);
  const tone = sellerConfidenceTone(score);
  return (
    <p
      className={`confidence confidence-${tone}`}
      title={describeSellerFeedback(listing)}
    >
      <span className="confidence-score">{score}</span>
      <span className="confidence-label">Seller score</span>
    </p>
  );
}
