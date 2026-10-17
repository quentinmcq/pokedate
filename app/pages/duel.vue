<script setup lang="ts">
import type { DateInput } from '#shared/types/pokemon'

const route = useRoute()
const router = useRouter()
const { setAccent, resetAccent } = useAccent()
const share = useShare()
const siteUrl = useSiteUrl()
const { catchPokemon } = useDex()

const NAME_MAX = 20
const queryString = (v: unknown) => (typeof v === 'string' ? v : '')
const cleanName = (v: unknown) => queryString(v).trim().slice(0, NAME_MAX)
const queryId = (v: unknown) => {
  const n = Number(queryString(v))
  return Number.isInteger(n) && n >= 1 && n <= MAX_POKEMON ? n : null
}

const inputA = ref<DateInput>(emptyDateInput())
const inputB = ref<DateInput>(emptyDateInput())
const nameA = ref(cleanName(route.query.na))
const nameB = ref(cleanName(route.query.nb))
const error = ref('')
const resultEl = useTemplateRef<HTMLElement>('result')

const prefill = parseIsoDate(route.query.a)
if (prefill) inputA.value = toDateInput(prefill)

const idA = computed(() => queryId(route.query.pa))
const idB = computed(() => queryId(route.query.pb))
const shinyA = computed(() => route.query.sa === '1')
const shinyB = computed(() => route.query.sb === '1')
const ready = computed(() => !!idA.value && !!idB.value)

const [{ data: monA }, { data: monB }] = await Promise.all([
  usePokemon(() => (ready.value ? idA.value : null)),
  usePokemon(() => (ready.value ? idB.value : null)),
])

const labelA = computed(() => cleanName(route.query.na) || 'Joueur 1')
const labelB = computed(() => cleanName(route.query.nb) || 'Joueur 2')

const fight = computed(() => (ready.value && monA.value && monB.value ? duel(monA.value, monB.value) : null))
const winnerMon = computed(() =>
  fight.value?.winner === 'A' ? monA.value : fight.value?.winner === 'B' ? monB.value : null,
)
const winnerName = computed(() => (fight.value?.winner === 'A' ? labelA.value : labelB.value))

watchEffect(() => {
  const m = fight.value?.winner === 'B' ? monB.value : monA.value
  if (fight.value && m) setAccent(m.types)
  else resetAccent()
})

const verdictTitle = computed(() => {
  if (!fight.value || !monA.value || !monB.value) return ''
  if (winnerMon.value) return `🏆 ${winnerName.value} gagne avec ${winnerMon.value.fr} !`
  return monA.value.id === monB.value.id ? '🪞 Match miroir : même Pokémon, égalité parfaite !' : '🤝 Match nul !'
})

const koText = (turns: number) =>
  turns === Infinity ? 'ne peut pas le toucher' : `le met K.O. en ${turns} tour${turns > 1 ? 's' : ''}`
const fighterClass = (side: 'A' | 'B') =>
  fight.value?.winner ? (fight.value.winner === side ? 'fighter--win' : 'fighter--lose') : ''

function celebrate() {
  if (!fight.value || !monA.value || !monB.value) return
  catchPokemon(monA.value.id, shinyA.value)
  catchPokemon(monB.value.id, shinyB.value)
  const w = winnerMon.value
  if (w) setTimeout(() => launchConfetti(['#ffd23f', typeColor(w.types[0]!), '#fff']), 900)
}
watch(fight, celebrate)
onMounted(celebrate)

async function submit() {
  const a = validateDateInput(inputA.value)
  const b = validateDateInput(inputB.value)
  error.value = 'error' in a ? `Joueur 1 : ${a.error}` : 'error' in b ? `Joueur 2 : ${b.error}` : ''
  if ('error' in a || 'error' in b) return
  const query: Record<string, string> = { pa: String(pokemonIdFromDate(a)), pb: String(pokemonIdFromDate(b)) }
  if (isShinyDate(a)) query.sa = '1'
  if (isShinyDate(b)) query.sb = '1'
  if (nameA.value.trim()) query.na = nameA.value.trim().slice(0, NAME_MAX)
  if (nameB.value.trim()) query.nb = nameB.value.trim().slice(0, NAME_MAX)
  await router.push({ query })
  await nextTick()
  resultEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  resultEl.value?.focus({ preventScroll: true })
}

function shareDuel() {
  const query = new URLSearchParams()
  for (const k of ['pa', 'pb', 'sa', 'sb', 'na', 'nb']) {
    const v = queryString(route.query[k])
    if (v) query.set(k, k === 'na' || k === 'nb' ? v.slice(0, NAME_MAX) : v)
  }
  share(
    winnerMon.value
      ? `${winnerName.value} gagne le duel PokéDate avec ${winnerMon.value.fr} ! Revanche ?`
      : 'Match nul au duel PokéDate ! Revanche ?',
    `${siteUrl('/duel')}?${query}`,
    'Lien du duel copié 📋',
  )
}

