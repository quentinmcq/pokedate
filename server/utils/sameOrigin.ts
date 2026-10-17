import type { H3Event } from 'h3'

export function assertSameOrigin(event: H3Event) {
  const origin = getRequestHeader(event, 'origin')
  if (origin && new URL(origin).host !== getRequestHost(event, { xForwardedHost: true }))
    throw createError({ statusCode: 403, message: 'Requête refusée.' })
}
