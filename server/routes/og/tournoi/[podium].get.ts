const PODIUM_SIZE = 3

export default defineEventHandler((event) => {
  const fileName = getRouterParam(event, 'podium') ?? ''
  const locale = shareImageLocale(fileName)
  const podium = parseSharedFighters(fileName, PODIUM_SIZE)
  const podiumPokemon = podium?.map((fighter) => findPokemon(fighter.pokemonId, locale)) ?? []
  if (!podium || podiumPokemon.some((pokemon) => !pokemon)) throw createError({ statusCode: 404 })

  const composition = tournamentLayers(
    translatorFor(locale),
    podium.map((fighter, rank) => ({ ...fighter, name: podiumPokemon[rank]!.name })),
  )
  return sendShareImage(event, composition, shareImagePath(podium[0]!.pokemonId, locale))
})
