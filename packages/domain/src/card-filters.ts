/**
 * Card catalog facets from TCGplayer + Cardmarket, plus the official eBay
 * Trading Cards taxonomy (Sports 212, Non-Sport 182982, CCG 2536).
 * Set/rarity/printing/language/grader inject into `q`. Category is a Browse
 * category_ids value and is never added to keywords.
 */

import {
  allBrickQueryTerms,
  brickQueryTerms,
  type BrickQuerySelection,
} from "./brick-filters.ts";

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

export const CARD_GRADER_FILTERS: CardFilterOption[] = [
  { value: "psa", label: "PSA" },
  { value: "cgc", label: "CGC" },
  { value: "bgs", label: "BGS" },
  { value: "sgc", label: "SGC" },
];

export const DEFAULT_CARD_GRADE = "10";

export const CARD_GRADE_FILTERS: CardFilterOption[] = [
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
].map((value) => ({ value: String(value), label: String(value) }));

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

/**
 * eBay has no single Trading Cards id, and Browse accepts only one
 * category_ids value. Groups follow the official US parents: Sports
 * Trading Cards (212) under Sports Mem, Cards & Fan Shop; Non-Sport
 * Trading Cards (182982) under Collectibles; Collectible Card Games
 * (2536) under Toys & Hobbies. Toys & Hobbies itself is not selectable —
 * that tree includes non-card toys.
 */
export type CardCategoryGroup =
  | "Sports Mem, Cards & Fan Shop"
  | "Collectibles"
  | "Toys & Hobbies";

export type CardCategoryOption = CardFilterOption & {
  group?: CardCategoryGroup;
};

