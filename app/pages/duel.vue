<script setup lang="ts">
import type { DateInput } from '#shared/types/pokemon'

const route = useRoute()
const router = useRouter()
const { setAccent } = useAccent()
const share = useShare()
const absoluteUrl = useAbsoluteUrl()
const { catchPokemon } = useDex()

const queryString = (v: unknown) => (typeof v === 'string' ? v : '')

const inputA = ref<DateInput>(emptyDateInput())
const inputB = ref<DateInput>(emptyDateInput())
const nameA = ref(queryString(route.query.na))
const nameB = ref(queryString(route.query.nb))
const error = ref('')
const resultEl = useTemplateRef<HTMLElement>('result')

const dateA = computed(() => parseIsoDate(route.query.a))
const dateB = computed(() => parseIsoDate(route.query.b))
watch(dateA, (d) => d && (inputA.value = toDateInput(d)), { immediate: true })
watch(dateB, (d) => d && (inputB.value = toDateInput(d)), { immediate: true })

// Le combat n'a lieu que si les deux dates sont dans l'URL
const ready = computed(() => !!dateA.value && !!dateB.value)
const idA = computed(() => (ready.value ? pokemonIdFromDate(dateA.value!) : null))
const idB = computed(() => (ready.value ? pokemonIdFromDate(dateB.value!) : null))
const shinyA = computed(() => !!dateA.value && isShinyDate(dateA.value))
const shinyB = computed(() => !!dateB.value && isShinyDate(dateB.value))

const [{ data: monA }, { data: monB }] = await Promise.all([usePokemon(idA), usePokemon(idB)])

const labelA = computed(() => queryString(route.query.na) || 'Toi')
const labelB = computed(() => queryString(route.query.nb) || 'Ton ami·e')

const fight = computed(() => (monA.value && monB.value ? duel(monA.value, monB.value) : null))
const winnerMon = computed(() =>
  fight.value?.winner === 'A' ? monA.value : fight.value?.winner === 'B' ? monB.value : null,
)
const winnerName = computed(() => (fight.value?.winner === 'A' ? labelA.value : labelB.value))

watchEffect(() => {
  const m = fight.value?.winner === 'B' ? monB.value : monA.value
  if (m) setAccent(m.types)
})

const verdictTitle = computed(() => {
  if (!fight.value || !monA.value || !monB.value) return ''
  if (winnerMon.value) return `🏆 ${winnerName.value} gagne avec ${winnerMon.value.fr} !`
  return monA.value.id === monB.value.id ? '🪞 Match miroir : même Pokémon, égalité parfaite !' : '🤝 Match nul !'
})

const koText = (turns: number) =>
  turns === Infinity ? 'ne peut pas le toucher' : `le met K.O. en ${turns} tour${turns > 1 ? 's' : ''}`
const fighterClass = (side: 'A' | 'B') => (fight.value?.winner ? (fight.value.winner === side ? 'win' : 'lose') : '')

// Pokédex + confettis quand un combat s'affiche dans le navigateur
function celebrate() {
  if (!fight.value || !monA.value || !monB.value) return
  catchPokemon(monA.value.id, shinyA.value)
  catchPokemon(monB.value.id, shinyB.value)
  const w = winnerMon.value
  if (w) setTimeout(() => launchConfetti(['#ffd23f', typeColor(w.types[0]!), '#fff']), 900)
}
watch(fight, celebrate) // nouveau combat lancé depuis le formulaire
onMounted(celebrate) // arrivée par un lien partagé

