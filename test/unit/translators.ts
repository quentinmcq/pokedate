import en from '../../i18n/locales/en.json'
import fr from '../../i18n/locales/fr.json'
import { createTranslator, type Translate } from '../../shared/utils/messages'

// French texts use non-breaking spaces before punctuation; the tests compare plain wording.
const withPlainSpaces =
  (translate: Translate): Translate =>
  (key, params) =>
    translate(key, params).replace(/ /g, ' ')

export const translateFr = withPlainSpaces(createTranslator(fr))
export const translateEn = createTranslator(en)
