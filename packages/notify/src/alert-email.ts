import {
  describeListingLocation,
  describePriceScore,
  ebaySiteCurrency,
  formatMoney,
  landedCostCents,
  sellerConfidence,
  sellerConfidenceTone,
  type CandidateListing,
  type WatchFrequency,
} from "@watchseebuy/domain";
import {
  alertEmailIntro,
  alertEmailSubject,
  alertEmailTitle,
} from "./alert-copy.ts";
import { attr, escapeHtml } from "./html.ts";

const INK = "#1c1917";
const MUTED = "#57534e";
const PAPER = "#f6f1e8";
const CARD = "#fffdf8";
const LINE = "#e7e0d4";
const ACCENT = "#9a3412";

const SCORE = {
  high: { ink: "#3f6212", line: "#d4e0bf", bg: "#f4f7ec", muted: "#4d7c0f" },
  mid: { ink: "#92400e", line: "#edd6b3", bg: "#faf4ea", muted: "#b45309" },
  low: { ink: MUTED, line: LINE, bg: PAPER, muted: MUTED },
} as const;

export type AlertEmailListing = CandidateListing & {
  buyUrl: string;
};

export type AlertEmailInput = {
  frequency: WatchFrequency;
  watchLabel: string;
  watchSummary: string;
  listings: AlertEmailListing[];
  openSearchUrl: string;
  stopWatchUrl: string;
  appUrl: string;
  brandMarkUrl: string;
  site?: string;
};

export type RenderedAlertEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderAlertEmail(input: AlertEmailInput): RenderedAlertEmail {
  const subject = alertEmailSubject({
    frequency: input.frequency,
    watchLabel: input.watchLabel,
    listingCount: input.listings.length,
  });
  return {
    subject,
    html: renderHtml(input, subject),
    text: renderText(input, subject),
  };
}

