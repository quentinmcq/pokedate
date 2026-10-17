export default defineNuxtPlugin((nuxtApp) => {
  const { loadDiscoveries } = usePokedex()

  nuxtApp.hook('app:suspense:resolve', loadDiscoveries)
})
