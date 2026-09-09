export type EpnLinkInput = {
  itemId: string;
  campaignId?: string;
  publisherId?: string;
  customId?: string;
  toolId?: string;
  site?: string;
};

export type EpnSource = "search" | "alert";

export type EpnConfig = {
  campaignId?: string;
  publisherId?: string;
  toolId?: string;
};

type EpnTracking = { siteid: string; mkrid: string };

const US_TRACKING: EpnTracking = { siteid: "0", mkrid: "711-53200-19255-0" };

/** EPN rotation IDs from the current Link Generator (mkrid) plus marketplace siteid. */
const EPN_TRACKING: Record<string, EpnTracking> = {
  "ebay.at": { siteid: "16", mkrid: "5221-53469-19255-0" },
  "ebay.com.au": { siteid: "15", mkrid: "705-53470-19255-0" },
  "ebay.be": { siteid: "23", mkrid: "1553-53471-19255-0" },
  "ebay.ca": { siteid: "2", mkrid: "706-53473-19255-0" },
  "ebay.ch": { siteid: "193", mkrid: "5222-53480-19255-0" },
  "ebay.de": { siteid: "77", mkrid: "707-53477-19255-0" },
  "ebay.es": { siteid: "186", mkrid: "1185-53479-19255-0" },
  "ebay.fr": { siteid: "71", mkrid: "709-53476-19255-0" },
  "ebay.ie": { siteid: "205", mkrid: "5282-53468-19255-0" },
  "ebay.it": { siteid: "101", mkrid: "724-53478-19255-0" },
  "ebay.nl": { siteid: "146", mkrid: "1346-53482-19255-0" },
  "ebay.co.uk": { siteid: "3", mkrid: "710-53481-19255-0" },
  "ebay.com": US_TRACKING,
};

const MARKETPLACE_HOST: Record<string, string> = {
  EBAY_AT: "ebay.at",
  EBAY_AU: "ebay.com.au",
  EBAY_BE: "ebay.be",
  EBAY_CA: "ebay.ca",
  EBAY_CH: "ebay.ch",
  EBAY_DE: "ebay.de",
  EBAY_ES: "ebay.es",
  EBAY_FR: "ebay.fr",
  EBAY_IE: "ebay.ie",
  EBAY_IT: "ebay.it",
  EBAY_NL: "ebay.nl",
  EBAY_GB: "ebay.co.uk",
  EBAY_UK: "ebay.co.uk",
  EBAY_US: "ebay.com",
};

export function plainItemUrl(
  itemId: string,
  site: string = "ebay.com",
): string {
  return `https://www.${resolveHost(site)}/itm/${encodeURIComponent(itemId)}`;
}

function trimEnv(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function resolveHost(site?: string): string {
  if (!site?.trim()) return "ebay.com";
  const trimmed = site.trim().replace(/^www\./, "");
  const marketplace = trimmed.toUpperCase().replace(/-/g, "_");
  return MARKETPLACE_HOST[marketplace] ?? trimmed;
}

function trackingForHost(host: string): EpnTracking {
  return EPN_TRACKING[host] ?? US_TRACKING;
}

/**
 * On-item EPN URL from the current Link Generator.
 * Ad blockers may strip these query params — always keep a plain fallback.
 */
export function epnItemUrl(input: EpnLinkInput): string | null {
  if (!input.campaignId) return null;
  const host = resolveHost(input.site);
  const tracking = trackingForHost(host);
  const params = new URLSearchParams({
    mkcid: "1",
    mkrid: tracking.mkrid,
    siteid: tracking.siteid,
    campid: input.campaignId,
    ...(input.customId?.trim() ? { customid: input.customId.trim() } : {}),
    toolid: input.toolId ?? "10001",
    mkevt: "1",
  });
  return `${plainItemUrl(input.itemId, host)}?${params.toString()}`;
}

export function epnConfigFromEnv(
  source: EpnSource,
  env: NodeJS.ProcessEnv = process.env,
): EpnConfig {
  const specific =
    source === "alert" ? env.EPN_CAMPAIGN_ID_ALERT : env.EPN_CAMPAIGN_ID_SEARCH;
  const campaignId = trimEnv(specific) ?? trimEnv(env.EPN_CAMPAIGN_ID);
  const publisherId = trimEnv(env.EPN_PUBLISHER_ID);
  const toolId = trimEnv(env.EPN_TOOL_ID);
  const config: EpnConfig = {};
  if (campaignId) config.campaignId = campaignId;
  if (publisherId) config.publisherId = publisherId;
  if (toolId) config.toolId = toolId;
  return config;
}

export function epnEnabledFromEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    trimEnv(env.EPN_CAMPAIGN_ID) ||
      trimEnv(env.EPN_CAMPAIGN_ID_SEARCH) ||
      trimEnv(env.EPN_CAMPAIGN_ID_ALERT),
  );
}

/** EasyList-style filters still block this host; use it as a blocker heuristic. */
export const EPN_PROBE_HOST = "https://rover.ebay.com/favicon.ico";
