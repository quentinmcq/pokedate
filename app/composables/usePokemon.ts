import type { DexEntry, PokemonDetail } from '#shared/types/pokemon'

/** Récupère un Pokémon (rendu côté serveur, refetch quand le numéro change) */
export function usePokemon(id: MaybeRefOrGetter<number | null | undefined>) {
  return useAsyncData(
    () => `pokemon-${toValue(id) ?? 'none'}`,
    () => {
      const v = toValue(id)
      return v ? $fetch<PokemonDetail>(`/api/pokemon/${v}`) : Promise.resolve(null)
    },
  )
}

export function useDexList() {
  return useFetch<DexEntry[]>('/api/pokedex', { key: 'dex-list' })
}
