<script setup lang="ts">
import type { CalendarDate, DateFieldValue } from '#shared/types/pokemon'
import type { DateFieldKey } from '#shared/utils/date'
import type { Message } from '#shared/utils/messages'

const route = useRoute()
const router = useRouter()
const { resetAccent } = usePageAccent()
const absoluteUrl = useAbsoluteUrl()
const { portfolioUrl } = useRuntimeConfig().public
const { recordDiscovery } = usePokedex()
const trackEvent = useTrackEvent()
const { t, locale } = useLocaleTools()
const localePath = useLocalePath()
rememberCurrentPath('home')

const RANDOM_DATE_START = new Date(1950, 0, 1).getTime()

const dateInput = ref<DateFieldValue>(emptyDateFieldValue())
const formError = ref<Message | null>(null)
const invalidDatePart = ref<DateFieldKey | null>(null)
const dateField = useTemplateRef('dateField')
const revealCount = ref(0)
const resultSection = useTemplateRef<HTMLElement>('resultSection')
const scrollToResult = useScrollToResult(resultSection)

const DATE_FIELD_NAMES = { day: 'jour', month: 'mois', year: 'annee' } as const

const submittedWithoutJavaScript = parseDateFieldValue({
  day: String(route.query[DATE_FIELD_NAMES.day] ?? ''),
  month: String(route.query[DATE_FIELD_NAMES.month] ?? ''),
  year: String(route.query[DATE_FIELD_NAMES.year] ?? ''),
})

if (submittedWithoutJavaScript.ok)
  await navigateTo({ query: { date: toIsoDate(submittedWithoutJavaScript.date) } }, { replace: true })

const selectedDate = computed(() => parseIsoDate(route.query.date))
const isRandomDraw = computed(() => route.query.hasard === '1')
// Today's Pokémon is the same for everyone: it would only fill the shared draws with duplicates.
const isTodaysDate = computed(
  () => !!selectedDate.value && toIsoDate(selectedDate.value) === toIsoDate(todayInParis.value),
)
watch(selectedDate, (date) => date && (dateInput.value = toDateFieldValue(date)), { immediate: true })

const pokemonId = computed(() => (selectedDate.value ? pokemonIdFromDate(selectedDate.value) : null))
const isShiny = computed(() => !!selectedDate.value && isShinyDate(selectedDate.value))
const mirrorPokemonId = computed(() => (selectedDate.value ? mirrorPokemonIdForDate(selectedDate.value) : null))

const todayInParis = useState('today-in-paris', () => todayInTimeZone('Europe/Paris'))
const isTodayShiny = computed(() => isShinyDate(todayInParis.value))

const [
  { data: pokemon, error: pokemonError, refresh: retryPokemon },
  { data: mirrorPokemon },
  { data: pokemonOfTheDay },
] = await Promise.all([
  usePokemonDetail(pokemonId),
  usePokemonDetail(mirrorPokemonId),
  usePokemonDetail(() => pokemonIdFromDate(todayInParis.value)),
])

const pokemonOfTheDayLink = computed(() =>
  pokemonOfTheDay.value
    ? `${pokemonPath(pokemonOfTheDay.value)}${isTodayShiny.value ? '?shiny=1' : ''}`
    : localePath('/'),
)
const formattedToday = computed(() => {
  const { day, month, year } = todayInParis.value
  return `${padNumber(day)}/${padNumber(month)}/${year}`
})

const isNewDiscovery = ref(false)

// Only a reveal made on this page, or a date link just opened, plays the animation: coming back from another tab
// shows the card as it was left.
const isOpeningPage = import.meta.server || useNuxtApp().isHydrating
const playsRevealAnimation = computed(() => isOpeningPage || revealCount.value > 0)

// Recorded from the date itself, so leaving before the Pokémon details arrive still fills the Pokédex.
function recordRevealedDate() {
  const date = selectedDate.value
  if (!date) return
  const caught = !isRandomDraw.value
  isNewDiscovery.value = recordDiscovery(pokemonIdFromDate(date), { caught, shiny: isShinyDate(date) })
  const mirrorId = mirrorPokemonIdForDate(date)
  if (mirrorId) recordDiscovery(mirrorId, { caught })
}
onMounted(() => watch([() => route.fullPath, revealCount], recordRevealedDate, { immediate: true }))
watchEffect(() => !pokemon.value && resetAccent())

