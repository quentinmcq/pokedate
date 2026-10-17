import type { LocationQuery } from 'vue-router'

export interface TournamentPlayer {
  pokemonId: number
  shiny: boolean
  name: string
}

const QUERY_KEYS = { pokemonId: 'p', shiny: 's', name: 'n' } as const

const asArray = (value: LocationQuery[string] | undefined) =>
  Array.isArray(value) ? value : value == null ? [] : [value]

export function parseTournamentQuery(query: LocationQuery): TournamentPlayer[] | null {
  const pokemonIds = asArray(query[QUERY_KEYS.pokemonId]).map((value) => Number(value))
  if (pokemonIds.length < TOURNAMENT_PLAYER_LIMITS.min || pokemonIds.length > TOURNAMENT_PLAYER_LIMITS.max) return null
  if (!pokemonIds.every((id) => Number.isInteger(id) && id >= 1 && id <= POKEMON_COUNT)) return null
  const shinyFlags = asArray(query[QUERY_KEYS.shiny])
  const names = asArray(query[QUERY_KEYS.name])
  return pokemonIds.map((pokemonId, index) => ({
    pokemonId,
    shiny: shinyFlags[index] === '1',
    name: cleanPlayerName(names[index]),
  }))
}

export function buildTournamentQuery(players: readonly TournamentPlayer[]) {
  return {
    [QUERY_KEYS.pokemonId]: players.map(({ pokemonId }) => String(pokemonId)),
    [QUERY_KEYS.shiny]: players.map(({ shiny }) => (shiny ? '1' : '0')),
    [QUERY_KEYS.name]: players.map(({ name }) => cleanPlayerName(name)),
  }
}
