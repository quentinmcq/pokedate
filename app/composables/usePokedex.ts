const STORAGE_KEY = 'pokedate.dex'

export interface Discovery {
  shiny: boolean
}

export type Discoveries = Record<number, Discovery>

const isShinyFlag = (value: unknown) => {
  if (!value || typeof value !== 'object') return false
  const flags = value as { shiny?: unknown; s?: unknown }
  return flags.shiny === true || flags.s === 1
}

export function sanitizeDiscoveries(stored: unknown): Discoveries {
  const discoveries: Discoveries = {}
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return discoveries
  for (const [key, value] of Object.entries(stored)) {
    const id = Number(key)
    if (Number.isInteger(id) && id >= 1 && id <= POKEMON_COUNT) discoveries[id] = { shiny: isShinyFlag(value) }
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
  const discoveredCount = computed(() => Object.keys(discoveries.value).length)
  const shinyCount = computed(() => Object.values(discoveries.value).filter((discovery) => discovery.shiny).length)

  function loadDiscoveries() {
    if (isLoaded.value || import.meta.server) return
    isLoaded.value = true
    discoveries.value = { ...readStoredDiscoveries(), ...discoveries.value }
  }

  function recordDiscovery(id: number, { shiny = false } = {}) {
    loadDiscoveries()
    const isNew = !discoveries.value[id]
    const wasShiny = discoveries.value[id]?.shiny ?? false
    discoveries.value = { ...discoveries.value, [id]: { shiny: wasShiny || shiny } }
    writeStoredDiscoveries(discoveries.value)
    return isNew
  }

  return { discoveries, discoveredCount, shinyCount, loadDiscoveries, recordDiscovery }
}
