export default defineNuxtPlugin((nuxtApp) => {
  const { loadDiscoveries } = usePokedex()
  // Once every async page has hydrated (later than app:mounted), so server and client markup match.
  nuxtApp.hook('app:suspense:resolve', loadDiscoveries)
})
