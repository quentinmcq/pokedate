export default defineEventHandler((event) => {
  const pokemon = findPokemon(Number(getRouterParam(event, 'id')))
  if (!pokemon) throw createError({ statusCode: 404, message: 'Pokémon introuvable' })
  return pokemon
})
