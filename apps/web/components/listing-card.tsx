"use client";

import { useTranslations } from "next-intl";
import {
  describeListingLocation,
  describePriceScore,
  describeSellerFeedback,
  ebaySiteCurrency,
  formatMoney,
  landedCostCents,
  sellerConfidence,
  sellerConfidenceTone,
} from "@watchseebuy/domain";
import type { CandidateListing, PriceScore } from "@watchseebuy/domain";
import { ListingDescription } from "@/components/listing-description";
import { ListingImage } from "@/components/listing-image";

function listingMeta(
  listing: CandidateListing,
  t: ReturnType<typeof useTranslations<"listing">>,
): string {
  const bits: string[] = [];
  if (listing.listingType === "auction") bits.push(t("auction"));
  if (listing.buyingOptions?.includes("BEST_OFFER")) bits.push(t("bestOffer"));
  return bits.join(" · ");
}

export function ListingCard({
  listing,
  site,
}: {
  listing: CandidateListing;
  site?: string;
}) {
  const t = useTranslations("listing");
  const currency = ebaySiteCurrency(site);
  const landed = landedCostCents({
    itemCents: listing.itemCents,
    shippingCents: listing.shippingCents,
  });
  const buyParams = new URLSearchParams({ item: listing.ebayItemId });
  if (site) buyParams.set("site", site);
  const buyHref = `/go/buy?${buyParams.toString()}`;
  const money = (cents: number) => formatMoney(cents, currency);
  const location = describeListingLocation(listing.itemLocationCountry);
  const breakdown =
    listing.shippingCents === 0
      ? t("shippingUnknown", { item: money(listing.itemCents) })
      : t("shipping", {
          item: money(listing.itemCents),
          shipping: money(listing.shippingCents),
        });

  return (
    <li className="listing">
      {listing.imageUrl ? (
        <ListingImage src={listing.imageUrl} alt={listing.title} />
      ) : (
        <div className="listing-ph" />
      )}
      <div className="listing-copy">
        <h2>{listing.title}</h2>
        {listing.condition || listingMeta(listing, t) ? (
          <p className="listing-meta">
            {[listing.condition, listingMeta(listing, t)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {location ? <p className="listing-location">{location}</p> : null}
      </div>
      {listing.description ? (
        <ListingDescription text={listing.description} />
      ) : null}
      <div className="listing-price">
        <div className="listing-price-text">
          <p className="listing-landed">{money(landed)}</p>
          <p className="listing-breakdown">{breakdown}</p>
        </div>
        <div className="listing-scores">
          <PriceScoreCard
            score={listing.priceScore}
            identity={listing.identity}
          />
          <ConfidenceCard listing={listing} />
        </div>
        <div className="listing-actions">
          <a
            className="btn"
            href={buyHref}
            rel="nofollow sponsored"
            target="_blank"
          >
            {t("buyOnEbay")}
          </a>
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
  const t = useTranslations("listing");
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
      <span className="confidence-label">{t("priceScore")}</span>
    </p>
  );
}

function ConfidenceCard({ listing }: { listing: CandidateListing }) {
  const t = useTranslations("listing");
  const score = sellerConfidence(listing);
  const tone = sellerConfidenceTone(score);
  return (
    <p
      className={`confidence confidence-${tone}`}
      title={describeSellerFeedback(listing)}
    >
      <span className="confidence-score">{score}</span>
      <span className="confidence-label">{t("sellerScore")}</span>
    </p>
  );
}
