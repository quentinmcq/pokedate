export default defineEventHandler((event) => {
  const fileName = getRouterParam(event, 'fighters') ?? ''
  const locale = shareImageLocale(fileName)
  const fighters = parseSharedFighters(fileName, 2)
  const [pokemonA, pokemonB] = fighters?.map((fighter) => findPokemon(fighter.pokemonId, locale)) ?? []
  if (!fighters || !pokemonA || !pokemonB) throw createError({ statusCode: 404 })

  const { winner } = resolveDuel(pokemonA, pokemonB)
  const composition = duelLayers(
    translatorFor(locale),
    { ...fighters[0]!, name: pokemonA.name },
    { ...fighters[1]!, name: pokemonB.name },
    winner,
  )
  return sendShareImage(event, composition, shareImagePath(winner === 'B' ? pokemonB.id : pokemonA.id, locale))
})
