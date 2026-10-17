import type { PokemonDetail } from '#shared/types/pokemon'

const META_DESCRIPTION_MAX_LENGTH = 158

export const typesLabel = (pokemon: Pick<PokemonDetail, 'types'>) =>
  pokemon.types.map((type) => POKEMON_TYPES[type].label).join(' et ')

export function pokemonMetaDescription(pokemon: PokemonDetail) {
  const generation = generationOf(pokemon.generation)
  const intro = `${pokemon.name} (n° ${pokemon.id}), ${pokemon.genus.toLowerCase()} de type ${typesLabel(pokemon)}${generation ? `, génération ${generation.roman}` : ''}. `
  const text = intro + pokemon.description
  return text.length > META_DESCRIPTION_MAX_LENGTH
    ? `${text.slice(0, META_DESCRIPTION_MAX_LENGTH - 3).trimEnd()}…`
    : text.trimEnd()
}
