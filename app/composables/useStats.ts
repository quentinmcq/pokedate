import type { TrackedEvent } from '#shared/utils/trackedEvents'

const STATS_OPT_OUT_KEY = 'pokedate.stats-off'

export function isStatsOptedOut() {
  try {
    return localStorage.getItem(STATS_OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function setStatsOptOut(isOptedOut: boolean) {
  try {
    if (isOptedOut) localStorage.setItem(STATS_OPT_OUT_KEY, '1')
    else localStorage.removeItem(STATS_OPT_OUT_KEY)
  } catch {}
}

export function useIsCountedVisit() {
  const { siteUrl } = useRuntimeConfig().public
  return () => import.meta.client && location.host === new URL(siteUrl).host && !isStatsOptedOut()
}

export function useTrackEvent() {
  const isCountedVisit = useIsCountedVisit()
  return (name: TrackedEvent) => {
    if (!isCountedVisit()) return
    navigator.sendBeacon?.('/api/events', new Blob([JSON.stringify({ name })], { type: 'application/json' }))
  }
}
