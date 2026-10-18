<script setup lang="ts">
import type { DateFieldValue } from '#shared/types/pokemon'
import type { DateFieldKey } from '#shared/utils/date'
import type { DuelSide } from '#shared/utils/duel'
import type { Message } from '#shared/utils/messages'

const route = useRoute()
const router = useRouter()
const { applyTypes, resetAccent } = usePageAccent()
const shareLink = useShareLink()
const absoluteUrl = useAbsoluteUrl()
const { recordDiscovery } = usePokedex()
const trackEvent = useTrackEvent()
const { t, locale, translate } = useLocaleTools()
const localePath = useLocalePath()
rememberCurrentPath('challenges')

const duelQuery = computed(() => parseDuelQuery(route.query))
const hasBothPokemon = computed(() => !!duelQuery.value.pokemonIdA && !!duelQuery.value.pokemonIdB)

const dateA = ref<DateFieldValue>(emptyDateFieldValue())
const dateB = ref<DateFieldValue>(emptyDateFieldValue())
const playerNameInputA = ref(duelQuery.value.playerNameA)
const playerNameInputB = ref(duelQuery.value.playerNameB)
const formError = ref<{ player: string; error: Message } | null>(null)
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

const playerLabelA = computed(() => duelQuery.value.playerNameA || t('challenge.player', { number: 1 }))
const playerLabelB = computed(() => duelQuery.value.playerNameB || t('challenge.player', { number: 2 }))

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
  if (winnerPokemon.value) return t('duel.winner', { player: winnerName.value, pokemon: winnerPokemon.value.name })
  if (pokemonA.value.id === pokemonB.value.id) return t('duel.mirror')
  return t('duel.draw')
})

const verdictIcon = computed(() => {
  if (winnerPokemon.value) return 'lucide:trophy'
  if (pokemonA.value?.id === pokemonB.value?.id) return 'lucide:flip-horizontal-2'
  return 'lucide:handshake'
})

const tempoText = computed(() =>
  outcome.value && pokemonA.value && pokemonB.value
    ? describeDuelTempo(translate, { A: pokemonA.value, B: pokemonB.value }, outcome.value)
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
    formError.value = {
      player: cleanPlayerName(playerNameInputA.value) || t('challenge.player', { number: 1 }),
      error: parsedA.error,
    }
    return dateFieldA.value?.focusInvalidPart(parsedA.invalidPart)
  }
  if (!parsedB.ok) {
    formError.value = {
      player: cleanPlayerName(playerNameInputB.value) || t('challenge.player', { number: 2 }),
      error: parsedB.error,
    }
    return dateFieldB.value?.focusInvalidPart(parsedB.invalidPart)
  }
  formError.value = null
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
      ? t('duel.shareWinner', { player: winnerName.value, pokemon: winnerPokemon.value.name })
      : t('duel.shareDraw'),
    url: `${absoluteUrl(localePath('/duel'))}?${query}`,
    copiedMessage: t('duel.linkCopied'),
  })
}

usePageSeo({
  title: () =>
    pokemonA.value && pokemonB.value && outcome.value
      ? `${pokemonA.value.name} VS ${pokemonB.value.name}`
      : t('duel.title'),
  description: () => t('duel.seoDescription'),
  shareImagePath: () => {
    const { pokemonIdA, pokemonIdB, shinyA, shinyB } = duelQuery.value
    if (!hasResult.value || !pokemonIdA || !pokemonIdB) return undefined
    return duelShareImagePath(
      { pokemonId: pokemonIdA, shiny: shinyA },
      { pokemonId: pokemonIdB, shiny: shinyB },
      locale.value,
    )
  },
  shareImageAlt: () =>
    pokemonA.value && pokemonB.value
      ? t('duel.shareImageAlt', { first: pokemonA.value.name, second: pokemonB.value.name })
      : undefined,
  noindex: () => hasBothPokemon.value,
})
</script>

<template>
  <div>
    <div v-if="hasResult" class="hero duel-heading">
      <h1>{{ t('duel.title') }}</h1>
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
          <li>{{ describeAttack(translate, locale, pokemonA.name, pokemonB.name, outcome.attackOfA) }}</li>
          <li>{{ describeAttack(translate, locale, pokemonB.name, pokemonA.name, outcome.attackOfB) }}</li>
          <li>{{ tempoText }}</li>
        </ul>
      </div>
      <div class="actions">
        <button class="btn btn--primary btn--sm" type="button" @click="shareDuel">
          <Icon name="lucide:share-2" aria-hidden="true" /> {{ t('duel.share') }}
        </button>
      </div>
      <p class="field-hint field-hint--privacy">
        <Icon name="lucide:lock" aria-hidden="true" /> {{ t('challenge.linkPrivacy') }}
      </p>
    </section>

    <form
      class="hero"
      :class="{ 'duel-rematch': hasResult }"
      autocomplete="off"
      novalidate
      :aria-labelledby="hasResult ? 'rematch-title' : undefined"
      @submit.prevent="startDuel"
    >
      <h2 v-if="hasResult" id="rematch-title" class="duel-rematch__title">{{ t('duel.rematch') }}</h2>
      <template v-else>
        <h1>{{ t('duel.title') }}</h1>
        <p class="lead">{{ t('duel.lead') }}</p>
      </template>
      <div class="duel-form">
        <div class="duel-form__side">
          <label class="visually-hidden" for="player-name-a">{{ t('challenge.playerName', { number: 1 }) }}</label>
          <input
            id="player-name-a"
            v-model="playerNameInputA"
            class="text-input"
            :placeholder="t('duel.yourName')"
            :maxlength="PLAYER_NAME_MAX_LENGTH"
          />
          <DateField
            ref="dateFieldA"
            v-model="dateA"
            compact
            :legend="t('challenge.playerDate', { number: 1 })"
            error-id="duel-error"
            :invalid-part="invalidDatePartA"
          />
        </div>
        <span class="vs-badge" aria-hidden="true">VS</span>
        <div class="duel-form__side">
          <label class="visually-hidden" for="player-name-b">{{ t('challenge.playerName', { number: 2 }) }}</label>
          <input
            id="player-name-b"
            v-model="playerNameInputB"
            class="text-input"
            :placeholder="t('duel.opponentName')"
            :maxlength="PLAYER_NAME_MAX_LENGTH"
          />
          <DateField
            ref="dateFieldB"
            v-model="dateB"
            compact
            :legend="t('challenge.playerDate', { number: 2 })"
            error-id="duel-error"
            :invalid-part="invalidDatePartB"
          />
        </div>
      </div>
      <p id="duel-error" class="field-error" role="alert">
        {{
          formError
            ? t('challenge.playerError', {
                player: formError.player,
                error: t(formError.error.key, formError.error.params ?? {}),
              })
            : ''
        }}
      </p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">
          <Icon name="lucide:swords" aria-hidden="true" /> {{ t('duel.start') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss" src="./duel.scss" />
