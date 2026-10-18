import type { DrawsActivity } from '#shared/types/pokemon'

const DAYS_IN_WEEK = 7
const FAVOURITE_MIN_DRAWS = 2

export default defineEventHandler(async (event): Promise<DrawsActivity> => {
  setResponseHeader(event, 'cache-control', 'public, max-age=60')
  const { DB } = cloudflareBindings(event)
  if (!DB) throw createError({ statusCode: 503, message: "L'activité du jour est indisponible pour le moment." })

  const todayTotals = await DB.prepare(
    'SELECT COUNT(*) AS reveals, COALESCE(SUM(shiny), 0) AS shiny FROM draws WHERE created_at >= ?',
  )
    .bind(startOfParisDay())
    .first<{ reveals: number; shiny: number }>()
  // Like today's numbers, counted from the published draws, so the block always matches the list below it.
  const weekFavourite = await DB.prepare(
    'SELECT pokemon_id, COUNT(*) AS total FROM draws WHERE created_at >= ? GROUP BY pokemon_id HAVING total >= ? ORDER BY total DESC, MAX(created_at) DESC LIMIT 1',
  )
    .bind(Date.now() - DAYS_IN_WEEK * 24 * 60 * 60 * 1000, FAVOURITE_MIN_DRAWS)
    .first<{ pokemon_id: number; total: number }>()

  const favouritePokemon = weekFavourite ? findPokemon(weekFavourite.pokemon_id, requestLocale(event)) : null
  return {
    todayReveals: todayTotals?.reveals ?? 0,
    todayShiny: todayTotals?.shiny ?? 0,
    weekFavourite:
      weekFavourite && favouritePokemon
        ? { id: favouritePokemon.id, name: favouritePokemon.name, count: weekFavourite.total }
        : null,
  }
})
