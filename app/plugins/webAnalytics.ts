const CLOUDFLARE_BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js'

export default defineNuxtPlugin(() => {
  const { cloudflareAnalyticsToken, siteUrl } = useRuntimeConfig().public
  const isProductionSite = useRequestURL().host === new URL(siteUrl).host
  if (!cloudflareAnalyticsToken || !isProductionSite) return

  useHead({
    script: [
      {
        key: 'cloudflare-web-analytics',
        src: CLOUDFLARE_BEACON_URL,
        defer: true,
        'data-cf-beacon': JSON.stringify({ token: cloudflareAnalyticsToken, spa: true }),
      },
    ],
  })
})
