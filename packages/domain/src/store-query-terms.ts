import {
  DEFAULT_APP_LOCALE,
  storeLocaleOf,
  type AppLocale,
} from "./ebay-sites.ts";

type LocaleTable = Partial<Record<AppLocale, string>>;

const QUERY_TERMS: Record<string, LocaleTable> = {
  carded: {
    de: "carded",
    fr: "blister",
    it: "blister",
    es: "blister",
    nl: "carded",
    pl: "blister",
  },
  loose: {
    de: "lose",
    fr: "loose",
    it: "sfuso",
    es: "suelto",
    nl: "los",
    pl: "luzem",
  },
  complete: {
    de: "vollständig",
    fr: "complet",
    it: "completo",
    es: "completo",
    nl: "compleet",
    pl: "kompletny",
  },
  incomplete: {
    de: "unvollständig",
    fr: "incomplet",
    it: "incompleto",
    es: "incompleto",
    nl: "incompleet",
    pl: "niekompletny",
  },
  unpunched: {
    de: "ungeöffnet",
    fr: "non percé",
    it: "non bucato",
    es: "sin perforar",
    nl: "ongeponst",
    pl: "nieprzebity",
  },
  punched: {
    de: "gelocht",
    fr: "percé",
    it: "bucato",
    es: "perforado",
    nl: "geponst",
    pl: "przebity",
  },
  sealed: {
    de: "ovp",
    fr: "scellé",
    it: "sigillato",
    es: "precintado",
    nl: "verzegeld",
    pl: "folia",
  },
  minifigure: {
    de: "minifigur",
    fr: "minifigurine",
    it: "minifigure",
    es: "minifigura",
    nl: "minifiguur",
    pl: "minifigurka",
  },
  manual: {
    de: "anleitung",
    fr: "notice",
    it: "istruzioni",
    es: "instrucciones",
    nl: "handleiding",
    pl: "instrukcja",
  },
  box: {
    de: "karton",
    fr: "boîte",
    it: "scatola",
    es: "caja",
    nl: "doos",
    pl: "pudełko",
  },
};

