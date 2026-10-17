interface ShareOptions {
  text: string
  url: string
  copiedMessage?: string
}

export function useShareLink() {
  const { showToast } = useToast()
  const trackEvent = useTrackEvent()

  return async ({ text, url, copiedMessage = 'Lien copié, envoie-le à tes potes' }: ShareOptions) => {
    trackEvent('share')
    if (navigator.share) {
      await navigator.share({ title: 'PokéDate', text, url }).catch(() => {})
      return
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      showToast(copiedMessage)
    } catch {
      prompt('Copie ce lien :', url)
    }
  }
}
