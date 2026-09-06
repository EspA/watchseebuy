export type EpnLinkInput = {
  itemId: string;
  campaignId?: string;
  customId?: string;
  toolId?: string;
  site?: string;
};

export function plainItemUrl(
  itemId: string,
  site: string = "ebay.com",
): string {
  return `https://www.${site}/itm/${encodeURIComponent(itemId)}`;
}

/** Rover-style EPN URL. Ad blockers may kill this host — always keep a plain fallback. */
export function epnItemUrl(input: EpnLinkInput): string | null {
  if (!input.campaignId) return null;
  const dest = plainItemUrl(input.itemId, input.site);
  const params = new URLSearchParams({
    icep_ff3: "2",
    pub: input.campaignId,
    toolid: input.toolId ?? "10001",
    campid: input.campaignId,
    customid: input.customId ?? "",
    mpre: dest,
  });
  return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?${params.toString()}`;
}

export const EPN_PROBE_HOST = "https://rover.ebay.com/favicon.ico";