async function submit() {
  const a = validateDateInput(inputA.value)
  const b = validateDateInput(inputB.value)
  error.value = 'error' in a ? a.error : 'error' in b ? b.error : ''
  if ('error' in a || 'error' in b) return
  const query: Record<string, string> = { a: toIsoDate(a), b: toIsoDate(b) }
  if (nameA.value.trim()) query.na = nameA.value.trim()
  if (nameB.value.trim()) query.nb = nameB.value.trim()
  await router.push({ query })
  await nextTick()
  resultEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function shareDuel() {
  share(
    winnerMon.value
      ? `${winnerName.value} gagne le duel PokéDate avec ${winnerMon.value.fr} ! Revanche ?`
      : 'Match nul au duel PokéDate !',
    absoluteUrl('/duel', Object.fromEntries(Object.entries(route.query).map(([k, v]) => [k, queryString(v)]))),
    'Lien du duel copié 📋',
  )
}

useSeoMeta({
  title: () =>
    monA.value && monB.value ? `${monA.value.fr} VS ${monB.value.fr} · PokéDate` : "Duel d'anniversaires · PokéDate",
  ogTitle: () => verdictTitle.value || "Duel d'anniversaires : quel Pokémon l'emporte ?",
  description: "Ta date contre celle d'un ami : quel Pokémon gagne le combat ?",
  ogImage: () => (winnerMon.value ? artUrl(winnerMon.value.id) : undefined),
})
</script>

<template>
  <section>
    <form class="entry" autocomplete="off" @submit.prevent="submit">
      <h1>Duel d'anniversaires</h1>
      <p class="sub">Ta date contre celle d'un·e ami·e : quel Pokémon l'emporte&nbsp;?</p>
      <div class="duel-inputs">
        <div>
          <input v-model="nameA" class="name" placeholder="Toi" maxlength="20" aria-label="Ton prénom" />
          <DateField v-model="inputA" compact />
        </div>
        <span class="vs-badge">VS</span>
        <div>
          <input v-model="nameB" class="name" placeholder="Ton ami·e" maxlength="20" aria-label="Prénom de ton ami·e" />
          <DateField v-model="inputB" compact />
        </div>
      </div>
      <p class="error" role="alert">{{ error }}</p>
      <div class="actions"><button class="btn primary" type="submit">Lancer le combat ⚔️</button></div>
    </form>

    <div v-if="fight && monA && monB" ref="result" class="duel-result">
      <div class="arena">
        <div class="fighter left" :class="fighterClass('A')" :style="{ '--accent': typeColor(monA.types[0]!) }">
          <span v-if="fighterClass('A') === 'win'" class="crown">👑</span>
          <img :src="artUrl(monA.id, shinyA)" :alt="monA.fr" />
          <div class="who-name">{{ labelA }}</div>
          <h3>
            {{ monA.fr }}{{ shinyA ? ' ✨' : '' }} <small>#{{ monA.id }}</small>
          </h3>
          <div class="types"><TypeChip v-for="t in monA.types" :key="t" :type="t" small /></div>
          <div class="power">
            Total stats <b>{{ statTotal(monA) }}</b> · Vitesse <b>{{ monA.stats[5] }}</b>
          </div>
        </div>
        <div class="vs-mid"><span>VS</span></div>
        <div class="fighter right" :class="fighterClass('B')" :style="{ '--accent': typeColor(monB.types[0]!) }">
          <span v-if="fighterClass('B') === 'win'" class="crown">👑</span>
          <img :src="artUrl(monB.id, shinyB)" :alt="monB.fr" />
          <div class="who-name">{{ labelB }}</div>
          <h3>
            {{ monB.fr }}{{ shinyB ? ' ✨' : '' }} <small>#{{ monB.id }}</small>
          </h3>
          <div class="types"><TypeChip v-for="t in monB.types" :key="t" :type="t" small /></div>
          <div class="power">
            Total stats <b>{{ statTotal(monB) }}</b> · Vitesse <b>{{ monB.stats[5] }}</b>
          </div>
        </div>
      </div>

      <div class="verdict">
        <h2>{{ verdictTitle }}</h2>
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
      <div class="actions spaced">
        <button class="btn ghost small" type="button" @click="shareDuel">Partager le duel 📤</button>
      </div>
    </div>
  </section>
</template>
