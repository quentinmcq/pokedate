export default defineEventHandler((event) => {
  const fighters = parseSharedFighters(getRouterParam(event, 'fighters') ?? '', 2)
  const [pokemonA, pokemonB] = fighters?.map((fighter) => findPokemon(fighter.pokemonId)) ?? []
  if (!fighters || !pokemonA || !pokemonB) throw createError({ statusCode: 404 })

  const { winner } = resolveDuel(pokemonA, pokemonB)
  const composition = duelLayers(
    { ...fighters[0]!, name: pokemonA.name },
    { ...fighters[1]!, name: pokemonB.name },
    winner,
  )
  return sendShareImage(event, composition, shareImagePath(winner === 'B' ? pokemonB.id : pokemonA.id))
})
