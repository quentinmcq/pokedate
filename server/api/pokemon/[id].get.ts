export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))
  const pokemon = Number.isInteger(id) ? findPokemon(id) : null
  if (!pokemon) throw createError({ statusCode: 404, statusMessage: 'Pokémon introuvable' })
  return pokemon
})
