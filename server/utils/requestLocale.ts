import type { H3Event } from 'h3'
import type { Locale } from '#shared/types/pokemon'

export const requestLocale = (event: H3Event): Locale => (getQuery(event).lang === 'en' ? 'en' : 'fr')
