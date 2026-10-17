import type { PokedexEntry, PokemonDetail } from '#shared/types/pokemon'

export function usePokemonDetail(id: MaybeRefOrGetter<number | null | undefined>) {
  return useAsyncData(
    () => `pokemon-${toValue(id) ?? 'none'}`,
    () => {
      const pokemonId = toValue(id)
      return pokemonId ? $fetch<PokemonDetail>(`/api/pokemon/${pokemonId}`) : Promise.resolve(null)
    },
  )
}

export function usePokedexEntries() {
  return useFetch<PokedexEntry[]>('/api/pokedex', { key: 'pokedex-entries' })
}
