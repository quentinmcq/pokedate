const readPokemonId = (value: unknown, first = 1) =>
  typeof value === 'number' && Number.isInteger(value) && value >= first && value <= POKEMON_COUNT ? value : null

export default defineEventHandler(async (event) => {
  const DB = requireDrawsDatabase(event)
  const body = await readBody<{ pokemonId?: unknown; shiny?: unknown; bonusPokemonId?: unknown; nickname?: unknown }>(
    event,
  )
  const pokemonId = readPokemonId(body?.pokemonId)
  if (!pokemonId) throw createError({ statusCode: 400, message: 'Pokémon inconnu.' })
  const bonusPokemonId =
    body?.bonusPokemonId == null ? null : readPokemonId(body.bonusPokemonId, LAST_DATE_POKEMON_ID + 1)
  if (body?.bonusPokemonId != null && !bonusPokemonId)
    throw createError({ statusCode: 400, message: 'Pokémon bonus inconnu.' })

  await assertWithinRateLimit(event, cloudflareBindings(event).PUBLISH_RATE_LIMITER)
  const nickname = await readAllowedNickname(DB, body?.nickname)

  setResponseStatus(event, 201)
  return publishDraw(DB, { pokemonId, shiny: body?.shiny === true, bonusPokemonId, nickname })
})