usePageSeo({
  title: () =>
    monA.value && monB.value && fight.value ? `${monA.value.fr} VS ${monB.value.fr}` : "Duel d'anniversaires",
  description:
    "Ta date contre celle d'un ami : quel Pokémon gagne le combat ? Un duel de dates d'anniversaire façon Pokémon.",
  image: () => (winnerMon.value ? `/sprites/og/${winnerMon.value.id}.jpg` : undefined),
  imageAlt: () => winnerMon.value?.fr,
  noindex: () => ready.value,
})
</script>

<template>
  <div>
    <form class="hero" autocomplete="off" novalidate @submit.prevent="submit">
      <h1>Duel d'anniversaires</h1>
      <p class="lead">Ta date contre celle d'un·e ami·e : quel Pokémon l'emporte&nbsp;?</p>
      <div class="duel-form">
        <div class="duel-form__side">
          <label class="visually-hidden" for="name-a">Prénom du joueur 1</label>
          <input id="name-a" v-model="nameA" class="text-input" placeholder="Ton prénom" :maxlength="NAME_MAX" />
          <DateField v-model="inputA" compact legend="Date du joueur 1" error-id="duel-error" />
        </div>
        <span class="vs-badge" aria-hidden="true">VS</span>
        <div class="duel-form__side">
          <label class="visually-hidden" for="name-b">Prénom du joueur 2</label>
          <input id="name-b" v-model="nameB" class="text-input" placeholder="Son prénom" :maxlength="NAME_MAX" />
          <DateField v-model="inputB" compact legend="Date du joueur 2" error-id="duel-error" />
        </div>
      </div>
      <p id="duel-error" class="field-error" role="alert">{{ error }}</p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">Lancer le combat <span aria-hidden="true">⚔️</span></button>
      </div>
      <p class="field-hint">Seuls les Pokémon apparaissent dans le lien du duel, jamais vos dates.</p>
    </form>

    <section v-if="fight && monA && monB" ref="result" class="duel-result" tabindex="-1" aria-labelledby="verdict">
      <div class="arena">
        <div
          class="fighter fighter--left"
          :class="fighterClass('A')"
          :style="{ '--accent': typeColor(monA.types[0]!) }"
        >
          <span v-if="fight.winner === 'A'" class="fighter__crown" aria-hidden="true">👑</span>
          <img :src="artUrl(monA.id, shinyA)" :alt="monA.fr" width="160" height="160" />
          <div class="fighter__player">{{ labelA }}</div>
          <h2 class="fighter__name">
            <NuxtLink :to="pokemonPath(monA)">{{ monA.fr }}</NuxtLink
            >{{ shinyA ? ' ✨' : '' }} <small>#{{ monA.id }}</small>
          </h2>
          <div class="chip-list"><TypeChip v-for="t in monA.types" :key="t" :type="t" small /></div>
          <div class="fighter__power">
            Total stats <b>{{ statTotal(monA) }}</b> · Vitesse <b>{{ monA.stats[5] }}</b>
          </div>
        </div>
        <div class="arena__vs" aria-hidden="true">VS</div>
        <div
          class="fighter fighter--right"
          :class="fighterClass('B')"
          :style="{ '--accent': typeColor(monB.types[0]!) }"
        >
          <span v-if="fight.winner === 'B'" class="fighter__crown" aria-hidden="true">👑</span>
          <img :src="artUrl(monB.id, shinyB)" :alt="monB.fr" width="160" height="160" />
          <div class="fighter__player">{{ labelB }}</div>
          <h2 class="fighter__name">
            <NuxtLink :to="pokemonPath(monB)">{{ monB.fr }}</NuxtLink
            >{{ shinyB ? ' ✨' : '' }} <small>#{{ monB.id }}</small>
          </h2>
          <div class="chip-list"><TypeChip v-for="t in monB.types" :key="t" :type="t" small /></div>
          <div class="fighter__power">
            Total stats <b>{{ statTotal(monB) }}</b> · Vitesse <b>{{ monB.stats[5] }}</b>
          </div>
        </div>
      </div>

      <div class="verdict">
        <h2 id="verdict">{{ verdictTitle }}</h2>
        <ul>
          <li>
            {{ monA.fr }} attaque en {{ TYPES[fight.ab.type][2] }} {{ TYPES[fight.ab.type][0] }} : ça
            {{ effectText(fight.ab.mult) }} (×{{ formatNumber(fight.ab.mult, 2) }}) et {{ koText(fight.ab.turns) }}.
          </li>
          <li>
            {{ monB.fr }} attaque en {{ TYPES[fight.ba.type][2] }} {{ TYPES[fight.ba.type][0] }} : ça
            {{ effectText(fight.ba.mult) }} (×{{ formatNumber(fight.ba.mult, 2) }}) et {{ koText(fight.ba.turns) }}.
          </li>
          <li>
            {{ fight.aFirst ? monA.fr : monB.fr }} est
            {{ monA.stats[5] === monB.stats[5] ? 'aussi rapide mais plus costaud' : 'plus rapide' }} et frappe en
            premier.
          </li>
        </ul>
      </div>
      <div class="actions actions--spaced">
        <button class="btn btn--primary btn--sm" type="button" @click="shareDuel">Partager le duel 📤</button>
      </div>
    </section>
  </div>
</template>
