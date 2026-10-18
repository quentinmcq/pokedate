export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:suspense:resolve', () => nuxtApp.runWithContext(useGoalCelebrations))
})