async function revealPokemonFor(date: CalendarDate, { isRandom = false } = {}) {
  formError.value = null
  invalidDatePart.value = null
  revealCount.value++
  trackEvent(isRandom ? 'random' : 'reveal', { pokemonId: pokemonIdFromDate(date), shiny: isShinyDate(date) })
  await router.push({ query: { date: toIsoDate(date), ...(isRandom ? { hasard: '1' } : {}) } })
  await scrollToResult()
}

function submitDate() {
  const parsed = parseDateFieldValue(dateInput.value)
  if (parsed.ok) return revealPokemonFor(parsed.date)
  formError.value = parsed.error
  invalidDatePart.value = parsed.invalidPart
  dateField.value?.focusInvalidPart(parsed.invalidPart)
}

const revealToday = () => revealPokemonFor(todayAsCalendarDate())

const revealRandomDate = () =>
  revealPokemonFor(
    todayAsCalendarDate(new Date(RANDOM_DATE_START + Math.random() * (Date.now() - RANDOM_DATE_START))),
    {
      isRandom: true,
    },
  )

const revealedPokemon = computed(() => (selectedDate.value ? pokemon.value : null))

usePageSeo({
  title: () => (revealedPokemon.value ? `${revealedPokemon.value.name} #${revealedPokemon.value.id}` : undefined),
  description: () => t('home.seoDescription'),
  shareImagePath: () => (revealedPokemon.value ? shareImagePath(revealedPokemon.value.id, locale.value) : undefined),
  shareImageAlt: () => revealedPokemon.value?.name,
  noindex: () => !!route.query.date,
  structuredData: () => [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PokéDate',
      url: absoluteUrl(localePath('/')),
      inLanguage: LOCALE_TAGS[locale.value],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PokéDate',
      url: absoluteUrl(localePath('/')),
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: t('home.anyOperatingSystem'),
      inLanguage: LOCALE_TAGS[locale.value],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      author: { '@type': 'Person', name: 'Quentin Macq', url: portfolioUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQ_KEYS.map((key) => ({
        '@type': 'Question',
        name: t(`faq.${key}.question`),
        acceptedAnswer: { '@type': 'Answer', text: t(`faq.${key}.answer`) },
      })),
    },
  ],
})
</script>

