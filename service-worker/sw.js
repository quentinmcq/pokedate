/* global self, caches, fetch, URL, Response, BUILD_ID, PRECACHED_ASSETS */
// The build prepends `const BUILD_ID` and `const PRECACHED_ASSETS` (see the 'compiled' hook in nuxt.config.ts).

const CACHE_PREFIX = 'pokedate-'
const SHELL_CACHE = `${CACHE_PREFIX}shell-${BUILD_ID}`
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-v1`
// Workers static assets serve offline.html at /offline and redirect the .html address.
const OFFLINE_PAGE = '/offline'
const SHELL_URLS = [
  '/',
  OFFLINE_PAGE,
  '/api/pokedex',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  ...PRECACHED_ASSETS,
]

const LIVE_PATHS = ['/api/draws', '/api/activity', '/api/events', '/og/', '/_nuxt/builds/']
const IMMUTABLE_PATHS = ['/_nuxt/', '/sprites/', '/cries/', '/icons/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function putInRuntimeCache(request, response) {
  // Audio range requests answer 206, which the Cache API refuses.
  if (response.status !== 200) return
  const cache = await caches.open(RUNTIME_CACHE)
  await cache.put(request, response)
}

async function networkFirst(event, fallback) {
  try {
    const response = await fetch(event.request)
    event.waitUntil(putInRuntimeCache(event.request, response.clone()))
    return response
  } catch (error) {
    const cached = await caches.match(event.request)
    if (cached) return cached
    if (fallback) return (await caches.match(fallback)) ?? Response.error()
    throw error
  }
}

async function cacheFirst(event) {
  const cached = await caches.match(event.request)
  if (cached) return cached
  const response = await fetch(event.request)
  event.waitUntil(putInRuntimeCache(event.request, response.clone()))
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (LIVE_PATHS.some((path) => url.pathname.startsWith(path))) return

  if (request.mode === 'navigate') return event.respondWith(networkFirst(event, OFFLINE_PAGE))
  if (IMMUTABLE_PATHS.some((path) => url.pathname.startsWith(path))) return event.respondWith(cacheFirst(event))
  if (url.pathname.startsWith('/api/')) return event.respondWith(networkFirst(event))
})
