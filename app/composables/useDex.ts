// Pokédex perso : enregistré dans le navigateur (localStorage). On ne le lit qu'après
// l'hydratation (plugins/dex.client.ts ou premier catchPokemon) pour que le rendu
// serveur et le premier rendu client restent identiques.

const STORAGE_KEY = 'pokedate.dex'

/** numéro → { s: 1 si déjà vu en shiny } */
export type DexState = Record<number, { s: number }>

export function useDex() {
  const dex = useState<DexState>('dex', () => ({}))
  const loaded = useState('dex-loaded', () => false)
  const count = computed(() => Object.keys(dex.value).length)
  const shinyCount = computed(() => Object.values(dex.value).filter((x) => x.s).length)

  function ensureLoaded() {
    if (loaded.value || import.meta.server) return
    loaded.value = true
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      if (saved && typeof saved === 'object') dex.value = { ...saved, ...dex.value }
    } catch {}
  }

  /** Enregistre un Pokémon ; renvoie true si c'est une nouvelle découverte */
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
