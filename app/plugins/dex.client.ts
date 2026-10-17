export default defineNuxtPlugin((nuxtApp) => {
  const { ensureLoaded } = useDex()
  nuxtApp.hook('app:mounted', ensureLoaded)
})
