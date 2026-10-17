const STORAGE_KEY = 'pokedate.dex'

export type DexState = Record<number, { s: number }>

export function sanitizeDex(raw: unknown): DexState {
  const out: DexState = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key)
    if (!Number.isInteger(id) || id < 1 || id > MAX_POKEMON) continue
    out[id] = { s: (value as { s?: unknown } | null)?.s === 1 ? 1 : 0 }
  }
  return out
}

export function useDex() {
  const dex = useState<DexState>('dex', () => ({}))
  const loaded = useState('dex-loaded', () => false)
  const count = computed(() => Object.keys(dex.value).length)
  const shinyCount = computed(() => Object.values(dex.value).filter((x) => x.s).length)

  function ensureLoaded() {
    if (loaded.value || import.meta.server) return
    loaded.value = true
    try {
      dex.value = { ...sanitizeDex(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')), ...dex.value }
    } catch {}
  }

  function catchPokemon(id: number, shiny = false) {
    ensureLoaded()
    const isNew = !dex.value[id]
    dex.value = { ...dex.value, [id]: { s: (dex.value[id]?.s ?? 0) | (shiny ? 1 : 0) } }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dex.value))
    } catch {}
    return isNew
  }

  return { dex, count, shinyCount, catchPokemon, ensureLoaded }
}
