import type { LocationQuery } from 'vue-router'

export const PLAYER_NAME_MAX_LENGTH = 20

const QUERY_KEYS = {
  pokemonIdA: 'pa',
  pokemonIdB: 'pb',
  shinyA: 'sa',
  shinyB: 'sb',
  playerNameA: 'na',
  playerNameB: 'nb',
} as const

export interface DuelQuery {
  pokemonIdA: number | null
  pokemonIdB: number | null
  shinyA: boolean
  shinyB: boolean
  playerNameA: string
  playerNameB: string
}

const readString = (value: unknown) => (typeof value === 'string' ? value : '')

export const cleanPlayerName = (value: unknown) => readString(value).trim().slice(0, PLAYER_NAME_MAX_LENGTH)

function readPokemonId(value: unknown) {
  const id = Number(readString(value))
  return Number.isInteger(id) && id >= 1 && id <= POKEMON_COUNT ? id : null
}

export function parseDuelQuery(query: LocationQuery): DuelQuery {
  return {
    pokemonIdA: readPokemonId(query[QUERY_KEYS.pokemonIdA]),
    pokemonIdB: readPokemonId(query[QUERY_KEYS.pokemonIdB]),
    shinyA: query[QUERY_KEYS.shinyA] === '1',
    shinyB: query[QUERY_KEYS.shinyB] === '1',
    playerNameA: cleanPlayerName(query[QUERY_KEYS.playerNameA]),
    playerNameB: cleanPlayerName(query[QUERY_KEYS.playerNameB]),
  }
}

export function buildDuelQuery(duel: DuelQuery): Record<string, string> {
  const query: Record<string, string> = {}
  if (duel.pokemonIdA) query[QUERY_KEYS.pokemonIdA] = String(duel.pokemonIdA)
  if (duel.pokemonIdB) query[QUERY_KEYS.pokemonIdB] = String(duel.pokemonIdB)
  if (duel.shinyA) query[QUERY_KEYS.shinyA] = '1'
  if (duel.shinyB) query[QUERY_KEYS.shinyB] = '1'
  const playerNameA = cleanPlayerName(duel.playerNameA)
  const playerNameB = cleanPlayerName(duel.playerNameB)
  if (playerNameA) query[QUERY_KEYS.playerNameA] = playerNameA
  if (playerNameB) query[QUERY_KEYS.playerNameB] = playerNameB
  return query
}
