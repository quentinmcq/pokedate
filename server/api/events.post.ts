export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const { DB, EVENT_RATE_LIMITER } = cloudflareBindings(event)
  const body = await readBody<{ name?: unknown; pokemonId?: unknown; shiny?: unknown }>(event)
  if (!isTrackedEvent(body?.name)) throw createError({ statusCode: 400, message: 'Événement inconnu.' })
  if (!DB) return sendNoContent(event)

  const connectionKey = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? 'unknown'
  const isWithinRateLimit = EVENT_RATE_LIMITER ? (await EVENT_RATE_LIMITER.limit({ key: connectionKey })).success : true
  if (!isWithinRateLimit) return sendNoContent(event)
  await incrementEventCount(DB, body.name)
  const pokemonId = Number(body.pokemonId)
  const isRevealWithPokemon =
    (body.name === 'reveal' || body.name === 'random') &&
    Number.isInteger(pokemonId) &&
    pokemonId >= 1 &&
    pokemonId <= POKEMON_COUNT
  if (isRevealWithPokemon) await incrementPokemonRevealCount(DB, { pokemonId, shiny: body.shiny === true })
  return sendNoContent(event)
})
