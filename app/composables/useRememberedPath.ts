import type { LocationQuery } from 'vue-router'

type RememberedSection = 'home' | 'challenges' | 'pokedex'

interface RememberedPage {
  name: string
  query: LocationQuery
}

const SECTION_PAGES: Record<RememberedSection, readonly string[]> = {
  home: ['index'],
  challenges: ['duel', 'tournoi'],
  pokedex: ['pokedex', 'pokemon'],
}

const useRememberedPages = () =>
  useState<Record<RememberedSection, RememberedPage>>('remembered-pages', () => ({
    home: { name: 'index', query: {} },
    challenges: { name: 'duel', query: {} },
    pokedex: { name: 'pokedex', query: {} },
  }))

export const isSectionPage = (section: RememberedSection, pageName: string | undefined) =>
  !!pageName && SECTION_PAGES[section].includes(pageName)

export function useCurrentPageName() {
  const routeBaseName = useRouteBaseName()
  const route = useRoute()
  return computed(() => {
    const name = routeBaseName(route)
    return typeof name === 'string' ? name : undefined
  })
}

export function useRememberedPath(section: RememberedSection) {
  const rememberedPages = useRememberedPages()
  const localePath = useLocalePath()
  return computed(() =>
    localePath({ name: rememberedPages.value[section].name, query: rememberedPages.value[section].query }),
  )
}

export function rememberCurrentPath(section: RememberedSection) {
  const route = useRoute()
  const rememberedPages = useRememberedPages()
  const pageName = useCurrentPageName()
  // Updated after mount only, so the server and the first client render share the same header links.
  onMounted(() =>
    watch(
      () => route.fullPath,
      () => {
        if (isSectionPage(section, pageName.value))
          rememberedPages.value = { ...rememberedPages.value, [section]: { name: pageName.value!, query: route.query } }
      },
      { immediate: true },
    ),
  )
}
