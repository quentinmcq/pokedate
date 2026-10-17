<script setup lang="ts">
import type { DateFieldValue, PokemonDetail } from '#shared/types/pokemon'
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
rememberCurrentPath('challenges')

const tournamentPlayers = computed(() => parseTournamentQuery(route.query))

const { data: pokemonList } = await useAsyncData(
  () => `tournament-${tournamentPlayers.value?.map(({ pokemonId }) => pokemonId).join('-') ?? 'none'}`,
  async () => {
    const players = tournamentPlayers.value
    if (!players) return null
    return Promise.all(players.map(({ pokemonId }) => $fetch<PokemonDetail>(`/api/pokemon/${pokemonId}`)))
  },
)

const contenders = computed(() => {
  const players = tournamentPlayers.value
  const pokemon = pokemonList.value
  if (!players || !pokemon || pokemon.length !== players.length) return null
  return players.map((player, index) => ({
    ...player,
    label: player.name || `Joueur ${index + 1}`,
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
  if (winner === null) return `${named(first)} et ${named(second)} : match nul`
  return `${named(winner)} bat ${named(winner === first ? second : first)}`
}

watchEffect(() => {
  if (champion.value) applyTypes(champion.value.pokemon.types)
  else resetAccent()
})

function celebrate() {
  if (!contenders.value || !champion.value) return
  const championType = champion.value.pokemon.types[0]
  setTimeout(() => launchConfetti(['#ffd23f', typeColor(championType), '#fff']), 600)
}
watch(champion, celebrate)
onMounted(celebrate)

const recordTournamentPokemon = () =>
  tournamentPlayers.value?.forEach(({ pokemonId, shiny }) => recordDiscovery(pokemonId, { caught: true, shiny }))
onMounted(() => watch(tournamentPlayers, recordTournamentPokemon, { immediate: true }))

let nextDraftKey = 0
const createDraft = (): PlayerDraft => ({ key: nextDraftKey++, name: '', date: emptyDateFieldValue() })
const drafts = ref<PlayerDraft[]>(Array.from({ length: TOURNAMENT_PLAYER_LIMITS.min }, createDraft))
const formError = ref('')
const invalidPart = ref<{ draftKey: number; part: DateFieldKey } | null>(null)
const dateFields = useTemplateRef<{ focusInvalidPart: (part: DateFieldKey) => void }[]>('dateFields')
const resultSection = useTemplateRef<HTMLElement>('resultSection')

const canAddPlayer = computed(() => drafts.value.length < TOURNAMENT_PLAYER_LIMITS.max)
const canRemovePlayer = computed(() => drafts.value.length > TOURNAMENT_PLAYER_LIMITS.min)
const addPlayer = () => canAddPlayer.value && drafts.value.push(createDraft())
const removePlayer = (key: number) => (drafts.value = drafts.value.filter((draft) => draft.key !== key))

async function startTournament() {
  const players = []
  for (const [index, draft] of drafts.value.entries()) {
    const parsed = parseDateFieldValue(draft.date)
    if (!parsed.ok) {
      formError.value = `${cleanPlayerName(draft.name) || `Joueur ${index + 1}`} : ${parsed.error}`
      invalidPart.value = { draftKey: draft.key, part: parsed.invalidPart }
      dateFields.value?.[index]?.focusInvalidPart(parsed.invalidPart)
      return
    }
    players.push({ pokemonId: pokemonIdFromDate(parsed.date), shiny: isShinyDate(parsed.date), name: draft.name })
  }
  formError.value = ''
  invalidPart.value = null
  trackEvent('tournament')
  await router.push({ query: buildTournamentQuery(players) })
  await nextTick()
  resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  resultSection.value?.focus({ preventScroll: true })
}

function shareTournament() {
  if (!contenders.value || !champion.value) return
  const query = new URLSearchParams()
  for (const [key, values] of Object.entries(buildTournamentQuery(contenders.value)))
    for (const value of values) query.append(key, value)
  shareLink({
    text: `${champion.value.label} remporte le tournoi PokéDate avec ${champion.value.pokemon.name} ! Revanche ?`,
    url: `${absoluteUrl('/tournoi')}?${query}`,
    copiedMessage: 'Lien du tournoi copié',
  })
}

usePageSeo({
  title: () => (champion.value ? `${champion.value.pokemon.name} remporte le tournoi` : "Tournoi d'anniversaires"),
  description:
    'De 3 à 8 amis, une date chacun : quel Pokémon remporte le tournoi ? Chaque Pokémon affronte tous les autres, le meilleur gagne.',
  shareImagePath: () => (champion.value ? shareImagePath(champion.value.pokemon.id) : undefined),
  shareImageAlt: () => champion.value?.pokemon.name,
  noindex: () => !!tournamentPlayers.value,
})
</script>

<template>
  <div>
    <ChallengeSwitch />
    <div class="hero" :class="{ 'tournament-heading': ranking.length }">
      <h1>Tournoi d'anniversaires</h1>
      <p v-if="!ranking.length" class="lead">
        De 3 à 8 amis, une date chacun&nbsp;: chaque Pokémon affronte tous les autres. Qui finira en tête&nbsp;?
      </p>
    </div>

    <section
      v-if="ranking.length && tournament"
      ref="resultSection"
      class="tournament-result"
      tabindex="-1"
      aria-labelledby="ranking-title"
    >
      <h2 id="ranking-title" class="tournament-result__title">
        <Icon name="lucide:trophy" aria-hidden="true" /> {{ champion!.label }} gagne avec
        {{ champion!.pokemon.name }}&nbsp;!
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
              ><span class="visually-hidden">{{ position + 1 }}<sup>e</sup> : </span>{{ entry.contender.label }}</span
            >
            <NuxtLink class="ranking__pokemon" :to="pokemonPath(entry.contender.pokemon)">{{
              entry.contender.pokemon.name
            }}</NuxtLink>
          </span>
          <span class="ranking__record">{{ entry.wins }} V · {{ entry.draws }} N · {{ entry.losses }} D</span>
          <span class="ranking__points">{{ entry.points }} pts</span>
        </li>
      </ol>
      <p class="tournament-result__hint">
        Victoire&nbsp;: 3 points, match nul&nbsp;: 1 point. À égalité, le total des stats départage.
      </p>
      <AccordionItem :question="`Voir les ${tournament.matches.length} combats`" group="tournament-matches">
        <ul class="matches">
          <li v-for="match in tournament.matches" :key="`${match.first}-${match.second}`">
            {{ describeMatch(match) }}
          </li>
        </ul>
      </AccordionItem>
      <div class="actions">
        <button class="btn btn--primary btn--sm" type="button" @click="shareTournament">
          <Icon name="lucide:share-2" aria-hidden="true" /> Partager le tournoi
        </button>
      </div>
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
        {{ ranking.length ? 'Un nouveau tournoi ?' : 'Les joueurs' }}
      </h2>
      <ol class="players">
        <li v-for="(draft, index) in drafts" :key="draft.key" class="players__row">
          <span class="players__number" aria-hidden="true">{{ index + 1 }}</span>
          <label class="visually-hidden" :for="`player-name-${draft.key}`">Prénom du joueur {{ index + 1 }}</label>
          <input
            :id="`player-name-${draft.key}`"
            v-model="draft.name"
            class="text-input players__name"
            :placeholder="`Joueur ${index + 1}`"
            :maxlength="PLAYER_NAME_MAX_LENGTH"
          />
          <DateField
            ref="dateFields"
            v-model="draft.date"
            compact
            :legend="`Date du joueur ${index + 1}`"
            error-id="tournament-error"
            :invalid-part="invalidPart?.draftKey === draft.key ? invalidPart.part : null"
          />
          <button
            v-if="canRemovePlayer"
            class="icon-btn players__remove"
            type="button"
            :aria-label="`Retirer le joueur ${index + 1}`"
            @click="removePlayer(draft.key)"
          >
            <Icon name="lucide:x" aria-hidden="true" />
          </button>
        </li>
      </ol>
      <button v-if="canAddPlayer" class="btn btn--ghost btn--sm players__add" type="button" @click="addPlayer">
        <Icon name="lucide:user-plus" aria-hidden="true" /> Ajouter un joueur
      </button>
      <p id="tournament-error" class="field-error" role="alert">{{ formError }}</p>
      <div class="actions">
        <button class="btn btn--primary" type="submit">
          <Icon name="lucide:trophy" aria-hidden="true" /> Lancer le tournoi
        </button>
      </div>
      <p class="field-hint">Seuls les Pokémon apparaissent dans le lien du tournoi, jamais vos dates.</p>
    </form>
  </div>
</template>

<style scoped lang="scss" src="./tournoi.scss" />
