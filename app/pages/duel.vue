<script setup lang="ts">
import type { DateFieldValue } from '#shared/types/pokemon'
import type { DateFieldKey } from '#shared/utils/date'
import type { DuelSide } from '#shared/utils/duel'

const route = useRoute()
const router = useRouter()
const { applyTypes, resetAccent } = usePageAccent()
const shareLink = useShareLink()
const absoluteUrl = useAbsoluteUrl()
const { recordDiscovery } = usePokedex()
const trackEvent = useTrackEvent()
rememberCurrentPath('challenges')

const duelQuery = computed(() => parseDuelQuery(route.query))
const hasBothPokemon = computed(() => !!duelQuery.value.pokemonIdA && !!duelQuery.value.pokemonIdB)

const dateA = ref<DateFieldValue>(emptyDateFieldValue())
const dateB = ref<DateFieldValue>(emptyDateFieldValue())
const playerNameInputA = ref(duelQuery.value.playerNameA)
const playerNameInputB = ref(duelQuery.value.playerNameB)
const formError = ref('')
const invalidDatePartA = ref<DateFieldKey | null>(null)
const invalidDatePartB = ref<DateFieldKey | null>(null)
const dateFieldA = useTemplateRef('dateFieldA')
const dateFieldB = useTemplateRef('dateFieldB')
const resultSection = useTemplateRef<HTMLElement>('resultSection')
const scrollToResult = useScrollToResult(resultSection)

const prefilledDate = parseIsoDate(route.query.a)
if (prefilledDate) dateA.value = toDateFieldValue(prefilledDate)

const [{ data: pokemonA }, { data: pokemonB }] = await Promise.all([
  usePokemonDetail(() => (hasBothPokemon.value ? duelQuery.value.pokemonIdA : null)),
  usePokemonDetail(() => (hasBothPokemon.value ? duelQuery.value.pokemonIdB : null)),
])

const playerLabelA = computed(() => duelQuery.value.playerNameA || 'Joueur 1')
const playerLabelB = computed(() => duelQuery.value.playerNameB || 'Joueur 2')

const outcome = computed(() =>
  hasBothPokemon.value && pokemonA.value && pokemonB.value ? resolveDuel(pokemonA.value, pokemonB.value) : null,
)
const hasResult = computed(() => !!(outcome.value && pokemonA.value && pokemonB.value))
const winnerPokemon = computed(() => {
  if (outcome.value?.winner === 'A') return pokemonA.value
  if (outcome.value?.winner === 'B') return pokemonB.value
  return null
})
const winnerName = computed(() => (outcome.value?.winner === 'A' ? playerLabelA.value : playerLabelB.value))

const fighterResult = (side: DuelSide) => {
  if (!outcome.value?.winner) return 'draw'
  return outcome.value.winner === side ? 'win' : 'lose'
}

const verdictTitle = computed(() => {
  if (!outcome.value || !pokemonA.value || !pokemonB.value) return ''
  if (winnerPokemon.value) return `${winnerName.value} gagne avec ${winnerPokemon.value.name} !`
  if (pokemonA.value.id === pokemonB.value.id) return 'Match miroir : même Pokémon, égalité parfaite !'
  return 'Match nul !'
})

const verdictIcon = computed(() => {
  if (winnerPokemon.value) return 'lucide:trophy'
  if (pokemonA.value?.id === pokemonB.value?.id) return 'lucide:flip-horizontal-2'
  return 'lucide:handshake'
})

const tempoText = computed(() =>
  outcome.value && pokemonA.value && pokemonB.value
    ? describeDuelTempo({ A: pokemonA.value, B: pokemonB.value }, outcome.value)
    : '',
)

watchEffect(() => {
  const accentPokemon = outcome.value?.winner === 'B' ? pokemonB.value : pokemonA.value
  if (outcome.value && accentPokemon) applyTypes(accentPokemon.types)
  else resetAccent()
})

function celebrate() {
  if (!outcome.value || !pokemonA.value || !pokemonB.value) return
  const winner = winnerPokemon.value
  if (winner) setTimeout(() => launchConfetti(['#ffd23f', typeColor(winner.types[0]), '#fff']), 900)
}
watch(outcome, celebrate)
onMounted(celebrate)

function recordDuelPokemon() {
  const { pokemonIdA, pokemonIdB, shinyA, shinyB } = duelQuery.value
  if (!pokemonIdA || !pokemonIdB) return
  recordDiscovery(pokemonIdA, { caught: true, shiny: shinyA })
  recordDiscovery(pokemonIdB, { caught: true, shiny: shinyB })
}
onMounted(() => watch(duelQuery, recordDuelPokemon, { immediate: true }))

async function startDuel() {
  const parsedA = parseDateFieldValue(dateA.value)
  const parsedB = parseDateFieldValue(dateB.value)
  invalidDatePartA.value = parsedA.ok ? null : parsedA.invalidPart
  invalidDatePartB.value = parsedA.ok && !parsedB.ok ? parsedB.invalidPart : null
  if (!parsedA.ok) {
    formError.value = `${cleanPlayerName(playerNameInputA.value) || 'Joueur 1'} : ${parsedA.error}`
    return dateFieldA.value?.focusInvalidPart(parsedA.invalidPart)
  }
  if (!parsedB.ok) {
    formError.value = `${cleanPlayerName(playerNameInputB.value) || 'Joueur 2'} : ${parsedB.error}`
    return dateFieldB.value?.focusInvalidPart(parsedB.invalidPart)
  }
  formError.value = ''
  trackEvent('duel')

  await router.push({
    query: buildDuelQuery({
      pokemonIdA: pokemonIdFromDate(parsedA.date),
      pokemonIdB: pokemonIdFromDate(parsedB.date),
      shinyA: isShinyDate(parsedA.date),
      shinyB: isShinyDate(parsedB.date),
      playerNameA: playerNameInputA.value,
      playerNameB: playerNameInputB.value,
    }),
  })
  await scrollToResult()
}

