const RETURN_KEY = 'pokedate.pokebrawl-return'

const readReturn = () => {
  try {
    return sessionStorage.getItem(RETURN_KEY) === '1'
  } catch {
    return false
  }
}

const writeReturn = (returning: boolean) => {
  try {
    if (returning) sessionStorage.setItem(RETURN_KEY, '1')
    else sessionStorage.removeItem(RETURN_KEY)
  } catch {
    // Without storage, the way back only lasts for this page.
  }
}

/**
 * A player sent from PokéBrawl (`?from=pokebrawl`) to fetch their caught Pokémon keeps a way back on every page of
 * the visit, until they go back or close it.
 */
export function usePokeBrawlReturn() {
  const isReturning = useState('pokebrawl-return', () => false)
  const route = useRoute()

  onMounted(() => {
    if (route.query.from === 'pokebrawl') writeReturn(true)
    isReturning.value = readReturn()
  })

  function endReturn() {
    writeReturn(false)
    isReturning.value = false
  }

  return { isReturning, endReturn }
}

/** PokéBrawl's home page in the visitor's language. */
export function usePokeBrawlHome() {
  const { pokebrawlUrl } = useRuntimeConfig().public
  const { locale } = useLocaleTools()
  return computed(() => `${pokebrawlUrl}${locale.value === 'en' ? '/en/' : '/'}`)
}
