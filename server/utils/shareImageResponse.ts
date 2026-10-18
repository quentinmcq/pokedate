import type { H3Event } from 'h3'
import type { ShareImageComposition } from './shareImageComposer'

const ONE_WEEK = 60 * 60 * 24 * 7

interface EdgeCache {
  match: (request: Request) => Promise<Response | undefined>
  put: (request: Request, response: Response) => Promise<void>
}

function redirectToFallback(event: H3Event, fallbackPath: string) {
  setResponseHeader(event, 'cache-control', 'no-store')
  return sendRedirect(event, fallbackPath, 302)
}

const edgeCache = () => (globalThis as { caches?: { default?: EdgeCache } }).caches?.default

// Composing an image costs one of the free plan's monthly transformations: each result is kept in the
// edge cache, and a refused or failed composition (rate limit, quota reached) falls back to the winner's
// static image.
export async function sendShareImage(event: H3Event, composition: ShareImageComposition, fallbackPath: string) {
  const { IMAGES, ASSETS, SHARE_IMAGE_RATE_LIMITER } = cloudflareBindings(event)
  if (!IMAGES || !ASSETS) return redirectToFallback(event, fallbackPath)

  const requestUrl = getRequestURL(event)
  const cacheKey = new Request(requestUrl.href)
  const cache = edgeCache()
  const cached = await cache?.match(cacheKey)
  if (cached) return cached

  const connectionKey = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event) ?? 'unknown'
  const isWithinRateLimit = SHARE_IMAGE_RATE_LIMITER
    ? (await SHARE_IMAGE_RATE_LIMITER.limit({ key: connectionKey })).success
    : true
  if (!isWithinRateLimit) return redirectToFallback(event, fallbackPath)

  try {
    const loadAsset = async (path: string) => {
      const response = await ASSETS.fetch(new URL(path, requestUrl))
      if (!response.ok || !response.body) throw new Error(`Asset ${path} : ${response.status}`)
      return response.body
    }
    const fontUrl = new URL(SHARE_FONT_PATH, requestUrl).href
    const rendered = await renderShareImage({ images: IMAGES, loadAsset, fontUrl }, composition)
    const response = new Response(rendered.body, {
      headers: { 'content-type': 'image/jpeg', 'cache-control': `public, max-age=${ONE_WEEK}` },
    })
    if (cache) event.waitUntil(cache.put(cacheKey, response.clone()))
    return response
  } catch (error) {
    console.error('Image de partage indisponible', requestUrl.pathname, error)
    return redirectToFallback(event, fallbackPath)
  }
}
