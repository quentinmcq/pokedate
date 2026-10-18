import type { Locale } from '#shared/types/pokemon'
import en from '../../i18n/locales/en.json'
import fr from '../../i18n/locales/fr.json'

const TRANSLATORS = { fr: createTranslator(fr), en: createTranslator(en) }

export const translatorFor = (locale: Locale) => TRANSLATORS[locale]
