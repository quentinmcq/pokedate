// The Workers runtime does not hand DELETE bodies to Nitro, so the edit token travels in a header.
export default defineEventHandler(async (event) => {
  const DB = requireDrawsDatabase(event)
  const { drawId, editToken } = readEditRequest(event, { editToken: getRequestHeader(event, 'x-edit-token') })
  await assertWithinRateLimit(event, cloudflareBindings(event).EVENT_RATE_LIMITER)

  await removeDraw(DB, drawId, editToken)
  return sendNoContent(event)
})
