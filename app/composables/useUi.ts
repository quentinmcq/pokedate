import type { TypeKey } from '#shared/types/pokemon'

const DEFAULT_ACCENT: [string, string] = ['#ff4b3e', '#ff8a3d']

export function useAccent() {
  const accent = useState<[string, string]>('accent', () => DEFAULT_ACCENT)
  const setAccent = (types: TypeKey[]) => {
    accent.value = [typeColor(types[0]!), typeColor(types[1] ?? types[0]!)]
  }
  const resetAccent = () => (accent.value = DEFAULT_ACCENT)
  return { accent, setAccent, resetAccent }
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export function useToast() {
  const toast = useState('toast', () => ({ msg: '', visible: false }))
  const show = (msg: string) => {
    toast.value = { msg, visible: true }
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = { ...toast.value, visible: false }), 2600)
  }
  return { toast, show }
}

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
