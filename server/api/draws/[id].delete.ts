export default defineEventHandler(async (event) => {
  const DB = requireDrawsDatabase(event)
  const { drawId, editToken } = readEditRequest(event, await readBody<{ editToken?: unknown }>(event))
  await assertWithinRateLimit(event, cloudflareBindings(event).EVENT_RATE_LIMITER)

  await removeDraw(DB, drawId, editToken)
  setResponseStatus(event, 204)
  return null
})
