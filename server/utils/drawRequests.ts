import type { H3Event } from 'h3'
import type { D1Database, PokedateBindings } from './cloudflareBindings'

type RateLimiter = NonNullable<PokedateBindings['PUBLISH_RATE_LIMITER']>

export function requireDrawsDatabase(event: H3Event) {
  setResponseHeader(event, 'cache-control', 'no-store')
  assertSameOrigin(event)
  const { DB } = cloudflareBindings(event)
  if (!DB) throw createError({ statusCode: 503, message: 'Les tirages sont indisponibles pour le moment.' })
  return DB
}

export async function assertWithinRateLimit(event: H3Event, limiter: RateLimiter | undefined) {
  if (!limiter) return
  const connectionKey = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? 'unknown'
  if (!(await limiter.limit({ key: connectionKey })).success)
    throw createError({ statusCode: 429, message: 'Doucement ! Réessaie dans une minute.' })
}

export async function readAllowedNickname(db: D1Database, value: unknown) {
  const nicknameCheck = checkNickname(value)
  if (!nicknameCheck.ok) throw createError({ statusCode: 400, message: nicknameCheck.error })
  const { nickname } = nicknameCheck
  if (nickname !== ANONYMOUS_NICKNAME && (await countRecentDrawsOfNickname(db, nickname)) >= NICKNAME_HOURLY_LIMIT)
    throw createError({ statusCode: 429, message: 'Ce pseudo a déjà beaucoup publié, réessaie dans une heure.' })
  return nickname
}

export function readEditRequest(event: H3Event, body: { editToken?: unknown } | undefined) {
  const drawId = Number(getRouterParam(event, 'id'))
  const editToken = body?.editToken
  if (!Number.isInteger(drawId) || drawId < 1 || !isEditToken(editToken))
    throw createError({ statusCode: 400, message: 'Tirage inconnu.' })
  return { drawId, editToken }
}
