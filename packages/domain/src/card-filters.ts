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
import {
  allWheelsQueryTerms,
  wheelsQueryTerms,
  type WheelsQuerySelection,
} from "./wheel-filters.ts";
import {
  allFigureQueryTerms,
  figureQueryTerms,
  type FigureQuerySelection,
} from "./figure-filters.ts";

export type CardFilterOption = {
  value: string;
  label: string;
  queryTerm?: string;
};

export type CardSetGroup =
  | "WOTC Vintage"
  | "EX"
  | "DP / HGSS"
  | "Black & White"
  | "XY"
  | "Sun & Moon"
  | "Sword & Shield"
  | "Scarlet & Violet";

/** Chase rarities only. Common/Uncommon/Rare are noise on eBay. */
export const CARD_RARITY_FILTERS: CardFilterOption[] = [
  { value: "holo-rare", label: "Holo Rare" },
  { value: "ultra-rare", label: "Ultra Rare" },
  { value: "secret-rare", label: "Secret Rare" },
  { value: "illustration-rare", label: "Illustration Rare", queryTerm: "IR" },
  {
    value: "special-illustration-rare",
    label: "Special Illustration Rare",
    queryTerm: "SIR",
  },
  { value: "rainbow-rare", label: "Rainbow Rare" },
  { value: "hyper-rare", label: "Hyper Rare" },
  { value: "amazing-rare", label: "Amazing Rare" },
];

export const CARD_PRINTING_FILTERS: CardFilterOption[] = [
  { value: "1st-edition", label: "1st Edition" },
  { value: "unlimited", label: "Unlimited" },
  { value: "shadowless", label: "Shadowless" },
  {
    value: "reverse-holofoil",
    label: "Reverse Holofoil",
    queryTerm: "reverse holo",
  },
];

/** Extra title tokens so identity still recognizes older printing language. */
export const CARD_PRINTING_IDENTITY_LABELS = [
  ...CARD_PRINTING_FILTERS.map((option) => option.label),
  "Holofoil",
  "Non-holo",
  "Reverse Holo",
];

export const CARD_GRADER_FILTERS: CardFilterOption[] = [
  { value: "raw", label: "Raw" },
  { value: "psa", label: "PSA" },
  { value: "cgc", label: "CGC" },
  { value: "bgs", label: "BGS" },
  { value: "sgc", label: "SGC" },
];

export const DEFAULT_CARD_GRADE = "10";

export const CARD_GRADE_FILTERS: CardFilterOption[] = [
  "10",
  "9.5",
  "9",
  "8.5",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
  "1",
].map((value) => ({ value, label: value }));

export const CARD_LANGUAGE_FILTERS: CardFilterOption[] = [
  { value: "english", label: "English" },
  { value: "japanese", label: "Japanese" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "spanish", label: "Spanish" },
  { value: "italian", label: "Italian" },
  { value: "korean", label: "Korean" },
  { value: "simplified-chinese", label: "Simplified Chinese" },
  { value: "traditional-chinese", label: "Traditional Chinese" },
];

export const CARD_RAW_EXCLUDE_WORDS = [
  "psa",
  "cgc",
  "bgs",
  "sgc",
  "beckett",
  "graded",
];
export const CARD_REPRINT_EXCLUDE_WORDS = ["reproduction"];
export const CARD_PROXY_EXCLUDE_WORDS = ["fake"];
export const CARD_CUSTOM_EXCLUDE_WORDS = ["custom"];

