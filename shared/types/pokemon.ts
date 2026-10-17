export type TypeKey =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy'

/** Une entrée de server/data/pokemon.json (clés courtes pour garder le fichier léger) */
export interface Pokemon {
  id: number
  fr: string
  en: string
  genus: string
  types: TypeKey[]
  /** taille en m */
  h: number
  /** poids en kg */
  w: number
  /** PV, Attaque, Défense, Atq. Spé., Déf. Spé., Vitesse */
  stats: number[]
  /** [nom du talent, 1 si caché] */
  ab: [string, number][]
  desc: string
  /** 1 si la description n'existe qu'en anglais */
  descEn?: number
  gen: number
  /** 0 normal, 1 légendaire, 2 fabuleux */
  rare: number
  baby: number
  /** index de la chaîne d'évolution */
  evo: number
}

export interface EvoMon {
  id: number
  fr: string
}

/** Ce que renvoie /api/pokemon/:id */
export interface PokemonDetail extends Omit<Pokemon, 'evo'> {
  /** étapes d'évolution, chacune pouvant avoir plusieurs branches (Évoli…) */
  chain: EvoMon[][]
}

/** Ce que renvoie /api/pokedex */
export interface DexEntry {
  id: number
  fr: string
  types: TypeKey[]
}

export interface DateParts {
  d: number
  m: number
  y: number
}

/** Valeurs brutes des champs JJ / MM / AAAA */
export interface DateInput {
  d: string
  m: string
  y: string
}
