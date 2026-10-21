// Safari erases the data of a site left unvisited for seven days, and other browsers may clear it when space runs
// low: once there is a Pokédex to lose, the browser is asked to keep this site's data.
async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist || (await navigator.storage.persisted())) return
    await navigator.storage.persist()
  } catch {}
}

export default defineNuxtPlugin((nuxtApp) => {
  const { caughtCount } = usePokedex()

  nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
    watch(
      () => caughtCount.value > 0,
      (hasPokedex) => hasPokedex && requestPersistentStorage(),
      { immediate: true },
    )
  })
})