export const CARD_SET_FILTERS: (CardFilterOption & { group: CardSetGroup })[] = [
  { value: "base-set", label: "Base Set", group: "WOTC Vintage" },
  { value: "base-set-2", label: "Base Set 2", group: "WOTC Vintage" },
  { value: "jungle", label: "Jungle", group: "WOTC Vintage" },
  { value: "fossil", label: "Fossil", group: "WOTC Vintage" },
  { value: "team-rocket", label: "Team Rocket", group: "WOTC Vintage" },
  { value: "gym-heroes", label: "Gym Heroes", group: "WOTC Vintage" },
  { value: "gym-challenge", label: "Gym Challenge", group: "WOTC Vintage" },
  { value: "neo-genesis", label: "Neo Genesis", group: "WOTC Vintage" },
  { value: "neo-discovery", label: "Neo Discovery", group: "WOTC Vintage" },
  { value: "neo-revelation", label: "Neo Revelation", group: "WOTC Vintage" },
  { value: "neo-destiny", label: "Neo Destiny", group: "WOTC Vintage" },
  { value: "legendary-collection", label: "Legendary Collection", group: "WOTC Vintage" },
  { value: "expedition", label: "Expedition", group: "WOTC Vintage" },
  { value: "aquapolis", label: "Aquapolis", group: "WOTC Vintage" },
  { value: "skyridge", label: "Skyridge", group: "WOTC Vintage" },
  { value: "ruby-sapphire", label: "Ruby & Sapphire", group: "EX" },
  { value: "sandstorm", label: "Sandstorm", group: "EX" },
  { value: "dragon", label: "Dragon", group: "EX" },
  { value: "team-magma-vs-team-aqua", label: "Team Magma vs Team Aqua", group: "EX" },
  { value: "hidden-legends", label: "Hidden Legends", group: "EX" },
  { value: "firered-leafgreen", label: "FireRed & LeafGreen", group: "EX" },
  { value: "team-rocket-returns", label: "Team Rocket Returns", group: "EX" },
  { value: "deoxys", label: "Deoxys", group: "EX" },
  { value: "emerald", label: "Emerald", group: "EX" },
  { value: "unseen-forces", label: "Unseen Forces", group: "EX" },
  { value: "delta-species", label: "Delta Species", group: "EX" },
  { value: "legend-maker", label: "Legend Maker", group: "EX" },
  { value: "holon-phantoms", label: "Holon Phantoms", group: "EX" },
  { value: "crystal-guardians", label: "Crystal Guardians", group: "EX" },
  { value: "dragon-frontiers", label: "Dragon Frontiers", group: "EX" },
  { value: "power-keepers", label: "Power Keepers", group: "EX" },
  { value: "diamond-pearl", label: "Diamond & Pearl", group: "DP / HGSS" },
  { value: "mysterious-treasures", label: "Mysterious Treasures", group: "DP / HGSS" },
  { value: "secret-wonders", label: "Secret Wonders", group: "DP / HGSS" },
  { value: "great-encounters", label: "Great Encounters", group: "DP / HGSS" },
  { value: "majestic-dawn", label: "Majestic Dawn", group: "DP / HGSS" },
  { value: "legends-awakened", label: "Legends Awakened", group: "DP / HGSS" },
  { value: "stormfront", label: "Stormfront", group: "DP / HGSS" },
  { value: "platinum", label: "Platinum", group: "DP / HGSS" },
  { value: "rising-rivals", label: "Rising Rivals", group: "DP / HGSS" },
  { value: "supreme-victors", label: "Supreme Victors", group: "DP / HGSS" },
  { value: "arceus", label: "Arceus", group: "DP / HGSS" },
  { value: "heartgold-soulsilver", label: "HeartGold & SoulSilver", group: "DP / HGSS" },
  { value: "unleashed", label: "Unleashed", group: "DP / HGSS" },
  { value: "undaunted", label: "Undaunted", group: "DP / HGSS" },
  { value: "triumphant", label: "Triumphant", group: "DP / HGSS" },
  { value: "call-of-legends", label: "Call of Legends", group: "DP / HGSS" },
  { value: "black-white", label: "Black & White", group: "Black & White" },
  { value: "emerging-powers", label: "Emerging Powers", group: "Black & White" },
  { value: "noble-victories", label: "Noble Victories", group: "Black & White" },
  { value: "next-destinies", label: "Next Destinies", group: "Black & White" },
  { value: "dark-explorers", label: "Dark Explorers", group: "Black & White" },
  { value: "dragons-exalted", label: "Dragons Exalted", group: "Black & White" },
  { value: "boundaries-crossed", label: "Boundaries Crossed", group: "Black & White" },
  { value: "plasma-storm", label: "Plasma Storm", group: "Black & White" },
  { value: "plasma-freeze", label: "Plasma Freeze", group: "Black & White" },
  { value: "plasma-blast", label: "Plasma Blast", group: "Black & White" },
  { value: "legendary-treasures", label: "Legendary Treasures", group: "Black & White" },
  { value: "xy", label: "XY", group: "XY" },
  { value: "flashfire", label: "Flashfire", group: "XY" },
  { value: "furious-fists", label: "Furious Fists", group: "XY" },
  { value: "phantom-forces", label: "Phantom Forces", group: "XY" },
  { value: "primal-clash", label: "Primal Clash", group: "XY" },
  { value: "roaring-skies", label: "Roaring Skies", group: "XY" },
  { value: "ancient-origins", label: "Ancient Origins", group: "XY" },
  { value: "breakthrough", label: "BREAKthrough", group: "XY" },
  { value: "breakpoint", label: "BREAKpoint", group: "XY" },
  { value: "fates-collide", label: "Fates Collide", group: "XY" },
  { value: "steam-siege", label: "Steam Siege", group: "XY" },
  { value: "xy-evolutions", label: "Evolutions", group: "XY" },
  { value: "sun-moon", label: "Sun & Moon", group: "Sun & Moon" },
  { value: "guardians-rising", label: "Guardians Rising", group: "Sun & Moon" },
  { value: "burning-shadows", label: "Burning Shadows", group: "Sun & Moon" },
  { value: "crimson-invasion", label: "Crimson Invasion", group: "Sun & Moon" },
  { value: "ultra-prism", label: "Ultra Prism", group: "Sun & Moon" },
  { value: "forbidden-light", label: "Forbidden Light", group: "Sun & Moon" },
  { value: "celestial-storm", label: "Celestial Storm", group: "Sun & Moon" },
  { value: "lost-thunder", label: "Lost Thunder", group: "Sun & Moon" },
  { value: "team-up", label: "Team Up", group: "Sun & Moon" },
  { value: "unbroken-bonds", label: "Unbroken Bonds", group: "Sun & Moon" },
  { value: "unified-minds", label: "Unified Minds", group: "Sun & Moon" },
  { value: "hidden-fates", label: "Hidden Fates", group: "Sun & Moon" },
  { value: "cosmic-eclipse", label: "Cosmic Eclipse", group: "Sun & Moon" },
  { value: "sword-shield", label: "Sword & Shield", group: "Sword & Shield" },
  { value: "rebel-clash", label: "Rebel Clash", group: "Sword & Shield" },
  { value: "darkness-ablaze", label: "Darkness Ablaze", group: "Sword & Shield" },
  { value: "champions-path", label: "Champion's Path", group: "Sword & Shield" },
  { value: "vivid-voltage", label: "Vivid Voltage", group: "Sword & Shield" },
  { value: "shining-fates", label: "Shining Fates", group: "Sword & Shield" },
  { value: "battle-styles", label: "Battle Styles", group: "Sword & Shield" },
  { value: "chilling-reign", label: "Chilling Reign", group: "Sword & Shield" },
  { value: "evolving-skies", label: "Evolving Skies", group: "Sword & Shield" },
  { value: "celebrations", label: "Celebrations", group: "Sword & Shield" },
  { value: "fusion-strike", label: "Fusion Strike", group: "Sword & Shield" },
  { value: "brilliant-stars", label: "Brilliant Stars", group: "Sword & Shield" },
  { value: "astral-radiance", label: "Astral Radiance", group: "Sword & Shield" },
  { value: "pokemon-go", label: "Pokemon GO", group: "Sword & Shield" },
  { value: "lost-origin", label: "Lost Origin", group: "Sword & Shield" },
  { value: "silver-tempest", label: "Silver Tempest", group: "Sword & Shield" },
  { value: "crown-zenith", label: "Crown Zenith", group: "Sword & Shield" },
  { value: "scarlet-violet", label: "Scarlet & Violet", group: "Scarlet & Violet" },
  { value: "paldea-evolved", label: "Paldea Evolved", group: "Scarlet & Violet" },
  { value: "obsidian-flames", label: "Obsidian Flames", group: "Scarlet & Violet" },
  { value: "scarlet-violet-151", label: "151", group: "Scarlet & Violet" },
  { value: "paradox-rift", label: "Paradox Rift", group: "Scarlet & Violet" },
  { value: "paldean-fates", label: "Paldean Fates", group: "Scarlet & Violet" },
  { value: "temporal-forces", label: "Temporal Forces", group: "Scarlet & Violet" },
  { value: "twilight-masquerade", label: "Twilight Masquerade", group: "Scarlet & Violet" },
  { value: "shrouded-fable", label: "Shrouded Fable", group: "Scarlet & Violet" },
  { value: "stellar-crown", label: "Stellar Crown", group: "Scarlet & Violet" },
  { value: "surging-sparks", label: "Surging Sparks", group: "Scarlet & Violet" },
  { value: "prismatic-evolutions", label: "Prismatic Evolutions", group: "Scarlet & Violet" },
  { value: "journey-together", label: "Journey Together", group: "Scarlet & Violet" },
  { value: "destined-rivals", label: "Destined Rivals", group: "Scarlet & Violet" },
  { value: "black-bolt", label: "Black Bolt", group: "Scarlet & Violet" },
  { value: "white-flare", label: "White Flare", group: "Scarlet & Violet" },
  { value: "phantasmal-flames", label: "Phantasmal Flames", group: "Scarlet & Violet" },
];

