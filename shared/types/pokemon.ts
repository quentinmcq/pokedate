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

export type PokemonTypes = [TypeKey] | [TypeKey, TypeKey]

export interface BaseStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export type StatKey = keyof BaseStats

export interface Ability {
  name: string
  hidden: boolean
}

export type Rarity = 'legendary' | 'mythical' | null

export interface PokemonSummary {
  id: number
  name: string
}

export interface PokedexEntry extends PokemonSummary {
  types: PokemonTypes
}

export interface PokemonDetail extends PokedexEntry {
  englishName: string
  genus: string
  heightMeters: number
  weightKg: number
  stats: BaseStats
  abilities: Ability[]
  description: string
  generation: number
  rarity: Rarity
  isBaby: boolean
  evolutionStages: PokemonSummary[][]
  previous: PokemonSummary | null
  next: PokemonSummary | null
}

export interface CalendarDate {
  day: number
  month: number
  year: number
}

export interface DateFieldValue {
  day: string
  month: string
  year: string
}

export interface PublicDraw {
  id: number
  pokemonId: number
  pokemonName: string
  shiny: boolean
  nickname: string
  createdAt: string
}
