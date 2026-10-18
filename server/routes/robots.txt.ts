export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  setResponseHeaders(event, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  })
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${new URL('/sitemap.xml', siteUrl).href}
`
})