<template>
  <div>
    <form
      class="hero"
      :action="localePath('/')"
      method="get"
      autocomplete="off"
      novalidate
      @submit.prevent="submitDate"
    >
      <h1>{{ t('home.titleStart') }}<br />{{ t('home.titleEnd') }}</h1>
      <i18n-t keypath="home.lead" tag="p" class="lead" scope="global">
        <template #day
          ><b>{{ t('home.leadDay') }}</b></template
        >
        <template #month
          ><b>{{ t('home.leadMonth') }}</b></template
        >
        <template #year
          ><b>{{ t('home.leadYear') }}</b></template
        >
      </i18n-t>
      <DateField
        ref="dateField"
        v-model="dateInput"
        :legend="t('home.dateLegend')"
        error-id="date-error"
        :invalid-part="invalidDatePart"
        :field-names="DATE_FIELD_NAMES"
      />
      <p id="date-error" class="field-error" role="alert">
        {{ formError ? t(formError.key, formError.params ?? {}) : '' }}
      </p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">{{ t('home.reveal') }}</button>
        <span class="actions__break" aria-hidden="true" />
        <button class="btn btn--ghost" type="button" @click="revealToday">{{ t('home.today') }}</button>
        <button class="btn btn--ghost" type="button" @click="revealRandomDate">
          <Icon name="lucide:dices" aria-hidden="true" /> {{ t('home.random') }}
        </button>
      </div>
    </form>

    <section
      v-if="pokemon && selectedDate"
      ref="resultSection"
      class="result"
      tabindex="-1"
      :aria-label="t('home.resultLabel')"
    >
      <DateFormula :date="selectedDate" />
      <p v-if="isRandomDraw" class="result__random-note">
        <Icon name="lucide:dices" aria-hidden="true" />
        <i18n-t :keypath="isShiny ? 'home.randomNoteShiny' : 'home.randomNote'" tag="span" scope="global">
          <template #name>{{ pokemon.name }}</template>
          <template #seen
            ><b>{{ t('home.randomNoteSeen') }}</b></template
          >
        </i18n-t>
      </p>
      <PokemonCard
        :key="`${toIsoDate(selectedDate)}-${revealCount}`"
        :pokemon="pokemon"
        :date="selectedDate"
        :shiny="isShiny"
        :new-discovery="isNewDiscovery"
        :animate="playsRevealAnimation"
        :celebrate="playsRevealAnimation"
      >
        <template v-if="!isRandomDraw && !isTodaysDate" #after-actions="{ revealed }">
          <DrawPublication
            :ready="revealed"
            :pokemon-id="pokemon.id"
            :shiny="isShiny"
            :bonus-pokemon-id="mirrorPokemonId"
          />
        </template>
      </PokemonCard>
      <NuxtLinkLocale class="result__dates-link" :to="{ path: pokemonPath(pokemon), hash: '#pokemon-dates-title' }">
        <Icon name="lucide:calendar-search" aria-hidden="true" />
        {{ t('home.datesLink', { name: pokemon.name }) }}
        <Icon name="lucide:arrow-right" aria-hidden="true" />
      </NuxtLinkLocale>
      <HighlightBanner
        v-if="mirrorPokemon"
        :to="pokemonPath(mirrorPokemon)"
        :image-src="artworkUrl(mirrorPokemon.id)"
        icon="lucide:moon-star"
        :title="t('home.mirrorTitle', { date: `${padNumber(selectedDate.day)}/${padNumber(selectedDate.month)}` })"
      >
        <i18n-t keypath="home.mirrorText" scope="global">
          <template #name
            ><strong>{{ mirrorPokemon.name }}</strong></template
          >
        </i18n-t>
      </HighlightBanner>
    </section>

    <div v-else-if="selectedDate && pokemonError" class="result-error" role="alert">
      <Icon name="lucide:wifi-off" aria-hidden="true" />
      <p>{{ t('home.loadError') }}</p>
      <button class="btn btn--ghost btn--sm" type="button" @click="retryPokemon()">{{ t('common.retry') }}</button>
    </div>

    <HighlightBanner
      v-if="!selectedDate && pokemonOfTheDay"
      class="pokemon-of-the-day"
      :to="pokemonOfTheDayLink"
      :image-src="artworkUrl(pokemonOfTheDay.id, isTodayShiny)"
      icon="lucide:calendar-days"
      :title="t('home.dailyTitle', { name: pokemonOfTheDay.name })"
    >
      {{
        t(isTodayShiny ? 'home.dailyTextShiny' : 'home.dailyText', {
          date: formattedToday,
          number: pokemonOfTheDay.id,
        })
      }}
    </HighlightBanner>

    <section class="section" aria-labelledby="how-it-works">
      <h2 id="how-it-works" class="section__title">{{ t('home.howTitle') }}</h2>
      <ol class="steps">
        <li>
          <strong>{{ t('home.stepDateTitle') }}</strong
          >{{ t('home.stepDateText') }}
        </li>
        <li>
          <strong>{{ t('home.stepDigitsTitle') }}</strong
          >{{ t('home.stepDigitsText') }}
        </li>
        <li>
          <strong>{{ t('home.stepChallengeTitle') }}</strong
          ><i18n-t keypath="home.stepChallengeText" tag="span" scope="global">
            <template #duel
              ><NuxtLinkLocale to="/duel" class="text-link">{{ t('home.stepChallengeDuel') }}</NuxtLinkLocale></template
            >
            <template #pokedex><NuxtLinkLocale to="/pokedex" class="text-link">Pokédex</NuxtLinkLocale></template>
          </i18n-t>
        </li>
      </ol>
    </section>

    <section class="section" aria-labelledby="faq">
      <h2 id="faq" class="section__title">{{ t('home.faqTitle') }}</h2>
      <div class="faq">
        <AccordionItem v-for="key in HOME_FAQ_KEYS" :key="key" :question="t(`faq.${key}.question`)" group="faq">
          <p>{{ t(`faq.${key}.answer`) }}</p>
        </AccordionItem>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss" src="./index.scss" />
