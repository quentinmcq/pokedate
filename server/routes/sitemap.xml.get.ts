export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const absoluteUrl = (path: string) => new URL(path, siteUrl).href

  const pages = [
    { url: absoluteUrl('/'), priority: '1.0' },
    { url: absoluteUrl('/pokemon'), priority: '0.8' },
    { url: absoluteUrl('/duel'), priority: '0.6' },
    { url: absoluteUrl('/mentions-legales'), priority: '0.2' },
    ...listPokedexEntries().map((entry) => ({ url: absoluteUrl(pokemonPath(entry)), priority: '0.7' })),
  ]

  setResponseHeaders(event, {
    'content-type': 'application/xml; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url><loc>${page.url}</loc><priority>${page.priority}</priority></url>`).join('\n')}
</urlset>
`
})
