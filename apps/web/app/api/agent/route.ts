import {
  getDb,
  incrementAgentSearchQuota,
  readAgentSearchQuota,
  writeAgentSearchQuota,
} from "@watchseebuy/db";
import {
  PLAN_ENTITLEMENTS,
  agentSearchGuide,
  agentSearchMonthKey,
  DEFAULT_EBAY_SITE,
  interpretAgentTurn,
  parseAppLocale,
  parseEbaySite,
} from "@watchseebuy/domain";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getLocale } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  AGENT_QUOTA_COOKIE,
  ANONYMOUS_AGENT_SEARCH_LIMIT,
  agentQuotaCookieOptions,
  agentQuotaKey,
  anonymousAgentSearchAllowed,
  readAgentSearchCount,
  signAgentSearchCount,
} from "@/lib/agent-quota";
import { currentBilling } from "@/lib/current-billing";
import { clientMeta } from "@/lib/client-meta";
import { intentFromSearchQuery, type SearchQuery } from "@/lib/search-params";
import { getSession } from "@/lib/session";

const MODEL_DEFAULT = "gemini-3.5-flash-lite";
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 1000;
const MAX_FIELD_CHARS = 300;

const SEARCH_FIELDS = [
  "q",
  "min",
  "max",
  "zip",
  "condition",
  "located",
  "to",
  "confidence",
  "score",
  "listing",
  "exclude",
  "set",
  "rarity",
  "printing",
  "language",
  "grader",
  "grade",
  "cardLine",
  "cardCategory",
  "cardGame",
  "cardNoReprints",
  "cardNoProxy",
  "unofficial",
  "figureCategory",
  "figureScale",
  "figurePackaging",
  "figureCompleteness",
  "figurePunch",
  "brickCategory",
  "brickType",
  "brickStatus",
  "wheelsCategory",
  "wheelsScale",
  "wheelsPackaging",
] as const satisfies readonly (keyof SearchQuery)[];

const LOCALE_NAME: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  nl: "Dutch",
  pl: "Polish",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const RESPONSE_SCHEMA = {
  type: "object",
  required: ["action", "reply", "fresh"],
  properties: {
    action: { type: "string", enum: ["search", "clarify", "out_of_scope"] },
    reply: { type: "string" },
    fresh: { type: "boolean" },
    query: { type: "string", nullable: true },
    minDollars: { type: "number", nullable: true },
    maxDollars: { type: "number", nullable: true },
    condition: { type: "string", nullable: true },
    listing: { type: "string", nullable: true },
    exclude: { type: "string", nullable: true },
    located: { type: "string", nullable: true },
    to: { type: "string", nullable: true },
    zip: { type: "string", nullable: true },
    confidence: { type: "number", nullable: true },
    score: { type: "number", nullable: true },
    set: { type: "string", nullable: true },
    rarity: { type: "string", nullable: true },
    printing: { type: "string", nullable: true },
    language: { type: "string", nullable: true },
    grader: { type: "string", nullable: true },
    grade: { type: "string", nullable: true },
    cardCategory: { type: "string", nullable: true },
    cardGame: { type: "string", nullable: true },
    cardNoReprints: { type: "boolean", nullable: true },
    cardNoProxy: { type: "boolean", nullable: true },
    unofficial: { type: "boolean", nullable: true },
    figureCategory: { type: "string", nullable: true },
    figureScale: { type: "string", nullable: true },
    figurePackaging: { type: "string", nullable: true },
    figureCompleteness: { type: "string", nullable: true },
    figurePunch: { type: "string", nullable: true },
    brickCategory: { type: "string", nullable: true },
    brickType: { type: "string", nullable: true },
    brickStatus: { type: "string", nullable: true },
    wheelsCategory: { type: "string", nullable: true },
    wheelsScale: { type: "string", nullable: true },
    wheelsPackaging: { type: "string", nullable: true },
  },
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return unavailable();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = chatMessages(body.messages);
  if (!messages) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const site =
    parseEbaySite(typeof body.site === "string" ? body.site : undefined) ??
    DEFAULT_EBAY_SITE;
  const search = searchQueryFrom(body.search, site);
  const locale = parseAppLocale(await getLocale()) ?? "en";
  const session = await getSession();
  const quota = session ? null : await anonymousQuota();
  if (quota && !anonymousAgentSearchAllowed(quota.used)) {
    return quotaResponse({ action: "sign_in_required" }, quota.used, quota.secret);
  }
  if (session && (await signedInQuotaBlocked(session.user.id))) {
    return NextResponse.json({ action: "upgrade_required" });
  }

  let raw: unknown;
  try {
    raw = await completeTurn({
      apiKey,
      messages,
      site,
      search,
      locale,
    });
  } catch (error) {
    console.error(
      "agent turn failed",
      error instanceof Error ? error.message : error,
    );
    return unavailable();
  }

  const turn = interpretAgentTurn(raw, {
    ebaySite: site,
    current: intentFromSearchQuery(search),
  });

  if (turn.action === "out_of_scope") {
    return NextResponse.json({ action: "out_of_scope" });
  }
  if (turn.action === "clarify") {
    return NextResponse.json({
      action: "clarify",
      reply: turn.reply,
      fresh: turn.fresh,
    });
  }
  const href = `/search?${turn.params.toString()}`;
  const nextUsed = quota ? quota.used + 1 : 0;
  if (quota?.ip && quota.secret) rememberAnonymousQuota(quota.ip, quota.secret, nextUsed);
  if (session) rememberSignedInSearch(session.user.id);
  return quotaResponse(
    {
      action: "search",
      reply: turn.reply,
      href,
      fresh: turn.fresh,
      ...(quota && nextUsed >= ANONYMOUS_AGENT_SEARCH_LIMIT
        ? { limitReached: true }
        : {}),
    },
    quota ? nextUsed : null,
    quota?.secret ?? "",
  );
}

