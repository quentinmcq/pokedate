const CLOUDFLARE_BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js'
const STATS_QUERY_KEY = 'stats'

export default defineNuxtPlugin((nuxtApp) => {
  const { cloudflareAnalyticsToken } = useRuntimeConfig().public
  const { t } = nuxtApp.$i18n
  const isCountedVisit = useIsCountedVisit()
  const router = useRouter()
  const { showToast } = useToast()

  function applyStatsPreference() {
    const preference = router.currentRoute.value.query[STATS_QUERY_KEY]
    if (preference !== 'off' && preference !== 'on') return
    setStatsOptOut(preference === 'off')
    showToast(preference === 'off' ? t('statsOptOut.optedOut') : t('statsOptOut.optedIn'))
    router.replace({ query: { ...router.currentRoute.value.query, [STATS_QUERY_KEY]: undefined } })
  }

  function loadBeacon() {
    if (!cloudflareAnalyticsToken || !isCountedVisit()) return
    const beacon = document.createElement('script')
    beacon.src = CLOUDFLARE_BEACON_URL
    beacon.defer = true
    beacon.dataset.cfBeacon = JSON.stringify({ token: cloudflareAnalyticsToken, spa: true })
    document.head.append(beacon)
  }

  nuxtApp.hook('app:suspense:resolve', () => {
    applyStatsPreference()
    loadBeacon()
  })
})