const EXCLUDE_TERMS: Record<string, LocaleTable> = {
  reprint: {
    de: "nachdruck",
    fr: "réimpression",
    it: "ristampa",
    es: "reimpresión",
    nl: "herdruk",
    pl: "przedruk",
  },
  reprints: {
    de: "nachdrucke",
    fr: "réimpressions",
    it: "ristampe",
    es: "reimpresiones",
    nl: "herdrukken",
    pl: "przedruki",
  },
  proxy: {
    de: "proxy",
    fr: "proxy",
    it: "proxy",
    es: "proxy",
    nl: "proxy",
    pl: "proxy",
  },
  "for parts": {
    de: "defekt",
    fr: "pour pièces",
    it: "per ricambi",
    es: "para piezas",
    nl: "voor onderdelen",
    pl: "na części",
  },
  custom: {
    de: "custom",
    fr: "custom",
    it: "custom",
    es: "custom",
    nl: "custom",
    pl: "custom",
  },
  moc: { de: "moc", fr: "moc", it: "moc", es: "moc", nl: "moc", pl: "moc" },
  mock: {
    de: "nachbau",
    fr: "imitation",
    it: "imitazione",
    es: "imitación",
    nl: "namaak",
    pl: "imitacja",
  },
  replica: {
    de: "replik",
    fr: "réplique",
    it: "replica",
    es: "réplica",
    nl: "replica",
    pl: "replika",
  },
  fake: {
    de: "fälschung",
    fr: "faux",
    it: "falso",
    es: "falso",
    nl: "nep",
    pl: "fałszywy",
  },
  compatible: {
    de: "kompatibel",
    fr: "compatible",
    it: "compatibile",
    es: "compatible",
    nl: "compatibel",
    pl: "kompatybilny",
  },
  copy: {
    de: "kopie",
    fr: "copie",
    it: "copia",
    es: "copia",
    nl: "kopie",
    pl: "kopia",
  },
  generic: {
    de: "generisch",
    fr: "générique",
    it: "generico",
    es: "genérico",
    nl: "generiek",
    pl: "generyczny",
  },
  unofficial: {
    de: "inoffiziell",
    fr: "non officiel",
    it: "non ufficiale",
    es: "no oficial",
    nl: "onofficieel",
    pl: "nieoficjalny",
  },
  reproduction: {
    de: "reproduktion",
    fr: "reproduction",
    it: "riproduzione",
    es: "reproducción",
    nl: "reproductie",
    pl: "reprodukcja",
  },
  imitation: {
    de: "imitation",
    fr: "imitation",
    it: "imitazione",
    es: "imitación",
    nl: "imitatie",
    pl: "imitacja",
  },
  dummy: {
    de: "dummy",
    fr: "dummy",
    it: "dummy",
    es: "dummy",
    nl: "dummy",
    pl: "dummy",
  },
  duplicate: {
    de: "duplikat",
    fr: "doublon",
    it: "duplicato",
    es: "duplicado",
    nl: "duplicaat",
    pl: "duplikat",
  },
  counterpart: {
    de: "gegenstück",
    fr: "contrepartie",
    it: "controparte",
    es: "contraparte",
    nl: "tegenhanger",
    pl: "odpowiednik",
  },
  unbranded: {
    de: "unmarkiert",
    fr: "sans marque",
    it: "senza marca",
    es: "sin marca",
    nl: "merkloos",
    pl: "bez marki",
  },
  unlicensed: {
    de: "unlizenziert",
    fr: "sans licence",
    it: "senza licenza",
    es: "sin licencia",
    nl: "ongelicentieerd",
    pl: "bez licencji",
  },
  "re-creation": {
    de: "nachbildung",
    fr: "recréation",
    it: "ricreazione",
    es: "recreación",
    nl: "recreatie",
    pl: "rekonstrukcja",
  },
  graded: {
    de: "bewertet",
    fr: "gradé",
    it: "graduato",
    es: "gradado",
    nl: "gegradeerd",
    pl: "oceniony",
  },
  uncarded: {
    de: "lose",
    fr: "hors blister",
    it: "sfuso",
    es: "sin blister",
    nl: "los",
    pl: "bez blistera",
  },
  missing: {
    de: "fehlt",
    fr: "manquant",
    it: "mancante",
    es: "faltante",
    nl: "ontbreekt",
    pl: "brakuje",
  },
  minifigure: QUERY_TERMS.minifigure!,
  minifigures: {
    de: "minifiguren",
    fr: "minifigurines",
    it: "minifigure",
    es: "minifiguras",
    nl: "minifiguren",
    pl: "minifigurki",
  },
  minifig: {
    de: "minifig",
    fr: "minifig",
    it: "minifig",
    es: "minifig",
    nl: "minifig",
    pl: "minifig",
  },
  minifigs: {
    de: "minifigs",
    fr: "minifigs",
    it: "minifigs",
    es: "minifigs",
    nl: "minifigs",
    pl: "minifigs",
  },
  manual: QUERY_TERMS.manual!,
  torso: {
    de: "torso",
    fr: "torse",
    it: "torso",
    es: "torso",
    nl: "torso",
    pl: "tułów",
  },
  head: {
    de: "kopf",
    fr: "tête",
    it: "testa",
    es: "cabeza",
    nl: "hoofd",
    pl: "głowa",
  },
  part: {
    de: "teil",
    fr: "pièce",
    it: "pezzo",
    es: "pieza",
    nl: "onderdeel",
    pl: "część",
  },
  plate: {
    de: "platte",
    fr: "plaque",
    it: "piastra",
    es: "placa",
    nl: "plaat",
    pl: "płytka",
  },
  brick: {
    de: "stein",
    fr: "brique",
    it: "mattoncino",
    es: "ladrillo",
    nl: "steen",
    pl: "klocek",
  },
  panel: {
    de: "panel",
    fr: "panneau",
    it: "pannello",
    es: "panel",
    nl: "paneel",
    pl: "panel",
  },
  tile: {
    de: "fliese",
    fr: "tuile",
    it: "piastrella",
    es: "baldosa",
    nl: "tegel",
    pl: "płytka",
  },
  slope: {
    de: "schrägstein",
    fr: "pente",
    it: "inclinato",
    es: "inclinado",
    nl: "helling",
    pl: "skos",
  },
  case: {
    de: "vitrine",
    fr: "vitrine",
    it: "teca",
    es: "vitrina",
    nl: "vitrine",
    pl: "gablota",
  },
  display: {
    de: "display",
    fr: "présentoir",
    it: "espositore",
    es: "expositor",
    nl: "display",
    pl: "ekspozytor",
  },
  sticker: {
    de: "aufkleber",
    fr: "sticker",
    it: "adesivo",
    es: "pegatina",
    nl: "sticker",
    pl: "naklejka",
  },
  stickers: {
    de: "aufkleber",
    fr: "stickers",
    it: "adesivi",
    es: "pegatinas",
    nl: "stickers",
    pl: "naklejki",
  },
  led: { de: "led", fr: "led", it: "led", es: "led", nl: "led", pl: "led" },
  displaycase: {
    de: "vitrine",
    fr: "vitrine",
    it: "teca",
    es: "vitrina",
    nl: "vitrine",
    pl: "gablota",
  },
  protector: {
    de: "schutz",
    fr: "protection",
    it: "protezione",
    es: "protector",
    nl: "beschermer",
    pl: "ochraniacz",
  },
};

function lookup(table: Record<string, LocaleTable>, word: string, locale: AppLocale): string {
  if (locale === DEFAULT_APP_LOCALE) return word;
  return table[word.toLowerCase()]?.[locale] ?? word;
}

export function localizeQueryTerm(
  term: string,
  locale: AppLocale = DEFAULT_APP_LOCALE,
): string {
  return lookup(QUERY_TERMS, term, locale);
}

export function localizeExcludeWord(
  word: string,
  locale: AppLocale = DEFAULT_APP_LOCALE,
): string {
  return lookup(EXCLUDE_TERMS, word, locale);
}

export function localizeExcludeWords(
  words: readonly string[],
  locale: AppLocale = DEFAULT_APP_LOCALE,
): string[] {
  return words.map((word) => localizeExcludeWord(word, locale));
}

export function localizeQueryTerms(
  terms: readonly string[],
  locale: AppLocale = DEFAULT_APP_LOCALE,
): string[] {
  return terms.map((term) => localizeQueryTerm(term, locale));
}

export function allLocaleVariants(word: string): string[] {
  const seen = new Set<string>();
  const add = (value: string) => {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
  };
  add(word);
  const query = QUERY_TERMS[word.toLowerCase()];
  const exclude = EXCLUDE_TERMS[word.toLowerCase()];
  for (const table of [query, exclude]) {
    if (!table) continue;
    for (const value of Object.values(table)) {
      if (value) add(value);
    }
  }
  return [...seen];
}

export function reservedWordSet(words: readonly string[]): Set<string> {
  const keys = new Set<string>();
  for (const word of words) {
    for (const variant of allLocaleVariants(word)) {
      keys.add(variant);
    }
  }
  return keys;
}

export function storeLocaleFromSite(site: string | undefined): AppLocale {
  return storeLocaleOf(site);
}
