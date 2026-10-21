import type { PokemonDetail } from '#shared/types/pokemon'

const META_DESCRIPTION_MAX_LENGTH = 158

export const typesLabel = (t: Translate, pokemon: Pick<PokemonDetail, 'types'>) =>
  pokemon.types.map((type) => t(`types.${type}`)).join(t('pokemonPage.typesSeparator'))

export function pokemonMetaDescription(t: Translate, pokemon: PokemonDetail) {
  const generation = generationOf(pokemon.generation)
  const intro = t(generation ? 'pokemonPage.metaIntroWithGeneration' : 'pokemonPage.metaIntro', {
    name: pokemon.name,
    id: pokemon.id,
    genus: pokemon.genus,
    genusLowercase: pokemon.genus.toLowerCase(),
    types: typesLabel(t, pokemon),
    generation: generation?.roman ?? '',
  })
  const text = `${intro} ${t('pokemonPage.metaDates', { name: pokemon.name })} ${pokemon.description}`
  return text.length > META_DESCRIPTION_MAX_LENGTH
    ? `${text.slice(0, META_DESCRIPTION_MAX_LENGTH - 3).replace(/[\s.,;:!?…]+$/u, '')}…`
    : text.trimEnd()
}
