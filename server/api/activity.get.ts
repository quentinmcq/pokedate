import type { DrawsActivity } from '#shared/types/pokemon'

const DAYS_IN_WEEK = 7

export default defineEventHandler(async (event): Promise<DrawsActivity> => {
  setResponseHeader(event, 'cache-control', 'public, max-age=60')
  const { DB } = cloudflareBindings(event)
  if (!DB) throw createError({ statusCode: 503, message: "L'activité du jour est indisponible pour le moment." })

  const today = todayInParisIso()
  const todayTotals = await DB.prepare(
    'SELECT COALESCE(SUM(count), 0) AS reveals, COALESCE(SUM(shiny_count), 0) AS shiny FROM pokemon_reveal_counts WHERE day = ?',
  )
    .bind(today)
    .first<{ reveals: number; shiny: number }>()
  const weekFavourite = await DB.prepare(
    'SELECT pokemon_id, SUM(count) AS total FROM pokemon_reveal_counts WHERE day >= date(?, ?) GROUP BY pokemon_id ORDER BY total DESC, pokemon_id LIMIT 1',
  )
    .bind(today, `-${DAYS_IN_WEEK - 1} days`)
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
