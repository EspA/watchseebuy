/**
 * Card catalog facets from TCGplayer + Cardmarket.
 * eBay Browse has no first-class filter for these (aspect_filter needs a
 * category id and is Pokémon-only). Selected labels are injected into `q`.
 */

export type CardFilterOption = { value: string; label: string };

export type CardSetGroup =
  | "Vintage"
  | "XY / Sun & Moon"
  | "Sword & Shield"
  | "Scarlet & Violet"
  | "Promos & other";

export const CARD_RARITY_FILTERS: CardFilterOption[] = [
  { value: "common", label: "Common" },
  { value: "uncommon", label: "Uncommon" },
  { value: "rare", label: "Rare" },
  { value: "holo-rare", label: "Holo Rare" },
  { value: "double-rare", label: "Double Rare" },
  { value: "triple-rare", label: "Triple Rare" },
  { value: "ultra-rare", label: "Ultra Rare" },
  { value: "secret-rare", label: "Secret Rare" },
  { value: "illustration-rare", label: "Illustration Rare" },
  { value: "special-illustration-rare", label: "Special Illustration Rare" },
  { value: "rainbow-rare", label: "Rainbow Rare" },
  { value: "hyper-rare", label: "Hyper Rare" },
  { value: "mega-hyper-rare", label: "Mega Hyper Rare" },
  { value: "shiny-rare", label: "Shiny Rare" },
  { value: "shiny-holo-rare", label: "Shiny Holo Rare" },
  { value: "shiny-ultra-rare", label: "Shiny Ultra Rare" },
  { value: "radiant-rare", label: "Radiant Rare" },
  { value: "amazing-rare", label: "Amazing Rare" },
  { value: "ace-rare", label: "ACE Rare" },
  { value: "character-rare", label: "Character Rare" },
  { value: "character-super-rare", label: "Character Super Rare" },
  { value: "promo", label: "Promo" },
  { value: "classic-collection", label: "Classic Collection" },
  { value: "prize-pack-series", label: "Prize Pack Series" },
  { value: "code-card", label: "Code Card" },
];

export const CARD_PRINTING_FILTERS: CardFilterOption[] = [
  { value: "holofoil", label: "Holofoil" },
  { value: "reverse-holofoil", label: "Reverse Holofoil" },
  { value: "non-holo", label: "Non-holo" },
  { value: "1st-edition", label: "1st Edition" },
];

export const CARD_LANGUAGE_FILTERS: CardFilterOption[] = [
  { value: "english", label: "English" },
  { value: "japanese", label: "Japanese" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "spanish", label: "Spanish" },
  { value: "italian", label: "Italian" },
  { value: "portuguese", label: "Portuguese" },
  { value: "korean", label: "Korean" },
  { value: "simplified-chinese", label: "Simplified Chinese" },
  { value: "traditional-chinese", label: "Traditional Chinese" },
  { value: "russian", label: "Russian" },
  { value: "dutch", label: "Dutch" },
];

export const CARD_SET_FILTERS: (CardFilterOption & { group: CardSetGroup })[] = [
  { value: "base-set", label: "Base Set", group: "Vintage" },
  { value: "base-set-shadowless", label: "Base Set Shadowless", group: "Vintage" },
  { value: "base-set-2", label: "Base Set 2", group: "Vintage" },
  { value: "jungle", label: "Jungle", group: "Vintage" },
  { value: "fossil", label: "Fossil", group: "Vintage" },
  { value: "team-rocket", label: "Team Rocket", group: "Vintage" },
  { value: "gym-heroes", label: "Gym Heroes", group: "Vintage" },
  { value: "gym-challenge", label: "Gym Challenge", group: "Vintage" },
  { value: "neo-genesis", label: "Neo Genesis", group: "Vintage" },
  { value: "neo-discovery", label: "Neo Discovery", group: "Vintage" },
  { value: "neo-revelation", label: "Neo Revelation", group: "Vintage" },
  { value: "neo-destiny", label: "Neo Destiny", group: "Vintage" },
  { value: "legendary-collection", label: "Legendary Collection", group: "Vintage" },
  { value: "expedition", label: "Expedition", group: "Vintage" },
  { value: "aquapolis", label: "Aquapolis", group: "Vintage" },
  { value: "skyridge", label: "Skyridge", group: "Vintage" },
  { value: "xy-evolutions", label: "XY Evolutions", group: "XY / Sun & Moon" },
  { value: "hidden-fates", label: "Hidden Fates", group: "XY / Sun & Moon" },
  { value: "hidden-fates-shiny-vault", label: "Hidden Fates Shiny Vault", group: "XY / Sun & Moon" },
  { value: "cosmic-eclipse", label: "Cosmic Eclipse", group: "XY / Sun & Moon" },
  { value: "champions-path", label: "Champion's Path", group: "XY / Sun & Moon" },
  { value: "shining-fates", label: "Shining Fates", group: "XY / Sun & Moon" },
  { value: "celebrations", label: "Celebrations", group: "XY / Sun & Moon" },
  { value: "celebrations-classic", label: "Celebrations Classic Collection", group: "XY / Sun & Moon" },
  { value: "vivid-voltage", label: "Vivid Voltage", group: "Sword & Shield" },
  { value: "battle-styles", label: "Battle Styles", group: "Sword & Shield" },
  { value: "evolving-skies", label: "Evolving Skies", group: "Sword & Shield" },
  { value: "fusion-strike", label: "Fusion Strike", group: "Sword & Shield" },
  { value: "brilliant-stars", label: "Brilliant Stars", group: "Sword & Shield" },
  { value: "lost-origin", label: "Lost Origin", group: "Sword & Shield" },
  { value: "silver-tempest", label: "Silver Tempest", group: "Sword & Shield" },
  { value: "crown-zenith", label: "Crown Zenith", group: "Sword & Shield" },
  { value: "pokemon-go", label: "Pokemon GO", group: "Sword & Shield" },
  { value: "scarlet-violet-151", label: "Scarlet & Violet 151", group: "Scarlet & Violet" },
  { value: "paldean-fates", label: "Paldean Fates", group: "Scarlet & Violet" },
  { value: "obsidian-flames", label: "Obsidian Flames", group: "Scarlet & Violet" },
  { value: "twilight-masquerade", label: "Twilight Masquerade", group: "Scarlet & Violet" },
  { value: "surging-sparks", label: "Surging Sparks", group: "Scarlet & Violet" },
  { value: "prismatic-evolutions", label: "Prismatic Evolutions", group: "Scarlet & Violet" },
  { value: "phantasmal-flames", label: "Phantasmal Flames", group: "Scarlet & Violet" },
  { value: "swsh-promos", label: "Sword & Shield Promos", group: "Promos & other" },
  { value: "sv-promos", label: "Scarlet & Violet Promos", group: "Promos & other" },
  { value: "mcdonalds-promos-2024", label: "McDonald's Promos 2024", group: "Promos & other" },
  { value: "prize-pack-series", label: "Prize Pack Series Cards", group: "Promos & other" },
];

