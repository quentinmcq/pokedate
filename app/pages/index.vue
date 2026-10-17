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

const DATE_FIELD_NAMES = { day: 'jour', month: 'mois', year: 'annee' } as const

const submittedWithoutJavaScript = parseDateFieldValue({
  day: String(route.query[DATE_FIELD_NAMES.day] ?? ''),
  month: String(route.query[DATE_FIELD_NAMES.month] ?? ''),
  year: String(route.query[DATE_FIELD_NAMES.year] ?? ''),
})

if (submittedWithoutJavaScript.ok)
  await navigateTo({ query: { date: toIsoDate(submittedWithoutJavaScript.date) } }, { replace: true })

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
    <form class="hero" action="/" method="get" autocomplete="off" novalidate @submit.prevent="submitDate">
      <h1>Quel Pokémon<br />se cache dans ta date&nbsp;?</h1>
      <p class="lead">
        Le dernier chiffre du <b>jour</b>, du <b>mois</b> et de l'<b>année</b> forment le numéro de ton Pokémon. Essaie
        avec ta date de naissance&nbsp;!
      </p>
      <DateField
        v-model="dateInput"
        legend="Ta date"
        error-id="date-error"
        :invalid="!!formError"
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
        animate
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
        <details v-for="item in HOME_FAQ" :key="item.question">
          <summary>{{ item.question }}</summary>
          <p>{{ item.answer }}</p>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;
@use '../assets/scss/abstracts/mixins' as *;

.result:focus {
  outline: none;
}

.section {
  margin-top: space(16);

  &__title {
    font-size: font-size('2xl');
    margin: 0 0 space(5);
    text-align: center;
  }
}

.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: space(4);
  counter-reset: step;

  li {
    @include surface(2);
    border-radius: radius('lg');
    padding: space(5);
    counter-increment: step;
    line-height: 1.5;
    color: color('text-muted');

    &::before {
      content: counter(step);
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      margin-bottom: space(3);
      border-radius: 50%;
      background: color('highlight');
      color: color('on-light');
      font-family: var(--font-mono), monospace;
      font-weight: weight('bold');
    }

    strong {
      display: block;
      color: color('text');
      font-size: font-size('lg');
      margin-bottom: space(1);
    }
  }
}

.faq {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: space(3);

  details {
    @include surface(2);
    border-radius: radius('lg');
    padding: 0 space(5);
    interpolate-size: allow-keywords;
    transition: border-color duration('base');

    &:hover {
      border-color: color('text-subtle');
    }

    &::details-content {
      block-size: 0;
      opacity: 0;
      overflow: hidden;
      transition:
        block-size duration('medium') ease('standard'),
        opacity duration('medium') ease('standard'),
        content-visibility duration('medium') allow-discrete;
    }

    &[open]::details-content {
      block-size: auto;
      opacity: 1;
    }

    &[open] summary::after {
      transform: rotate(45deg);
    }
  }

  summary {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    list-style: none;
    padding: space(4) 0;
    font-weight: weight('bold');
    display: flex;
    justify-content: space-between;
    gap: space(4);
    @include focus-ring;

    &::-webkit-details-marker {
      display: none;
    }
    &::after {
      content: '+';
      font-size: font-size('xl');
      line-height: 1;
      color: color('highlight');
      transition: transform duration('medium') ease('standard');
    }
  }

  p {
    margin: 0 0 space(4);
    color: color('text-muted');
    line-height: 1.6;
  }
}
</style>
