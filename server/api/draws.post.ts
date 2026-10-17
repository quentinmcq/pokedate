const readPokemonId = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= POKEMON_COUNT ? value : null

function assertSameOrigin(event: Parameters<typeof getRequestHost>[0]) {
  const origin = getRequestHeader(event, 'origin')
  if (origin && new URL(origin).host !== getRequestHost(event, { xForwardedHost: true }))
    throw createError({ statusCode: 403, message: 'Publication refusée.' })
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  assertSameOrigin(event)
  const { DB, PUBLISH_RATE_LIMITER } = cloudflareBindings(event)
  if (!DB) throw createError({ statusCode: 503, message: 'La publication est indisponible pour le moment.' })

  const body = await readBody<{ pokemonId?: unknown; shiny?: unknown; nickname?: unknown }>(event)
  const pokemonId = readPokemonId(body?.pokemonId)
  if (!pokemonId) throw createError({ statusCode: 400, message: 'Pokémon inconnu.' })
  const nicknameCheck = checkNickname(body?.nickname)
  if (!nicknameCheck.ok) throw createError({ statusCode: 400, message: nicknameCheck.error })

  const connectionKey = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? 'unknown'
  const isWithinRateLimit = PUBLISH_RATE_LIMITER
    ? (await PUBLISH_RATE_LIMITER.limit({ key: connectionKey })).success
    : true
  if (!isWithinRateLimit) throw createError({ statusCode: 429, message: 'Doucement ! Réessaie dans une minute.' })
  if ((await countRecentDrawsOfNickname(DB, nicknameCheck.nickname)) >= NICKNAME_HOURLY_LIMIT)
    throw createError({ statusCode: 429, message: 'Ce pseudo a déjà beaucoup publié, réessaie dans une heure.' })

  setResponseStatus(event, 201)
  return publishDraw(DB, { pokemonId, shiny: body?.shiny === true, nickname: nicknameCheck.nickname })
})
