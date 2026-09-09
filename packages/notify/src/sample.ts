import type { WatchCriteria } from "@waitseebuy/domain";
import { describeWatch } from "@waitseebuy/domain";
import type { AlertEmailInput, AlertEmailListing } from "./alert-email.ts";

const SAMPLE_WATCH: WatchCriteria = {
  query: "PSA 10 Base Set Charizard",
  condition: "graded",
  excludeKeywords: ["reprint", "proxy"],
  listingType: "bin",
  maxLandedCents: 450000,
  minConfidence: 7,
  minPriceScore: 7,
  grader: "psa",
  cardGrade: "10",
  cardSet: "base-set",
  cardGame: "pokemon-tcg",
  ebaySite: "EBAY_US",
  shipToPostal: "10001",
};

function sampleListings(origin: string): AlertEmailListing[] {
  return [
    {
      ebayItemId: "111111111111",
      title: "Pokemon Base Set Charizard PSA 10 Gem Mint Holo 4/102 Unlimited",
      itemCents: 312500,
      shippingCents: 1495,
      listingType: "bin",
      condition: "Graded",
      itemLocationCountry: "US",
      imageUrl: `${origin}/dev/sample-listing-1.svg`,
      sellerFeedbackScore: 4280,
      sellerFeedbackPercentage: 99.8,
      identity: {
        itemKey: "psa|base-set-charizard|10",
        label: "PSA 10 · Base Set Charizard",
        confidence: "high",
        source: "title",
      },
      priceScore: {
        score: 9,
        tone: "high",
        deltaPct: -18,
        sampleSize: 11,
        reason: "18% below the median of 11 similar listings",
      },
      buyUrl: `${origin}/out/preview-buy-1`,
    },
    {
      ebayItemId: "222222222222",
      title: "1999 Pokemon Base Set Charizard Holo PSA 10 #4 Unlimited",
      itemCents: 389900,
      shippingCents: 899,
      listingType: "bin",
      buyingOptions: ["BEST_OFFER"],
      condition: "Graded",
      itemLocationCountry: "JP",
      imageUrl: `${origin}/dev/sample-listing-2.svg`,
      sellerFeedbackScore: 186,
      sellerFeedbackPercentage: 100,
      identity: {
        itemKey: "psa|base-set-charizard|10",
        label: "PSA 10 · Base Set Charizard",
        confidence: "high",
        source: "title",
      },
      priceScore: {
        score: 7,
        tone: "mid",
        deltaPct: 4,
        sampleSize: 11,
        reason: "4% above the median of 11 similar listings",
      },
      buyUrl: `${origin}/out/preview-buy-2`,
    },
    {
      ebayItemId: "333333333333",
      title: "Charizard Base Set Holo PSA 10 Pokemon 1999 WOTC",
      itemCents: 429500,
      shippingCents: 0,
      listingType: "bin",
      condition: "Graded",
      itemLocationCountry: "GB",
      imageUrl: `${origin}/dev/sample-listing-3.svg`,
      sellerFeedbackScore: 52,
      sellerFeedbackPercentage: 96.4,
      identity: {
        itemKey: "psa|base-set-charizard|10",
        label: "PSA 10 · Base Set Charizard",
        confidence: "medium",
        source: "title",
      },
      priceScore: {
        score: 6,
        tone: "mid",
        deltaPct: 14,
        sampleSize: 11,
        reason: "14% above the median of 11 similar listings",
      },
      buyUrl: `${origin}/out/preview-buy-3`,
    },
  ];
}

export function sampleAlertEmailInput(
  frequency: AlertEmailInput["frequency"],
  origin = "https://waitseebuy.com",
): AlertEmailInput {
  const all = sampleListings(origin);
  const listings = frequency === "on_change" ? all.slice(0, 1) : all;
  return {
    frequency,
    watchLabel: "PSA 10 Base Set Charizard",
    watchSummary: describeWatch(SAMPLE_WATCH),
    listings,
    openSearchUrl: `${origin}/search?q=PSA+10+Base+Set+Charizard&watch=preview-watch&max=4500&grader=psa&grade=10`,
    stopWatchUrl: `${origin}/watches/preview-watch/stop`,
    appUrl: origin,
    brandMarkUrl: `${origin}/brand-mark.png?v=16`,
    site: "EBAY_US",
  };
}
