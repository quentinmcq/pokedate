import type { PokedexEntry } from '#shared/types/pokemon'
import type { GoalProgress } from '#shared/utils/pokedexGoals'

const CELEBRATED_STORAGE_KEY = 'pokedate.celebrated-goals'
// Leaves time for the revealed card to finish its own animation.
const CELEBRATION_DELAY_MS = 2600

export function goalTexts(t: Translate) {
  const paramsOf = (goal: GoalProgress) => ({
    ...goal.params,
    ...(goal.params?.region ? { region: t(`regions.${goal.params.region}`) } : {}),
    target: goal.target,
  })
  return {
    goalTitle: (goal: GoalProgress) => t(`goals.${goal.key}.title`, paramsOf(goal)),
    goalDescription: (goal: GoalProgress) => t(`goals.${goal.key}.description`, paramsOf(goal)),
  }
}

export const useGoalTexts = () => goalTexts(useLocaleTools().translate)

export function usePokedexGoals(entries: MaybeRefOrGetter<readonly PokedexEntry[] | null | undefined>) {
  const { discoveries } = usePokedex()
  const caught = computed(() =>
    Object.entries(discoveries.value)
      .filter(([, discovery]) => discovery.caught)
      .map(([id, discovery]) => ({ id: Number(id), shiny: discovery.shiny })),
  )
  const goals = computed(() => pokedexGoals(caught.value, toValue(entries) ?? []))
  const doneCount = computed(() => goals.value.filter((goal) => goal.done).length)
  return { goals, doneCount, hasCaught: computed(() => caught.value.length > 0) }
}

function readCelebrated(): Set<string> | null {
  try {
    const stored = localStorage.getItem(CELEBRATED_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored) as string[]) : null
  } catch {
    return null
  }
}

function writeCelebrated(ids: Set<string>) {
  try {
    localStorage.setItem(CELEBRATED_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {}
}

// Celebrates each goal once, wherever the Pokémon that completes it was caught.
// Runs from a plugin, outside any component: it reads the i18n instance instead of useI18n().
export function useGoalCelebrations() {
  const { $i18n } = useNuxtApp()
  const t: Translate = (key, params) => $i18n.t(key, params ?? {})
  const { showToast } = useToast()
  const { goalTitle } = goalTexts(t)
  const { isLoaded } = usePokedex()
  const entries = shallowRef<PokedexEntry[] | null>(null)
  const { goals, hasCaught } = usePokedexGoals(entries)

  async function loadEntries() {
    if (entries.value) return
    entries.value = await $fetch<PokedexEntry[]>('/api/pokedex', { query: { lang: $i18n.locale.value } }).catch(
      () => null,
    )
  }

  function celebrate(reachedGoals: GoalProgress[]) {
    const [firstGoal] = reachedGoals
    if (!firstGoal) return
    setTimeout(() => {
      showToast(
        reachedGoals.length === 1
          ? t('goals.reachedOne', { title: goalTitle(firstGoal) })
          : t('goals.reachedMany', { count: reachedGoals.length }),
      )
      launchConfetti(['#ffd23f', '#fff3b0', '#ffffff'])
    }, CELEBRATION_DELAY_MS)
  }

  function celebrateNewGoals(currentGoals: GoalProgress[]) {
    const known = readCelebrated() ?? new Set<string>()
    const reached = currentGoals.filter((goal) => goal.done && !known.has(goalId(goal)))
    if (!reached.length) return
    reached.forEach((goal) => known.add(goalId(goal)))
    writeCelebrated(known)
    celebrate(reached)
  }

  let isWatching = false
  watch(
    isLoaded,
    async (loaded) => {
      if (!loaded || isWatching) return
      isWatching = true
      if (hasCaught.value) await loadEntries()
      // A Pokédex filled before goals existed has nothing to celebrate: its goals are recorded silently.
      if (!readCelebrated()) writeCelebrated(new Set(goals.value.filter((goal) => goal.done).map(goalId)))
      watch(hasCaught, (caughtSomething) => caughtSomething && loadEntries())
      watch(goals, celebrateNewGoals)
    },
    { immediate: true },
  )
}
