export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const { DB, EVENT_RATE_LIMITER } = cloudflareBindings(event)
  const body = await readBody<{ name?: unknown }>(event)
  if (!isTrackedEvent(body?.name)) throw createError({ statusCode: 400, message: 'Événement inconnu.' })
  if (!DB) return sendNoContent(event)

  const connectionKey = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? 'unknown'
  const isWithinRateLimit = EVENT_RATE_LIMITER ? (await EVENT_RATE_LIMITER.limit({ key: connectionKey })).success : true
  if (isWithinRateLimit) await incrementEventCount(DB, body.name)
  return sendNoContent(event)
})
