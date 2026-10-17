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

export interface Pokemon {
  id: number
  fr: string
  en: string
  genus: string
  types: TypeKey[]
  h: number
  w: number
  stats: number[]
  ab: [string, number][]
  desc: string
  descEn?: number
  gen: number
  rare: number
  baby: number
  evo: number
}

export interface EvoMon {
  id: number
  fr: string
}

export interface PokemonDetail extends Omit<Pokemon, 'evo'> {
  chain: EvoMon[][]
  prev: EvoMon | null
  next: EvoMon | null
}

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

export interface DateInput {
  d: string
  m: string
  y: string
}
