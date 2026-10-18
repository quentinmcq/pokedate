export default defineEventHandler(async (event) => {
  const DB = requireDrawsDatabase(event)
  const body = await readBody<{ editToken?: unknown; nickname?: unknown }>(event)
  const { drawId, editToken } = readEditRequest(event, body)
  await assertWithinRateLimit(event, cloudflareBindings(event).EVENT_RATE_LIMITER)
  const nickname = await readAllowedNickname(DB, body?.nickname)

  if (!(await renameDraw(DB, drawId, editToken, nickname)))
    throw createError({ statusCode: 404, message: "Ce tirage n'est plus dans les derniers tirages." })
  return { nickname }
})