type AnonymousQuota = { used: number; secret: string; ip: string | null };

async function anonymousQuota(): Promise<AnonymousQuota> {
  const secret = process.env.BETTER_AUTH_SECRET?.trim() ?? "";
  const headerList = await headers();
  const cookieStore = await cookies();
  const fromCookie = readAgentSearchCount(
    cookieStore.get(AGENT_QUOTA_COOKIE)?.value,
    secret,
  );
  const ip = clientMeta(headerList).ip;
  if (!secret || !ip || !anonymousAgentSearchAllowed(fromCookie)) {
    return { used: fromCookie, secret, ip };
  }
  const stored = await storedAgentSearches(ip, secret);
  return { used: Math.max(fromCookie, stored), secret, ip };
}

async function storedAgentSearches(ip: string, secret: string): Promise<number> {
  try {
    const key = agentQuotaKey(ip, secret);
    return await withTimeout(readAgentSearchQuota(getDb(), key), 400);
  } catch {
    return 0;
  }
}

async function signedInQuotaBlocked(userId: string): Promise<boolean> {
  try {
    const billing = await currentBilling(userId);
    const limit = PLAN_ENTITLEMENTS[billing.plan].aiSearchesPerMonth;
    if (limit === null) return false;
    const used = await readAgentSearchQuota(getDb(), agentSearchMonthKey(userId));
    return used >= limit;
  } catch {
    return false;
  }
}

function rememberSignedInSearch(userId: string) {
  void (async () => {
    try {
      const billing = await currentBilling(userId);
      if (PLAN_ENTITLEMENTS[billing.plan].aiSearchesPerMonth === null) return;
      await incrementAgentSearchQuota(getDb(), agentSearchMonthKey(userId));
    } catch (error) {
      console.error(
        "agent quota write failed",
        error instanceof Error ? error.message : error,
      );
    }
  })();
}

function rememberAnonymousQuota(ip: string, secret: string, count: number) {
  const key = agentQuotaKey(ip, secret);
  void (async () => {
    try {
      await writeAgentSearchQuota(getDb(), key, count);
    } catch (error) {
      console.error(
        "agent quota write failed",
        error instanceof Error ? error.message : error,
      );
    }
  })();
}

