import type { PokemonTypes } from '#shared/types/pokemon'

const DEFAULT_ACCENT = { primary: '#ff4b3e', secondary: '#ff8a3d' }

export function usePageAccent() {
  const accent = useState('page-accent', () => DEFAULT_ACCENT)

  const applyTypes = ([primaryType, secondaryType = primaryType]: PokemonTypes) => {
    accent.value = { primary: typeColor(primaryType), secondary: typeColor(secondaryType) }
  }
  const resetAccent = () => (accent.value = DEFAULT_ACCENT)

  return { accent, applyTypes, resetAccent }
}