export const CARD_CATEGORY_FILTERS: CardCategoryOption[] = [
  {
    value: "212",
    label: "Sports Trading Cards",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261328",
    label: "Sports Trading Card Singles",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261329",
    label: "Sports Trading Card Lots",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261330",
    label: "Sports Trading Card Sets",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261331",
    label: "Sports Sealed Trading Card Packs",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261332",
    label: "Sports Sealed Trading Card Boxes",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261333",
    label: "Sports Sealed Trading Card Cases",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261334",
    label: "Sports Trading Card Box & Case Breaks",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "463772",
    label: "Sports Trading Card Repacks",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261335",
    label: "Sports Wrappers & Empty Card Boxes",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261893",
    label: "Sports Uncut Trading Card Sheets",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "183436",
    label: "Sports Storage & Display Supplies",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "183437",
    label: "Sports Card Sleeves & Bags",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "183438",
    label: "Sports Card Toploaders & Holders",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "183439",
    label: "Sports Albums, Binders & Pages",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "183440",
    label: "Sports Card Storage Boxes & Dividers",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "183441",
    label: "Sports Card Sorting Trays",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "183442",
    label: "Sports Card Display Cases & Stands",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261949",
    label: "Sports Card Grading Tools",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "170135",
    label: "Sports Price Guides & Publications",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "262055",
    label: "Sport Trading Card NFTs",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "182982",
    label: "Non-Sport Trading Cards",
    group: "Collectibles",
  },
  {
    value: "183050",
    label: "Non-Sport Trading Card Singles",
    group: "Collectibles",
  },
  {
    value: "183051",
    label: "Non-Sport Trading Card Lots",
    group: "Collectibles",
  },
  {
    value: "183052",
    label: "Non-Sport Trading Card Sets",
    group: "Collectibles",
  },
  {
    value: "183053",
    label: "Non-Sport Sealed Trading Card Packs",
    group: "Collectibles",
  },
  {
    value: "261035",
    label: "Non-Sport Sealed Trading Card Boxes",
    group: "Collectibles",
  },
  {
    value: "261036",
    label: "Non-Sport Sealed Trading Card Cases",
    group: "Collectibles",
  },
  {
    value: "261336",
    label: "Non-Sport Trading Card Box & Case Breaks",
    group: "Collectibles",
  },
  {
    value: "183054",
    label: "Non-Sport Wrappers & Empty Card Boxes",
    group: "Collectibles",
  },
  {
    value: "261947",
    label: "Non-Sport Uncut Trading Card Sheets",
    group: "Collectibles",
  },
  {
    value: "183056",
    label: "Non-Sport Card Supplies & Accessories",
    group: "Collectibles",
  },
  {
    value: "259148",
    label: "Non-Sport Card Sleeves & Bags",
    group: "Collectibles",
  },
  {
    value: "259149",
    label: "Non-Sport Card Toploaders & Holders",
    group: "Collectibles",
  },
  {
    value: "183059",
    label: "Non-Sport Card Albums, Binders & Pages",
    group: "Collectibles",
  },
  {
    value: "259150",
    label: "Non-Sport Card Storage Boxes & Dividers",
    group: "Collectibles",
  },
  {
    value: "261038",
    label: "Non-Sport Card Sorting Trays",
    group: "Collectibles",
  },
  {
    value: "261037",
    label: "Non-Sport Card Display Cases & Stands",
    group: "Collectibles",
  },
  {
    value: "261950",
    label: "Non-Sport Card Grading Tools",
    group: "Collectibles",
  },
  {
    value: "171198",
    label: "Non-Sport Price Guides & Publications",
    group: "Collectibles",
  },
  {
    value: "219",
    label: "Other Non-Sport Trading Card Merchandise",
    group: "Collectibles",
  },
  {
    value: "262052",
    label: "Non-Sport Trading Card NFTs",
    group: "Collectibles",
  },
  {
    value: "2536",
    label: "Collectible Card Games",
    group: "Toys & Hobbies",
  },
  {
    value: "183454",
    label: "Single Cards",
    group: "Toys & Hobbies",
  },
  {
    value: "183455",
    label: "CCG Mixed Card Lots",
    group: "Toys & Hobbies",
  },
  { value: "183459", label: "CCG Sets", group: "Toys & Hobbies" },
  {
    value: "183456",
    label: "CCG Sealed Packs",
    group: "Toys & Hobbies",
  },
  {
    value: "183457",
    label: "CCG Sealed Decks & Kits",
    group: "Toys & Hobbies",
  },
  {
    value: "261044",
    label: "CCG Sealed Boxes",
    group: "Toys & Hobbies",
  },
  {
    value: "261045",
    label: "CCG Sealed Cases",
    group: "Toys & Hobbies",
  },
  {
    value: "183458",
    label: "CCG Player-Built Decks",
    group: "Toys & Hobbies",
  },
  {
    value: "261337",
    label: "CCG Box & Case Breaks",
    group: "Toys & Hobbies",
  },
  { value: "463773", label: "CCG Repacks", group: "Toys & Hobbies" },
  {
    value: "261948",
    label: "Uncut CCG Sheets",
    group: "Toys & Hobbies",
  },
  {
    value: "183460",
    label: "CCG Supplies & Accessories",
    group: "Toys & Hobbies",
  },
  {
    value: "183461",
    label: "CCG Card Sleeves",
    group: "Toys & Hobbies",
  },
  {
    value: "183462",
    label: "CCG Deck Boxes, Storage Cases & Dividers",
    group: "Toys & Hobbies",
  },
  { value: "183463", label: "CCG Dice", group: "Toys & Hobbies" },
  { value: "183464", label: "CCG Playmats", group: "Toys & Hobbies" },
  {
    value: "183465",
    label: "CCG Albums, Binders & Pages",
    group: "Toys & Hobbies",
  },
  { value: "261039", label: "CCG Coins", group: "Toys & Hobbies" },
  { value: "261040", label: "CCG Counters", group: "Toys & Hobbies" },
  {
    value: "261042",
    label: "CCG Dice Pouches",
    group: "Toys & Hobbies",
  },
  {
    value: "261043",
    label: "CCG Playmat Tubes, Bags & Cases",
    group: "Toys & Hobbies",
  },
  {
    value: "261951",
    label: "CCG Grading Tools",
    group: "Toys & Hobbies",
  },
  {
    value: "261041",
    label: "CCG Price Guides & Publications",
    group: "Toys & Hobbies",
  },
  { value: "2535", label: "Other CCG Items", group: "Toys & Hobbies" },
  { value: "262056", label: "CCG NFTs", group: "Toys & Hobbies" },
];

export const CARD_CATEGORY_GROUPS: CardCategoryGroup[] = [
  "Sports Mem, Cards & Fan Shop",
  "Collectibles",
  "Toys & Hobbies",
];

export const CARD_CATEGORY_LINES: CardCategoryOption[] = [
  {
    value: "212",
    label: "Sports Trading Cards",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "182982",
    label: "Non-Sport Trading Cards",
    group: "Collectibles",
  },
  {
    value: "2536",
    label: "Collectible Card Games",
    group: "Toys & Hobbies",
  },
];

/** Leaf CCG categories that expose the official Game aspect. */
export const CCG_GAME_CATEGORY_IDS = new Set([
  "183454",
  "183455",
  "183456",
  "183457",
  "183458",
  "183459",
  "261044",
  "261045",
  "261337",
  "463773",
]);