function quotaResponse(body: unknown, count: number | null, secret: string) {
  const response = NextResponse.json(body);
  if (count !== null && secret) {
    response.cookies.set(
      AGENT_QUOTA_COOKIE,
      signAgentSearchCount(count, secret),
      agentQuotaCookieOptions(),
    );
  }
  return response;
}

function withTimeout(promise: Promise<number>, ms: number): Promise<number> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(0), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(0);
      },
    );
  });
}

async function completeTurn(input: {
  apiKey: string;
  messages: ChatMessage[];
  site: string;
  search: SearchQuery;
  locale: string;
}): Promise<unknown> {
  const ai = new GoogleGenAI({ apiKey: input.apiKey });
  const model = process.env.GEMINI_MODEL?.trim() || MODEL_DEFAULT;
  const response = await ai.models.generateContent({
    model,
    contents: input.messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction: systemPrompt(input),
      temperature: 0.2,
      maxOutputTokens: 512,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  });
  return parseModelJson(response.text ?? "");
}

function systemPrompt(input: {
  site: string;
  search: SearchQuery;
  locale: string;
}): string {
  const language = LOCALE_NAME[input.locale] ?? "English";
  return [
    "You are the WatchSeeBuy catalog assistant.",
    "You only help a collector find listings in the catalog.",
    "A request is in scope when it is a toy or a game a collector would buy. That includes action figures, dolls, plush, building sets, die-cast, model kits, trading cards, card games, board games, tabletop games, and video games.",
    "The launch lines — Pokémon, LEGO, Hot Wheels, Labubu, Kenner Star Wars, Transformers, TMNT, Barbie, G.I. Joe, and He-Man — are examples. Any other toy or game is in scope too, including Dragon Ball, Marvel, Gundam, Magic: The Gathering, and console games.",
    "If the words name a character, set, series, or title a collector would shop for as a toy or game, set action to search.",
    "Browsing the catalog for that piece is in scope, including price, condition, and where it ships.",
    "If the user asks for anything else — general chat, writing, code, weather, account help, saving a watch, alerts, other websites, clothing, comics, coins, stamps, or advice that is not a toy or game search — set action to out_of_scope and reply to an empty string.",
    "Do not answer an out-of-scope request.",
    "When you still need the piece or one missing detail, set action to clarify and ask one short question.",
    "When you can search, set action to search.",
    "fresh is true only when the latest message starts a different search: another piece, line, or franchise, or a request to start over.",
    "fresh is false when the latest message refines the current search, such as price, condition, exclusions, shipping, packaging, or a detail of the same piece.",
    "fresh is false when there is no earlier search.",
    "When fresh is true, ignore the current search and the earlier messages. Fill in only what the new request asks for. A field you omit is cleared.",
    "When fresh is true, talk only about the new search.",
    "When fresh is false, omit a field to keep it from the current search.",
    "reply is one or two short sentences in " +
      language +
      ", spoken to the collector.",
    "When action is search, confirm what you understood. Name the piece and the filters.",
    "Do not begin the reply with Searching, and do not say that you are searching. A separate line already tells the collector to wait.",
    "Sound like a person helping, for example: I'll look for a factory-sealed LEGO set and leave mosaics out.",
    "Do not list individual listings.",
    "The marketplace is " + input.site + ". Do not change it.",
    "Current search JSON:",
    JSON.stringify(input.search),
    "Fields:",
    agentSearchGuide(),
  ].join("\n");
}

function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

function searchQueryFrom(search: unknown, site: string): SearchQuery {
  const query: SearchQuery = { q: "", site };
  if (!isRecord(search)) return query;
  for (const key of SEARCH_FIELDS) {
    const value = search[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim().slice(0, MAX_FIELD_CHARS);
    if (!trimmed) continue;
    query[key] = trimmed;
  }
  return query;
}

function chatMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return null;
  }
  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (item.role !== "user" && item.role !== "assistant") return null;
    if (typeof item.content !== "string") return null;
    const content = item.content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!content) return null;
    messages.push({ role: item.role, content });
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return null;
  return messages;
}

function unavailable() {
  return NextResponse.json({ action: "unavailable" }, { status: 503 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
