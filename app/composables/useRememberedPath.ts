type RememberedSection = '/' | '/duel'

const useRememberedPaths = () =>
  useState<Record<RememberedSection, string>>('remembered-paths', () => ({ '/': '/', '/duel': '/duel' }))

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
        if (route.path === section) rememberedPaths.value = { ...rememberedPaths.value, [section]: fullPath }
      },
      { immediate: true },
    ),
  )
}
