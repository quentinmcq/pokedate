export default defineNuxtPlugin((nuxtApp) => {
  const { loadDiscoveries } = usePokedex()
  // After hydration, so the server render and the first client render stay identical.
  nuxtApp.hook('app:mounted', loadDiscoveries)
})
