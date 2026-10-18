import data from '../data/pokemon.json'
import type { StoredPokedex, StoredPokemon } from '../data/storedPokedex'
import type { Locale, PokedexEntry, PokemonDetail, PokemonSummary, Rarity } from '#shared/types/pokemon'

const { pokemon: storedPokemon, chains: evolutionChains } = data as unknown as StoredPokedex

const RARITY_BY_CODE: Record<number, Rarity> = { 0: null, 1: 'legendary', 2: 'mythical' }

const OTHER_LOCALE: Record<Locale, Locale> = { fr: 'en', en: 'fr' }

function toSummary(stored: StoredPokemon, locale: Locale): PokemonSummary {
  return { id: stored.id, name: stored[locale] }
}

function toEntry(stored: StoredPokemon, locale: Locale): PokedexEntry {
  return { ...toSummary(stored, locale), types: stored.types }
}

const findStored = (id: number) => (Number.isInteger(id) ? storedPokemon[id - 1] : undefined)

const summaryOf = (id: number, locale: Locale) => {
  const stored = findStored(id)
  return stored ? toSummary(stored, locale) : null
}

function toDetail(stored: StoredPokemon, locale: Locale): PokemonDetail {
  const [hp, attack, defense, specialAttack, specialDefense, speed] = stored.stats
  const evolutionIds = evolutionChains[stored.evo] ?? [[stored.id]]
  const isEnglish = locale === 'en'
  return {
    ...toEntry(stored, locale),
    otherLanguageName: stored[OTHER_LOCALE[locale]],
    genus: isEnglish ? stored.genusEn : stored.genus,
    heightMeters: stored.h,
    weightKg: stored.w,
    stats: { hp, attack, defense, specialAttack, specialDefense, speed },
    abilities: stored.ab.map(([name, hidden], index) => ({
      name: isEnglish ? (stored.abEn[index] ?? name) : name,
      hidden: hidden === 1,
    })),
    description: isEnglish ? stored.descEn : stored.desc,
    generation: stored.gen,
    rarity: RARITY_BY_CODE[stored.rare] ?? null,
    isBaby: stored.baby === 1,
    evolutionStages: evolutionIds.map((stage) =>
      stage.map((id) => summaryOf(id, locale)).filter((pokemon) => pokemon !== null),
    ),
    previous: summaryOf(stored.id - 1, locale),
    next: summaryOf(stored.id + 1, locale),
  }
}

export function findPokemon(id: number, locale: Locale = 'fr'): PokemonDetail | null {
  const stored = findStored(id)
  return stored ? toDetail(stored, locale) : null
}

export const pokemonNameOf = (id: number, locale: Locale = 'fr') => findStored(id)?.[locale] ?? `#${id}`

const pokedexEntries: Partial<Record<Locale, PokedexEntry[]>> = {}
export const listPokedexEntries = (locale: Locale = 'fr') =>
  (pokedexEntries[locale] ??= storedPokemon.map((stored) => toEntry(stored, locale)))
