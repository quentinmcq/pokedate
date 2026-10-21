// Google and Apple read their AI training opt-outs only from robots.txt; the training crawlers themselves are blocked
// one by one in Cloudflare AI Crawl Control, because blocking the whole category also blocks Googlebot.
const AI_TRAINING_TOKENS = ['Google-Extended', 'Applebot-Extended']

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  setResponseHeaders(event, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  })
  const trainingOptOuts = AI_TRAINING_TOKENS.map((token) => `User-agent: ${token}\nDisallow: /\n`).join('\n')
  return `User-agent: *
Content-Signal: search=yes, ai-train=no
Allow: /
Disallow: /api/

${trainingOptOuts}
Sitemap: ${new URL('/sitemap.xml', siteUrl).href}
`
})
