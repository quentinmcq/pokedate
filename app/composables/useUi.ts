import type { TypeKey } from '#shared/types/pokemon'

const DEFAULT_ACCENT: [string, string] = ['#ff4b3e', '#ff8a3d']

/** Couleurs d'ambiance de la page, prises sur les types du Pokémon affiché */
export function useAccent() {
  const accent = useState<[string, string]>('accent', () => DEFAULT_ACCENT)
  const setAccent = (types: TypeKey[]) => {
    accent.value = [typeColor(types[0]!), typeColor(types[1] ?? types[0]!)]
  }
  const resetAccent = () => (accent.value = DEFAULT_ACCENT)
  return { accent, setAccent, resetAccent }
}

let toastTimer: ReturnType<typeof setTimeout> | undefined // uniquement côté navigateur

export function useToast() {
  const toast = useState('toast', () => ({ msg: '', visible: false }))
  const show = (msg: string) => {
    toast.value = { msg, visible: true }
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = { ...toast.value, visible: false }), 2600)
  }
  return { toast, show }
}

/** Partage natif sur mobile, sinon copie du lien */
export function useShare() {
  const { show } = useToast()
  return async (text: string, url: string, copiedMsg = 'Lien copié, envoie-le à tes potes 📋') => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PokéDate', text, url })
      } catch {}
      return
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      show(copiedMsg)
    } catch {
      prompt('Copie ce lien :', url)
    }
  }
}

/** URL absolue d'une page du site, pour les liens à partager */
export function useAbsoluteUrl() {
  const reqUrl = useRequestURL()
  return (path: string, query: Record<string, string> = {}) => {
    const u = new URL(path, reqUrl.origin)
    for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v)
    return u.href
  }
}
