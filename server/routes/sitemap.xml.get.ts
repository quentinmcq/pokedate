import type { Locale } from '#shared/types/pokemon'

interface SitemapPage {
  paths: Record<Locale, string>
  priority: string
}

const staticPage = (frenchPath: string, priority: string): SitemapPage => ({
  paths: { fr: localizedPagePath(frenchPath, 'fr'), en: localizedPagePath(frenchPath, 'en') },
  priority,
})

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const absoluteUrl = (path: string) => new URL(path, siteUrl).href
  const englishEntries = listPokedexEntries('en')

  const pages: SitemapPage[] = [
    staticPage('/', '1.0'),
    staticPage('/pokemon', '0.8'),
    staticPage('/duel', '0.6'),
    staticPage('/tournoi', '0.6'),
    staticPage('/mentions-legales', '0.2'),
    ...listPokedexEntries('fr').map((entry, index) => ({
      paths: { fr: pokemonPath(entry), en: `${localePrefix('en')}${pokemonPath(englishEntries[index]!)}` },
      priority: '0.7',
    })),
  ]

  const alternates = (page: SitemapPage) =>
    [
      ...LOCALES.map(
        (locale) => `<xhtml:link rel="alternate" hreflang="${locale}" href="${absoluteUrl(page.paths[locale])}"/>`,
      ),
      `<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(page.paths[DEFAULT_LOCALE])}"/>`,
    ].join('')

  setResponseHeaders(event, {
    'content-type': 'application/xml; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages
  .flatMap((page) =>
    LOCALES.map(
      (locale) =>
        `  <url><loc>${absoluteUrl(page.paths[locale])}</loc>${alternates(page)}<priority>${page.priority}</priority></url>`,
    ),
  )
  .join('\n')}
</urlset>
`
})
