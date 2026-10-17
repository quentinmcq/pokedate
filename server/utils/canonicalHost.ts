const HOSTS_REDIRECTED_TO_SITE = new Set(['www.pokedate.fr', 'pokedate.quentin-macq.workers.dev'])

export function canonicalRedirectUrl(requestUrl: URL, siteUrl: string) {
  if (!HOSTS_REDIRECTED_TO_SITE.has(requestUrl.host)) return null
  return new URL(requestUrl.pathname + requestUrl.search, siteUrl).href
}
