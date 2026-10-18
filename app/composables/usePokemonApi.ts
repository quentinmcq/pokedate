import type { Locale, PokedexEntry, PokemonDetail } from '#shared/types/pokemon'

export const fetchPokemonDetail = (id: number, locale: Locale) =>
  $fetch<PokemonDetail>(`/api/pokemon/${id}`, { query: { lang: locale } })

export function usePokemonDetail(id: MaybeRefOrGetter<number | null | undefined>) {
  const { locale } = useLocaleTools()
  return useAsyncData(
    () => `pokemon-${toValue(id) ?? 'none'}-${locale.value}`,
    () => {
      const pokemonId = toValue(id)
      return pokemonId ? fetchPokemonDetail(pokemonId, locale.value) : Promise.resolve(null)
    },
  )
}

export function usePokedexEntries() {
  const { locale } = useLocaleTools()
  return useFetch<PokedexEntry[]>('/api/pokedex', {
    key: () => `pokedex-entries-${locale.value}`,
    query: { lang: locale },
  })
}
