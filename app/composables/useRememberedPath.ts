type RememberedSection = 'home' | 'challenges' | 'pokedex'

const SECTION_PATHS: Record<RememberedSection, readonly string[]> = {
  home: ['/'],
  challenges: ['/duel', '/tournoi'],
  pokedex: ['/pokedex', '/pokemon'],
}

const useRememberedPaths = () =>
  useState<Record<RememberedSection, string>>('remembered-paths', () => ({
    home: '/',
    challenges: '/duel',
    pokedex: '/pokedex',
  }))

export const isSectionPath = (section: RememberedSection, path: string) => SECTION_PATHS[section].includes(path)

export function useRememberedPath(section: RememberedSection) {
  const rememberedPaths = useRememberedPaths()
  return computed(() => rememberedPaths.value[section])
}

export function rememberCurrentPath(section: RememberedSection) {
  const route = useRoute()
  const rememberedPaths = useRememberedPaths()
  // Updated after mount only, so the server and the first client render share the same header links.
  onMounted(() =>
    watch(
      () => route.fullPath,
      (fullPath) => {
        if (isSectionPath(section, route.path))
          rememberedPaths.value = { ...rememberedPaths.value, [section]: fullPath }
      },
      { immediate: true },
    ),
  )
}
