const PODIUM_SIZE = 3

export default defineEventHandler((event) => {
  const podium = parseSharedFighters(getRouterParam(event, 'podium') ?? '', PODIUM_SIZE)
  const podiumPokemon = podium?.map((fighter) => findPokemon(fighter.pokemonId)) ?? []
  if (!podium || podiumPokemon.some((pokemon) => !pokemon)) throw createError({ statusCode: 404 })

  const composition = tournamentLayers(podium.map((fighter, rank) => ({ ...fighter, name: podiumPokemon[rank]!.name })))
  return sendShareImage(event, composition, shareImagePath(podium[0]!.pokemonId))
})