function shareDuel() {
  const query = new URLSearchParams(buildDuelQuery(duelQuery.value))
  shareLink({
    text: winnerPokemon.value
      ? `${winnerName.value} gagne le duel PokéDate avec ${winnerPokemon.value.name} ! Revanche ?`
      : 'Match nul au duel PokéDate ! Revanche ?',
    url: `${absoluteUrl('/duel')}?${query}`,
    copiedMessage: 'Lien du duel copié',
  })
}

usePageSeo({
  title: () =>
    pokemonA.value && pokemonB.value && outcome.value
      ? `${pokemonA.value.name} VS ${pokemonB.value.name}`
      : "Duel d'anniversaires",
  description:
    "Ta date contre celle d'un ami : quel Pokémon gagne le combat ? Un duel de dates d'anniversaire façon Pokémon.",
  shareImagePath: () => (winnerPokemon.value ? shareImagePath(winnerPokemon.value.id) : undefined),
  shareImageAlt: () => winnerPokemon.value?.name,
  noindex: () => hasBothPokemon.value,
})
</script>

<template>
  <div>
    <div v-if="hasResult" class="hero duel-heading">
      <h1>Duel d'anniversaires</h1>
    </div>

    <section
      v-if="outcome && pokemonA && pokemonB"
      ref="resultSection"
      class="duel-result"
      tabindex="-1"
      aria-labelledby="verdict"
    >
      <div class="arena">
        <DuelFighter
          :pokemon="pokemonA"
          :player-name="playerLabelA"
          :shiny="duelQuery.shinyA"
          side="A"
          :result="fighterResult('A')"
        />
        <div class="arena__vs" aria-hidden="true">VS</div>
        <DuelFighter
          :pokemon="pokemonB"
          :player-name="playerLabelB"
          :shiny="duelQuery.shinyB"
          side="B"
          :result="fighterResult('B')"
        />
      </div>

      <div class="verdict">
        <h2 id="verdict"><Icon :name="verdictIcon" aria-hidden="true" /> {{ verdictTitle }}</h2>
        <ul>
          <li>{{ describeAttack(pokemonA.name, pokemonB.name, outcome.attackOfA) }}</li>
          <li>{{ describeAttack(pokemonB.name, pokemonA.name, outcome.attackOfB) }}</li>
          <li>{{ tempoText }}</li>
        </ul>
      </div>
      <div class="actions">
        <button class="btn btn--primary btn--sm" type="button" @click="shareDuel">
          <Icon name="lucide:share-2" aria-hidden="true" /> Partager le duel
        </button>
      </div>
    </section>

    <form
      class="hero"
      :class="{ 'duel-rematch': hasResult }"
      autocomplete="off"
      novalidate
      :aria-labelledby="hasResult ? 'rematch-title' : undefined"
      @submit.prevent="startDuel"
    >
      <h2 v-if="hasResult" id="rematch-title" class="duel-rematch__title">Ta revanche&nbsp;?</h2>
      <template v-else>
        <h1>Duel d'anniversaires</h1>
        <p class="lead">Ta date contre celle d'un·e ami·e : quel Pokémon l'emporte&nbsp;?</p>
      </template>
      <div class="duel-form">
        <div class="duel-form__side">
          <label class="visually-hidden" for="player-name-a">Prénom du joueur 1</label>
          <input
            id="player-name-a"
            v-model="playerNameInputA"
            class="text-input"
            placeholder="Ton prénom"
            :maxlength="PLAYER_NAME_MAX_LENGTH"
          />
          <DateField
            ref="dateFieldA"
            v-model="dateA"
            compact
            legend="Date du joueur 1"
            error-id="duel-error"
            :invalid-part="invalidDatePartA"
          />
        </div>
        <span class="vs-badge" aria-hidden="true">VS</span>
        <div class="duel-form__side">
          <label class="visually-hidden" for="player-name-b">Prénom du joueur 2</label>
          <input
            id="player-name-b"
            v-model="playerNameInputB"
            class="text-input"
            placeholder="Son prénom"
            :maxlength="PLAYER_NAME_MAX_LENGTH"
          />
          <DateField
            ref="dateFieldB"
            v-model="dateB"
            compact
            legend="Date du joueur 2"
            error-id="duel-error"
            :invalid-part="invalidDatePartB"
          />
        </div>
      </div>
      <p id="duel-error" class="field-error" role="alert">{{ formError }}</p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">
          <Icon name="lucide:swords" aria-hidden="true" /> Lancer le combat
        </button>
      </div>
      <p class="field-hint">Seuls les Pokémon apparaissent dans le lien du duel, jamais vos dates.</p>
    </form>
  </div>
</template>

<style scoped lang="scss" src="./duel.scss" />
