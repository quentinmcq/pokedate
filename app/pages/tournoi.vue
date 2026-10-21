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
const ranking = computed(() =>
  tournament.value && contenders.value
    ? tournament.value.standings.map((standing) => ({ ...standing, contender: contenders.value![standing.player]! }))
    : [],
)
const champion = computed(() => ranking.value[0]?.contender ?? null)

const describeMatch = ({ first, second, winner }: { first: number; second: number; winner: number | null }) => {
  const players = contenders.value!
  const named = (index: number) => `${players[index]!.label} (${players[index]!.pokemon.name})`
  if (winner === null) return t('tournament.matchDraw', { first: named(first), second: named(second) })
  return t('tournament.matchWin', { winner: named(winner), loser: named(winner === first ? second : first) })
}

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
function collapsePlayerRow(element: Element, done: () => void) {
  const row = element as HTMLElement
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done()
  const style = getComputedStyle(row)
  const FOLDED_BOX_PROPERTIES = [
    'height',
    'paddingTop',
    'paddingBottom',
    'marginBottom',
    'borderTopWidth',
    'borderBottomWidth',
  ] as const
  row.style.overflow = 'hidden'
  row
    .animate(
      [
        {
          ...Object.fromEntries(FOLDED_BOX_PROPERTIES.map((property) => [property, style[property]])),
          height: `${row.offsetHeight}px`,
          opacity: 1,
          transform: 'scale(1)',
        },
        {
          ...Object.fromEntries(FOLDED_BOX_PROPERTIES.map((property) => [property, '0px'])),
          opacity: 0,
          transform: 'scale(0.96)',
        },
      ],
      { duration: 450, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' },
    )
    .finished.then(done, done)
}

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
    champion.value ? t('tournament.championTitle', { pokemon: champion.value.pokemon.name }) : t('tournament.title'),
  description: () => t('tournament.seoDescription'),
  shareImagePath: () =>
    champion.value
      ? tournamentShareImagePath(
          ranking.value.slice(0, 3).map(({ contender }) => contender),
          locale.value,
        )
      : undefined,
  shareImageAlt: () =>
    champion.value
      ? t('tournament.podiumAlt', {
          pokemon: ranking.value
            .slice(0, 3)
            .map(({ contender }) => contender.pokemon.name)
            .join(', '),
        })
      : undefined,
  noindex: () => !!tournamentPlayers.value,
})
</script>

<template>
  <div>
    <div class="hero" :class="{ 'tournament-heading': ranking.length }">
      <h1>{{ t('tournament.title') }}</h1>
      <p v-if="!ranking.length" class="lead">{{ t('tournament.lead') }}</p>
    </div>

    <section
      v-if="ranking.length && tournament"
      ref="resultSection"
      class="tournament-result"
      tabindex="-1"
      aria-labelledby="ranking-title"
    >
      <h2 id="ranking-title" class="tournament-result__title">
        <Icon name="lucide:trophy" aria-hidden="true" />
        {{ t('tournament.winner', { player: champion!.label, pokemon: champion!.pokemon.name }) }}
      </h2>
      <ol class="ranking">
        <li
          v-for="(entry, position) in ranking"
          :key="entry.player"
          class="ranking__row"
          :class="{ 'ranking__row--champion': position === 0 }"
          :style="{ '--accent': typeColor(entry.contender.pokemon.types[0]) }"
        >
          <span class="ranking__position" aria-hidden="true">{{ position + 1 }}</span>
          <img
            class="ranking__sprite"
            :src="spriteUrl(entry.contender.pokemon.id, entry.contender.shiny)"
            alt=""
            width="56"
            height="56"
          />
          <span class="ranking__who">
            <span class="ranking__player"
              ><span class="visually-hidden">{{ t('tournament.rank', { rank: position + 1 }) }}</span
              >{{ entry.contender.label }}</span
            >
            <NuxtLinkLocale class="ranking__pokemon" :to="pokemonPath(entry.contender.pokemon)">{{
              entry.contender.pokemon.name
            }}</NuxtLinkLocale>
          </span>
          <span class="ranking__record">{{
            t('tournament.record', { wins: entry.wins, draws: entry.draws, losses: entry.losses })
          }}</span>
          <span class="ranking__points">{{ t('tournament.points', { points: entry.points }) }}</span>
        </li>
      </ol>
      <p class="tournament-result__hint">{{ t('tournament.scoring') }}</p>
      <AccordionItem
        :question="t('tournament.showMatches', { count: tournament.matches.length })"
        group="tournament-matches"
      >
        <ul class="matches">
          <li v-for="match in tournament.matches" :key="`${match.first}-${match.second}`">
            {{ describeMatch(match) }}
          </li>
        </ul>
      </AccordionItem>
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
      :class="{ 'tournament-form--rematch': ranking.length }"
      autocomplete="off"
      novalidate
      aria-labelledby="tournament-form-title"
      @submit.prevent="startTournament"
    >
      <h2 id="tournament-form-title" class="tournament-form__title">
        {{ ranking.length ? t('tournament.again') : t('tournament.players') }}
      </h2>
      <TransitionGroup tag="ol" name="player-row" class="players" @leave="collapsePlayerRow">
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
