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
rememberCurrentPath('home')

const RANDOM_DATE_START = new Date(1950, 0, 1).getTime()

const dateInput = ref<DateFieldValue>(emptyDateFieldValue())
const formError = ref('')
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
watch(selectedDate, (date) => date && (dateInput.value = toDateFieldValue(date)), { immediate: true })

const pokemonId = computed(() => (selectedDate.value ? pokemonIdFromDate(selectedDate.value) : null))
const isShiny = computed(() => !!selectedDate.value && isShinyDate(selectedDate.value))
const mirrorPokemonId = computed(() => (selectedDate.value ? mirrorPokemonIdForDate(selectedDate.value) : null))

const [{ data: pokemon, error: pokemonError, refresh: retryPokemon }, { data: mirrorPokemon }] = await Promise.all([
  usePokemonDetail(pokemonId),
  usePokemonDetail(mirrorPokemonId),
])

const isNewDiscovery = ref(false)

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
  formError.value = ''
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
  description:
    "Quel Pokémon se cache dans ta date de naissance ? Les derniers chiffres du jour, du mois et de l'année donnent ton Pokémon parmi les 1025 : types, stats, faiblesses, évolutions, duels et tournois entre potes.",
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
        Les derniers chiffres du <b>jour</b>, du <b>mois</b> et de l'<b>année</b> forment le numéro de ton Pokémon.
        Essaie avec ta date de naissance&nbsp;!
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
        <span class="actions__break" aria-hidden="true" />
        <button class="btn btn--ghost" type="button" @click="revealToday">Aujourd'hui</button>
        <button class="btn btn--ghost" type="button" @click="revealRandomDate">
          <Icon name="lucide:dices" aria-hidden="true" /> Au hasard
        </button>
      </div>
    </form>

    <section v-if="pokemon && selectedDate" ref="resultSection" class="result" tabindex="-1" aria-label="Ton Pokémon">
      <DateFormula :date="selectedDate" />
      <p v-if="isRandomDraw" class="result__random-note">
        <Icon name="lucide:dices" aria-hidden="true" />
        <span>
          Tirage au hasard&nbsp;: {{ pokemon.name }} est seulement <b>vu</b> dans ton Pokédex, en ombre<template
            v-if="isShiny"
            >, même s'il est shiny</template
          >. Pour l'attraper, entre une date qui compte pour toi.
        </span>
      </p>
      <PokemonCard
        :key="`${toIsoDate(selectedDate)}-${revealCount}`"
        :pokemon="pokemon"
        :date="selectedDate"
        :shiny="isShiny"
        :new-discovery="isNewDiscovery"
        animate
      >
        <template v-if="!isRandomDraw" #after-actions="{ revealed }">
          <DrawPublication
            :ready="revealed"
            :pokemon-id="pokemon.id"
            :shiny="isShiny"
            :bonus-pokemon-id="mirrorPokemonId"
          />
        </template>
      </PokemonCard>
      <HighlightBanner
        v-if="mirrorPokemon"
        :to="pokemonPath(mirrorPokemon)"
        :image-src="artworkUrl(mirrorPokemon.id)"
        icon="lucide:moon-star"
        :title="`Ta date est une date miroir : ${padNumber(selectedDate.day)}/${padNumber(selectedDate.month)} !`"
      >
        Le jour et le mois de ta date sont identiques, alors un Pokémon rare surgit en bonus&nbsp;:
        <strong>{{ mirrorPokemon.name }}</strong
        >. Touche pour le découvrir.
      </HighlightBanner>
    </section>

    <div v-else-if="selectedDate && pokemonError" class="result-error" role="alert">
      <Icon name="lucide:wifi-off" aria-hidden="true" />
      <p>Ton Pokémon n'a pas pu s'afficher. Vérifie ta connexion, puis réessaie.</p>
      <button class="btn btn--ghost btn--sm" type="button" @click="retryPokemon()">Réessayer</button>
    </div>

    <section class="section" aria-labelledby="how-it-works">
      <h2 id="how-it-works" class="section__title">Comment ça marche&nbsp;?</h2>
      <ol class="steps">
        <li>
          <strong>Entre une date</strong>Ton anniversaire, celui de tes potes ou n'importe quel jour qui compte pour
          toi.
        </li>
        <li>
          <strong>Trois chiffres, un Pokémon</strong>Les derniers chiffres du jour, du mois et de l'année donnent un
          numéro entre 1 et 1000.
        </li>
        <li>
          <strong>Défie tes potes</strong>Lance un <NuxtLink to="/duel" class="text-link">duel</NuxtLink> et complète
          ton <NuxtLink to="/pokedex" class="text-link">Pokédex</NuxtLink> au fil des dates.
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