export const CARD_SET_GROUPS: CardSetGroup[] = [
  "WOTC Vintage",
  "EX",
  "DP / HGSS",
  "Black & White",
  "XY",
  "Sun & Moon",
  "Sword & Shield",
  "Scarlet & Violet",
];

export const CARD_SET_IDENTITY_LABELS = [
  ...CARD_SET_FILTERS.map((option) => option.label),
  "Base Set Shadowless",
  "XY Evolutions",
  "Scarlet & Violet 151",
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
    value: "2536",
    label: "Collectible Card Games",
    group: "Toys & Hobbies",
  },
  { value: "183454", label: "Singles", group: "Toys & Hobbies" },
  { value: "183455", label: "Lots", group: "Toys & Hobbies" },
  { value: "183459", label: "Sets", group: "Toys & Hobbies" },
  { value: "183456", label: "Sealed packs", group: "Toys & Hobbies" },
  {
    value: "183457",
    label: "Sealed decks & kits",
    group: "Toys & Hobbies",
  },
  { value: "261044", label: "Sealed boxes", group: "Toys & Hobbies" },
  { value: "261045", label: "Sealed cases", group: "Toys & Hobbies" },
  {
    value: "182982",
    label: "Non-Sport Trading Cards",
    group: "Collectibles",
  },
  { value: "183050", label: "Singles", group: "Collectibles" },
  { value: "183051", label: "Lots", group: "Collectibles" },
  { value: "183052", label: "Sets", group: "Collectibles" },
  { value: "183053", label: "Sealed packs", group: "Collectibles" },
  { value: "261035", label: "Sealed boxes", group: "Collectibles" },
  { value: "261036", label: "Sealed cases", group: "Collectibles" },
  {
    value: "212",
    label: "Sports Trading Cards",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261328",
    label: "Singles",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261329",
    label: "Lots",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261330",
    label: "Sets",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261331",
    label: "Sealed packs",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261332",
    label: "Sealed boxes",
    group: "Sports Mem, Cards & Fan Shop",
  },
  {
    value: "261333",
    label: "Sealed cases",
    group: "Sports Mem, Cards & Fan Shop",
  },
];

