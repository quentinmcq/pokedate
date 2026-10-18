export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  const { DB } = cloudflareBindings(event)
  if (!DB) throw createError({ statusCode: 503, message: 'Les derniers tirages sont indisponibles pour le moment.' })
  return listRecentDraws(DB, requestLocale(event))
})
