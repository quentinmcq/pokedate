import type { Locale } from '../types/pokemon'

export const LOCALES: readonly Locale[] = ['fr', 'en']
export const DEFAULT_LOCALE: Locale = 'fr'

// French pages live at the root; English ones under /en, with translated paths where the French word shows.
export const ENGLISH_PAGE_PATHS = {
  tournoi: '/tournament',
  tirages: '/draws',
  'mentions-legales': '/legal-notice',
} as const

export const localePrefix = (locale: Locale) => (locale === DEFAULT_LOCALE ? '' : `/${locale}`)

export function localizedPagePath(frenchPath: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE) return frenchPath
  const englishPaths: Record<string, string> = ENGLISH_PAGE_PATHS
  const path = englishPaths[frenchPath.slice(1)] ?? frenchPath
  return path === '/' ? localePrefix(locale) : `${localePrefix(locale)}${path}`
}