export const CARD_CATEGORY_GROUPS: CardCategoryGroup[] = [
  "Toys & Hobbies",
  "Collectibles",
  "Sports Mem, Cards & Fan Shop",
];

export const CARD_CATEGORY_LINES: CardCategoryOption[] = [
  {
    value: "2536",
    label: "Collectible Card Games",
    group: "Toys & Hobbies",
  },
  {
    value: "182982",
    label: "Non-Sport Trading Cards",
    group: "Collectibles",
  },
  {
    value: "212",
    label: "Sports Trading Cards",
    group: "Sports Mem, Cards & Fan Shop",
  },
];

export const CCG_LINE_ID = "2536";
export const CCG_SINGLES_ID = "183454";

/** Leaf CCG categories that expose the official Game aspect. */
export const CCG_GAME_CATEGORY_IDS = new Set([
  CCG_SINGLES_ID,
  "183455",
  "183456",
  "183457",
  "183459",
  "261044",
  "261045",
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

/** Launch-line CCGs that sit next to Popular. */
export const CARD_GAME_WEDGE = [
  "star-wars-tcg",
  "star-wars-ccg",
  "g-i-joe-tcg",
  "transformers-tcg",
];

export const POKEMON_GAME = "pokemon-tcg";

export type CardCatalogSelection = {
  cardSet?: string;
  rarity?: string;
  printing?: string;
  language?: string;
  grader?: string;
  cardGrade?: string;
  cardNoReprints?: boolean;
  cardNoProxy?: boolean;
};

export type CatalogSelection = CardCatalogSelection &
  BrickQuerySelection &
  WheelsQuerySelection &
  FigureQuerySelection;

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

export function cardCategoryIds(
  value: string | undefined,
  game?: string,
): string | undefined {
  const parsed = parseCardCategory(value);
  if (!parsed) return undefined;
  if (parsed === CCG_LINE_ID && parseCardGame(game)) return CCG_SINGLES_ID;
  return parsed;
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
  return Boolean(
    parsed && (parsed === CCG_LINE_ID || CCG_GAME_CATEGORY_IDS.has(parsed)),
  );
}

export function isPokemonCardGame(value: string | undefined): boolean {
  return parseCardGame(value) === POKEMON_GAME;
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
  const aspect = cardGameAspect(game);
  if (!aspect) return undefined;
  const category = cardCategoryIds(categoryId, game);
  if (!category || !CCG_GAME_CATEGORY_IDS.has(category)) return undefined;
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
  if (!raw || raw === ANY) return undefined;
  if (raw.toLowerCase() === "beckett") return "bgs";
  return findOption(CARD_GRADER_FILTERS, raw)?.value;
}

export function isSlabGrader(value: string | undefined): boolean {
  const grader = parseCardGrader(value);
  return Boolean(grader && grader !== "raw");
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

function optionQueryTerm(
  option: CardFilterOption | undefined,
): string | undefined {
  if (!option) return undefined;
  return option.queryTerm ?? option.label;
}

export function cardRarityQueryTerm(value: string | undefined): string | undefined {
  return optionQueryTerm(findOption(CARD_RARITY_FILTERS, value));
}

export function cardPrintingQueryTerm(
  value: string | undefined,
): string | undefined {
  return optionQueryTerm(findOption(CARD_PRINTING_FILTERS, value));
}

export function cardLanguageQueryTerm(
  value: string | undefined,
): string | undefined {
  const language = parseCardLanguage(value);
  if (!language || language === "english") return undefined;
  return cardLanguageLabel(language);
}

/** `PSA 10` when both are set, otherwise just `PSA`. Raw is never injected. */
export function cardGraderQueryTerm(
  selection: Pick<CardCatalogSelection, "grader" | "cardGrade">,
): string | undefined {
  if (!isSlabGrader(selection.grader)) return undefined;
  const grader = cardGraderLabel(selection.grader);
  if (!grader) return undefined;
  const grade = cardGradeLabel(selection.cardGrade);
  return grade ? `${grader} ${grade}` : grader;
}

export function cardExcludeWords(
  selection: Pick<
    CardCatalogSelection,
    "grader" | "cardNoReprints" | "cardNoProxy" | "cardSet" | "rarity"
  > & {
    cardGame?: string;
    cardCategory?: string;
  },
): string[] {
  const words: string[] = [];
  if (selection.grader === "raw") words.push(...CARD_RAW_EXCLUDE_WORDS);
  const cardActive = Boolean(
    selection.grader ||
      selection.cardSet ||
      selection.rarity ||
      selection.cardGame ||
      selection.cardCategory,
  );
  if (!cardActive) return words;
  if (selection.cardNoReprints !== false) {
    words.push(...CARD_REPRINT_EXCLUDE_WORDS);
  }
  if (selection.cardNoProxy !== false) {
    words.push(...CARD_PROXY_EXCLUDE_WORDS);
  }
  words.push(...CARD_CUSTOM_EXCLUDE_WORDS);
  return words;
}

const CARD_RESERVED_EXCLUDES = [
  ...CARD_RAW_EXCLUDE_WORDS,
  ...CARD_REPRINT_EXCLUDE_WORDS,
  ...CARD_PROXY_EXCLUDE_WORDS,
  ...CARD_CUSTOM_EXCLUDE_WORDS,
].map((word) => word.toLowerCase());

export function isCardExcludeWord(word: string): boolean {
  return CARD_RESERVED_EXCLUDES.includes(word.toLowerCase());
}

export function withoutCardExcludeWords(words: string[]): string[] {
  return words.filter((word) => !isCardExcludeWord(word));
}

export function cardSkippedDefaultExcludes(
  selection: Pick<
    CardCatalogSelection,
    "cardNoReprints" | "cardNoProxy" | "grader" | "cardSet" | "rarity"
  > & {
    cardGame?: string;
    cardCategory?: string;
  },
): string[] {
  const cardActive = Boolean(
    selection.grader ||
      selection.cardSet ||
      selection.rarity ||
      selection.cardGame ||
      selection.cardCategory,
  );
  if (!cardActive) return [];
  const skip: string[] = [];
  if (selection.cardNoReprints === false) skip.push("reprint", "reprints");
  if (selection.cardNoProxy === false) skip.push("proxy");
  return skip;
}

/** Labels / keywords that should be appended to the eBay keyword query. */
export function catalogQueryTerms(selection: CatalogSelection): string[] {
  const terms: string[] = [];
  const set = cardSetLabel(selection.cardSet);
  const rarity = cardRarityQueryTerm(selection.rarity);
  const printing = cardPrintingQueryTerm(selection.printing);
  const language = cardLanguageQueryTerm(selection.language);
  const grader = cardGraderQueryTerm(selection);
  if (set) terms.push(set);
  if (rarity) terms.push(rarity);
  if (printing) terms.push(printing);
  if (language) terms.push(language);
  if (grader) terms.push(grader);
  terms.push(...brickQueryTerms(selection));
  terms.push(...wheelsQueryTerms(selection));
  terms.push(...figureQueryTerms(selection));
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
    if (grader.value === "raw") continue;
    for (const grade of CARD_GRADE_FILTERS) {
      labels.push(`${grader.label} ${grade.label}`);
    }
    labels.push(grader.label);
  }
  return labels;
}

const LEGACY_CATALOG_LABELS = [
  "Holofoil",
  "Non-holo",
  "Reverse Holofoil",
  "Special Illustration Rare",
  "Illustration Rare",
  "Base Set Shadowless",
  "XY Evolutions",
  "Scarlet & Violet 151",
];

function allCatalogLabels(includeGraders = true): string[] {
  const terms = [
    ...CARD_SET_FILTERS.flatMap((option) =>
      [option.label, option.queryTerm].filter(
        (term): term is string => Boolean(term),
      ),
    ),
    ...CARD_RARITY_FILTERS.flatMap((option) =>
      [option.label, option.queryTerm].filter(
        (term): term is string => Boolean(term),
      ),
    ),
    ...CARD_PRINTING_FILTERS.flatMap((option) =>
      [option.label, option.queryTerm].filter(
        (term): term is string => Boolean(term),
      ),
    ),
    ...CARD_LANGUAGE_FILTERS.map((option) => option.label),
    ...LEGACY_CATALOG_LABELS,
    ...(includeGraders ? allGraderLabels() : []),
    ...allBrickQueryTerms(),
    ...allWheelsQueryTerms(),
    ...allFigureQueryTerms(),
  ];
  return [...new Set(terms)].sort((a, b) => b.length - a.length);
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
  if (/^(PSA|CGC|BGS|SGC) \d+(?:\.\d+)?$/i.test(term)) return term;
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
