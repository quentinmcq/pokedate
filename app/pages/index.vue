<script setup lang="ts">
import type { CalendarDate, DateFieldValue } from '#shared/types/pokemon'

const route = useRoute()
const router = useRouter()
const { resetAccent } = usePageAccent()
const absoluteUrl = useAbsoluteUrl()
const { portfolioUrl } = useRuntimeConfig().public
const { recordDiscovery } = usePokedex()

const RANDOM_DATE_START = new Date(1950, 0, 1).getTime()

const dateInput = ref<DateFieldValue>(emptyDateFieldValue())
const formError = ref('')
const revealCount = ref(0)
const resultSection = useTemplateRef<HTMLElement>('resultSection')

const selectedDate = computed(() => parseIsoDate(route.query.date))
watch(selectedDate, (date) => date && (dateInput.value = toDateFieldValue(date)), { immediate: true })

const pokemonId = computed(() => (selectedDate.value ? pokemonIdFromDate(selectedDate.value) : null))
const isShiny = computed(() => !!selectedDate.value && isShinyDate(selectedDate.value))
const mirrorPokemonId = computed(() => (selectedDate.value ? mirrorPokemonIdForDate(selectedDate.value) : null))

const [{ data: pokemon }, { data: mirrorPokemon }] = await Promise.all([
  usePokemonDetail(pokemonId),
  usePokemonDetail(mirrorPokemonId),
])

const recordMirrorPokemon = () => mirrorPokemon.value && recordDiscovery(mirrorPokemon.value.id)
onMounted(recordMirrorPokemon)
watch(mirrorPokemon, recordMirrorPokemon)
watchEffect(() => !pokemon.value && resetAccent())

async function revealPokemonFor(date: CalendarDate) {
  formError.value = ''
  revealCount.value++
  await router.push({ query: { date: toIsoDate(date) } })
  await nextTick()
  resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  resultSection.value?.focus({ preventScroll: true })
}

function submitDate() {
  const parsed = parseDateFieldValue(dateInput.value)
  if (parsed.ok) revealPokemonFor(parsed.date)
  else formError.value = parsed.error
}

const revealToday = () => revealPokemonFor(todayAsCalendarDate())

const revealRandomDate = () =>
  revealPokemonFor(todayAsCalendarDate(new Date(RANDOM_DATE_START + Math.random() * (Date.now() - RANDOM_DATE_START))))

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
    <form class="hero" autocomplete="off" novalidate @submit.prevent="submitDate">
      <h1>Quel Pokémon<br />se cache dans ta date&nbsp;?</h1>
      <p class="lead">
        Le dernier chiffre du <b>jour</b>, du <b>mois</b> et de l'<b>année</b> forment le numéro de ton Pokémon. Essaie
        avec ta date de naissance&nbsp;!
      </p>
      <DateField v-model="dateInput" legend="Ta date" error-id="date-error" :invalid="!!formError" />
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
        animate
      />
      <NuxtLink v-if="mirrorPokemon" class="banner" :to="pokemonPath(mirrorPokemon)">
        <img :src="artworkUrl(mirrorPokemon.id)" alt="" width="64" height="64" loading="lazy" />
        <div>
          <b><Icon name="lucide:moon-star" aria-hidden="true" /> Date miroir ! Le jour et le mois sont identiques.</b>
          <span
            >Un Pokémon rare surgit : <strong>{{ mirrorPokemon.name }}</strong
            >. Touche pour le découvrir.</span
          >
        </div>
      </NuxtLink>
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
        <details v-for="item in HOME_FAQ" :key="item.question">
          <summary>{{ item.question }}</summary>
          <p>{{ item.answer }}</p>
        </details>
      </div>
    </section>
  </div>
</template>