const CCG_GAME_NAMES = [
  "7th Sea CCG",
  "A Game of Thrones CCG",
  "Age of Empires: Expandable Card Game",
  "Aliens vs Predator CCG",
  "Anachronism",
  "Animal Kaiser",
  "Ani-Mayhem",
  "Argent Saga TCG",
  "Austin Powers CCG",
  "Babylon 5 CCG",
  "Bakugan TCG",
  "Battle Spirits TCG",
  "Battlestar Galactica CCG",
  "BattleTech CCG",
  "Behind TCG",
  "Bella Sara",
  "Bleach TCG",
  "Blood Wars",
  "Buffy the Vampire Slayer CCG",
  "Cardfight!! Vanguard TCG",
  "Chaotic TCG",
  "Corunea CCG",
  "Cyberpunk CCG",
  "Dark Age: Feudal Lords",
  "Dark Eden",
  "Deadlands: Lost Colony - Showdown",
  "Deadman's Cross",
  "Dice Masters",
  "Digimon CCG",
  "Dinosaur King TCG",
  "Disney Lorcana TCG",
  "Dixie",
  "Doctor Who Alien Armies TCG",
  "Doctor Who Alien Attax TCG",
  "Doctor Who Battles in Time CCG",
  "Doctor Who CCG",
  "Doctor Who Monster Invasion TCG",
  "Doomtown: Reloaded",
  "Doomtrooper CCG",
  "Dragoborne",
  "Dragon Ball CCG",
  "Dragon Ball GT TCG",
  "Dragon Ball Super Card Game",
  "Dragon Ball Z TCG",
  "Dragon Storm CCG",
  "D-Spirits",
  "Duel Masters TCG",
  "Dune CCG",
  "Eagles CCG",
  "Epic Battles",
  "Epic TCG",
  "Exodus TCG",
  "Final Fantasy TCG",
  "Fire Emblem 0 (Cipher)",
  "Flesh and Blood TCG",
  "Force of Will TCG",
  "Fortnite TCG",
  "Free Realms TCG",
  "Future Card Buddyfight",
  "G.I. Joe TCG",
  "Galactic Empires",
  "Gate Ruler TCG",
  "Gridiron: Fantasy Football Game",
  "Guardian Cross TCG",
  "Guardians CCG",
  "Gundam War TCG",
  "Gwent: The Witcher Card Game",
  "Gym Heroes TCG",
  "Harry Potter TCG",
  "Hecatomb",
  "Heresy: Kingdom Come",
  "Highlander: The Card Game",
  "Illuminati: New World Order",
  "InuYasha TCG",
  "James Bond 007 CCG",
  "Jedi Knights TCG",
  "Justice League TCG",
  "Kaijudo TCG",
  "KeyForge",
  "Kingdoms CCG",
  "L.O.L. Surprise! Dance Off! TCG",
  "Legendary: Marvel Studios",
  "Legend of the Five Rings",
  "LEGO Ninjago TCG",
  "Lightseekers TCG",
  "Looney Tunes TCG",
  "Luck & Logic",
  "Magic: The Gathering",
  "Magi-Nation Duel",
  "MapleStory iTCG",
  "Marvel ReCharge CCG",
  "Marvel Superstars TCG",
  "Marvel Ultimate Battles TCG",
  "Mega Man NT Warrior TCG",
  "MetaX TCG",
  "MetaZoo CCG",
  "Middle-earth CCG",
  "Minions TCG",
  "Moshi Monsters Mash Up TCG",
  "Munchkin CCG",
  "My Hero Academia: The Card Game",
  "My Little Pony CCG",
  "Mythos CCG",
  "Naruto CCG",
  "Neopets TCG",
  "Netrunner",
  "One Piece CCG",
  "On The Edge TCG",
  "OverPower",
  "Pirates Constructible Strategy Game",
  "Pirates of the Caribbean TCG",
  "Pirates of the Spanish Main",
  "Pokémon TCG",
  "Power Rangers ACG",
  "Precious Memories",
  "Raw Deal CCG",
  "Redakai",
  "Redemption TCG",
  "Riftbound: League of Legends TCG",
  "Robotech CCG",
  "Sailor Moon CCG",
  "Shadowfist TCG",
  "Shadowrun: The Trading Card Game",
  "Shadowverse",
  "Skylanders Battlecast",
  "Sorcery TCG",
  "Spawn PowerCardz",
  "Spellfire: Master the Magic",
  "Stargate TCG",
  "Star Trek: The Card Game",
  "Star Trek CCG",
  "Star Trek Tribbles CCG",
  "Star Wars: Destiny",
  "Star Wars CCG",
  "Star Wars Episode I CCG",
  "Star Wars Force Attax",
  "Star Wars PocketModel TCG",
  "Star Wars TCG",
  "The Caster Chronicles TCG",
  "The Eye of Judgment",
  "The Lord of the Rings TCG",
  "The Simpsons TCG",
  "The Terminator CCG",
  "The Wheel of Time CCG",
  "The X-Files CCG",
  "Tomb Raider CCG",
  "Transformers TCG",
  "Universal Fighting System",
  "UniVersus",
  "Vampire: The Eternal Struggle",
  "Vs. System",
  "WarCry",
  "Warhammer: Age of Sigmar TCG",
  "Warhammer 40,000 CCG",
  "Warlord: Saga of the Storm",
  "Webkinz TCG",
  "Weiss Schwarz",
  "Wildstorms CCG",
  "Wing Commander TCG",
  "Wixoss",
  "World of Warcraft TCG",
  "World of Warriors TCG",
  "Wyvern",
  "X-Men TCG",
  "Young Jedi CCG",
  "Yu-Gi-Oh! TCG",
  "Yu Yu Hakusho TCG",
  "Zombie World Order TCG",
] as const;

