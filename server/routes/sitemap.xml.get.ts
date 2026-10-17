// Plan du site pour les moteurs de recherche : pages fixes + une fiche par Pokémon
export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const url = (path: string) => new URL(path, siteUrl).href

  const pages = [
    { loc: url('/'), priority: '1.0' },
    { loc: url('/pokemon'), priority: '0.8' },
    { loc: url('/duel'), priority: '0.6' },
    ...getDexList().map((p) => ({ loc: url(pokemonPath(p)), priority: '0.7' })),
  ]

  setResponseHeaders(event, {
    'content-type': 'application/xml; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${p.loc}</loc><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`
})
