import type { TypeKey } from '#shared/types/pokemon'

export interface StoredPokemon {
  id: number
  fr: string
  en: string
  genus: string
  types: [TypeKey] | [TypeKey, TypeKey]
  h: number
  w: number
  stats: [number, number, number, number, number, number]
  ab: [string, 0 | 1][]
  abEn: string[]
  desc: string
  descEn: string
  genusEn: string
  gen: number
  rare: 0 | 1 | 2
  baby: 0 | 1
  evo: number
}

export interface StoredPokedex {
  pokemon: StoredPokemon[]
  chains: number[][][]
}
