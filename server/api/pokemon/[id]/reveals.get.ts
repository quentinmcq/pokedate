const DAYS_IN_WEEK = 7

export default defineEventHandler(async (event) => {
  const pokemonId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > POKEMON_COUNT)
    throw createError({ statusCode: 404, message: 'Pokémon introuvable' })
  const { DB } = cloudflareBindings(event)
  if (!DB) return { weekCount: 0 }

  const row = await DB.prepare(
    'SELECT COALESCE(SUM(count), 0) AS total FROM pokemon_reveal_counts WHERE pokemon_id = ? AND day >= date(?, ?)',
  )
    .bind(pokemonId, todayInParisIso(), `-${DAYS_IN_WEEK - 1} days`)
    .first<{ total: number }>()
  return { weekCount: row?.total ?? 0 }
})
