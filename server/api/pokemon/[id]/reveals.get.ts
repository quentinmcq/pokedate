const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Counted from the published draws, like the week's favourite, so both numbers always agree.
export default defineEventHandler(async (event) => {
  const pokemonId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > POKEMON_COUNT)
    throw createError({ statusCode: 404, message: 'Pokémon introuvable' })
  const { DB } = cloudflareBindings(event)
  if (!DB) return { weekCount: 0 }

  const row = await DB.prepare('SELECT COUNT(*) AS total FROM draws WHERE pokemon_id = ? AND created_at >= ?')
    .bind(pokemonId, Date.now() - WEEK_MS)
    .first<{ total: number }>()
  return { weekCount: row?.total ?? 0 }
})
