export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  nuxtApp.hook('app:suspense:resolve', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Mode hors ligne indisponible', error))
  })
})