const CCG_GAME_POPULAR_ASPECTS = [
  "Pokémon TCG",
  "Magic: The Gathering",
  "Yu-Gi-Oh! TCG",
  "Disney Lorcana TCG",
  "One Piece CCG",
  "Digimon CCG",
  "Flesh and Blood TCG",
  "Dragon Ball Super Card Game",
  "Weiss Schwarz",
  "Cardfight!! Vanguard TCG",
] as const;

export type CardGameOption = CardFilterOption & { aspect: string };

function slugifyGame(name: string): string {
  return name
    .replace(/Pokémon/g, "Pokemon")
    .replace(/&/g, "and")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const CARD_GAME_FILTERS: CardGameOption[] = CCG_GAME_NAMES.map(
  (aspect) => ({
    value: slugifyGame(aspect),
    label: aspect,
    aspect,
  }),
);

export const CARD_GAME_POPULAR = CCG_GAME_POPULAR_ASPECTS.map((aspect) =>
  slugifyGame(aspect),
);

export type CardCatalogSelection = {
  cardSet?: string;
  rarity?: string;
  printing?: string;
  language?: string;
  grader?: string;
  cardGrade?: string;
};

export type CatalogSelection = CardCatalogSelection & BrickQuerySelection;

const ANY = "any";

function findOption(
  options: readonly CardFilterOption[],
  value: string | undefined,
): CardFilterOption | undefined {
  if (!value || value === ANY) return undefined;
  return options.find((option) => option.value === value);
}

export function parseCardCategory(raw: string | undefined): string | undefined {
  return findOption(CARD_CATEGORY_FILTERS, raw)?.value;
}

export function cardCategoryLabel(value: string | undefined): string | undefined {
  return findOption(CARD_CATEGORY_FILTERS, value)?.label;
}

export function cardCategoryIds(value: string | undefined): string | undefined {
  return parseCardCategory(value);
}

export function parseCardLine(raw: string | undefined): string | undefined {
  if (!raw || raw === ANY) return undefined;
  return CARD_CATEGORY_LINES.find((option) => option.value === raw)?.value;
}

export function cardCategoryLineOf(value: string | undefined): string | undefined {
  const parsed = parseCardCategory(value);
  if (!parsed) return undefined;
  if (parseCardLine(parsed)) return parsed;
  const option = CARD_CATEGORY_FILTERS.find((item) => item.value === parsed);
  return CARD_CATEGORY_LINES.find((line) => line.group === option?.group)?.value;
}

export function cardCategoryChildren(lineId: string | undefined): CardCategoryOption[] {
  const line = CARD_CATEGORY_LINES.find((option) => option.value === lineId);
  if (!line) return [];
  return CARD_CATEGORY_FILTERS.filter(
    (option) => option.group === line.group && option.value !== line.value,
  );
}

export function categorySupportsCardGame(value: string | undefined): boolean {
  const parsed = parseCardCategory(value);
  return Boolean(parsed && CCG_GAME_CATEGORY_IDS.has(parsed));
}

export function parseCardGame(raw: string | undefined): string | undefined {
  if (!raw || raw === ANY) return undefined;
  return CARD_GAME_FILTERS.find(
    (option) => option.value === raw || option.aspect === raw,
  )?.value;
}

export function cardGameLabel(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return CARD_GAME_FILTERS.find(
    (option) => option.value === value || option.aspect === value,
  )?.label;
}

export function cardGameAspect(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return CARD_GAME_FILTERS.find(
    (option) => option.value === value || option.aspect === value,
  )?.aspect;
}

export function cardGameAspectFilter(
  categoryId: string | undefined,
  game: string | undefined,
): string | undefined {
  const category = parseCardCategory(categoryId);
  const aspect = cardGameAspect(game);
  if (!category || !aspect || !categorySupportsCardGame(category)) return undefined;
  return `categoryId:${category},Game:{${aspect}}`;
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

export function parseCardGrader(raw: string | undefined): string | undefined {
  return findOption(CARD_GRADER_FILTERS, raw)?.value;
}

export function parseCardGrade(raw: string | undefined): string | undefined {
  return findOption(CARD_GRADE_FILTERS, raw)?.value;
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

export function cardGraderLabel(value: string | undefined): string | undefined {
  return findOption(CARD_GRADER_FILTERS, value)?.label;
}

export function cardGradeLabel(value: string | undefined): string | undefined {
  return findOption(CARD_GRADE_FILTERS, value)?.label;
}

/** `PSA 10` when both are set, otherwise just `PSA`. */
export function cardGraderQueryTerm(
  selection: Pick<CardCatalogSelection, "grader" | "cardGrade">,
): string | undefined {
  const grader = cardGraderLabel(selection.grader);
  if (!grader) return undefined;
  const grade = cardGradeLabel(selection.cardGrade);
  return grade ? `${grader} ${grade}` : grader;
}

/** Labels / keywords that should be appended to the eBay keyword query. */
export function catalogQueryTerms(selection: CatalogSelection): string[] {
  const terms: string[] = [];
  const set = cardSetLabel(selection.cardSet);
  const rarity = cardRarityLabel(selection.rarity);
  const printing = cardPrintingLabel(selection.printing);
  const language = cardLanguageLabel(selection.language);
  const grader = cardGraderQueryTerm(selection);
  if (set) terms.push(set);
  if (rarity) terms.push(rarity);
  if (printing) terms.push(printing);
  if (language) terms.push(language);
  if (grader) terms.push(grader);
  terms.push(...brickQueryTerms(selection));
  return terms;
}

function phrasePattern(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)"?${escaped}"?(?=\\s|$)`, "ig");
}

export function queryIncludesPhrase(query: string, phrase: string): boolean {
  return phrasePattern(phrase).test(query);
}

function allGraderLabels(): string[] {
  const labels: string[] = [];
  for (const grader of CARD_GRADER_FILTERS) {
    for (const grade of CARD_GRADE_FILTERS) {
      labels.push(`${grader.label} ${grade.label}`);
    }
    labels.push(grader.label);
  }
  return labels;
}

function allCatalogLabels(includeGraders = true): string[] {
  return [
    ...CARD_SET_FILTERS.map((option) => option.label),
    ...CARD_RARITY_FILTERS.map((option) => option.label),
    ...CARD_PRINTING_FILTERS.map((option) => option.label),
    ...CARD_LANGUAGE_FILTERS.map((option) => option.label),
    ...(includeGraders ? allGraderLabels() : []),
    ...allBrickQueryTerms(),
  ].sort((a, b) => b.length - a.length);
}

export function stripCatalogTerms(
  query: string,
  selection: CatalogSelection,
): string {
  let next = query;
  for (const term of catalogQueryTerms(selection)) {
    next = next.replace(phrasePattern(term), " ");
  }
  return next.replace(/\s+/g, " ").trim();
}

/** Drop every known catalog label so a dropdown change can replace the old term. */
export function stripAllCatalogLabels(
  query: string,
  options?: { includeGraders?: boolean },
): string {
  let next = query;
  for (const term of allCatalogLabels(options?.includeGraders ?? true)) {
    next = next.replace(phrasePattern(term), " ");
  }
  return next.replace(/\s+/g, " ").trim();
}

function quoteTerm(term: string): string {
  if (/^(PSA|CGC|BGS|SGC) \d+$/i.test(term)) return term;
  return /\s/.test(term) ? `"${term}"` : term;
}

export function composeCatalogQuery(
  query: string,
  selection: CatalogSelection,
): string {
  const extras = catalogQueryTerms(selection)
    .filter((term) => !queryIncludesPhrase(query, term))
    .map(quoteTerm);
  return [query.trim(), ...extras].filter(Boolean).join(" ").trim();
}
