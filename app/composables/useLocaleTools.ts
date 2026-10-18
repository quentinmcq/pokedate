import type { Locale } from '#shared/types/pokemon'

export function useLocaleTools() {
  const { t, locale } = useI18n()
  const currentLocale = computed(() => locale.value as Locale)
  const translate: Translate = (key, params) => t(key, params ?? {})
  const formatLocalNumber = (value: number, maxDecimals?: number) =>
    formatNumber(value, currentLocale.value, maxDecimals)
  return { t, locale: currentLocale, translate, formatLocalNumber }
}
