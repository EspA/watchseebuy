export type AgentResultSort =
  | "price"
  | "price-desc"
  | "price-score"
  | "price-score-asc"
  | "seller-score"
  | "seller-score-asc";

const SELLER_SCORE =
  /\b(?:seller(?:'s|s)?\s+(?:scores?|ratings?)|best\s+sellers?|top\s+sellers?|worst\s+sellers?|(?:top|highest|best|lowest)[- ]rated\s+sellers?|beste[n]?\s+verk[aä]ufer|meilleurs?\s+vendeurs?|mejores?\s+vendedores?|migliori?\s+venditori|beste\s+verkopers|najlepsz\w*\s+sprzedawc\w*|verk[aä]ufer(?:-|\s)?(?:score|bewertung)|score\s+du\s+vendeur|score\s+vendeur|note\s+du\s+vendeur|puntuaci[oó]n\s+del\s+vendedor|score\s+del\s+vendedor|punteggio\s+del\s+venditore|verkoperscore|score\s+van\s+de\s+verkoper|ocena\s+sprzedawcy|wynik\s+sprzedawcy)\b/gi;

const PRICE_SCORE =
  /\b(?:price[\s-]+scores?|best\s+deals?|good\s+deals?|best\s+value|top\s+deals?|preis[\s-]?score|preisbewertung|beste[sn]?\s+angebote?|score\s+de\s+prix|score\s+prix|meilleures?\s+affaires|puntuaci[oó]n\s+de\s+precio|score\s+de\s+precio|mejores\s+ofertas|punteggio\s+di\s+prezzo|migliori\s+offerte|prijsscore|beste\s+deals?|ocena\s+ceny|wynik\s+ceny|najlepsze\s+oferty)\b/gi;

const EXPENSIVE =
  /\b(?:not\s+cheap|expensive|pricey|priciest|most\s+expensive|highest\s+price|high\s+price|teur\w*|am\s+teuersten|h[oö]chster\s+preis|plus\s+chers?|le\s+plus\s+cher|co[uû]teux|m[aá]s\s+car[oa]s?|car[oa]s?|pi[uù]\s+costos[oa]|costos[oa]|duurste|duurder|hoge\s+prijs|\bduur\b|najdroż\w*|wysoka\s+cena|drog(?:i|a|ie|iego))\b/gi;

const CHEAP =
  /\b(?:not\s+expensive|cheapest|cheap|inexpensive|affordable|lowest\s+price|low\s+price|bargain|g[uü]nstig\w*|billig\w*|preiswert\w*|pas\s+cher|moins\s+cher|bon\s+march[eé]|barat[oa]s?|econ[oó]mic[oa]s?|m[aá]s\s+barat[oa]|pi[uù]\s+economic[oa]|economic[oa]|a\s+buon\s+mercato|conveniente|goedkoop\w*|lage\s+prijs|najtaniej|najtańsz\w*|tani[ae]?|niska\s+cena)\b/gi;

const LOW_DIRECTION =
  /\b(?:low|lowest|worst|niedrig\w*|faible|bas|bajo|baja|basso|bassa|laagste|laag|nisk\w*|najniż\w*)\b/i;

const PRICE_FLOOR =
  /\b(?:price[\s-]+scores?|preis[\s-]?score|preisbewertung|score\s+de\s+prix|score\s+prix|puntuaci[oó]n\s+de\s+precio|score\s+de\s+precio|punteggio\s+di\s+prezzo|prijsscore|ocena\s+ceny|wynik\s+ceny)\b/gi;

const SELLER_FLOOR =
  /\b(?:seller(?:'s|s)?\s+(?:scores?|ratings?|confidence)|confidence|verk[aä]ufer(?:-|\s)?(?:score|bewertung)|score\s+du\s+vendeur|score\s+vendeur|note\s+du\s+vendeur|puntuaci[oó]n\s+del\s+vendedor|score\s+del\s+vendedor|punteggio\s+del\s+venditore|verkoperscore|score\s+van\s+de\s+verkoper|ocena\s+sprzedawcy|wynik\s+sprzedawcy)\b/gi;

const FLOOR_AFTER =
  /^(?:\s*(?:of|at\s+least|minimum|min|over|above|>=|≥|=|:)){0,3}\s*(10|[1-9])\b/i;

const FLOOR_BEFORE =
  /\b(10|[1-9])\s*\+?\s*(?:or\s+(?:higher|above|more|better))?\s*$/i;

export type AgentScoreFloors = {
  price?: number;
  seller?: number;
  clearPrice: boolean;
  clearSeller: boolean;
};

/**
 * Minimum score filters the collector actually asked for.
 * "Best sellers" and "best deals" sort results and do not set a floor.
 */
export function agentScoreFloorsFromText(text: string): AgentScoreFloors {
  const price = spokenFloor(text, PRICE_FLOOR);
  const seller = spokenFloor(text, SELLER_FLOOR);
  return {
    ...(price !== undefined ? { price } : {}),
    ...(seller !== undefined ? { seller } : {}),
    clearPrice: price === undefined && asksToClear(text, PRICE_FLOOR),
    clearSeller: seller === undefined && asksToClear(text, SELLER_FLOOR),
  };
}

/** Sort implied by the collector's latest message. A price cap is not a sort. */
export function agentSortFromText(text: string): AgentResultSort | undefined {
  const sellerAt = lastIndex(text, SELLER_SCORE);
  const priceScoreAt = lastIndex(text, PRICE_SCORE);
  if (sellerAt >= 0 || priceScoreAt >= 0) {
    const seller = sellerAt >= priceScoreAt;
    const at = seller ? sellerAt : priceScoreAt;
    const low = wantsLow(text, at);
    if (seller) return low ? "seller-score-asc" : "seller-score";
    return low ? "price-score-asc" : "price-score";
  }

  const expensiveAt = lastIndex(text, EXPENSIVE);
  const cheapAt = lastIndex(text, CHEAP);
  if (expensiveAt < 0 && cheapAt < 0) return undefined;
  return expensiveAt > cheapAt ? "price-desc" : "price";
}

function wantsLow(text: string, index: number): boolean {
  const window = text.slice(Math.max(0, index - 28), index + 48);
  return LOW_DIRECTION.test(window);
}

function lastIndex(text: string, pattern: RegExp): number {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  let at = -1;
  for (const match of text.matchAll(re)) {
    if (match.index === undefined || negated(text, match.index)) continue;
    if (match.index >= at) at = match.index;
  }
  return at;
}

function negated(text: string, index: number): boolean {
  return /\b(?:not|nicht|non|no|geen|nie)\s+$/i.test(
    text.slice(Math.max(0, index - 12), index),
  );
}

function spokenFloor(text: string, phrase: RegExp): number | undefined {
  const flags = phrase.flags.includes("g") ? phrase.flags : `${phrase.flags}g`;
  const re = new RegExp(phrase.source, flags);
  let floor: number | undefined;
  for (const match of text.matchAll(re)) {
    if (match.index === undefined) continue;
    const after = text.slice(match.index + match[0].length, match.index + match[0].length + 48);
    const before = text.slice(Math.max(0, match.index - 32), match.index);
    const found = after.match(FLOOR_AFTER) ?? before.match(FLOOR_BEFORE);
    const value = found?.[1] ? Number(found[1]) : undefined;
    if (value !== undefined) floor = value;
  }
  return floor;
}

function asksToClear(text: string, phrase: RegExp): boolean {
  const flags = phrase.flags.includes("g") ? phrase.flags : `${phrase.flags}g`;
  const re = new RegExp(
    `\\b(?:any|no|without|clear|remove|drop)\\b(?:\\s+\\w+){0,3}\\s+${phrase.source}`,
    flags,
  );
  return re.test(text);
}