function renderHtml(input: AlertEmailInput, subject: string): string {
  const title = alertEmailTitle(input.frequency);
  const intro = alertEmailIntro({
    frequency: input.frequency,
    listingCount: input.listings.length,
  });
  const currency = ebaySiteCurrency(input.site);
  const listings = input.listings
    .map((listing) => renderListing(listing, currency))
    .join("");
  const count = input.listings.length;
  const countLabel = `${count} ${count === 1 ? "result" : "results"}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK};font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(intro)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:24px 12px 40px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:0 4px 20px;">
              <a href="${attr(input.appUrl)}" style="text-decoration:none;color:${INK};">
                <img src="${attr(input.brandMarkUrl)}" width="34" height="34" alt="" style="display:inline-block;vertical-align:middle;border:0;">
                <span style="font-size:20px;letter-spacing:-0.02em;vertical-align:middle;padding-left:8px;">WatchSeeBuy</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 8px;color:${ACCENT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">
              ${escapeHtml(title)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 8px;font-size:28px;line-height:1.15;letter-spacing:-0.03em;">
              ${escapeHtml(input.watchLabel)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.5;color:${MUTED};">
              ${escapeHtml(input.watchSummary)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.5;color:${INK};">
              ${escapeHtml(intro)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 24px;">
              ${button(input.openSearchUrl, "Open the watch", true)}
              ${button(input.stopWatchUrl, "Stop this watch", false)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 4px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${MUTED};">
              ${escapeHtml(countLabel)}
            </td>
          </tr>
          ${listings}
          <tr>
            <td style="padding:28px 4px 0;border-top:1px solid ${LINE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.55;color:${MUTED};">
              WatchSeeBuy is an independent product. If you buy through our links, we may earn a commission from the eBay Partner Network. That does not change the price you pay.
              <br><br>
              <a href="${attr(input.openSearchUrl)}" style="color:${MUTED};">Open this watch</a>
              &nbsp;·&nbsp;
              <a href="${attr(input.stopWatchUrl)}" style="color:${MUTED};">Stop this watch</a>
              &nbsp;·&nbsp;
              <a href="${attr(input.appUrl)}" style="color:${MUTED};">watchseebuy.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderListing(listing: AlertEmailListing, currency: string): string {
  const landed = landedCostCents({
    itemCents: listing.itemCents,
    shippingCents: listing.shippingCents,
  });
  const money = (cents: number) => formatMoney(cents, currency);
  const breakdown =
    listing.shippingCents === 0
      ? `${money(listing.itemCents)} + shipping not shown or free`
      : `${money(listing.itemCents)} + ${money(listing.shippingCents)} shipping`;
  const meta = [listing.condition, listingMeta(listing)].filter(Boolean).join(" · ");
  const price = listing.priceScore ?? {
    score: null,
    tone: "low" as const,
    deltaPct: null,
    sampleSize: 0,
    reason: "Could not identify this product confidently",
  };
  const seller = sellerConfidence(listing);
  const sellerTone = sellerConfidenceTone(seller);
  const image = listing.imageUrl
    ? `<img src="${attr(listing.imageUrl)}" width="96" height="96" alt="" style="display:block;width:96px;height:96px;object-fit:cover;border-radius:6px;background:${LINE};">`
    : `<div style="width:96px;height:96px;border-radius:6px;background:${LINE};"></div>`;
  const location = describeListingLocation(listing.itemLocationCountry);
  const locationLine = location
    ? `<div style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${MUTED};">${escapeHtml(location)}</div>`
    : "";
  const comp = price.reason
    ? `<div style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.4;color:${MUTED};">${escapeHtml(describePriceScore(price, listing.identity))}</div>`
    : "";

  return `<tr>
    <td style="padding:0 0 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD};border:1px solid ${LINE};border-radius:10px;">
        <tr>
          <td style="padding:16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="top" width="96" style="width:96px;padding:0 16px 0 0;">
                  ${image}
                </td>
                <td valign="top">
                  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:600;line-height:1.35;color:${INK};">
                    ${escapeHtml(listing.title)}
                  </div>
                  ${meta ? `<div style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${MUTED};">${escapeHtml(meta)}</div>` : ""}
                  ${locationLine}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:14px 0 0;">
                  <div style="font-size:26px;letter-spacing:-0.03em;line-height:1.1;">${escapeHtml(money(landed))}</div>
                  <div style="margin:6px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${MUTED};">${escapeHtml(breakdown)}</div>
                  ${comp}
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                    <tr>
                      ${scoreCell(price.score, "Price score", price.tone)}
                      <td width="8"></td>
                      ${scoreCell(seller, "Seller score", sellerTone)}
                    </tr>
                  </table>
                  <div style="padding-top:12px;">
                    ${button(listing.buyUrl, "Buy on eBay", true)}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function scoreCell(
  score: number | null,
  label: string,
  tone: "high" | "mid" | "low",
): string {
  const colors = SCORE[tone];
  return `<td style="min-width:72px;padding:6px 10px 5px;border:1px solid ${colors.line};border-radius:6px;background:${colors.bg};text-align:center;">
    <div style="font-size:18px;letter-spacing:-0.03em;line-height:1;color:${colors.ink};">${score ?? "—"}</div>
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:10px;letter-spacing:0.04em;text-transform:uppercase;color:${colors.muted};padding-top:3px;">${escapeHtml(label)}</div>
  </td>`;
}

function button(href: string, label: string, primary: boolean): string {
  if (primary) {
    return `<a href="${attr(href)}" style="display:inline-block;background:${INK};color:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;text-decoration:none;padding:12px 16px;border-radius:6px;margin:0 8px 8px 0;">${escapeHtml(label)}</a>`;
  }
  return `<a href="${attr(href)}" style="display:inline-block;background:${CARD};color:${INK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;text-decoration:none;padding:11px 15px;border-radius:6px;border:1px solid ${LINE};margin:0 8px 8px 0;">${escapeHtml(label)}</a>`;
}

function listingMeta(listing: CandidateListing): string {
  const bits: string[] = [];
  if (listing.listingType === "auction") bits.push("Auction");
  if (listing.buyingOptions?.includes("BEST_OFFER")) bits.push("Best Offer");
  return bits.join(" · ");
}

function renderText(input: AlertEmailInput, subject: string): string {
  const intro = alertEmailIntro({
    frequency: input.frequency,
    listingCount: input.listings.length,
  });
  const currency = ebaySiteCurrency(input.site);
  const listings = input.listings
    .map((listing) => {
      const landed = landedCostCents({
        itemCents: listing.itemCents,
        shippingCents: listing.shippingCents,
      });
      const price = listing.priceScore;
      const seller = sellerConfidence(listing);
      return [
        listing.title,
        formatMoney(landed, currency),
        price ? describePriceScore(price, listing.identity) : "",
        `Seller score ${seller}`,
        `Buy on eBay: ${listing.buyUrl}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    subject,
    "",
    input.watchLabel,
    input.watchSummary,
    "",
    intro,
    "",
    `Open the watch: ${input.openSearchUrl}`,
    `Stop this watch: ${input.stopWatchUrl}`,
    "",
    listings,
    "",
    "WatchSeeBuy is an independent product. If you buy through our links, we may earn a commission from the eBay Partner Network.",
  ].join("\n");
}