export const CARD_SET_GROUPS: CardSetGroup[] = [
  "Vintage",
  "XY / Sun & Moon",
  "Sword & Shield",
  "Scarlet & Violet",
  "Promos & other",
];

export type CardCatalogSelection = {
  cardSet?: string;
  rarity?: string;
  printing?: string;
  language?: string;
};

const ANY = "any";

function findOption(
  options: readonly CardFilterOption[],
  value: string | undefined,
): CardFilterOption | undefined {
  if (!value || value === ANY) return undefined;
  return options.find((option) => option.value === value);
}

export function parseCardSet(raw: string | undefined): string | undefined {
  return findOption(CARD_SET_FILTERS, raw)?.value;
}

export function parseCardRarity(raw: string | undefined): string | undefined {
  return findOption(CARD_RARITY_FILTERS, raw)?.value;
}

export function parseCardPrinting(raw: string | undefined): string | undefined {
  return findOption(CARD_PRINTING_FILTERS, raw)?.value;
}

export function parseCardLanguage(raw: string | undefined): string | undefined {
  return findOption(CARD_LANGUAGE_FILTERS, raw)?.value;
}

export function cardSetLabel(value: string | undefined): string | undefined {
  return findOption(CARD_SET_FILTERS, value)?.label;
}

export function cardRarityLabel(value: string | undefined): string | undefined {
  return findOption(CARD_RARITY_FILTERS, value)?.label;
}

export function cardPrintingLabel(value: string | undefined): string | undefined {
  return findOption(CARD_PRINTING_FILTERS, value)?.label;
}

export function cardLanguageLabel(value: string | undefined): string | undefined {
  return findOption(CARD_LANGUAGE_FILTERS, value)?.label;
}

/** Labels that should be appended to the eBay keyword query. */
export function catalogQueryTerms(selection: CardCatalogSelection): string[] {
  const terms: string[] = [];
  const set = cardSetLabel(selection.cardSet);
  const rarity = cardRarityLabel(selection.rarity);
  const printing = cardPrintingLabel(selection.printing);
  const language = cardLanguageLabel(selection.language);
  if (set) terms.push(set);
  if (rarity) terms.push(rarity);
  if (printing) terms.push(printing);
  if (language) terms.push(language);
  return terms;
}

function phrasePattern(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)"?${escaped}"?(?=\\s|$)`, "ig");
}

export function queryIncludesPhrase(query: string, phrase: string): boolean {
  return phrasePattern(phrase).test(query);
}

function allCatalogLabels(): string[] {
  return [
    ...CARD_SET_FILTERS,
    ...CARD_RARITY_FILTERS,
    ...CARD_PRINTING_FILTERS,
    ...CARD_LANGUAGE_FILTERS,
  ]
    .map((option) => option.label)
    .sort((a, b) => b.length - a.length);
}

export function stripCatalogTerms(
  query: string,
  selection: CardCatalogSelection,
): string {
  let next = query;
  for (const term of catalogQueryTerms(selection)) {
    next = next.replace(phrasePattern(term), " ");
  }
  return next.replace(/\s+/g, " ").trim();
}

/** Drop every known catalog label so a dropdown change can replace the old term. */
export function stripAllCatalogLabels(query: string): string {
  let next = query;
  for (const term of allCatalogLabels()) {
    next = next.replace(phrasePattern(term), " ");
  }
  return next.replace(/\s+/g, " ").trim();
}

function quoteTerm(term: string): string {
  return /\s/.test(term) ? `"${term}"` : term;
}

export function composeCatalogQuery(
  query: string,
  selection: CardCatalogSelection,
): string {
  const extras = catalogQueryTerms(selection)
    .filter((term) => !queryIncludesPhrase(query, term))
    .map(quoteTerm);
  return [query.trim(), ...extras].filter(Boolean).join(" ").trim();
}
