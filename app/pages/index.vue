<script setup lang="ts">
import type { DateInput, DateParts } from '#shared/types/pokemon'

const route = useRoute()
const router = useRouter()
const { resetAccent } = useAccent()

const input = ref<DateInput>(emptyDateInput())
const error = ref('')
/** change à chaque validation pour rejouer la révélation, même sur la même date */
const nonce = ref(0)
const resultEl = useTemplateRef<HTMLElement>('result')

const date = computed(() => parseIsoDate(route.query.date))
watch(date, (d) => d && (input.value = toDateInput(d)), { immediate: true })

const id = computed(() => (date.value ? pokemonIdFromDate(date.value) : null))
const shiny = computed(() => !!date.value && isShinyDate(date.value))
const secretId = computed(() => (date.value ? secretIdForDate(date.value) : null))

const [{ data: pokemon }, { data: secret }] = await Promise.all([usePokemon(id), usePokemon(secretId)])

// La rencontre secrète compte aussi dans le Pokédex
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

useSeoMeta({
  title: () =>
    pokemon.value && date.value
      ? `${pokemon.value.fr} #${pokemon.value.id} · PokéDate`
      : 'PokéDate · Quel Pokémon se cache dans ta date ?',
  ogTitle: () =>
    pokemon.value && date.value
      ? `Cette date donne ${pokemon.value.fr} #${pokemon.value.id} ! Et toi ?`
      : 'PokéDate · Quel Pokémon es-tu ?',
  description: "Le dernier chiffre du jour, du mois et de l'année de ta date forment le numéro de ton Pokémon.",
  ogDescription: "Entre ta date d'anniversaire et découvre ton Pokémon.",
  ogImage: () => (pokemon.value ? artUrl(pokemon.value.id, shiny.value) : undefined),
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <section>
    <form class="entry" autocomplete="off" @submit.prevent="submit">
      <h1>Quel Pokémon<br />se cache dans ta date&nbsp;?</h1>
      <p class="sub">
        Le dernier chiffre du <b>jour</b>, du <b>mois</b> et de l'<b>année</b> forment le numéro de ton Pokémon.
      </p>
      <DateField v-model="input" />
      <p class="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="btn primary" type="submit">Révéler mon Pokémon</button>
        <button class="btn ghost" type="button" @click="today">Aujourd'hui</button>
        <button
          class="btn ghost"
          type="button"
          title="Une date au hasard"
          aria-label="Une date au hasard"
          @click="random"
        >
          🎲
        </button>
      </div>
    </form>

    <div v-if="pokemon && date" ref="result" class="result">
      <DateFormula :date="date" />
      <PokemonCard :key="`${toIsoDate(date)}-${nonce}`" :pokemon="pokemon" :date="date" :shiny="shiny" animate />
      <NuxtLink v-if="secret" class="secret" :to="`/pokemon/${secret.id}`">
        <img :src="artUrl(secret.id)" alt="" />
        <div>
          <b>🌌 Date miroir ! Le jour et le mois sont identiques.</b>
          <span
            >Un Pokémon rare (#1001–1025) surgit : <strong>{{ secret.fr }}</strong
            >. Clique pour le découvrir.</span
          >
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
