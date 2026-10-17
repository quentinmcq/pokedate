<script setup lang="ts">
import type { CalendarDate, DateFieldValue } from '#shared/types/pokemon'
import type { DateFieldKey } from '#shared/utils/date'

const route = useRoute()
const router = useRouter()
const { resetAccent } = usePageAccent()
const absoluteUrl = useAbsoluteUrl()
const { portfolioUrl } = useRuntimeConfig().public
const { recordDiscovery } = usePokedex()
const trackEvent = useTrackEvent()
rememberCurrentPath('/')

const RANDOM_DATE_START = new Date(1950, 0, 1).getTime()

const dateInput = ref<DateFieldValue>(emptyDateFieldValue())
const formError = ref('')
const invalidDatePart = ref<DateFieldKey | null>(null)
const dateField = useTemplateRef('dateField')
const revealCount = ref(0)
const resultSection = useTemplateRef<HTMLElement>('resultSection')

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
watch(selectedDate, (date) => date && (dateInput.value = toDateFieldValue(date)), { immediate: true })

const pokemonId = computed(() => (selectedDate.value ? pokemonIdFromDate(selectedDate.value) : null))
const isShiny = computed(() => !!selectedDate.value && isShinyDate(selectedDate.value))
const mirrorPokemonId = computed(() => (selectedDate.value ? mirrorPokemonIdForDate(selectedDate.value) : null))

const [{ data: pokemon }, { data: mirrorPokemon }] = await Promise.all([
  usePokemonDetail(pokemonId),
  usePokemonDetail(mirrorPokemonId),
])

const recordMirrorPokemon = () =>
  mirrorPokemon.value && recordDiscovery(mirrorPokemon.value.id, { caught: !isRandomDraw.value })
onMounted(recordMirrorPokemon)
watch(mirrorPokemon, recordMirrorPokemon)
watchEffect(() => !pokemon.value && resetAccent())

async function revealPokemonFor(date: CalendarDate, { isRandom = false } = {}) {
  formError.value = ''
  invalidDatePart.value = null
  revealCount.value++
  trackEvent(isRandom ? 'random' : 'reveal')
  await router.push({ query: { date: toIsoDate(date), ...(isRandom ? { hasard: '1' } : {}) } })
  await nextTick()
  resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  resultSection.value?.focus({ preventScroll: true })
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
  description:
    "Quel Pokémon se cache dans ta date de naissance ? Le dernier chiffre du jour, du mois et de l'année donnent ton Pokémon parmi les 1025 : types, stats, faiblesses, évolutions et duel entre amis.",
  shareImagePath: () => (revealedPokemon.value ? shareImagePath(revealedPokemon.value.id) : undefined),
  shareImageAlt: () => revealedPokemon.value?.name,
  noindex: () => !!route.query.date,
  structuredData: () => [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PokéDate',
      url: absoluteUrl('/'),
      inLanguage: 'fr-FR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PokéDate',
      url: absoluteUrl('/'),
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Tous',
      inLanguage: 'fr-FR',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      author: { '@type': 'Person', name: 'Quentin Macq', url: portfolioUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQ.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
})
</script>

<template>
  <div>
    <form class="hero" action="/" method="get" autocomplete="off" novalidate @submit.prevent="submitDate">
      <h1>Quel Pokémon<br />se cache dans ta date&nbsp;?</h1>
      <p class="lead">
        Le dernier chiffre du <b>jour</b>, du <b>mois</b> et de l'<b>année</b> forment le numéro de ton Pokémon. Essaie
        avec ta date de naissance&nbsp;!
      </p>
      <DateField
        ref="dateField"
        v-model="dateInput"
        legend="Ta date"
        error-id="date-error"
        :invalid-part="invalidDatePart"
        :field-names="DATE_FIELD_NAMES"
      />
      <p id="date-error" class="field-error" role="alert">{{ formError }}</p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">Révéler mon Pokémon</button>
        <button class="btn btn--ghost" type="button" @click="revealToday">Aujourd'hui</button>
        <button class="btn btn--ghost" type="button" @click="revealRandomDate">
          <Icon name="lucide:dices" aria-hidden="true" /> Au hasard
        </button>
      </div>
    </form>

    <section v-if="pokemon && selectedDate" ref="resultSection" class="result" tabindex="-1" aria-label="Ton Pokémon">
      <DateFormula :date="selectedDate" />
      <PokemonCard
        :key="`${toIsoDate(selectedDate)}-${revealCount}`"
        :pokemon="pokemon"
        :date="selectedDate"
        :shiny="isShiny"
        :catch-on-reveal="!isRandomDraw"
        animate
      />
      <PublishDraw
        v-if="!isRandomDraw"
        :key="`publish-${toIsoDate(selectedDate)}-${revealCount}`"
        :pokemon-id="pokemon.id"
        :pokemon-name="pokemon.name"
        :shiny="isShiny"
      />
      <HighlightBanner
        v-if="mirrorPokemon"
        :to="pokemonPath(mirrorPokemon)"
        :image-src="artworkUrl(mirrorPokemon.id)"
        icon="lucide:moon-star"
        title="Date miroir ! Le jour et le mois sont identiques."
      >
        Un Pokémon rare surgit : <strong>{{ mirrorPokemon.name }}</strong
        >. Touche pour le découvrir.
      </HighlightBanner>
    </section>

    <section class="section" aria-labelledby="how-it-works">
      <h2 id="how-it-works" class="section__title">Comment ça marche&nbsp;?</h2>
      <ol class="steps">
        <li>
          <strong>Entre une date</strong>Ton anniversaire, celui d'un ami, ou n'importe quel jour qui compte pour toi.
        </li>
        <li>
          <strong>Trois chiffres, un Pokémon</strong>Les derniers chiffres du jour, du mois et de l'année donnent un
          numéro entre 1 et 1000.
        </li>
        <li>
          <strong>Défie tes amis</strong>Lance un <NuxtLink to="/duel" class="text-link">duel</NuxtLink> et complète ton
          <NuxtLink to="/pokedex" class="text-link">Pokédex</NuxtLink> au fil des dates.
        </li>
      </ol>
    </section>

    <section class="section" aria-labelledby="faq">
      <h2 id="faq" class="section__title">Questions fréquentes</h2>
      <div class="faq">
        <AccordionItem v-for="item in HOME_FAQ" :key="item.question" :question="item.question" group="faq">
          <p>{{ item.answer }}</p>
        </AccordionItem>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss" src="./index.scss" />
