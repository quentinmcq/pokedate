<script setup lang="ts">
import type { DateFieldValue } from '#shared/types/pokemon'
import type { DateFieldKey } from '#shared/utils/date'

interface PlayerDraft {
  key: number
  name: string
  date: DateFieldValue
}

const route = useRoute()
const router = useRouter()
const { applyTypes, resetAccent } = usePageAccent()
const shareLink = useShareLink()
const absoluteUrl = useAbsoluteUrl()
const { recordDiscovery } = usePokedex()
const trackEvent = useTrackEvent()
const { t, locale } = useLocaleTools()
const { playerLabel, describePlayerError } = useChallengePlayers()
const localePath = useLocalePath()
rememberCurrentPath('challenges')

const tournamentPlayers = computed(() => parseTournamentQuery(route.query))

const { data: pokemonList } = await useAsyncData(
  () => `tournament-${tournamentPlayers.value?.map(({ pokemonId }) => pokemonId).join('-') ?? 'none'}-${locale.value}`,
  async () => {
    const players = tournamentPlayers.value
    if (!players) return null
    return Promise.all(players.map(({ pokemonId }) => fetchPokemonDetail(pokemonId, locale.value)))
  },
)

const contenders = computed(() => {
  const players = tournamentPlayers.value
  const pokemon = pokemonList.value
  if (!players || !pokemon || pokemon.length !== players.length) return null
  return players.map((player, index) => ({
    ...player,
    label: playerLabel(player.name, index + 1),
    pokemon: pokemon[index]!,
  }))
})

const tournament = computed(() =>
  contenders.value ? resolveTournament(contenders.value.map(({ pokemon }) => pokemon)) : null,
)
const PODIUM_SIZE = 3
const podium = computed(() =>
  tournament.value && contenders.value
    ? tournament.value.standings.slice(0, PODIUM_SIZE).map(({ player }) => contenders.value![player]!)
    : [],
)
const champion = computed(() => podium.value[0] ?? null)

watchEffect(() => {
  if (champion.value) applyTypes(champion.value.pokemon.types)
  else resetAccent()
})

function celebrate() {
  if (!contenders.value || !champion.value) return
  const championType = champion.value.pokemon.types[0]
  setTimeout(() => launchTypeConfetti(championType), 600)
}
watch(champion, celebrate)
onMounted(celebrate)

const recordTournamentPokemon = () =>
  tournamentPlayers.value?.forEach(({ pokemonId, shiny }) => recordDiscovery(pokemonId, { caught: true, shiny }))
onMounted(() => watch(tournamentPlayers, recordTournamentPokemon, { immediate: true }))

let nextDraftKey = 0
const createDraft = (): PlayerDraft => ({ key: nextDraftKey++, name: '', date: emptyDateFieldValue() })
const drafts = ref<PlayerDraft[]>(Array.from({ length: TOURNAMENT_PLAYER_LIMITS.min }, createDraft))
const formError = ref<PlayerFormError | null>(null)
const invalidPart = ref<{ draftKey: number; part: DateFieldKey } | null>(null)
const playerFields = useTemplateRef<{ focusInvalidPart: (part: DateFieldKey) => void }[]>('playerFields')
const resultSection = useTemplateRef<HTMLElement>('resultSection')
const scrollToResult = useScrollToResult(resultSection)

const canAddPlayer = computed(() => drafts.value.length < TOURNAMENT_PLAYER_LIMITS.max)
const canRemovePlayer = computed(() => drafts.value.length > TOURNAMENT_PLAYER_LIMITS.min)
const addPlayer = () => canAddPlayer.value && drafts.value.push(createDraft())
const removePlayer = (key: number) => (drafts.value = drafts.value.filter((draft) => draft.key !== key))

async function startTournament() {
  const players = []
  for (const [index, draft] of drafts.value.entries()) {
    const parsed = parseDateFieldValue(draft.date)
    if (!parsed.ok) {
      formError.value = { player: playerLabel(draft.name, index + 1), error: parsed.error }
      invalidPart.value = { draftKey: draft.key, part: parsed.invalidPart }
      playerFields.value?.[index]?.focusInvalidPart(parsed.invalidPart)
      return
    }
    players.push({ pokemonId: pokemonIdFromDate(parsed.date), shiny: isShinyDate(parsed.date), name: draft.name })
  }
  formError.value = null
  invalidPart.value = null
  trackEvent('tournament')
  await router.push({ query: buildTournamentQuery(players) })
  await scrollToResult()
}

