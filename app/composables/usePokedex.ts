const STORAGE_KEY = 'pokedate.dex'

export interface Discovery {
  caught: boolean
  shiny: boolean
}

export type Discoveries = Record<number, Discovery>

export type DiscoveryState = 'caught' | 'seen' | 'unknown'

const isShinyFlag = (value: unknown) => {
  if (!value || typeof value !== 'object') return false
  const flags = value as { shiny?: unknown; s?: unknown }
  return flags.shiny === true || flags.s === 1
}

const isCaughtFlag = (value: unknown) =>
  !value || typeof value !== 'object' || (value as { caught?: unknown }).caught !== false

export function sanitizeDiscoveries(stored: unknown): Discoveries {
  const discoveries: Discoveries = {}
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return discoveries
  for (const [key, value] of Object.entries(stored)) {
    const id = Number(key)
    if (!Number.isInteger(id) || id < 1 || id > POKEMON_COUNT) continue
    const caught = isCaughtFlag(value)
    discoveries[id] = { caught, shiny: caught && isShinyFlag(value) }
  }
  return discoveries
}

function readStoredDiscoveries(): Discoveries {
  try {
    return sanitizeDiscoveries(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
  } catch {
    return {}
  }
}

function writeStoredDiscoveries(discoveries: Discoveries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(discoveries))
  } catch {}
}

export function usePokedex() {
  const discoveries = useState<Discoveries>('pokedex-discoveries', () => ({}))
  const isLoaded = useState('pokedex-loaded', () => false)
  const seenCount = computed(() => Object.keys(discoveries.value).length)
  const caughtCount = computed(() => Object.values(discoveries.value).filter((discovery) => discovery.caught).length)
  const shinyCount = computed(() => Object.values(discoveries.value).filter((discovery) => discovery.shiny).length)

  function discoveryStateOf(id: number): DiscoveryState {
    const discovery = discoveries.value[id]
    if (!discovery) return 'unknown'
    return discovery.caught ? 'caught' : 'seen'
  }

  function loadDiscoveries() {
    if (isLoaded.value || import.meta.server) return
    isLoaded.value = true
    discoveries.value = { ...readStoredDiscoveries(), ...discoveries.value }
  }

  function recordDiscovery(id: number, { caught = false, shiny = false } = {}) {
    loadDiscoveries()
    const previous = discoveries.value[id]
    const isNew = caught ? !previous?.caught : !previous
    const isCaught = caught || (previous?.caught ?? false)
    discoveries.value = {
      ...discoveries.value,
      [id]: { caught: isCaught, shiny: (previous?.shiny ?? false) || (caught && shiny) },
    }
    writeStoredDiscoveries(discoveries.value)
    return isNew
  }

  return {
    discoveries,
    seenCount,
    caughtCount,
    shinyCount,
    isLoaded,
    discoveryStateOf,
    loadDiscoveries,
    recordDiscovery,
  }
}
