import data from '../data/pokemon.json'
import type { StoredPokedex, StoredPokemon } from '../data/storedPokedex'
import type { PokedexEntry, PokemonDetail, PokemonSummary, Rarity } from '../../shared/types/pokemon'

const { pokemon: storedPokemon, chains: evolutionChains } = data as unknown as StoredPokedex

const RARITY_BY_CODE: Record<number, Rarity> = { 0: null, 1: 'legendary', 2: 'mythical' }

function toSummary(stored: StoredPokemon): PokemonSummary {
  return { id: stored.id, name: stored.fr }
}

function toEntry(stored: StoredPokemon): PokedexEntry {
  return { ...toSummary(stored), types: stored.types }
}

const findStored = (id: number) => (Number.isInteger(id) ? storedPokemon[id - 1] : undefined)

const summaryOf = (id: number) => {
  const stored = findStored(id)
  return stored ? toSummary(stored) : null
}

function toDetail(stored: StoredPokemon): PokemonDetail {
  const [hp, attack, defense, specialAttack, specialDefense, speed] = stored.stats
  const evolutionIds = evolutionChains[stored.evo] ?? [[stored.id]]
  return {
    ...toEntry(stored),
    englishName: stored.en,
    genus: stored.genus,
    heightMeters: stored.h,
    weightKg: stored.w,
    stats: { hp, attack, defense, specialAttack, specialDefense, speed },
    abilities: stored.ab.map(([name, hidden]) => ({ name, hidden: hidden === 1 })),
    description: stored.desc,
    descriptionIsEnglish: stored.descEn === 1,
    generation: stored.gen,
    rarity: RARITY_BY_CODE[stored.rare] ?? null,
    isBaby: stored.baby === 1,
    evolutionStages: evolutionIds.map((stage) => stage.map(summaryOf).filter((pokemon) => pokemon !== null)),
    previous: summaryOf(stored.id - 1),
    next: summaryOf(stored.id + 1),
  }
}

export function findPokemon(id: number): PokemonDetail | null {
  const stored = findStored(id)
  return stored ? toDetail(stored) : null
}

let pokedexEntries: PokedexEntry[] | undefined
export const listPokedexEntries = () => (pokedexEntries ??= storedPokemon.map(toEntry))