function shareTournament() {
  if (!contenders.value || !champion.value) return
  const query = new URLSearchParams()
  for (const [key, values] of Object.entries(buildTournamentQuery(contenders.value)))
    for (const value of values) query.append(key, value)
  shareLink({
    text: t('tournament.shareText', { player: champion.value.label, pokemon: champion.value.pokemon.name }),
    url: `${absoluteUrl(localePath('/tournoi'))}?${query}`,
    copiedMessage: t('tournament.linkCopied'),
  })
}

usePageSeo({
  title: () =>
    champion.value ? t('tournament.championTitle', { pokemon: champion.value.pokemon.name }) : t('tournament.seoTitle'),
  description: () => t('tournament.seoDescription'),
  shareDescription: () =>
    champion.value
      ? t('tournament.resultDescription', {
          podium: podium.value.map((contender) => `${contender.label} (${contender.pokemon.name})`).join(', '),
        })
      : undefined,
  shareImagePath: () => (champion.value ? tournamentShareImagePath(podium.value, locale.value) : undefined),
  shareImageAlt: () =>
    champion.value
      ? t('tournament.podiumAlt', { pokemon: podium.value.map((contender) => contender.pokemon.name).join(', ') })
      : undefined,
  noindex: () => !!tournamentPlayers.value,
})
</script>

<template>
  <div>
    <div class="hero" :class="{ 'tournament-heading': champion }">
      <h1>{{ t('tournament.title') }}</h1>
      <p v-if="!champion" class="lead">{{ t('tournament.lead') }}</p>
    </div>

    <section
      v-if="champion && contenders && tournament"
      ref="resultSection"
      class="tournament-result"
      tabindex="-1"
      aria-labelledby="ranking-title"
    >
      <h2 id="ranking-title" class="tournament-result__title">
        <Icon name="lucide:trophy" aria-hidden="true" />
        {{ t('tournament.winner', { player: champion.label, pokemon: champion.pokemon.name }) }}
      </h2>
      <TournamentStandings :contenders="contenders" :standings="tournament.standings" :matches="tournament.matches" />
      <div class="actions">
        <button class="btn btn--primary btn--sm" type="button" @click="shareTournament">
          <Icon name="lucide:share-2" aria-hidden="true" /> {{ t('tournament.share') }}
        </button>
      </div>
      <p class="field-hint field-hint--privacy">
        <Icon name="lucide:lock" aria-hidden="true" /> {{ t('challenge.linkPrivacy') }}
      </p>
    </section>

    <form
      class="tournament-form"
      :class="{ 'tournament-form--rematch': champion }"
      autocomplete="off"
      novalidate
      aria-labelledby="tournament-form-title"
      @submit.prevent="startTournament"
    >
      <h2 id="tournament-form-title" class="tournament-form__title">
        {{ champion ? t('tournament.again') : t('tournament.players') }}
      </h2>
      <TransitionGroup tag="ol" name="player-row" class="players" @leave="collapseElement">
        <li v-for="(draft, index) in drafts" :key="draft.key" class="players__row">
          <span class="players__number" aria-hidden="true">{{ t('challenge.player', { number: index + 1 }) }}</span>
          <PlayerFields
            ref="playerFields"
            v-model:name="draft.name"
            v-model:date="draft.date"
            :number="index + 1"
            :placeholder="t('tournament.namePlaceholder')"
            error-id="tournament-error"
            :invalid-part="invalidPart?.draftKey === draft.key ? invalidPart.part : null"
          />
          <button
            class="icon-btn players__remove"
            :class="{ 'players__remove--hidden': !canRemovePlayer }"
            :disabled="!canRemovePlayer"
            type="button"
            :aria-label="t('tournament.removePlayer', { number: index + 1 })"
            @click="removePlayer(draft.key)"
          >
            <Icon name="lucide:x" aria-hidden="true" />
          </button>
        </li>
      </TransitionGroup>
      <button class="btn players__add" type="button" :disabled="!canAddPlayer" @click="addPlayer">
        <Icon name="lucide:user-plus" aria-hidden="true" />
        {{
          canAddPlayer ? t('tournament.addPlayer') : t('tournament.maxPlayers', { max: TOURNAMENT_PLAYER_LIMITS.max })
        }}
      </button>
      <p id="tournament-error" class="field-error" role="alert">{{ describePlayerError(formError) }}</p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">
          <Icon name="lucide:trophy" aria-hidden="true" /> {{ t('tournament.start') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped lang="scss" src="./tournoi.scss" />
