<script setup lang="ts">
import type { DateInput, DateParts } from '#shared/types/pokemon'

const route = useRoute()
const router = useRouter()
const { resetAccent } = useAccent()
const siteUrl = useSiteUrl()
const { portfolioUrl } = useRuntimeConfig().public

const input = ref<DateInput>(emptyDateInput())
const error = ref('')
const nonce = ref(0)
const resultEl = useTemplateRef<HTMLElement>('result')

const date = computed(() => parseIsoDate(route.query.date))
watch(date, (d) => d && (input.value = toDateInput(d)), { immediate: true })

const id = computed(() => (date.value ? pokemonIdFromDate(date.value) : null))
const shiny = computed(() => !!date.value && isShinyDate(date.value))
const secretId = computed(() => (date.value ? secretIdForDate(date.value) : null))

const [{ data: pokemon }, { data: secret }] = await Promise.all([usePokemon(id), usePokemon(secretId)])

const { catchPokemon } = useDex()
const catchSecret = () => secret.value && catchPokemon(secret.value.id)
onMounted(catchSecret)
watch(secret, catchSecret)
watchEffect(() => !pokemon.value && resetAccent())

async function show(d: DateParts) {
  error.value = ''
  nonce.value++
  await router.push({ query: { date: toIsoDate(d) } })
  await nextTick()
  resultEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  resultEl.value?.focus({ preventScroll: true })
}

function submit() {
  const r = validateDateInput(input.value)
  if ('error' in r) error.value = r.error
  else show(r)
}

function today() {
  const t = new Date()
  show({ d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear() })
}

function random() {
  const start = new Date(1950, 0, 1).getTime()
  const t = new Date(start + Math.random() * (Date.now() - start))
  show({ d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear() })
}

const faq = [
  {
    q: 'Comment PokéDate trouve mon Pokémon ?',
    a: "On prend le dernier chiffre du jour, du mois et de l'année de ta date, et on les met bout à bout. Le 17/10/2026 donne 7, 0 et 6 : c'est le Pokémon n° 706, Muplodocus. Si les trois chiffres sont 0, tu tombes sur le n° 1000.",
  },
  {
    q: 'Quel Pokémon suis-je selon ma date de naissance ?',
    a: "Entre ta date d'anniversaire dans le formulaire en haut de la page : ton Pokémon s'affiche avec ses types, ses statistiques, ses faiblesses et ses évolutions. Tes amis nés le même jour que toi, à quelques années près, peuvent tomber sur un autre Pokémon.",
  },
  {
    q: "C'est quoi un Pokémon shiny ?",
    a: "C'est une version aux couleurs rares. Environ une date sur vingt donne un Pokémon shiny, et c'est toujours la même pour une date donnée : à toi de voir si la tienne en fait partie.",
  },
  {
    q: 'Comment trouver les Pokémon n° 1001 à 1025 ?',
    a: 'Ils ne sortent pas avec la règle habituelle. Il faut une « date miroir », où le jour et le mois sont identiques (01/01, 02/02… 12/12) : un de ces Pokémon rares apparaît alors en bonus.',
  },
  {
    q: 'Mes données sont-elles enregistrées ?',
    a: "Non. Il n'y a ni compte, ni cookie, ni traceur. Ton Pokédex est enregistré uniquement dans ton navigateur, et les liens que tu partages ne contiennent jamais ta date de naissance.",
  },
]

usePageSeo({
  title: () => (pokemon.value && date.value ? `${pokemon.value.fr} #${pokemon.value.id}` : undefined),
  description:
    "Quel Pokémon se cache dans ta date de naissance ? Le dernier chiffre du jour, du mois et de l'année donnent ton Pokémon parmi les 1025 : types, stats, faiblesses, évolutions et duel entre amis.",
  image: () => (pokemon.value && date.value ? `/sprites/og/${pokemon.value.id}.jpg` : undefined),
  imageAlt: () => pokemon.value?.fr,
  noindex: () => !!route.query.date,
  jsonLd: () => [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PokéDate',
      url: siteUrl('/'),
      inLanguage: 'fr-FR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PokéDate',
      url: siteUrl('/'),
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Tous',
      inLanguage: 'fr-FR',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      author: { '@type': 'Person', name: 'Quentin Macq', url: portfolioUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
})
</script>

<template>
  <div>
    <form class="hero" autocomplete="off" novalidate @submit.prevent="submit">
      <h1>Quel Pokémon<br />se cache dans ta date&nbsp;?</h1>
      <p class="lead">
        Le dernier chiffre du <b>jour</b>, du <b>mois</b> et de l'<b>année</b> forment le numéro de ton Pokémon. Essaie
        avec ta date de naissance&nbsp;!
      </p>
      <DateField v-model="input" legend="Ta date" error-id="date-error" :invalid="!!error" />
      <p id="date-error" class="field-error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">Révéler mon Pokémon</button>
        <button class="btn btn--ghost" type="button" @click="today">Aujourd'hui</button>
        <button class="btn btn--ghost" type="button" @click="random">
          <span aria-hidden="true">🎲</span> Au hasard
        </button>
      </div>
    </form>

    <section v-if="pokemon && date" ref="result" class="result" tabindex="-1" aria-label="Ton Pokémon">
      <DateFormula :date="date" />
      <PokemonCard :key="`${toIsoDate(date)}-${nonce}`" :pokemon="pokemon" :date="date" :shiny="shiny" animate />
      <NuxtLink v-if="secret" class="banner" :to="pokemonPath(secret)">
        <img :src="artUrl(secret.id)" alt="" width="64" height="64" loading="lazy" />
        <div>
          <b>🌌 Date miroir ! Le jour et le mois sont identiques.</b>
          <span
            >Un Pokémon rare surgit : <strong>{{ secret.fr }}</strong
            >. Touche pour le découvrir.</span
          >
        </div>
      </NuxtLink>
    </section>

    <section class="section" aria-labelledby="comment">
      <h2 id="comment" class="section__title">Comment ça marche&nbsp;?</h2>
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
        <details v-for="item in faq" :key="item.q">
          <summary>{{ item.q }}</summary>
          <p>{{ item.a }}</p>
        </details>
      </div>
    </section>
  </div>
</template>
