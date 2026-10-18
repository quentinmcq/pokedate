interface ShareOptions {
  text: string
  url: string
  copiedMessage?: string
}

export function useShareLink() {
  const { showToast } = useToast()
  const trackEvent = useTrackEvent()
  const { t } = useLocaleTools()

  return async ({ text, url, copiedMessage = t('common.linkCopied') }: ShareOptions) => {
    trackEvent('share')
    if (navigator.share) {
      await navigator.share({ title: 'PokéDate', text, url }).catch(() => {})
      return
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      showToast(copiedMessage)
    } catch {
      prompt(t('common.copyPrompt'), url)
    }
  }
}
